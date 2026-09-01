-- Knoops Academy — sign-in + manager tracker support
-- Adds module_progress (reading-module completions; quiz completions already
-- have quiz_attempts from 0001). No CHECK constraints on trainees.store or
-- .role on purpose — the store/role lists live in shared/knoops-stores.js
-- and shared/signin.js so a new store or role doesn't require a migration.

create table if not exists public.module_progress (
  id bigint generated always as identity primary key,
  trainee_id uuid references public.trainees(id) on delete cascade,
  academy text not null,
  module_num int not null,
  module_title text,
  completed_at timestamptz not null default now(),
  unique (trainee_id, academy, module_num)
);

alter table public.module_progress enable row level security;

create policy "anon can insert/select/update module_progress" on public.module_progress
  for all using (true) with check (true);

create index if not exists idx_module_progress_trainee on public.module_progress(trainee_id);
create index if not exists idx_module_progress_academy on public.module_progress(academy);
