import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminBar from '../components/AdminBar.jsx';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { SOURCES, CURRENCIES, SECTORS, COUNTRIES } from '../lib/constants.js';

const EMPTY = {
  title: '',
  issuer: '',
  country: 'Kenya',
  region: '',
  source: 'Government',
  sector: 'ICT',
  ref_no: '',
  value: '',
  currency: 'USD',
  published_at: '',
  closes_at: '',
  summary: '',
  scope: '',
  eligibility: '',
  submission: '',
  bid_security: '',
  issuer_rating: 0,
  issuer_logo_url: '',
  issuer_logo_path: '',
  checklist: [],
  agpo_category: ''
};

export default function AdminUpload() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const fileRef = useRef(null);
  const logoRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [extractionMeta, setExtractionMeta] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [extractError, setExtractError] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    if (!editId || !isSupabaseConfigured) return;
    (async () => {
      const { data, error } = await supabase.from('tenders').select('*').eq('id', editId).maybeSingle();
      if (error) { alert(error.message); return; }
      if (data) {
        setForm({
          title: data.title || '',
          issuer: data.issuer || '',
          country: data.country || 'Kenya',
          region: data.region || '',
          source: data.source || 'Government',
          sector: data.sector || 'ICT',
          ref_no: data.ref_no || '',
          value: data.value ?? '',
          currency: data.currency || 'USD',
          published_at: (data.published_at || '').slice(0, 10),
          closes_at: (data.closes_at || '').slice(0, 10),
          summary: data.summary || '',
          scope: data.scope || '',
          eligibility: data.eligibility || '',
          submission: data.submission || '',
          bid_security: data.bid_security || '',
          issuer_rating: data.issuer_rating ?? 0,
          issuer_logo_url: data.issuer_logo_url || '',
          issuer_logo_path: data.issuer_logo_path || '',
          checklist: data.checklist || [],
          agpo_category: data.agpo_category || ''
        });
        setFiles((data.documents || []).map(d => ({ ...d, status: 'done' })));
      }
    })();
  }, [editId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleFiles(fileList) {
    const arr = Array.from(fileList || []);
    if (!arr.length) return;
    if (!isSupabaseConfigured) {
      setExtractError('Supabase not configured. Cannot upload PDFs yet.');
      return;
    }
    setExtractError(null);

    for (const file of arr) {
      const tempEntry = {
        name: file.name,
        size: prettyBytes(file.size),
        status: 'uploading'
      };
      setFiles(prev => [...prev, tempEntry]);

      const path = `${Date.now()}-${slug(file.name)}`;
      const { error: upErr } = await supabase.storage
        .from('tender-pdfs')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) {
        setFiles(prev => prev.map(f => f === tempEntry ? { ...f, status: 'error' } : f));
        setExtractError('Upload failed: ' + upErr.message);
        continue;
      }

      const { data: pubData } = supabase.storage.from('tender-pdfs').getPublicUrl(path);

      setFiles(prev => prev.map(f => f === tempEntry
        ? { ...f, storage_path: path, url: pubData?.publicUrl, status: 'extracting' }
        : f
      ));

      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setExtracting(true);
        try {
          const session = await supabase.auth.getSession();
          const token = session.data.session?.access_token || '';
          const res = await fetch('/api/extract-tender', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ storage_path: path })
          });
          const raw = await res.text();
          let json;
          try { json = JSON.parse(raw); } catch {
            throw new Error(
              `API returned non-JSON (HTTP ${res.status}). First 200 chars: ${raw.slice(0, 200)}`
            );
          }
          if (!res.ok) throw new Error(json.error || `Extraction failed (HTTP ${res.status})`);

          setForm(prev => ({
            ...prev,
            title: prev.title || json.title || '',
            issuer: prev.issuer || json.issuer || '',
            country: json.country || prev.country,
            region: prev.region || json.region || '',
            source: json.source && SOURCES.includes(json.source) ? json.source : prev.source,
            sector: json.sector || prev.sector,
            ref_no: prev.ref_no || json.ref_no || '',
            value: prev.value || json.value || '',
            currency: json.currency || prev.currency,
            published_at: prev.published_at || json.published_at || '',
            closes_at: prev.closes_at || json.closes_at || '',
            summary: prev.summary || json.summary || '',
            scope: prev.scope || json.scope || '',
            eligibility: prev.eligibility || json.eligibility || '',
            submission: prev.submission || json.submission || '',
            bid_security: prev.bid_security || json.bid_security || '',
            agpo_category: prev.agpo_category || json.agpo_category || '',
            checklist: (Array.isArray(json.checklist) && json.checklist.length) ? json.checklist : prev.checklist
          }));
          setExtractionMeta({
            fieldsDetected: json.fields_detected ?? null,
            needsReview: json.needs_review ?? [],
            confidence: json.confidence ?? null
          });
        } catch (e) {
          setExtractError(e.message || String(e));
        } finally {
          setExtracting(false);
        }
      }

      setFiles(prev => prev.map(f =>
        f.storage_path === path ? { ...f, status: 'done' } : f
      ));
    }
  }

  async function handleLogoUpload(file) {
    if (!file) return;
    if (!isSupabaseConfigured) { alert('Supabase not configured'); return; }
    setLogoUploading(true);
    const path = `logos/${Date.now()}-${slug(file.name)}`;
    const { error } = await supabase.storage
      .from('tender-pdfs')
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) {
      alert('Logo upload failed: ' + error.message);
      setLogoUploading(false);
      return;
    }
    const { data } = supabase.storage.from('tender-pdfs').getPublicUrl(path);
    setForm(f => ({ ...f, issuer_logo_path: path, issuer_logo_url: data?.publicUrl || '' }));
    setLogoUploading(false);
  }

  async function handleSave(status) {
    if (!isSupabaseConfigured) { alert('Supabase not configured.'); return; }
    if (!form.title || !form.issuer || !form.closes_at) {
      alert('Title, issuer, and closing date are required.');
      return;
    }
    setSaving(true);
    setSaveStatus(null);
    const documents = files
      .filter(f => f.status === 'done' && f.storage_path)
      .map(f => ({ name: f.name, size: f.size, storage_path: f.storage_path, url: f.url }));

    const payload = {
      title: form.title,
      issuer: form.issuer,
      country: form.country,
      region: form.region || null,
      source: form.source,
      sector: form.sector,
      ref_no: form.ref_no || null,
      value: form.value === '' ? null : Number(form.value),
      currency: form.currency,
      published_at: form.published_at || null,
      closes_at: form.closes_at,
      summary: form.summary,
      scope: form.scope || null,
      eligibility: form.eligibility || null,
      submission: form.submission || null,
      bid_security: form.bid_security || null,
      issuer_rating: form.issuer_rating || null,
      issuer_logo_url: form.issuer_logo_url || null,
      issuer_logo_path: form.issuer_logo_path || null,
      checklist: form.checklist || [],
      agpo_category: form.agpo_category || null,
      documents,
      status
    };

    let res;
    if (editId) {
      res = await supabase.from('tenders').update(payload).eq('id', editId).select().maybeSingle();
    } else {
      res = await supabase.from('tenders').insert(payload).select().maybeSingle();
    }
    setSaving(false);
    if (res.error) {
      setSaveStatus({ ok: false, msg: res.error.message });
    } else {
      setSaveStatus({ ok: true, msg: status === 'published' ? 'Published.' : 'Saved as draft.' });
      setTimeout(() => navigate('/admin'), 800);
    }
  }

  function handleDiscard() {
    if (!confirm('Discard all changes?')) return;
    setForm(EMPTY);
    setFiles([]);
    setExtractionMeta(null);
    navigate('/admin');
  }

  return (
    <div className="tf-admin tf-page-anim">
      <AdminBar />
      <div className="tf-container">
        <div style={{ paddingTop: 32 }}>
          <div className="tf-detail-back" onClick={() => navigate('/admin')}>← Back to dashboard</div>
        </div>
        <div className="tf-admin-grid">
          <div>
            <h1 className="tf-admin-h1">{editId ? 'Edit tender' : 'Upload a tender document'}</h1>
            <p className="tf-admin-sub">
              Drop the source PDF or document. TenderFlow will extract the key fields:
              title, issuer, value, deadlines, plus a requirements checklist for you
              to review and publish.
            </p>

            <div
              className={'tf-dropzone' + (extracting ? ' is-active' : '')}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleFiles(e.dataTransfer.files);
              }}
            >
              <div className="tf-dropzone-icon"></div>
              <h4>Drop tender documents here</h4>
              <p>PDF, DOCX, XLSX up to 25 MB. Or click to browse.</p>
              <input
                type="file"
                ref={fileRef}
                style={{ display: 'none' }}
                multiple
                accept="application/pdf,.pdf,.docx,.xlsx"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

            {extractError && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  border: '1px dashed var(--danger)',
                  background: 'var(--paper)',
                  color: 'var(--danger)',
                  fontSize: 13
                }}
              >
                {extractError}
              </div>
            )}

            <div className="tf-uploaded-list">
              {files.map((f, i) => (
                <div key={f.storage_path || f.name + i} className="tf-uploaded">
                  <span className="tf-doc-icon" style={{ width: 22, height: 28 }}></span>
                  <div className="tf-uploaded-name">
                    {f.name}
                    <div className="tf-uploaded-meta">{f.size}</div>
                  </div>
                  <span className={'tf-uploaded-status is-' + (f.status === 'error' ? 'error' : f.status === 'done' ? 'done' : 'extracting')}>
                    {f.status === 'uploading'
                      ? 'Uploading…'
                      : f.status === 'extracting'
                      ? 'Extracting…'
                      : f.status === 'error'
                      ? 'Error'
                      : 'Saved'}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="tf-cta" disabled={saving} onClick={() => handleSave('published')}>
                {saving ? 'Saving…' : 'Publish tender'}
              </button>
              <button className="tf-cta-ghost" disabled={saving} onClick={() => handleSave('draft')}>
                Save as draft
              </button>
              <button className="tf-cta-ghost" style={{ marginLeft: 'auto' }} onClick={handleDiscard}>
                Discard
              </button>
            </div>

            {saveStatus && (
              <p
                style={{
                  marginTop: 12,
                  fontSize: 13,
                  color: saveStatus.ok ? 'var(--gold)' : 'var(--danger)'
                }}
              >
                {saveStatus.msg}
              </p>
            )}
          </div>

          <div className="tf-admin-form">
            <h3>Extracted information. Review before publishing.</h3>
            {extractionMeta ? (
              <div className="tf-extracted">
                <span className="tf-extracted-tag">Auto-extracted</span>
                <div style={{ marginTop: 4 }}>
                  {extractionMeta.fieldsDetected ?? '–'} fields detected
                  {extractionMeta.needsReview?.length ? ` · ${extractionMeta.needsReview.length} need${extractionMeta.needsReview.length === 1 ? 's' : ''} review` : ''}
                  {extractionMeta.confidence != null ? ` · confidence ${Math.round(extractionMeta.confidence * 100)}%` : ''}
                </div>
              </div>
            ) : (
              <div className="tf-extracted">
                <span className="tf-extracted-tag">Manual entry</span>
                <div style={{ marginTop: 4 }}>
                  Upload a PDF above to auto-fill these fields, or enter them manually.
                </div>
              </div>
            )}

            <div className="tf-form-row full">
              <div className="tf-form-field">
                <label>Tender title</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} />
              </div>
            </div>

            <div className="tf-form-row full">
              <div className="tf-form-field">
                <label>Issuing organisation</label>
                <input value={form.issuer} onChange={e => set('issuer', e.target.value)} />
              </div>
            </div>

            <div className="tf-form-row">
              <div className="tf-form-field">
                <label>Source type</label>
                <select value={form.source} onChange={e => set('source', e.target.value)}>
                  {SOURCES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="tf-form-field">
                <label>Sector</label>
                <select value={form.sector} onChange={e => set('sector', e.target.value)}>
                  {SECTORS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="tf-form-row">
              <div className="tf-form-field">
                <label>Country</label>
                <select value={form.country} onChange={e => set('country', e.target.value)}>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="tf-form-field">
                <label>Reference number</label>
                <input value={form.ref_no} onChange={e => set('ref_no', e.target.value)} />
              </div>
            </div>

            <div className="tf-form-row">
              <div className="tf-form-field">
                <label>Estimated value</label>
                <input
                  type="number"
                  value={form.value}
                  onChange={e => set('value', e.target.value)}
                  placeholder="0 = refer to BoQ"
                />
              </div>
              <div className="tf-form-field">
                <label>Currency</label>
                <select value={form.currency} onChange={e => set('currency', e.target.value)}>
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="tf-form-row">
              <div className="tf-form-field">
                <label>
                  Bid security
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400, marginLeft: 6 }}>
                    (e.g. "USD 50,000", or blank for "Not Required")
                  </span>
                </label>
                <input
                  value={form.bid_security}
                  onChange={e => set('bid_security', e.target.value)}
                  placeholder='Leave blank for "Not Required"'
                />
              </div>
              <div className="tf-form-field">
                <label>
                  AGPO reservation
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400, marginLeft: 6 }}>
                    (Kenya 30% reservation)
                  </span>
                </label>
                <select
                  value={form.agpo_category || ''}
                  onChange={e => set('agpo_category', e.target.value)}
                >
                  <option value="">Not AGPO-reserved</option>
                  <option value="youth">Youth</option>
                  <option value="women">Women</option>
                  <option value="pwd">Persons with Disabilities</option>
                  <option value="general">Open AGPO (any category)</option>
                </select>
              </div>
            </div>

            <div className="tf-form-row">
              <div className="tf-form-field">
                <label>Published date</label>
                <input type="date" value={form.published_at} onChange={e => set('published_at', e.target.value)} />
              </div>
              <div className="tf-form-field">
                <label>
                  Closing date{' '}
                  {extractionMeta?.needsReview?.includes('closes_at') && (
                    <span style={{ color: 'var(--gold)', fontWeight: 700 }}>· Needs review</span>
                  )}
                </label>
                <input
                  type="date"
                  value={form.closes_at}
                  onChange={e => set('closes_at', e.target.value)}
                  style={extractionMeta?.needsReview?.includes('closes_at') ? { borderColor: 'var(--gold)' } : undefined}
                />
              </div>
            </div>

            <div className="tf-form-row full">
              <div className="tf-form-field">
                <label>Issuer logo</label>
                <div className="tf-photo-uploader">
                  <div
                    className="tf-photo-uploader-preview"
                    style={form.issuer_logo_url ? {
                      backgroundImage: `url(${form.issuer_logo_url})`,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat'
                    } : undefined}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button
                      type="button"
                      className="tf-cta-ghost"
                      style={{ padding: '8px 14px', fontSize: 12 }}
                      onClick={() => logoRef.current?.click()}
                      disabled={logoUploading}
                    >
                      {logoUploading ? 'Uploading…' : (form.issuer_logo_url ? 'Replace logo' : 'Upload logo')}
                    </button>
                    {form.issuer_logo_url && (
                      <button
                        type="button"
                        className="tf-cta-ghost"
                        style={{ padding: '6px 12px', fontSize: 11, color: 'var(--danger)' }}
                        onClick={() => set('issuer_logo_url', '') || set('issuer_logo_path', '')}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={logoRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => handleLogoUpload(e.target.files?.[0])}
                  />
                </div>
                <p style={{ fontSize: 11, color: 'var(--muted)', margin: '8px 0 0' }}>
                  Optional. Shows as a faded backdrop on the tender detail page.
                </p>
              </div>
            </div>

            <div className="tf-form-row full">
              <div className="tf-form-field">
                <label>Summary</label>
                <textarea
                  value={form.summary}
                  onChange={e => set('summary', e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <div className="tf-form-row full">
              <div className="tf-form-field">
                <label>Scope of work</label>
                <textarea
                  value={form.scope}
                  onChange={e => set('scope', e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="tf-form-row full">
              <div className="tf-form-field">
                <label>Eligibility</label>
                <textarea
                  value={form.eligibility}
                  onChange={e => set('eligibility', e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="tf-form-row full">
              <div className="tf-form-field">
                <label>Submission method</label>
                <input value={form.submission} onChange={e => set('submission', e.target.value)} />
              </div>
            </div>

            <div className="tf-form-row full">
              <div className="tf-form-field">
                <label>
                  Tender requirements checklist
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400, marginLeft: 6 }}>
                    ({form.checklist.length} items, auto-generated from PDF)
                  </span>
                </label>
                <ChecklistEditor
                  items={form.checklist}
                  onChange={v => set('checklist', v)}
                />
              </div>
            </div>

            <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>
              Fields above are pre-filled from the uploaded document. Review and edit before publishing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChecklistEditor({ items, onChange }) {
  const [draft, setDraft] = useState('');

  function addItem() {
    if (!draft.trim()) return;
    onChange([...items, { text: draft.trim() }]);
    setDraft('');
  }

  return (
    <div style={{ border: '1px solid var(--rule)', padding: 12, background: 'var(--paper)' }}>
      {items.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
          No checklist items yet. They populate automatically when you upload a PDF, or
          add them manually below.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map((it, i) => (
            <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0', borderBottom: i < items.length - 1 ? '1px solid var(--rule-soft)' : '0' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <input
                value={it.text || ''}
                onChange={e => {
                  const next = [...items];
                  next[i] = { ...next[i], text: e.target.value };
                  onChange(next);
                }}
                style={{ flex: 1, padding: '4px 8px', fontSize: 13, border: '1px solid transparent', background: 'transparent' }}
              />
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                style={{ background: 'none', border: 0, color: 'var(--muted)', cursor: 'pointer', fontSize: 14 }}
                aria-label="Remove"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 8, borderTop: items.length ? '1px solid var(--rule-soft)' : 'none' }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
          placeholder="Add a requirement (e.g. Tax compliance certificate)"
          style={{ flex: 1, padding: '6px 10px', fontSize: 13, border: '1px solid var(--rule)', background: 'var(--cream)' }}
        />
        <button type="button" className="tf-cta-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={addItem}>
          Add
        </button>
      </div>
    </div>
  );
}

function prettyBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9.]/g, '-').replace(/-+/g, '-');
}
