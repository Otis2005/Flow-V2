# TenderFlow — Setup Guide

This walks you through getting TenderFlow running locally and deploying it to production. **Total time: ~30 minutes.**

---

## 0. Prerequisites

- Node.js 18+ (you have 24 — perfect)
- A GitHub account
- A Vercel account (free): https://vercel.com/signup — sign up with GitHub
- A Supabase account (free): https://supabase.com — sign up with GitHub
- An Anthropic API key — get one at https://console.anthropic.com → Settings → API Keys

---

## 1. Local install

```bash
cd C:\projects\TenderFlow
npm install
npm run dev
```

Visit http://localhost:5173. The site will load in **demo mode** (using the bundled sample tenders) until you connect Supabase. All public pages will work; admin/sign-in features will tell you Supabase isn't configured.

---

## 2. Supabase project (5 min)

1. Go to https://supabase.com → **New Project**.
2. Name: `tenderflow` (or anything). Region: pick closest to your users (Europe / South Africa for Africa).
3. Set a strong database password and **save it**.
4. Wait ~2 min for the project to provision.

### 2a. Get your keys

- In the project dashboard, click the **Project Settings** gear icon (bottom left) → **Data API**.
- Copy:
  - **Project URL** → this is your `VITE_SUPABASE_URL`
  - **anon / public key** → `VITE_SUPABASE_ANON_KEY`
  - **service_role secret** (from the same page, lower down) → `SUPABASE_SERVICE_ROLE_KEY` — keep this secret, never commit it.

### 2b. Run the migrations

In the Supabase dashboard, click **SQL Editor → New query**, then paste each file in order and hit **Run**:

1. `supabase/migrations/001_init.sql`
2. `supabase/migrations/002_rls.sql`
3. `supabase/migrations/003_storage.sql`

You should see "Success. No rows returned" after each.

### 2c. Verify the storage bucket

**Storage → Buckets** — you should see a `tender-pdfs` bucket marked Public.

### 2d. Configure email auth (for admin sign-in)

By default Supabase magic links work out of the box using their built-in mailer.
For production you'll want your own SMTP — but for now the default is fine.

**Auth → URL Configuration:**

- **Site URL:** `http://localhost:5173` (during local dev) — change this to your Vercel URL after deploy.
- **Redirect URLs:** add both `http://localhost:5173/admin` and (later) `https://YOUR-VERCEL-DOMAIN.vercel.app/admin`.

---

## 3. Local `.env.local`

Copy `.env.example` to `.env.local` in the project root, then fill in:

```dotenv
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...

SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
ANTHROPIC_API_KEY=sk-ant-api03-...
ADMIN_EMAILS=kennedynange@gmail.com
```

Restart `npm run dev` after creating `.env.local`.

> **Note about local AI extraction:** Vercel serverless functions in `/api` only run when you use `vercel dev` or after deploying. With plain `npm run dev`, the upload UI works but PDF extraction will 404. To test extraction locally, install the Vercel CLI: `npm i -g vercel` then run `vercel dev` instead of `npm run dev`.

---

## 4. Sign in as admin (locally)

1. Visit http://localhost:5173/sign-in.
2. Enter `kennedynange@gmail.com` and click **Send magic link**.
3. Check that inbox — click the link.
4. You should land on `/admin` and see the empty Dashboard.

---

## 5. GitHub repo

Create a new repo on GitHub:

1. Go to https://github.com/new
2. Repository name: **Flow v2** (or `flow-v2` — GitHub will normalise the URL)
3. Owner: your account
4. Visibility: your choice (private is fine)
5. **Do NOT** initialise with README/license (the local repo already has one).
6. Click **Create repository**.

Then in your terminal:

```bash
cd C:\projects\TenderFlow
git add .
git commit -m "Build TenderFlow web app + admin + AI extraction"
git remote add origin https://github.com/YOUR_USERNAME/flow-v2.git
git branch -M main
git push -u origin main
```

If you get a 2FA / password prompt, use a [Personal Access Token](https://github.com/settings/tokens?type=beta) as the password (GitHub no longer accepts account passwords on the CLI).

---

## 6. Deploy to Vercel (5 min)

1. Go to https://vercel.com/new
2. Click **Import Git Repository** → select your `flow-v2` repo.
3. Framework: Vite (auto-detected).
4. Build settings: leave defaults (`npm run build`, output `dist`).
5. **Environment variables** — add all five from your `.env.local`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `ADMIN_EMAILS` = `kennedynange@gmail.com`
6. Click **Deploy**.

After ~90 seconds, your site is live at `https://flow-v2-xxxxx.vercel.app`.

### Post-deploy checklist

- Go back to **Supabase → Auth → URL Configuration** and add your Vercel URL to:
  - **Site URL:** `https://flow-v2-xxxxx.vercel.app`
  - **Redirect URLs:** `https://flow-v2-xxxxx.vercel.app/admin`
- Sign in at `https://flow-v2-xxxxx.vercel.app/sign-in` — magic link should now redirect back to your Vercel domain.
- Try the **Admin → Upload tender** flow with a real PDF.

---

## 7. Adding a custom domain (later)

In Vercel: **Project → Settings → Domains → Add**. Point your DNS as instructed. Update Supabase Auth URLs to match.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| "Sign-in is disabled until Supabase is configured" | `.env.local` missing or wrong keys — restart dev server after editing |
| Magic link email never arrives | Check Supabase Auth logs; check spam; default mailer has rate limits |
| Magic link redirects to localhost from production | Update **Site URL** + **Redirect URLs** in Supabase Auth settings |
| Admin redirected to "Access denied" | Email not in `admin_emails` table — re-run `001_init.sql` or insert manually |
| `/api/extract-tender` 404 in dev | Use `vercel dev` instead of `npm run dev` to run serverless functions locally |
| PDF extraction returns 502 | Check `ANTHROPIC_API_KEY` is set in Vercel env vars; check Vercel function logs |
| Storage upload "row-level security policy violated" | `003_storage.sql` was not run, or your email is not in `admin_emails` |

---

## Adding more admins later

```sql
insert into public.admin_emails (email) values ('newperson@example.com');
```

Run that in Supabase SQL Editor. They'll need to sign in once via magic link to create their auth user, then they'll have admin access.
