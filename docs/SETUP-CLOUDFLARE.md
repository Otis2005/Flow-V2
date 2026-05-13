# Cloudflare setup for TenderFlow

This is the launch-day Cloudflare walkthrough: DDoS protection, SSL,
global CDN, Bot Fight Mode, and edge rate limiting. Free plan covers
everything we need.

**Time required: 20 minutes.** Prerequisite: you've bought
`tenderflow.co.ke` from a Kenyan registrar (Truehost, Sasahost, Safaricom).

---

## 1. Create the Cloudflare account and add your site

1. Sign up at https://dash.cloudflare.com/sign-up (use your `kennedynange@gmail.com`).
2. Click **Add a site** → enter `tenderflow.co.ke`.
3. Select the **Free** plan.
4. Cloudflare scans your existing DNS and shows whatever records it found. You'll replace these with Vercel records in step 3.

---

## 2. Point your registrar's nameservers to Cloudflare

Cloudflare will give you two nameservers like:
```
adam.ns.cloudflare.com
zara.ns.cloudflare.com
```

Log in to your domain registrar (Truehost / Sasahost / wherever you bought `tenderflow.co.ke`):

1. Find **DNS** or **Nameserver** settings for the domain.
2. Replace whatever's there with the two Cloudflare nameservers.
3. Save.

Propagation takes 5 minutes to 24 hours, usually <1 hour for `.co.ke`.

---

## 3. Add Vercel DNS records in Cloudflare

In Cloudflare → your domain → **DNS** → **Records**, add these two records:

| Type  | Name | Content                  | Proxy        |
|-------|------|--------------------------|--------------|
| A     | @    | `76.76.21.21`            | Proxied (orange cloud) |
| CNAME | www  | `cname.vercel-dns.com`   | Proxied (orange cloud) |

The **orange cloud** (Proxy: ON) is what gives you DDoS protection, CDN, and Bot Fight Mode. Without it, traffic bypasses Cloudflare and you get nothing.

---

## 4. Add the domain in Vercel

In a separate tab:

1. https://vercel.com/dashboard → **flow-v2** → **Settings** → **Domains**.
2. Click **Add Domain** → type `tenderflow.co.ke` → Add.
3. Vercel will say "Invalid Configuration" until DNS propagates. Wait 10 min and refresh.
4. Also add `www.tenderflow.co.ke` and set it to redirect to the apex.

---

## 5. Enable Cloudflare protections

In Cloudflare dashboard, go through these tabs and flip the listed settings:

### SSL/TLS → Overview
- **Encryption mode**: set to **Full (strict)**. Vercel uses real certs so this is safe and gives you end-to-end encryption.

### SSL/TLS → Edge Certificates
- **Always Use HTTPS**: ON
- **Automatic HTTPS Rewrites**: ON
- **Minimum TLS Version**: TLS 1.2 (anything below has known issues)
- **Opportunistic Encryption**: ON

### Security → Settings (or "WAF" → "Tools")
- **Security Level**: Medium (default is fine; "I'm Under Attack" mode is for active DDoS)
- **Bot Fight Mode**: **ON**. This is the free version of Cloudflare's bot detection; blocks the obvious scrapers and credential-stuffers.
- **Browser Integrity Check**: ON
- **Challenge Passage**: 30 minutes (default)

### Security → WAF → Rate limiting rules
**Add one rate limit rule** (free plan allows one):

- **Rule name**: `Rate limit sign-in attempts`
- **If incoming requests match**:
  - **Field**: URI Path
  - **Operator**: equals
  - **Value**: `/sign-in`
- **AND**
  - **Field**: Request Method
  - **Operator**: equals
  - **Value**: `POST`
- **Then**:
  - **When rate exceeds**: 10 requests
  - **Per**: 1 minute
  - **By**: IP
  - **Take action**: Block
  - **Duration**: 10 minutes

(We can't reliably rate-limit `/api/*` paths separately on the free plan with one rule slot. Supabase already rate-limits its own auth endpoints, so this is layered defense for the sign-in form route.)

### Speed → Optimization
- **Auto Minify**: HTML, CSS, JS all ON
- **Brotli**: ON
- **Early Hints**: ON
- **Rocket Loader**: OFF (it breaks some React apps)

### Caching → Configuration
- **Browser Cache TTL**: Respect Existing Headers (Vercel sets sensible cache headers)
- **Always Online**: ON (serves cached pages if Vercel ever has an outage)

### Network
- **HTTP/3 (with QUIC)**: ON
- **WebSockets**: ON
- **0-RTT Connection Resumption**: ON
- **gRPC**: OFF (we don't use it)

---

## 6. Update Vercel + Supabase to know about the new domain

Once `tenderflow.co.ke` resolves to the site (test by visiting `https://tenderflow.co.ke` in incognito):

### Vercel
**Settings → Environment Variables**, update or add:
- `SITE_URL` = `https://tenderflow.co.ke`

Then **Deployments → latest → Redeploy**.

### Supabase
**Authentication → URL Configuration**:
- **Site URL**: `https://tenderflow.co.ke`
- **Redirect URLs**: add `https://tenderflow.co.ke/**` and `https://www.tenderflow.co.ke/**` (keep the Vercel one as a fallback).

This makes magic-link emails and password-reset emails redirect to the live domain instead of the Vercel URL.

---

## 7. Verify everything works

Use incognito mode (so no cached state):

- [ ] `https://tenderflow.co.ke` loads the site
- [ ] `http://tenderflow.co.ke` automatically redirects to HTTPS
- [ ] `www.tenderflow.co.ke` redirects to the apex
- [ ] Sign up with a test account → magic-link / confirmation email arrives → click link → lands at `tenderflow.co.ke/dashboard` (not the Vercel URL)
- [ ] Admin upload still works
- [ ] Cloudflare's analytics show traffic flowing through (Cloudflare dashboard → Analytics)

---

## 8. Optional but worth doing

### Email forwarding (so `help@tenderflow.co.ke` actually receives mail)

Cloudflare offers free email routing.

- Cloudflare dashboard → **Email** → **Email Routing** → Enable.
- Add a destination: `kennedynange@gmail.com` (or wherever you want mail delivered).
- Verify the destination via the confirmation email Cloudflare sends.
- Create routes:
  - `help@tenderflow.co.ke` → `kennedynange@gmail.com`
  - `kennedy.nange@tenderflow.co.ke` → `kennedynange@gmail.com`
  - `privacy@tenderflow.co.ke` → `kennedynange@gmail.com`
  - `press@tenderflow.co.ke` → `kennedynange@gmail.com`
- Add a catch-all (optional) for any `*@tenderflow.co.ke` not explicitly routed.

This is free and means the email addresses on your Contact page actually work. Until you do this, sending to `help@tenderflow.co.ke` bounces.

### Resend domain verification (for outgoing email)

Same idea but for outgoing mail (admin notifications when a consultant signs up):

1. Sign up at https://resend.com (use `kennedynange@gmail.com`).
2. **Domains → Add Domain** → `tenderflow.co.ke`.
3. Resend gives you 3 DNS records (SPF, DKIM, DMARC). Add them as **DNS-only** (grey cloud, NOT proxied) in Cloudflare DNS.
4. Wait for Resend to verify (usually <10 min).
5. Set Vercel env `RESEND_FROM` to `"TenderFlow <hello@tenderflow.co.ke>"` and `RESEND_API_KEY` to the key Resend gave you.
6. Redeploy.

Now `/api/notify-consultant` actually sends email instead of silently no-op'ing.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| `tenderflow.co.ke` shows Vercel 404 page | DNS resolves but Vercel doesn't know the domain. Add it in Vercel → Settings → Domains. |
| Browser shows "Connection not secure" | Cloudflare SSL mode is "Off" or "Flexible". Set to **Full (strict)**. |
| Cloudflare shows "525 SSL handshake failed" | Vercel cert isn't ready yet. Wait 10 min and retry. |
| Magic-link emails redirect to vercel.app | Supabase Auth URL Configuration still set to old URL. Update Site URL. |
| Bot Fight Mode blocks your own admin login | Add your IP to Cloudflare → Security → Tools → IP Access Rules → Allow. |
