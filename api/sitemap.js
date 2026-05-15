// Vercel serverless function: GET /api/sitemap (routed at /sitemap.xml).
//
// Produces an XML sitemap covering:
//   1. The static public pages (home, browse, how it works, etc.)
//   2. Every published tender as a /tenders/:id entry
//
// Re-generated on every request. Cache-Control set to ~1 hour so we
// don't query Supabase for every crawler hit, but new tenders still
// appear within an hour of being published.
//
// Auth: none required (this is a public sitemap).

import { createClient } from '@supabase/supabase-js';

const SITE_URL = process.env.SITE_URL || 'https://tenderflow.co.ke';

// Static routes worth indexing. Excludes admin / auth / one-off action
// routes (those are blocked in robots.txt too).
const STATIC_ROUTES = [
  { path: '/',              changefreq: 'daily',   priority: 1.0 },
  { path: '/tenders',       changefreq: 'hourly',  priority: 0.95 },
  { path: '/consultants',   changefreq: 'daily',   priority: 0.8 },
  { path: '/how-it-works',  changefreq: 'monthly', priority: 0.7 },
  { path: '/about',         changefreq: 'monthly', priority: 0.6 },
  { path: '/pricing',       changefreq: 'monthly', priority: 0.6 },
  { path: '/contact',       changefreq: 'monthly', priority: 0.5 },
  { path: '/faq',           changefreq: 'monthly', priority: 0.5 },
  { path: '/guide',         changefreq: 'monthly', priority: 0.5 },
  { path: '/glossary',      changefreq: 'monthly', priority: 0.4 },
  { path: '/submit-tender', changefreq: 'monthly', priority: 0.4 },
  { path: '/privacy',       changefreq: 'yearly',  priority: 0.2 },
  { path: '/terms',         changefreq: 'yearly',  priority: 0.2 },
  { path: '/cookies',       changefreq: 'yearly',  priority: 0.2 }
];

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  return `<url>
    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}${changefreq ? `\n    <changefreq>${changefreq}</changefreq>` : ''}${priority != null ? `\n    <priority>${priority}</priority>` : ''}
  </url>`;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  // Cache at the edge for 1 hour, stale-while-revalidate for another hour
  // so the next request after expiry still gets a fast response while we
  // refresh in the background.
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=3600');

  const today = new Date().toISOString().slice(0, 10);

  // Always include the static routes so the sitemap is useful even if
  // Supabase is unreachable.
  const entries = STATIC_ROUTES.map(r =>
    urlEntry({
      loc: `${SITE_URL}${r.path}`,
      lastmod: today,
      changefreq: r.changefreq,
      priority: r.priority
    })
  );

  // Add a /tenders/:id entry for every published tender. Use the row's
  // updated_at as lastmod so search engines know when to re-crawl.
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY; // anon is fine for reading published rows
    if (supabaseUrl && serviceKey) {
      const supabase = createClient(supabaseUrl, serviceKey);
      const { data, error } = await supabase
        .from('tenders')
        .select('id, updated_at, closes_at')
        .eq('status', 'published')
        .order('updated_at', { ascending: false })
        .limit(5000);
      if (!error && Array.isArray(data)) {
        const now = Date.now();
        for (const t of data) {
          // De-prioritise tenders that have already closed (still
          // indexed for historical reference, but lower priority).
          const closesAt = t.closes_at ? new Date(t.closes_at).getTime() : null;
          const closed = closesAt != null && closesAt < now;
          const lastmod = (t.updated_at || '').slice(0, 10) || today;
          entries.push(
            urlEntry({
              loc: `${SITE_URL}/tenders/${t.id}`,
              lastmod,
              changefreq: closed ? 'yearly' : 'daily',
              priority: closed ? 0.3 : 0.8
            })
          );
        }
      }
    }
  } catch (e) {
    console.error('[sitemap] tender fetch failed', e);
    // Continue with just the static routes.
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${entries.join('\n  ')}
</urlset>`;

  res.status(200).send(body);
}
