import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminBar from '../components/AdminBar.jsx';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { fmtDate, fmtValue } from '../lib/format.js';

const TABS = [
  { k: 'published', label: 'Published' },
  { k: 'draft', label: 'Drafts' },
  { k: 'all', label: 'All' }
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('published');
  const [error, setError] = useState(null);

  async function load() {
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Add env vars and run the migrations.');
      setLoading(false);
      return;
    }
    setLoading(true);
    let q = supabase.from('tenders').select('*').order('updated_at', { ascending: false });
    if (tab !== 'all') q = q.eq('status', tab);
    const { data, error } = await q;
    if (error) setError(error.message);
    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [tab]);

  async function handleDelete(id) {
    if (!confirm('Delete this tender? This is permanent.')) return;
    const { error } = await supabase.from('tenders').delete().eq('id', id);
    if (error) {
      alert('Delete failed: ' + error.message);
    } else {
      setRows(r => r.filter(x => x.id !== id));
    }
  }

  async function handleUnpublish(id) {
    const { error } = await supabase.from('tenders').update({ status: 'draft' }).eq('id', id);
    if (error) alert(error.message); else load();
  }

  async function handlePublish(id) {
    const { error } = await supabase.from('tenders').update({ status: 'published' }).eq('id', id);
    if (error) alert(error.message); else load();
  }

  return (
    <div className="tf-admin">
      <AdminBar />
      <div className="tf-container" style={{ paddingTop: 32 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 16
          }}
        >
          <div>
            <div className="tf-eyebrow tf-eyebrow-rule">Tenders</div>
            <h1 className="tf-admin-h1">All tenders</h1>
            <p className="tf-admin-sub">Review, publish, edit or remove tenders. Drafts are not visible to the public.</p>
          </div>
          <button className="tf-cta" onClick={() => navigate('/admin/upload')}>+ Upload new tender</button>
        </div>

        <div className="tf-segmented" role="tablist" style={{ margin: '24px 0 16px' }}>
          {TABS.map(t => (
            <button
              key={t.k}
              className={tab === t.k ? 'is-active' : ''}
              onClick={() => setTab(t.k)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div
            style={{
              padding: 16,
              border: '1px dashed var(--danger)',
              background: 'var(--paper)',
              color: 'var(--danger)',
              marginBottom: 16
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: 80, textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div
            style={{
              padding: '64px 24px',
              textAlign: 'center',
              background: 'var(--paper)',
              border: '1px solid var(--rule)'
            }}
          >
            <div className="tf-eyebrow">No {tab === 'all' ? '' : tab} tenders yet</div>
            <p style={{ marginTop: 12, color: 'var(--muted)' }}>
              Upload your first tender to get started.
            </p>
            <button className="tf-cta" style={{ marginTop: 20 }} onClick={() => navigate('/admin/upload')}>
              Upload tender
            </button>
          </div>
        ) : (
          <table className="tf-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Title / Issuer</th>
                <th>Source</th>
                <th>Country</th>
                <th>Closes</th>
                <th className="tf-table-num">Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>
                    <span
                      className="tf-badge"
                      data-source={r.status === 'published' ? 'Government' : 'SME'}
                      style={{ textTransform: 'uppercase' }}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <div className="tf-table-title">{r.title}</div>
                    <div className="tf-table-issuer">{r.issuer}</div>
                  </td>
                  <td>{r.source}</td>
                  <td>{r.country}</td>
                  <td>{fmtDate(r.closes_at)}</td>
                  <td className="tf-table-num">{fmtValue(r.value, r.currency)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Link to={`/admin/upload?edit=${r.id}`} className="tf-cta-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>Edit</Link>
                      {r.status === 'published' ? (
                        <button
                          className="tf-cta-ghost"
                          style={{ padding: '6px 12px', fontSize: 12 }}
                          onClick={() => handleUnpublish(r.id)}
                        >
                          Unpublish
                        </button>
                      ) : (
                        <button
                          className="tf-cta-ghost"
                          style={{ padding: '6px 12px', fontSize: 12 }}
                          onClick={() => handlePublish(r.id)}
                        >
                          Publish
                        </button>
                      )}
                      <button
                        className="tf-cta-ghost"
                        style={{ padding: '6px 12px', fontSize: 12, color: 'var(--danger)' }}
                        onClick={() => handleDelete(r.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
