import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import FadeIn from '../components/FadeIn.jsx';
import PageHero from '../components/PageHero.jsx';
import { TenderCard } from '../components/TenderViews.jsx';
import { useTenders } from '../lib/useTenders.js';

const PAGE_SIZE = 12;

export default function Listings() {
  const { tenders, loading, usingSample } = useTenders();
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [source, setSource] = useState(searchParams.get('source') || 'All sources');
  const [country, setCountry] = useState(searchParams.get('country') || 'All countries');
  const [sector, setSector] = useState(searchParams.get('sector') || 'All sectors');
  const [sortBy, setSortBy] = useState('published'); // default to latest uploaded first
  const [page, setPage] = useState(1);

  useEffect(() => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (source !== 'All sources') p.set('source', source);
    if (country !== 'All countries') p.set('country', country);
    if (sector !== 'All sectors') p.set('sector', sector);
    setSearchParams(p, { replace: true });
    setPage(1);
  }, [q, source, country, sector, setSearchParams]);

  const sourceOptions = useMemo(
    () => ['All sources', ...new Set(tenders.map(t => t.source))],
    [tenders]
  );
  const countryOptions = useMemo(
    () => ['All countries', ...new Set(tenders.map(t => t.country))],
    [tenders]
  );
  const sectorOptions = useMemo(
    () => ['All sectors', ...new Set(tenders.map(t => t.sector))],
    [tenders]
  );

  const filtered = useMemo(() => {
    return tenders
      .filter(t => !q || (t.title + t.issuer + t.summary).toLowerCase().includes(q.toLowerCase()))
      .filter(t => source === 'All sources' || t.source === source)
      .filter(t => country === 'All countries' || t.country === country)
      .filter(t => sector === 'All sectors' || t.sector === sector)
      .sort((a, b) => {
        if (sortBy === 'closes') return new Date(a.closes) - new Date(b.closes);
        if (sortBy === 'value') return (b.value || 0) - (a.value || 0);
        if (sortBy === 'published') return new Date(b.published) - new Date(a.published);
        return 0;
      });
  }, [q, source, country, sector, sortBy, tenders]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageEnd = pageStart + PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageEnd);

  const activeChips = [];
  if (source !== 'All sources') activeChips.push(['source', source, () => setSource('All sources')]);
  if (country !== 'All countries') activeChips.push(['country', country, () => setCountry('All countries')]);
  if (sector !== 'All sectors') activeChips.push(['sector', sector, () => setSector('All sectors')]);
  if (q) activeChips.push(['q', `"${q}"`, () => setQ('')]);

  return (
    <main className="tf-page-anim">
      <PageHero
        eyebrow="Browse"
        title={<>All live tenders. <em>One feed.</em></>}
        subtitle="Filter by source, country, sector, or search by issuer or keyword. Updated daily."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, color: 'rgba(245,246,235,0.7)', fontSize: 13, textAlign: 'right' }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 36, color: 'var(--gold-soft)', lineHeight: 1, fontWeight: 500 }}>
            {tenders.length}
          </span>
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 10.5 }}>Live tenders</span>
        </div>
      </PageHero>

      <div className="tf-container" style={{ paddingTop: 24 }}>
        {usingSample && (
          <div
            style={{
              margin: '0 0 16px',
              padding: '10px 14px',
              background: 'var(--paper)',
              border: '1px dashed var(--rule)',
              fontSize: 12,
              color: 'var(--muted)'
            }}
          >
            Demo mode. Showing sample tenders. Connect Supabase to see live data.
          </div>
        )}

        <div className="tf-filters">
          <div className="tf-field tf-search">
            <label>Search</label>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Issuer, title, or keyword…" />
          </div>
          <div className="tf-field tf-field-sm">
            <label>Source</label>
            <select value={source} onChange={e => setSource(e.target.value)}>
              {sourceOptions.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="tf-field tf-field-sm">
            <label>Country</label>
            <select value={country} onChange={e => setCountry(e.target.value)}>
              {countryOptions.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="tf-field tf-field-sm">
            <label>Sector</label>
            <select value={sector} onChange={e => setSector(e.target.value)}>
              {sectorOptions.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="tf-field tf-field-sm">
            <label>Sort by</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="published">Newly published</option>
              <option value="closes">Closing soonest</option>
              <option value="value">Highest value</option>
            </select>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 0 16px',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div className="tf-listings-meta">
            Showing <strong>{filtered.length}</strong> of <strong>{tenders.length}</strong> tenders
          </div>
          {activeChips.length > 0 && (
            <div className="tf-chips">
              {activeChips.map(([k, label, clear]) => (
                <span key={k} className="tf-chip" onClick={clear}>
                  {label}<span className="tf-chip-x">×</span>
                </span>
              ))}
              <span
                className="tf-chip is-clear"
                onClick={() => {
                  setSource('All sources');
                  setCountry('All countries');
                  setSector('All sectors');
                  setQ('');
                }}
              >
                Clear all
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '80px 24px', textAlign: 'center' }}>
            <div className="tf-eyebrow">Loading tenders…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: '80px 24px',
              textAlign: 'center',
              background: 'var(--paper)',
              border: '1px solid var(--rule)'
            }}
          >
            <div className="tf-eyebrow">No matches</div>
            <p style={{ marginTop: 12, color: 'var(--muted)' }}>Try clearing some filters or broadening your search.</p>
          </div>
        ) : (
          <div className="tf-cards-grid" key={`page-${page}-${sortBy}`}>
            {pageItems.map((t, i) => {
              // Stagger across rows of 3, so each row glides in together
              // rather than as a single straight cascade. Looks livelier.
              const row = Math.floor(i / 3);
              const col = i % 3;
              const delay = row * 120 + col * 60;
              return (
                <FadeIn key={t.id} delay={delay}>
                  <TenderCard tender={t} />
                </FadeIn>
              );
            })}
          </div>
        )}

        {filtered.length > PAGE_SIZE && (
          <div className="tf-pagination">
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>
              Page {page} of {totalPages}
            </span>
            <div className="tf-pagination-pages">
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const n = i + 1;
                return (
                  <button
                    key={n}
                    className={n === page ? 'is-active' : ''}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                );
              })}
              {totalPages > 5 && <button disabled>…</button>}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))}>→</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
