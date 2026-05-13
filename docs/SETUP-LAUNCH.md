# TenderFlow launch checklist

What needs to happen before public launch, in order.

---

## A. Migrations to apply in Supabase (5 min)

Open https://supabase.com/dashboard/project/rtessqlvvsjecogctwok/sql/new and paste these one at a time, hitting Run between each:

- [ ] `supabase/migrations/006_agpo.sql` (you said it's already done; verify by querying `tenders.agpo_category`)
- [ ] `supabase/migrations/007_storage_mime_locks.sql` (NEW. Locks bucket MIME types as defense in depth.)

---

## B. Supabase production settings (10 min)

### B1. Upgrade to Pro tier ($25/month)

https://supabase.com/dashboard/project/rtessqlvvsjecogctwok/settings/billing → **Upgrade to Pro**.

What this gets you that the free tier doesn't:
- **7 daily database backups** (free tier: 0)
- **8 GB database** (free tier: 500 MB; you'll hit this within months at 50K users)
- **100 GB Storage** (free tier: 1 GB; PDFs + CVs + photos will exceed this)
- **No project pausing after 1 week of inactivity**
- **Faster connection pooler** (matters under load)
- **PITR (point-in-time-recovery)** as an add-on

Required for production. Don't launch without this.

### B2. Auth → URL Configuration

https://supabase.com/dashboard/project/rtessqlvvsjecogctwok/auth/url-configuration

- **Site URL**: `https://tenderflow.co.ke`
- **Redirect URLs**: add `https://tenderflow.co.ke/**` and `https://www.tenderflow.co.ke/**`
- Keep `https://flow-v2-livid.vercel.app/**` as a fallback.

### B3. Auth → Providers → Email

- **Confirm email**: turn **ON** for production (users must verify their address before they can sign in). This kills automated junk signups.
- **Secure email change**: ON
- **Secure password change**: ON

### B4. Auth → Settings → JWT expiry

https://supabase.com/dashboard/project/rtessqlvvsjecogctwok/auth/providers → JWT settings

**My recommendation: leave the default of 3600 seconds (1 hour).** You asked for 24 hours so stolen tokens expire within a day; the default is even better — stolen tokens expire within an hour and refresh tokens handle the seamless renewal. Don't change this. If you must, cap at 7200 (2 hours).

### B5. Auth → Rate Limits

https://supabase.com/dashboard/project/rtessqlvvsjecogctwok/auth/rate-limits

Tighten from defaults:
- Sign-up: 30/hour per IP (default 30, fine)
- Sign-in (password): 30/hour per IP — leave default
- Token refresh: 1800/hour — leave default
- Magic link: 10/hour per IP — keep tight
- Recover (forgot password): 10/hour per IP — keep tight

---

## C. Vercel environment variables (5 min)

https://vercel.com/dashboard → flow-v2 → Settings → Environment Variables.

Required (probably already set, verify):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `ADMIN_EMAILS` = `kennedynange@gmail.com`

Add/update for launch:
- `SITE_URL` = `https://tenderflow.co.ke`
- `RESEND_API_KEY` = (after Resend setup — see SETUP-CLOUDFLARE.md section 8)
- `RESEND_FROM` = `"TenderFlow <help@tenderflow.co.ke>"`

After any env var change, **Deployments → latest → Redeploy** to pick them up.

---

## D. Cloudflare (20 min)

Follow `docs/SETUP-CLOUDFLARE.md` end to end. The free plan covers DDoS, SSL, CDN, Bot Fight Mode, and one rate-limit rule on the sign-in path.

---

## E. Security checklist (mapped to your 10-item list)

| # | Item | Status | Where |
|---|---|---|---|
| 1 | Rate limit on login endpoint | **Partly done.** Supabase enforces its own auth rate limits server-side. Cloudflare rule on `/sign-in` (this commit's setup docs) adds an edge layer. | Cloudflare rule + Supabase Auth rate limits |
| 2 | Rate limit on PDF download | **Partial.** Supabase signed URLs expire in 1 hour. Cloudflare Bot Fight Mode catches obvious scrapers. True per-user-per-hour limits would need a custom download API; defer to post-launch. | Bot Fight Mode + signed URL expiry |
| 3 | JWT tokens expire after 24 hours | **Better than asked: default is 1 hour.** Refresh tokens handle the renewal silently. Don't change. | Supabase Auth defaults |
| 4 | File type validation on uploads | **Done in this commit.** Server-side PDF magic-byte check in `/api/extract-tender`; client-side type+size checks on consultant photo, CV, and issuer logo; storage bucket `allowed_mime_types` lock via migration 007. | api/extract-tender.js + consultant signup/edit + AdminUpload + migration 007 |
| 5 | File size limits | **Done.** 25 MB cap on tender PDFs (bucket + API), 10 MB on CVs, 5 MB on consultant photos, 2 MB on issuer logos. | All client + server uploaders |
| 6 | Password hashing | **Done by Supabase.** bcrypt-based; we never see plaintext passwords. | Supabase Auth |
| 7 | Input sanitisation | **Mostly done.** React auto-escapes all JSX (kills XSS); Supabase uses parameterized queries (kills SQL injection); admin upload still validates string lengths server-side via Postgres constraints. | Stack-default protections |
| 8 | HTTPS everywhere | **Done.** Vercel auto-issues certs; Cloudflare "Always Use HTTPS" forces redirects. | Vercel + Cloudflare |
| 9 | Env vars in `.env`, never committed | **Done.** `.env`, `.env.local` are in `.gitignore`; production secrets only live in Vercel env var manager. | .gitignore + Vercel |
| 10 | Automated daily backups | **Done after B1.** Supabase Pro includes 7 daily backups. | Supabase Pro |

---

## F. Cost controls (extraction API)

The extraction pipeline was rewritten in this commit:

- **Primary path**: extract text from PDF locally with `pdf-parse`, send the text (not the PDF) to **Claude Haiku 4.5**. ~$0.005/PDF.
- **Fallback path**: if text extraction fails (image-only scanned PDFs), fall back to **Sonnet 4.5 + document content block**. ~$0.25/PDF, but rare.
- **Hard cap**: clip PDFs to 30 pages before processing (was 50). Lower token cost.
- **Hard cap**: clip extracted text to 60,000 characters (~15K tokens). Predictable cost.

**Expected savings**: from ~$0.25/PDF to ~$0.005/PDF on the majority case. Your $5 budget now covers ~1,000 PDFs instead of ~20.

**Optional further savings if needed later**:
- Hash + cache extractions: skip Claude for re-uploads of the same PDF
- Set a per-day cost cap via Anthropic dashboard
- Move to dedicated capacity if usage justifies it

---

## G. Final pre-launch smoke test

After everything above, open `https://tenderflow.co.ke` in incognito and confirm:

- [ ] Home page loads in <2s, hero image visible
- [ ] Sign up with a brand new email → confirmation email arrives (check spam) → click link → land on dashboard
- [ ] Browse tenders → load a tender detail page → click "Show checklist" → checklist renders → download .docx works
- [ ] As admin: sign in → upload a real tender PDF → extraction completes in <30s → review the fields → publish
- [ ] As anon: visit /admin → redirects to sign-in (admin route is gated)
- [ ] As anon: try to fetch a draft tender via the Supabase REST API → 401 (RLS works)
- [ ] Cloudflare analytics shows traffic flowing through

If any of these fail, paste the symptom and we'll fix before announcement.

---

## H. Post-launch monitoring

For the first week:

- Watch Vercel function logs for any 5xx on `/api/extract-tender` (https://vercel.com → flow-v2 → Logs)
- Watch Anthropic dashboard for cost spikes (https://console.anthropic.com → Usage)
- Watch Supabase logs for failed queries / hot tables (Dashboard → Logs)
- Watch Cloudflare for blocked bot traffic — confirm Bot Fight isn't blocking legitimate Kenyan ISPs (rare but possible)
