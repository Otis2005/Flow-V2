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

export default function AdminConsultants() {
  const [tab, setTab] = useState('pending');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    let q = supabase.from('consultants').select('*').order('created_at', { ascending: false });
    if (tab !== 'all') q = q.eq('status', tab);
    const { data } = await q;
    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [tab]);

  async function setStatus(id, status) {
    const { error } = await supabase.from('consultants').update({ status }).eq('id', id);
    if (error) { alert(error.message); return; }
    setRows(rs => rs.map(r => r.id === id ? { ...r, status } : r));
  }

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
        )}
      </div>
    </div>
  );
}
