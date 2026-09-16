-- Knoops Academy — visit sessions, device class, and active time
--
-- Answers three questions the platform previously had no data for at all:
-- how long people actually train for, whether they do it on a phone, and
-- when in the day and week they do it.
--
-- WHAT A ROW IS: one visit, not one page load. Moving between modules keeps
-- the same session (the client holds the id in sessionStorage), so "sessions
-- per person" means visits, not clicks.
--
-- WHY active_ms AND last_beat_at BOTH EXIST: wall-clock from started_at to
-- last_beat_at would count a tab left open over a lunch break as an hour of
-- training. active_ms only advances while the tab is visible AND the person
-- has interacted recently, so it is time SPENT, not time ELAPSED. Report
-- active_ms as the duration; last_beat_at is for recency and for spotting
-- sessions that ended in a crash rather than a close.
--
-- WHAT IS DELIBERATELY NOT STORED: no user-agent string, no IP, no fingerprint.
-- A coarse device class and a screen width answer "is this being done on a
-- phone?", which is the only question being asked of it.

create table if not exists trainee_sessions (
  id bigint generated always as identity primary key,
  trainee_id uuid references trainees(id) on delete cascade,
  started_at timestamptz not null default now(),
  last_beat_at timestamptz not null default now(),
  active_ms bigint not null default 0,   -- time spent, not time elapsed
  device text,                            -- 'phone' | 'tablet' | 'desktop'
  screen_w integer,
  entry_path text,                        -- which page the visit started on
  created_at timestamptz default now()
);

alter table trainee_sessions enable row level security;

-- Same open policy as every other table on this project. This is the thing
-- the README flags as needing to be tightened before real staff sign in —
-- adding a table here does not change that, it widens it by one more table.
drop policy if exists "trainee_sessions open" on trainee_sessions;
create policy "trainee_sessions open" on trainee_sessions
  for all using (true) with check (true);

create index if not exists trainee_sessions_trainee_idx
  on trainee_sessions (trainee_id);
create index if not exists trainee_sessions_started_idx
  on trainee_sessions (started_at desc);
