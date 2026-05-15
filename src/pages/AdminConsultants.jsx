import { useEffect, useState } from 'react';
import AdminBar from '../components/AdminBar.jsx';
import { Stars } from '../components/StarRating.jsx';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { fmtDate } from '../lib/format.js';

const TABS = [
  { k: 'pending', label: 'Pending review' },
  { k: 'approved', label: 'Approved' },
  { k: 'rejected', label: 'Rejected' },
  { k: 'all', label: 'All' }
];

// Same pagination defaults as the tenders dashboard.
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;

export default function AdminConsultants() {
  const [tab, setTab] = useState('pending');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination state: `total` is the row count for the current tab,
  // returned by Postgrest via count: 'exact'.
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  async function load() {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let q = supabase
      .from('consultants')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (tab !== 'all') q = q.eq('status', tab);
    const { data, count } = await q;
    setRows(data || []);
    setTotal(count || 0);
    setLoading(false);

    // If a status change empties the current page, snap back to the
    // last valid one on the next render.
    const maxPage = Math.max(1, Math.ceil((count || 0) / pageSize));
    if (page > maxPage) setPage(maxPage);
  }

  useEffect(() => { load(); }, [tab, page, pageSize]);

  // Reset to page 1 on tab or page-size change so the user doesn't end
  // up looking at "page 3" of a tab with one page.
  useEffect(() => { setPage(1); }, [tab]);
  useEffect(() => { setPage(1); }, [pageSize]);

  async function setStatus(id, status) {
    const { error } = await supabase.from('consultants').update({ status }).eq('id', id);
    if (error) { alert(error.message); return; }
    // If the active tab filters by status, an approval/rejection moves
    // this row out of the current view, so reload to keep counts +
    // pagination accurate. On the "all" tab we can optimistic-update.
    if (tab === 'all') {
      setRows(rs => rs.map(r => r.id === id ? { ...r, status } : r));
    } else {
      load();
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const fromIdx = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toIdx = Math.min(page * pageSize, total);

  return (
    <div className="tf-admin tf-page-anim">
      <AdminBar />
      <div className="tf-container" style={{ paddingTop: 32 }}>
        <div className="tf-eyebrow tf-eyebrow-rule">Consultants</div>
        <h1 className="tf-admin-h1">Consultant approvals</h1>
        <p className="tf-admin-sub">Review applications. Approved consultants appear publicly in the directory.</p>

        <div className="tf-segmented" role="tablist" style={{ margin: '24px 0 16px' }}>
          {TABS.map(t => (
            <button key={t.k} className={tab === t.k ? 'is-active' : ''} onClick={() => setTab(t.k)}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 80, textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center', background: 'var(--paper)', border: '1px solid var(--rule)' }}>
            <p style={{ color: 'var(--muted)' }}>No consultants in this category.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {rows.map(c => (
                <div key={c.id} style={{ background: 'var(--paper)', border: '1px solid var(--rule)', padding: '18px 22px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 18, alignItems: 'start' }}>
                  <div
                    className={'tf-consultant-photo' + (!c.photo_url ? ' empty' : '')}
                    style={{ width: 64, height: 64, marginBottom: 0, ...(c.photo_url ? { backgroundImage: `url(${c.photo_url})` } : {}) }}
                  >
                    {!c.photo_url && (c.name || '?')[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--navy)', fontWeight: 500 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                      {c.email}{c.phone ? ` · ${c.phone}` : ''} · Applied {fmtDate(c.created_at)}
                    </div>
                    {c.bio && <p style={{ fontSize: 14, marginTop: 10, lineHeight: 1.55 }}>{c.bio}</p>}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10, fontSize: 12, color: 'var(--muted)' }}>
                      <span><strong>Sectors:</strong> {(c.specialties || []).join(', ') || 'None'}</span>
                      <span><strong>Countries:</strong> {(c.countries || []).join(', ') || 'None'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                      {c.cv_url && <a href={c.cv_url} target="_blank" rel="noopener" style={{ fontSize: 12, color: 'var(--navy)', borderBottom: '1px solid var(--gold)' }}>View CV</a>}
                      <Stars value={c.rating} />
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{c.jobs_completed || 0} jobs</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span className="tf-badge" data-source={c.status === 'approved' ? 'Government' : 'SME'} style={{ textTransform: 'uppercase' }}>
                      {c.status}
                    </span>
                    {c.status !== 'approved' && (
                      <button className="tf-cta" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => setStatus(c.id, 'approved')}>Approve</button>
                    )}
                    {c.status !== 'rejected' && (
                      <button className="tf-cta-ghost" style={{ padding: '6px 14px', fontSize: 12, color: 'var(--danger)' }} onClick={() => setStatus(c.id, 'rejected')}>Reject</button>
                    )}
                    {c.status === 'approved' && (
                      <button className="tf-cta-ghost" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => setStatus(c.id, 'pending')}>Reset to pending</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                marginTop: 16,
                padding: '12px 4px',
                fontSize: 13,
                color: 'var(--muted)'
              }}
            >
              <div>
                Showing <strong style={{ color: 'var(--ink)' }}>{fromIdx}–{toIdx}</strong> of{' '}
                <strong style={{ color: 'var(--ink)' }}>{total}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Per page:</span>
                  <select
                    value={pageSize}
                    onChange={e => setPageSize(Number(e.target.value))}
                    style={{
                      padding: '4px 8px',
                      fontSize: 13,
                      border: '1px solid var(--rule)',
                      background: 'var(--paper)'
                    }}
                  >
                    {PAGE_SIZE_OPTIONS.map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    className="tf-cta-ghost"
                    style={{ padding: '6px 12px', fontSize: 12, opacity: page <= 1 ? 0.4 : 1 }}
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    ← Prev
                  </button>
                  <span>
                    Page <strong style={{ color: 'var(--ink)' }}>{page}</strong> of{' '}
                    <strong style={{ color: 'var(--ink)' }}>{totalPages}</strong>
                  </span>
                  <button
                    className="tf-cta-ghost"
                    style={{ padding: '6px 12px', fontSize: 12, opacity: page >= totalPages ? 0.4 : 1 }}
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
