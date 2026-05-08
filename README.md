# TenderFlow

**Pan-African tender intelligence — government, private, NGO and SME opportunities, consolidated.**

A production-ready SaaS web app: public tender listings + admin dashboard with AI-powered PDF extraction.

## Stack

- **Frontend:** Vite + React 18 + React Router v6
- **Backend:** Supabase (Postgres + Auth + Storage)
- **AI:** Anthropic Claude (PDF extraction via document content blocks)
- **Hosting:** Vercel (static + serverless functions)

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173. The app runs in demo mode (sample tenders) until you wire up Supabase.

For full setup including Supabase, GitHub, and Vercel deployment, see [docs/SETUP.md](docs/SETUP.md).

## Project layout

```
.
├── api/                       Vercel serverless functions
│   └── extract-tender.js      POST /api/extract-tender — PDF → Claude → JSON
├── src/
│   ├── components/            Header, Footer, Logo, Badge, AdminBar, AdminGuard, TenderViews
│   ├── pages/                 Home, Listings, TenderDetail, About, HowItWorks, Onboard,
│   │                          SignIn, AdminDashboard, AdminUpload, InfoPages (legal/marketing)
│   ├── lib/                   AuthProvider, supabaseClient, useTenders, format, constants
│   ├── styles/                styles.css
│   ├── App.jsx                Router
│   └── main.jsx               Entry
├── supabase/migrations/       SQL — tables, RLS, storage bucket
├── docs/SETUP.md              Step-by-step setup guide
├── public/
├── index.html
├── vite.config.js
├── vercel.json
└── package.json
```

## How it works

1. **Public visitors** browse tenders at `/tenders`, filter by source/country/sector, view detail at `/tenders/:id`, or sign up for the digest at `/digest`.
2. **Admin** (allowlisted email) signs in via magic link at `/sign-in`, then visits `/admin` to manage tenders.
3. **Upload flow:** admin drops a PDF → it's uploaded to Supabase Storage → backend serverless function sends it to Claude with a structured-extraction prompt → admin reviews and edits the extracted fields → publishes.
4. Public listings come from the `tenders` table where `status = 'published'`. RLS enforces that anonymous users can't see drafts.

## Admin allowlist

Admin gating is done by email. The allowlist is stored in the `admin_emails` table (seeded with `kennedynange@gmail.com`). To add admins, run:

```sql
insert into public.admin_emails (email) values ('newperson@example.com');
```

The frontend also reads `VITE_ADMIN_EMAILS` for an additional client-side check, and `/api/extract-tender` checks `ADMIN_EMAILS` server-side for upload authorization.
