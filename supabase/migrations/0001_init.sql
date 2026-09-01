-- Knoops Academy — initial schema
-- Mirrors the pattern used in the Motos Academy build (academy_content table
-- read at runtime by the AI edge function, rather than bundling content into
-- the deploy — avoids the per-deploy size ceiling issue hit on that project).
-- Run this in the Supabase SQL editor, or via `supabase db push` once the
-- project is linked locally.

create table if not exists public.academy_content (
  id bigint generated always as identity primary key,
  academy text not null,             -- e.g. 'academy1'
  module_num int not null,           -- e.g. 2 (Ask the Founder module)
  topic text,                        -- short label, e.g. "Sourcing accountability"
  content text not null,             -- the actual quote/fact text the AI may draw from
  source text,                       -- citation label, e.g. "Utah Business"
  source_url text,
  created_at timestamptz default now()
);

create table if not exists public.trainees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  store_location text,
  role text default 'knoopologist',  -- knoopologist | shift_lead | store_trainer
  created_at timestamptz default now()
);

create table if not exists public.quiz_attempts (
  id bigint generated always as identity primary key,
  trainee_id uuid references public.trainees(id),
  academy text not null,
  module_num int not null,
  score numeric,
  passed boolean,
  created_at timestamptz default now()
);

create table if not exists public.ask_queries (
  id bigint generated always as identity primary key,
  trainee_id uuid references public.trainees(id),
  academy text not null,
  module_num int,
  question text not null,
  answer text,
  created_at timestamptz default now()
);

-- Live Store Trainer sign-off — the "real Do" from the Tell-Show-Do
-- correction. A digital module completion (tracked client-side via
-- localStorage for now, or quiz_attempts once wired up) is NOT the same as
-- this record. Certification for physical/operational skills should require
-- both.
create table if not exists public.signoffs (
  id bigint generated always as identity primary key,
  trainee_id uuid references public.trainees(id),
  academy text not null,
  module_num int not null,
  signed_off_by uuid references public.trainees(id), -- the Store Trainer
  notes text,
  created_at timestamptz default now()
);

-- RLS: permissive for MVP/demo purposes (anon key can read content, and
-- insert trainee-generated rows). Tighten before any real staff data is
-- involved — e.g. scope inserts to authenticated sessions once real login
-- exists, and consider whether trainee PII needs stricter read policies.
alter table public.academy_content enable row level security;
alter table public.trainees enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.ask_queries enable row level security;
alter table public.signoffs enable row level security;

create policy "anon can read academy_content" on public.academy_content
  for select using (true);

create policy "anon can insert/select trainees" on public.trainees
  for all using (true) with check (true);

create policy "anon can insert/select quiz_attempts" on public.quiz_attempts
  for all using (true) with check (true);

create policy "anon can insert/select ask_queries" on public.ask_queries
  for all using (true) with check (true);

create policy "anon can insert/select signoffs" on public.signoffs
  for all using (true) with check (true);

-- Seed: Academy 1, Module 2 "Ask the Founder" grounding table — the exact
-- 9 sourced quotes from claude/knoops-academy1-content.md. This is what
-- keeps the AI widget honest: it should only draw from rows like these.
insert into public.academy_content (academy, module_num, topic, content, source, source_url) values
('academy1', 2, 'Origin / why he started', 'Couldn''t find a genuinely good hot chocolate anywhere in London, not even in the big coffee chains — winter 2012.', 'Oxford Student', 'https://www.oxfordstudent.com/2024/11/24/in-conversation-with-jens-knoop/'),
('academy1', 2, 'Growth philosophy', 'Making the best drink for the next customer that would walk in — not focused on rapid expansion early on.', 'Oxford Student', 'https://www.oxfordstudent.com/2024/11/24/in-conversation-with-jens-knoop/'),
('academy1', 2, 'Emotional core of the product', 'A little hug in a mug.', 'Oxford Student', 'https://www.oxfordstudent.com/2024/11/24/in-conversation-with-jens-knoop/'),
('academy1', 2, 'Sourcing accountability', 'It''s my name on the stores. I am responsible for what we are selling in the stores.', 'Utah Business', 'https://www.utahbusiness.com/industry/2026/08/12/uk-based-hot-chocolate-sommelier-jens-knoop-knoops-slc-utah-american-debut/'),
('academy1', 2, 'Sourcing practice', 'Personally visits cacao farms in Peru, Colombia, Venezuela, and Ghana to build direct relationships with farmers.', 'Utah Business', 'https://www.utahbusiness.com/industry/2026/08/12/uk-based-hot-chocolate-sommelier-jens-knoop-knoops-slc-utah-american-debut/'),
('academy1', 2, 'Inclusivity / personal taste', 'Just because I don''t like it doesn''t mean it''s not the ultimate chocolate drink for someone else.', 'About Time Magazine', 'https://www.abouttimemagazine.co.uk/life/about-time-you-met-jens-knoop-founder-of-knoops/'),
('academy1', 2, 'Community / local connection', 'Wants every store to incorporate local producers because we are part of their community.', 'Utah Business', 'https://www.utahbusiness.com/industry/2026/08/12/uk-based-hot-chocolate-sommelier-jens-knoop-knoops-slc-utah-american-debut/'),
('academy1', 2, 'Best feedback he''s had', 'Customers who walked out, then came back in just to say ''this is the best thing I ever had.''', 'Utah Business', 'https://www.utahbusiness.com/industry/2026/08/12/uk-based-hot-chocolate-sommelier-jens-knoop-knoops-slc-utah-american-debut/'),
('academy1', 2, 'Continuous improvement', 'We are improving every day based on customer feedback, with small and big changes being implemented all the time.', 'About Time Magazine', 'https://www.abouttimemagazine.co.uk/life/about-time-you-met-jens-knoop-founder-of-knoops/');
