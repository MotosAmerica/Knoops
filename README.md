# Knoops Academy — build status & step-by-step to go live

Everything below is either **done** (built this session, sitting in this repo) or a **step for Doug** — clearly marked. This repo lives at `~/knoops-academy` in the Claude session workspace; the whole thing is a single git repo, ready to push.

## What's already built

- Full static site: hub page + 5 academies, each with a module index and a shared module reader (`shared/app-common.js`)
- Real Knoops brand styling (`shared/styles.css`) — colors, chocolate-button motif, tone — per `claude/knoops-style-guide.md`
- **All 5 academies have real, full content** wired in as structured data (`content-data.js`) — Academy 1 & 2 as originally built, Academy 3 and Academy 5 fully transcribed from the project docs, Academy 4 kept deliberately thin (an honest placeholder seam for Greg's real recipes/technique specs, not an oversight)
- **Sign-in (no password)**: name, store, and role, captured once per device via `shared/signin.js` and written to the `trainees` table — store list lives in `shared/knoops-stores.js` (real Knoops locations, UK/UAE/US, sourced from knoops.com's store locator) so a new store opening is a one-line edit, not a database migration
- **Manager tracker** (`tracker/index.html`) — a live, read-only dashboard for Store Trainers/Managers/District Managers: who's signed in, per-store and per-person completion %, filterable by store and academy. Anyone signed in with a manager-tier role sees a "Team Progress" link in the topbar; the page itself has no separate login (same "internal use only, don't link it publicly" model used across the platform)
- Progress tracking is both local (works offline, no backend needed to demo) and synced to Supabase (`module_progress`, `quiz_attempts`) whenever someone's signed in and Supabase is connected — the tracker reads from the synced data
- Supabase schema (`supabase/migrations/0001_init.sql`, `0002_signin_tracker.sql`) — `academy_content` (seeded with the real 9-quote "Ask the Founder" grounding data), `trainees`, `quiz_attempts`, `ask_queries`, `module_progress`, and a `signoffs` table for the live Store Trainer sign-off workflow from the Tell-Show-Do correction
- AI edge function (`supabase/functions/knoops-academy-ai/index.ts`) — grounds answers only in what's in the database, same discipline as the Motos "Ask This Manual" function, with the same lessons already baked in (paginated content fetch, correct text-block parsing)
- Verified: every page loads (200), all JS is syntax-clean, sign-in/progress-sync/tracker flows tested end-to-end in a real browser (Playwright) with mocked Supabase responses

**You can open `index.html` in a browser right now and click through the whole thing.** The AI widget will show a friendly "not connected yet" message until Supabase is wired up — everything else works.

## Live now

The repo, GitHub Pages, Supabase project, database migrations, and edge function are all set up and live — this isn't a "step-by-step to go live" doc anymore, it's the running platform. What's left is smaller, specific items:

- **Add your Anthropic API key as a Supabase secret** if "Ask the Founder" ever stops answering (Supabase project → Edge Functions → `knoops-academy-ai` → Secrets → `ANTHROPIC_API_KEY`) — this was set up once already; only relevant if it needs rotating.
- **Academy 4 (Craft & Recipes)** is still the deliberately thin placeholder — real technique/recipe specifics from Greg drop into `academy4/content-data.js` whenever you have them, without needing to touch the module structure.
- **The live sign-off workflow** (item 9 below) is still just a database table with no UI.

Steps 1-7 that used to be here (repo, Pages, Supabase project, migration, edge function, config) are done — kept below only as reference if you ever spin up a second environment.

<details>
<summary>Original setup steps (for reference / a second environment)</summary>

### 1. Get the files onto your computer
This session can't push to GitHub directly (no linked computer / gh auth in this session). Easiest path: ask Claude to package this folder and send it to you, or connect your computer to a Cowork session and Claude can write it directly into a folder there. Either way, you end up with the `knoops-academy` folder on your machine.

### 2. Create the GitHub repo
- On github.com, create a new **private** repo (e.g. `knoops-academy`) — private for now since this is the blind build, make it public later if/when you want it visible before showing Greg.
- In the `knoops-academy` folder on your computer:
  ```
  git remote add origin https://github.com/<your-username>/knoops-academy.git
  git add -A
  git commit -m "Initial Knoops Academy build"
  git branch -M main
  git push -u origin main
  ```

### 3. Turn on GitHub Pages (no custom URL, as you asked)
- In the repo on GitHub: **Settings → Pages**
- Source: **Deploy from a branch**, Branch: **main**, folder: **/ (root)**
- Save. GitHub gives you a URL like `https://<your-username>.github.io/knoops-academy/` within a minute or two — that's your live site, no domain purchase needed.

### 4. Create the Supabase project
- You've got one Supabase org available right now ("Motos America") — a new project there is **$10/month** and technically separate (own database, own credentials) but billed under that org. If you want Knoops fully separate from day one, set up a new Supabase org first; otherwise just create the project under Motos America and move it later if needed.
- In Supabase: **New Project** → name it `knoops-academy` → pick a region → create.

### 5. Run the database migration
- In the new project: **SQL Editor** → paste the contents of `supabase/migrations/0001_init.sql` → run it.
- This creates all the tables and seeds the real "Ask the Founder" quote data.

### 6. Deploy the AI edge function
- Install the Supabase CLI if you don't have it: `npm install -g supabase`
- From the `knoops-academy` folder: `supabase link --project-ref <your-project-ref>` (found in Supabase project settings)
- Set your Anthropic API key as a secret: `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`
- Deploy: `supabase functions deploy knoops-academy-ai`

### 7. Connect the frontend to Supabase
- Open `shared/config.js`
- Fill in `SUPABASE_URL` and `SUPABASE_ANON_KEY` (both found in Supabase project **Settings → API**)
- Commit and push (`git add -A && git commit -m "Connect Supabase" && git push`) — GitHub Pages auto-updates within a minute or two.
- The "Ask the Founder" widget in Academy 1 will now give real, grounded answers.

### 8. Academies 3-5 content
- Done — transcribed from the project docs into `academy3/content-data.js` and `academy5/content-data.js`. Academy 4 stays intentionally thin (see above).

</details>

### 9. (Later, not urgent) The live sign-off workflow
- The `signoffs` table exists in the schema, but there's no UI for a Store Trainer to actually record one yet — that's real remaining platform work, not urgent for the initial blind-build demo to Greg, but worth planning before this becomes the real, in-use tool at Knoops.

## Interactive "Do — Practice" (voice + AI grading)

Every `Do — practice` prompt across the reading modules is a real interactive rep, not a text box that goes nowhere:

- **Speak or type.** Phone-first: a big mic button is the primary input, the keyboard is the fallback. Transcription happens **on-device** via the browser's own speech recognition — no audio leaves the phone, no transcription API key, no per-minute cost. The transcript lands in an editable box so a mis-heard word can be fixed before submitting. Browsers without speech support (mainly Firefox) simply get the text box; nothing else changes.
- **AI grades it 1-5** via the `knoops-academy-ai` edge function (`action: "grade"`). The module's **full teaching text is sent with every submission**, so the grader marks the answer against what that module actually taught rather than against its own idea of a good answer. Grounding order is deliberate: **Jens' own sourced quotes first** (the same `academy_content` rows the Ask widget uses), then general hospitality knowledge, but only ever anchored to verified Knoops facts. The grader is forbidden from inventing a Knoops fact, menu item, policy, or Jens quote.
- **It grades comprehension, not English.** Answers arrive as raw voice transcripts, so the prompt carries an explicit do-not-deduct list: spelling, grammar, punctuation, speech-to-text mangling, length, filler words, style, not matching the module's example wording, and minor date/number slips. Deducting for any of those is defined as a grading error.
- **The scale:**
  - **5** — excellent comprehension. Reserved and earned: everything a 4 has, *plus* visible judgement (adapting to the customer in front of them, anticipating a reaction, working from the principle rather than the instruction).
  - **4** — the normal, expected score. They understood the lesson and applied it. Small slips and rough edges are fine here. A 4 is a good outcome, not a near miss.
  - **3** — a specific element the module explicitly taught is absent or muddled.
  - **2** — little evidence the idea landed; generic, or answering a different question.
  - **1** — didn't engage, off-topic, or does the opposite of what was taught.
  
  Two worked calibration examples from different lessons are baked into the prompt to anchor the 4/5 line, plus guards in both directions: it must be able to name a missing *idea* before scoring 3 or below, and must confirm genuine insight before awarding a 5. Verified against 9 answers across three lessons.
- **Scores are feedback, not a gate.** A low score never blocks module completion — below a 4 the UI warmly nudges another attempt; a 5 gets a kudos band. It gives the trainee a next step and a Store Trainer something real to coach against.
- **Retry is unlimited and encouraged** — every attempt is stored, the newest is what shows.
- **Recorded to `practice_responses`** (score, feedback, response text, and whether it was spoken or typed) and cached per-device in `localStorage`, so a graded answer survives a page reload and the whole thing still works if Supabase is unreachable.
- **Surfaced in the tracker**: average practice score and total reps logged as headline stats, plus a per-person Practice column showing their average, rep count, and how many were spoken aloud.

## Sign-in & the manager tracker

- **Trainee sign-in** (`shared/signin.js`) shows once per device — name, store (dropdown from `shared/knoops-stores.js`, the real Knoops locations), and role. No password. The record is cached in `localStorage` so someone isn't asked again on the same device, and written to the `trainees` table so a manager can see it. "Sign out" in the topbar clears the local cache (useful for a shared/shop device where multiple people sign in over time).
- **Store list** is a plain JS array, not a database constraint — adding a new store as Knoops opens one is a one-line edit to `shared/knoops-stores.js`, no migration needed. "Other / not listed" is always there as a fallback.
- **Roles**: Knoopologist, Shift Lead, Store Trainer, Store Manager, District/Regional Manager. Role never gates academy content (everyone sees everything, matching the "all staff, same page" decision) — it only controls whether the "Team Progress" link shows up in the topbar.
- **Manager tracker** (`tracker/index.html`) is a read-only dashboard: total signed in, average completion, who's fully certified, a store/academy filter, and a per-person progress bar with last-active date. It reads live from `trainees` + `module_progress` + `quiz_attempts` — nothing to configure. Like the rest of the platform, it has no password of its own; don't link it anywhere public.
- **Progress sync**: every "Mark module complete" click (reading modules and quizzes) writes to `module_progress` (and `quiz_attempts` for quizzes, with the score) whenever someone's signed in and Supabase is connected — that's what feeds the tracker. If Supabase isn't reachable, local progress still works, it just won't show up for a manager until it's back.

## Notes / things to keep in mind
- Everything in this build is designed to keep working with **zero backend** — the site is a complete, clickable demo even if Supabase were ever disconnected. Supabase adds the live AI grounding, real analytics, and the manager tracker.
- The site is bespoke to Knoops (not multi-tenant), per your earlier decision — if you ever want to resell this to another counter-serve brand, that's a real second build, not a config flip.
- Nothing in the trainee-facing content references Knoops' public reviews, Glassdoor, or any of the research that shaped which modules got the most weight — that's intentional (see the "two-layer strategy" in `claude/knoops-academy-outlines.md`), worth a final read-through before showing anyone outside this conversation.
