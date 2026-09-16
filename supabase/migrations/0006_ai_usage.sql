-- Knoops Academy — AI token usage
--
-- Every call to the Anthropic API from the edge function logs what it cost, so
-- the analytics page can answer "what is the AI actually costing, and where is
-- it going" without anyone opening a billing console.
--
-- WRITTEN SERVER-SIDE ONLY. The edge function is the only place that sees real
-- usage numbers, and a client can't forge a row it never writes.
--
-- WHY THE CACHE COLUMNS EXIST even though nothing uses prompt caching yet: the
-- grading prompt sends the whole module text as `taught` on every rep, which is
-- exactly the shape caching is for. When that gets turned on, the saving shows
-- up here as cache_read_tokens climbing while input_tokens falls — and without
-- the columns there'd be no before to compare against.

create table if not exists ai_usage (
  id bigint generated always as identity primary key,
  kind text not null,                 -- 'grade' | 'ask'
  trainee_id uuid references trainees(id) on delete set null,
  academy text,
  module_num integer,
  model text,
  input_tokens integer default 0,
  output_tokens integer default 0,
  cache_read_tokens integer default 0,
  cache_write_tokens integer default 0,
  ok boolean default true,            -- false when the call failed or was unparseable
  created_at timestamptz default now()
);

alter table ai_usage enable row level security;

-- Same open policy as every other table on this project (see README — this is
-- the thing that needs tightening before real staff sign in).
drop policy if exists "ai_usage open" on ai_usage;
create policy "ai_usage open" on ai_usage
  for all using (true) with check (true);

create index if not exists ai_usage_created_idx on ai_usage (created_at desc);
create index if not exists ai_usage_kind_idx on ai_usage (kind);
create index if not exists ai_usage_trainee_idx on ai_usage (trainee_id);
