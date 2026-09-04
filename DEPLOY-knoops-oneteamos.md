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
