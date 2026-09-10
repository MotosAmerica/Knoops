# Deploying to knoops.oneteamos.com

A subdomain on your existing hosting is a better answer than a custom domain on GitHub Pages, for a reason worth stating plainly: **it removes the repo from the picture entirely.** There's no GitHub URL to hand over, no git history, no README explaining the architecture, no migrations, no spec docs. Someone can still read the frontend — that's unavoidable for any website — but they get a shell with no working backend and no instructions.

## Before you start: the trap

**Do not upload the project folder as-is.** It contains things that would be publicly fetchable the moment they're inside the web root:

- `supabase/functions/knoops-academy-ai/index.ts` — the AI grading rubric. This is the one genuinely private asset you have. It normally never touches a browser; uploading it publishes it.
- `supabase/migrations/*.sql` — your whole schema.
- `README.md`, the spec docs, the audit — the architecture, written out.

Use the `knoops-academy-deploy.zip` bundle instead. It's the same site with those stripped out: 34 files, everything the browser needs, nothing it doesn't.

## Recommended: cPanel Git Version Control (same as motosacademy.com)

Since you're still developing, deploy from git rather than uploading zips. The repo now contains a `.cpanel.yml` that does the curation for you on every deploy — it publishes only the browser files and actively removes anything sensitive from the docroot. The zip bundle is still attached as a fallback if you'd rather do it once by hand.

1. **Create the subdomain.** cPanel → *Domains* → `knoops.oneteamos.com`. Note the document root it gives you (usually `/home/YOURUSER/knoops.oneteamos.com`).

2. **Set the deploy path.** Open `.cpanel.yml` in the repo and change the first task to your real docroot:
   ```
   - export DEPLOYPATH=/home/YOURUSER/knoops.oneteamos.com
   ```
   Commit and push. Nothing else in that file needs editing.

3. **Make the repo private, then give cPanel a key.** Repo → *Settings* → *Pages* → Source *None*; then *General* → *Danger Zone* → *Change visibility* → Private.
   In cPanel → *SSH Access* → *Manage SSH Keys* → generate a key, copy the **public** key. In GitHub: repo → *Settings* → *Deploy keys* → *Add deploy key* → paste it (read-only is enough).

4. **Clone it in cPanel.** cPanel → *Git Version Control* → *Create* → toggle *Clone a Repository* → paste the SSH URL (`git@github.com:motosamerica/Knoops.git`) → set the repository path (somewhere **outside** the docroot, e.g. `/home/YOURUSER/repos/knoops`) → Create.

5. **Deploy.** In *Git Version Control*, on that repo → *Manage* → *Pull or Deploy* tab → *Update from Remote*, then *Deploy HEAD Commit*. That runs `.cpanel.yml` and populates the subdomain.

   That's your update loop from now on: push to GitHub, then two clicks in cPanel. If your host allows SSH, `cd ~/repos/knoops && git pull && /usr/local/cpanel/scripts/... ` — or simply `git pull` then Deploy — does the same.

6. **SSL.** cPanel → *SSL/TLS Status* → run *AutoSSL* on the subdomain. **Required** — the mic will not work over plain HTTP.

7. **Password-protect the internal pages.** cPanel → *Directory Privacy* → `knoops.oneteamos.com/tracker` → tick *Password protect this directory*, add a user. Repeat for `/analytics`. The academies stay open so the demo just works. This is the password protection you wanted — five minutes on this hosting.

8. **Verify.** Load `https://knoops.oneteamos.com`, sign in, run a practice rep out loud. Then confirm these 404 or prompt for a password:
   - `/README.md` · `/supabase/migrations/0001_init.sql` · `/tracker/` · `/analytics/`

## Why the whitelist matters

`.cpanel.yml` lists what to **publish** rather than what to exclude. That's deliberate: when you add a spec doc, a migration or another edge function later, it stays private by default instead of being one forgotten `.gitignore` line away from public. The last few tasks also delete any stray `.md`, `.sql`, `.ts` or `supabase/` from the docroot on every deploy, so a manual upload can't leave something behind.

If you add a sixth academy, add its three lines to `.cpanel.yml` — otherwise it won't publish. That's the intended trade.

## Updating later

Push to GitHub, then *Update from Remote* → *Deploy HEAD Commit* in cPanel. No build step, no pipeline, and the curation is automatic.

## What this does and doesn't protect

**Does:** removes the repo, the schema, the migrations, the architecture docs and the AI rubric from public reach. Puts the internal pages behind a password. Makes the demo look like a product rather than a GitHub project.

**Doesn't:** hide the frontend HTML/CSS/JS. That's delivered to every visitor's browser by definition — true of every website ever made. Someone determined can copy the markup and the styling. What they cannot get is the curriculum's provenance, the grading rubric, the Supabase project, or you.

**Still outstanding:** the Supabase row-level security policies are currently wide open (`using (true)`), which means the anon key in `shared/config.js` — which is *supposed* to be public, that part is normal — is the only thing standing between a curious visitor and every trainee's name, comments and practice answers. That's fine with only test data in it. It needs fixing before real Knoops staff sign in, and it's a separate job from this deploy.

---

## Pull when auth ships

Everything in this section is **demo scaffolding**. It exists because the platform
currently has no access control: sign-in is an identity prompt, not an auth gate
(`shared/signin.js` — "it never gates any academy content"), every academy is
reachable by URL, and role does nothing but decide whether the Team Progress link
appears in the topbar. Copy that promised gating was therefore describing behaviour
the build does not have.

**Precondition — do not start this list until the gate actually works.** "Works"
means, tested against a real account with a non-leadership role:

1. `academy5/index.html` and `academy5/module.html?m=1` refuse to render content —
   not just hide the card on the hub. Typing the URL must not work.
2. The refusal survives a page reload and a fresh browser (i.e. it is enforced
   server-side or by a real session, not by a JS flag any visitor can flip in
   devtools).
3. A role change to Shift Lead / Store Trainer / Store Manager grants access
   without a redeploy.
4. If knowledge checks are meant to gate too: failing Academy 1 Module 6 blocks
   Academy 2, and passing it unblocks it, both verified live.

If any of those four is not true, the copy is still lying — leave it alone.

### 1. Remove the DEMO-ONLY blocks

Search the repo for `DEMO-ONLY` and remove each marked block.

> **Status as of 10 Sept 2026: this search returns nothing.** There are no
> `DEMO-ONLY` markers anywhere in the repo — not in the HTML, the content-data
> files, the shared JS, or the CSS. Either they were never added, or they live in
> a different project. Add the markers before relying on this step, or treat
> section 2 below as the authoritative list of what to undo.

### 2. Restore the gating copy

These strings were softened on 10 Sept 2026 because the gate they described does
not exist. Restore them **only** once the precondition above passes. Exact
before/after so this is a mechanical revert:

| File | Currently reads | Restore to |
|---|---|---|
| `index.html` (intro, ~line 20) | `Academy 5 is for staff in or entering a leadership role.` | `Academy 5 unlocks once you're on the leadership track.` |
| `index.html` (Academy 5 card, ~line 46) | `For staff in or entering a leadership role.` | `For staff in or entering a leadership role. Unlocks on promotion.` |
| `academy5/content-data.js` (`description`, ~line 7) | `For staff in or entering a leadership role. Not part of the universal sequence.` | `For staff in or entering a leadership role. Not part of the universal sequence — unlocks on promotion.` |
| `academy5/content-data.js` (header comment, line 1) | `(aimed at the leadership track, not universal)` | `(gated to leadership track, not universal)` |

The fourth item on the original change list — Academy 1 Module 5's closing line
`gating your move into Academy 2` — **was not found and was not changed.** No form
of the word "gate" appears anywhere in `academy1/content-data.js`. The nearest
string is the Module 6 summary, `"A short check before moving into Academy 2."`,
which is already non-gating and needs nothing done to it in either direction.

### 3. Re-check the rest of the sweep

Two strings were reviewed on 10 Sept 2026 and deliberately left alone. Re-read them
when auth ships, in case shipping it changes the answer:

- `academy5/content-data.js` (~line 156) — *"This isn't a formal gate to enforce
  rigidly — it's a judgment call."* About a Store Trainer's judgment on Academy 4
  readiness, not a system gate. Still accurate after auth ships, unless Academy 4
  becomes genuinely gated.
- `academy2/content-data.js` (~line 326) — *"Passing both earns your Ritual &
  Hospitality credential."* Not a progression gate, but it is an unfulfilled
  promise of a different kind: the `signoffs` table exists with no interface, so no
  credential is actually issued. Worth settling alongside auth.

### 4. Related, same root cause

`tracker/` and `analytics/` are open to anyone with the URL, and Supabase RLS is
still `using (true)` (see the last paragraph of the previous section). Real auth is
the fix for all three. Doing the copy restore without the RLS work would mean the
site claims access control it still doesn't have where it matters most.
