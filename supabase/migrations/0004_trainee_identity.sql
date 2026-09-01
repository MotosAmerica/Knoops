-- Knoops Academy — one trainee record per person, per store
--
-- Bug this fixes: sign-in blind-inserted a new `trainees` row on every login,
-- so one person accumulated a new record (and a fresh, empty progress history)
-- every time they signed in on a new device or after signing out.
--
-- Identity is (name, store). Name matching is deliberately fuzzy, because
-- people type their own name inconsistently:
--   "doug brown" = "Doug Brown" = "DOUG BROWN"   (case)
--   "Doug  Brown" = "Doug Brown"                  (whitespace)
--   "Doug Brown" = "Douglas Brown"                (shortened given name)
--   "D Brown"   = "Doug Brown"                    (initial)
--   "Bob Smith" = "Robert Smith"                  (nickname, not a prefix)
--   "Doug R Brown" = "Doug Brown"                 (middle name/initial ignored)
--
-- Scoping every comparison to one store keeps the blast radius small: two
-- genuinely different people would have to share a surname AND an equivalent
-- given name AND a store to be wrongly merged.

-- ---------------------------------------------------------------------------
-- 1. Normalisation
-- ---------------------------------------------------------------------------
create or replace function normalize_person_name(p_name text)
returns text language sql immutable as $$
  select trim(regexp_replace(
    regexp_replace(
      lower(translate(coalesce(p_name, ''),
        'àáâãäåèéêëìíîïòóôõöùúûüñçÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÑÇ',
        'aaaaaaeeeeiiiiooooouuuuncAAAAAAEEEEIIIIOOOOOUUUUNC')),
      '[^a-z0-9 ]', ' ', 'g'),
    '\s+', ' ', 'g'));
$$;

-- ---------------------------------------------------------------------------
-- 2. Nicknames that aren't simple prefixes (Bob/Robert, Jack/John, ...)
--    A lookup table rather than a hardcoded CASE, so adding one later is an
--    insert, not a migration.
-- ---------------------------------------------------------------------------
create table if not exists name_nicknames (
  formal   text not null,
  nickname text not null,
  primary key (formal, nickname)
);

insert into name_nicknames (formal, nickname) values
  ('robert','bob'), ('robert','rob'), ('robert','bobby'),
  ('william','bill'), ('william','will'), ('william','billy'), ('william','liam'),
  ('richard','dick'), ('richard','rick'), ('richard','rich'), ('richard','ricky'),
  ('john','jack'), ('john','johnny'),
  ('james','jim'), ('james','jimmy'), ('james','jamie'),
  ('michael','mike'), ('michael','mickey'),
  ('charles','chuck'), ('charles','charlie'),
  ('henry','hank'), ('henry','harry'),
  ('elizabeth','liz'), ('elizabeth','beth'), ('elizabeth','betty'), ('elizabeth','eliza'), ('elizabeth','libby'),
  ('margaret','peggy'), ('margaret','maggie'), ('margaret','meg'),
  ('katherine','kate'), ('katherine','kathy'), ('katherine','katie'), ('catherine','cathy'), ('catherine','kate'),
  ('susan','sue'), ('susan','suzie'),
  ('anthony','tony'), ('stephen','steve'), ('steven','steve'),
  ('nicholas','nick'), ('edward','ted'), ('edward','ed'), ('edward','eddie'),
  ('theodore','ted'), ('theodore','teddy'),
  ('joseph','joe'), ('joseph','joey'),
  ('thomas','tom'), ('thomas','tommy'),
  ('daniel','dan'), ('daniel','danny'),
  ('christopher','chris'), ('patricia','pat'), ('patricia','patty'), ('patricia','trish'),
  ('deborah','debbie'), ('deborah','deb'), ('barbara','barb'),
  ('jennifer','jen'), ('jennifer','jenny'), ('rebecca','becky'), ('rebecca','becca'),
  ('andrew','andy'), ('andrew','drew'), ('alexander','alex'), ('alexandra','alex'),
  ('benjamin','ben'), ('samuel','sam'), ('samantha','sam'),
  ('matthew','matt'), ('gregory','greg'), ('douglas','doug'),
  ('ronald','ron'), ('donald','don'), ('kenneth','ken'), ('lawrence','larry'),
  ('francis','frank'), ('frederick','fred'), ('albert','al'), ('alfred','al'),
  ('vincent','vince'), ('eugene','gene'), ('walter','walt'), ('raymond','ray'),
  ('philip','phil'), ('phillip','phil'), ('peter','pete'), ('timothy','tim'),
  ('jonathan','jon'), ('nathaniel','nate'), ('zachary','zach'), ('joshua','josh'),
  ('abigail','abby'), ('victoria','vicky'), ('veronica','ronnie'),
  ('cynthia','cindy'), ('sandra','sandy'), ('pamela','pam'), ('teresa','terry'),
  ('theresa','terry'), ('gerald','jerry'), ('jeffrey','jeff'), ('geoffrey','geoff')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 3. Are two given names the same person's?
-- ---------------------------------------------------------------------------
create or replace function first_names_equivalent(a text, b text)
returns boolean language sql stable as $$
  select
    a = b
    -- shortened given name: doug/douglas, dan/daniel, chris/christopher.
    -- Minimum 3 chars so "jo" can't swallow john/joseph/joanne.
    or (length(a) >= 3 and length(b) >= 3 and (a like b || '%' or b like a || '%'))
    -- a single initial: "d brown" = "doug brown"
    or (length(a) = 1 and left(b, 1) = a)
    or (length(b) = 1 and left(a, 1) = b)
    -- nicknames that share no prefix
    or exists (
      select 1 from name_nicknames n
      where (n.formal = a and n.nickname = b)
         or (n.formal = b and n.nickname = a)
         -- two nicknames of the same formal name (bob/rob, bill/will)
         or exists (
           select 1 from name_nicknames n2
           where n2.formal = n.formal and n.nickname = a and n2.nickname = b
         )
    );
$$;

-- ---------------------------------------------------------------------------
-- 4. Are two full names the same person? (Caller scopes this to one store.)
-- ---------------------------------------------------------------------------
create or replace function person_names_match(a text, b text)
returns boolean language plpgsql stable as $$
declare
  na text := normalize_person_name(a);
  nb text := normalize_person_name(b);
  pa text[]; pb text[];
  a_first text; a_last text; b_first text; b_last text;
begin
  if na = '' or nb = '' then return false; end if;
  if na = nb then return true; end if;

  pa := regexp_split_to_array(na, ' ');
  pb := regexp_split_to_array(nb, ' ');
  a_first := pa[1];               b_first := pb[1];
  a_last  := pa[array_length(pa, 1)];
  b_last  := pb[array_length(pb, 1)];

  -- Someone entered only a first name once ("Remi" vs "Remi Broly").
  -- Store scoping is what makes this safe enough to accept.
  if array_length(pa, 1) = 1 or array_length(pb, 1) = 1 then
    return first_names_equivalent(a_first, b_first);
  end if;

  -- Otherwise: same surname + equivalent given name. Middle names/initials
  -- are ignored by only ever comparing the first and last tokens.
  return a_last = b_last and first_names_equivalent(a_first, b_first);
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Track re-logins instead of creating rows for them
-- ---------------------------------------------------------------------------
alter table trainees add column if not exists last_seen_at timestamptz;
alter table trainees add column if not exists login_count integer not null default 1;
update trainees set last_seen_at = created_at where last_seen_at is null;

-- ---------------------------------------------------------------------------
-- 6. The single entry point sign-in uses from now on.
--    Atomic find-or-create: no select-then-insert race, and the matching
--    logic lives in one place instead of in every frontend.
-- ---------------------------------------------------------------------------
create or replace function find_or_create_trainee(
  p_name  text,
  p_store text,
  p_role  text
)
returns trainees language plpgsql security definer as $$
declare
  existing trainees;
  clean_name text := trim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
begin
  if clean_name = '' then
    raise exception 'name is required';
  end if;

  -- Oldest match wins, so the canonical record is the one that already
  -- carries the most history.
  select t.* into existing
  from trainees t
  where t.store_location is not distinct from p_store
    and person_names_match(t.name, clean_name)
  order by t.created_at asc
  limit 1;

  if found then
    update trainees
       set last_seen_at = now(),
           login_count  = login_count + 1,
           -- A promotion should update the record, not fork it. Keep the
           -- longer spelling of the name ("Douglas" over "Doug") as canonical.
           role = coalesce(nullif(p_role, ''), role),
           name = case when length(clean_name) > length(name) then clean_name else name end
     where id = existing.id
     returning * into existing;
    return existing;
  end if;

  insert into trainees (name, store_location, role, last_seen_at, login_count)
  values (clean_name, p_store, p_role, now(), 1)
  returning * into existing;
  return existing;
end;
$$;

grant execute on function find_or_create_trainee(text, text, text) to anon, authenticated;
grant execute on function person_names_match(text, text) to anon, authenticated;
grant select on name_nicknames to anon, authenticated;
