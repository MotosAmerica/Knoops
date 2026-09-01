-- Knoops Academy — interactive "Do — Practice" responses
-- Each Do prompt in a reading module becomes a spoken (or typed) answer that
-- gets AI-graded 1-5 and recorded here, so practice effort shows up in the
-- manager tracker alongside module completion and quiz scores.

create table if not exists practice_responses (
  id bigint generated always as identity primary key,
  trainee_id uuid references trainees(id) on delete cascade,
  academy text not null,
  module_num integer not null,
  prompt_key text not null,        -- stable id: "<screenIdx>-<blockIdx>"
  prompt_text text,
  response_text text not null,
  input_mode text default 'text',  -- 'voice' | 'text'
  score integer check (score between 1 and 5),
  feedback text,
  created_at timestamptz default now()
);

alter table practice_responses enable row level security;

drop policy if exists "practice_responses open" on practice_responses;
create policy "practice_responses open" on practice_responses
  for all using (true) with check (true);

create index if not exists practice_responses_trainee_idx
  on practice_responses (trainee_id);
create index if not exists practice_responses_academy_idx
  on practice_responses (academy, module_num);
-- Latest-attempt lookups per prompt (a trainee can retry a prompt as often
-- as they like — every attempt is kept, the newest one is what's shown).
create index if not exists practice_responses_prompt_idx
  on practice_responses (trainee_id, academy, module_num, prompt_key, created_at desc);
