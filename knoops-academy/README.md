# Knoops Academy — build status & step-by-step to go live

Everything below is either **done** (built this session, sitting in this repo) or a **step for Doug** — clearly marked. This repo lives at `~/knoops-academy` in the Claude session workspace; the whole thing is a single git repo, ready to push.

## What's already built

- Full static site: hub page + 5 academies, each with a module index and a shared module reader (`shared/app-common.js`)
- Real Knoops brand styling (`shared/styles.css`) — colors, chocolate-button motif, tone — per `claude/knoops-style-guide.md`
- **Academy 1** (Brand & Culture) and **Academy 2** (Ritual & Hospitality) have their real, full content wired in as structured data (`content-data.js`), including the "Ask the Founder" grounding table and a working certification quiz with reveal-and-explain
- **Academies 3, 4, 5** are functional and navigable now, with real (condensed) content per module — the full ~2000-word prose for these already exists in the project docs (`claude/knoops-academy3-module*-content.md`, etc.) and just needs transcribing into their `content-data.js` files the same way Academy 1/2 were done. That's mechanical work, not a design decision — happy to do it in a follow-up pass.
- Progress tracking works right now via the browser's local storage — no backend needed to click through and demo the whole platform
- Supabase schema (`supabase/migrations/0001_init.sql`) — includes the `academy_content` table seeded with the real 9-quote "Ask the Founder" grounding data, plus `trainees`, `quiz_attempts`, `ask_queries`, and a `signoffs` table for the live Store Trainer sign-off workflow from the Tell-Show-Do correction
- AI edge function (`supabase/functions/knoops-academy-ai/index.ts`) — grounds answers only in what's in the database, same discipline as the Motos "Ask This Manual" function, with the same lessons already baked in (paginated content fetch, correct text-block parsing)
- Verified: every page loads (200), all JS is syntax-clean

**You can open `index.html` in a browser right now and click through the whole thing.** The AI widget will show a friendly "not connected yet" message until Supabase is wired up — everything else works.

## Step-by-step: what's left, in order

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

### 8. (Optional, when ready) Finish transcribing Academies 3-5
- The full module content already exists, written and reviewed, in the project docs. Ask Claude to transcribe `claude/knoops-academy3-module*-content.md` (and 4, 5) into `academy3/content-data.js` etc., following the exact pattern already used in `academy1/content-data.js` and `academy2/content-data.js`. This is quick, mechanical work once you're ready for it — no new decisions needed.

### 9. (Later, not urgent) The live sign-off workflow
- The `signoffs` table exists in the schema, but there's no UI for a Store Trainer to actually record one yet — that's real remaining platform work, not urgent for the initial blind-build demo to Greg, but worth planning before this becomes the real, in-use tool at Knoops.

## Notes / things to keep in mind
- Everything in this build is designed to keep working with **zero backend** — if step 4-7 never happen, the site is still a complete, clickable demo. Supabase only adds the live AI grounding and real analytics/tracking.
- The site is bespoke to Knoops (not multi-tenant), per your earlier decision — if you ever want to resell this to another counter-serve brand, that's a real second build, not a config flip.
- Nothing in the trainee-facing content references Knoops' public reviews, Glassdoor, or any of the research that shaped which modules got the most weight — that's intentional (see the "two-layer strategy" in `claude/knoops-academy-outlines.md`), worth a final read-through before showing anyone outside this conversation.
