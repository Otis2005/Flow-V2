# Getting TenderFlow on Google

What's already done in code (shipped, no action needed):

- ✓ `robots.txt` at `https://tenderflow.co.ke/robots.txt` — allows all crawlers, blocks `/admin`, `/dashboard`, auth pages, and `/api`. Points to the sitemap.
- ✓ Dynamic `sitemap.xml` at `https://tenderflow.co.ke/sitemap.xml` — lists every published tender plus all public static pages, refreshed every hour.
- ✓ Full meta tags in `index.html`: description, OG tags (Facebook/LinkedIn/WhatsApp link previews), Twitter cards, canonical URL, theme colour.
- ✓ Structured data (JSON-LD): Organization schema (Google knowledge panel-eligible) + WebSite SearchAction (potential search-box-in-results).
- ✓ Canonical URL is `https://tenderflow.co.ke/` (apex, no www) so both versions consolidate SEO authority.

What you need to do (4 steps, ~15 minutes total):

---

## 1. Google Search Console verification (5 min)

This is the door to telling Google about the site.

1. Open https://search.google.com/search-console
2. Click **Add property** (top left)
3. Pick **"Domain"** (recommended — covers all subdomains and both http/https in one shot). NOT URL-prefix.
4. Type `tenderflow.co.ke` (no `https://`, no `www`)
5. Continue.
6. Google shows a **DNS TXT record** to add. It looks like:
   ```
   google-site-verification=K7xJ_some_long_string
   ```

7. Open Cloudflare → `tenderflow.co.ke` zone → **DNS** → **Records** → **Add record**:
   - Type: `TXT`
   - Name: `@` (or `tenderflow.co.ke`, same thing)
   - Content: paste the entire string Google gave you, including the `google-site-verification=` prefix
   - TTL: Auto
   - Proxy status: DNS only (grey cloud — TXT records aren't proxied anyway)
8. Save.
9. Back in Google Search Console, click **Verify**. It checks DNS and confirms within seconds. Occasionally takes 5-30 min if DNS hasn't propagated; just wait and retry.

---

## 2. Submit the sitemap (2 min)

1. In Search Console (after verification), in the left sidebar click **Sitemaps**.
2. Under "Add a new sitemap", paste `sitemap.xml` and click **Submit**.
3. Status should flip to **"Success"** within a few seconds. If it says "Couldn't fetch" wait 5 min and click the refresh icon.

Google will start crawling within 24 hours. Index inclusion takes anywhere from a day to two weeks for a new site. **Don't worry if you don't see results immediately.**

---

## 3. Force-index your homepage (1 min)

To get the homepage indexed faster (often within 24h):

1. In Search Console, top search bar, paste `https://tenderflow.co.ke/`
2. Hit Enter. Google checks if the URL is indexed.
3. If "URL is not on Google" → click **Request indexing**.
4. Google queues a priority crawl. You'll see "URL submitted" within a minute.

Repeat for `/tenders` and `/about` if you want those indexed quickly too. Don't abuse this for every tender — Search Console rate-limits to ~10 requests per day.

---

## 4. Bing Webmaster Tools (optional, 5 min)

Bing is small in Africa but powers DuckDuckGo and Ecosia searches, and gets refused traffic from Google. Worth the 5 min.

1. https://www.bing.com/webmasters
2. Sign in with a Microsoft account (or import directly from Google Search Console — they support a one-click import).
3. Add `https://tenderflow.co.ke/`
4. Verify (same DNS TXT method or import-from-GSC).
5. Submit the same `https://tenderflow.co.ke/sitemap.xml`.

---

## Day-by-day expectations after submission

| Day | What you should see |
|---|---|
| 0 | Sitemap submitted, status "Success" in Search Console |
| 1-3 | First crawls visible in Coverage report. Google has discovered the URLs but not yet indexed them. |
| 3-7 | Homepage starts appearing for site-specific searches (e.g., `site:tenderflow.co.ke`) |
| 7-14 | Brand searches like "TenderFlow Kenya" start surfacing the homepage. Individual tender pages start appearing. |
| 14-30 | Topical keywords (e.g., "tender bid security Kenya") begin to pick up if the content matches. |
| 30+ | Long-tail traffic builds with new content. Real ranking takes months. |

**Speed-ups within your control:**

- Publish 3-5 tenders per week, every week. Fresh content is the strongest crawl signal.
- Add backlinks: list TenderFlow on Kenyan startup directories (Lipa Later, Twiga, AppsAfrica), African SaaS lists, ProductHunt-equivalents, your LinkedIn, professional networks. Each high-quality referring domain teaches Google your site exists.
- Write 1-2 long-form articles on the bid-writing guide page. Tender-related search queries are uncompetitive in Kenya, so good content ranks fast.
- Get one Press mention (Business Daily, TechCabal, Capital FM tech segment) — that single backlink moves the needle more than 50 directory listings.

**Things you should NOT do:**

- Don't buy backlinks. Google penalises this and it's hard to recover from.
- Don't keyword-stuff. Write like a human.
- Don't make duplicate pages (e.g., `/tenders/kenya` and `/tenders?country=Kenya` would compete). The canonical URL setup we shipped handles this.
- Don't change URLs after they're indexed. Pick a permalink format and stick with it. Our `/tenders/:uuid` format is permanent.

---

## Verifying it's working

Quick checks anyone can run anytime:

```
https://tenderflow.co.ke/robots.txt           ← should show our robots policy
https://tenderflow.co.ke/sitemap.xml          ← should show XML with all published tenders
https://www.google.com/search?q=site%3Atenderflow.co.ke   ← will show indexed pages once Google catches up
```

If the sitemap returns an error, the site is still discoverable via internal links — sitemaps are a hint, not a requirement. Don't panic if it fails one day.

---

## Future SEO upgrades (post-launch)

Worth doing once you have organic traffic:

1. **Per-tender title + description tags** via `react-helmet` so each tender page has a unique `<title>` for Google. Currently all pages share the homepage title.
2. **JobPosting-style structured data per tender** — there's no perfect schema.org type for tenders, but a tweaked JobPosting or GovernmentService can earn rich-result eligibility.
3. **An OG cover image** — design a 1200×630 image with the TenderFlow wordmark and replace the Supabase hero URL currently used as a placeholder.
4. **A `/blog`** — even occasional long-form posts ("How to bid for Kenyan government tenders in 2026") will outrank specialised forums quickly because nobody else is writing this.
5. **Translation to Kiswahili** for the listings — Kiswahili search volume in Kenya/Tanzania is significant.
