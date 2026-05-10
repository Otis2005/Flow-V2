import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FadeIn from '../components/FadeIn.jsx';
import { Stars } from '../components/StarRating.jsx';
import { useAuth } from '../lib/AuthProvider.jsx';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { fmtDate } from '../lib/format.js';

const STATUS_COPY = {
  pending: { label: 'In review', color: 'var(--gold)' },
  approved: { label: 'Approved & live', color: 'var(--gold)' },
  rejected: { label: 'Not approved', color: 'var(--danger)' },
  paused: { label: 'Paused by you', color: 'var(--muted)' }
};

export default function ConsultantDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) { setLoading(false); return; }
    let active = true;
    (async () => {
      const { data: prof } = await supabase
        .from('consultants')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!active) return;
      setProfile(prof);
      if (prof) {
        const { data: reqs } = await supabase
          .from('hire_requests')
          .select('*, tender:tenders(title, issuer, ref_no)')
          .eq('consultant_id', prof.id)
          .order('created_at', { ascending: false });
        if (!active) return;
        setRequests(reqs || []);
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [user]);

  async function updateRequest(id, status) {
    const { error } = await supabase
      .from('hire_requests')
      .update({ status })
      .eq('id', id);
    if (error) { alert(error.message); return; }
    setRequests(rs => rs.map(r => r.id === id ? { ...r, status } : r));
  }

  if (loading) {
    return <main style={{ padding: '120px 0', textAlign: 'center' }}><div className="tf-eyebrow">Loading…</div></main>;
  }

  if (!profile) {
    return (
      <main className="tf-page-anim" style={{ padding: '64px 0', minHeight: '60vh' }}>
        <div className="tf-container" style={{ maxWidth: 640 }}>
          <FadeIn>
            <div className="tf-eyebrow tf-eyebrow-rule">No consultant profile</div>
            <h1 className="tf-display" style={{ fontSize: 'clamp(36px, 4vw, 52px)', marginTop: 16 }}>
              Apply first to use this dashboard.
            </h1>
            <p style={{ fontSize: 16, color: 'var(--ink)', lineHeight: 1.6, marginTop: 14 }}>
              You don't have a consultant profile yet. Set one up in a few minutes and we'll
              review your application within 1-2 working days.
            </p>
            <button className="tf-cta" style={{ marginTop: 24 }} onClick={() => navigate('/consultant-signup')}>
              Apply to be a consultant
            </button>
          </FadeIn>
        </div>
      </main>
    );
  }

  const statusInfo = STATUS_COPY[profile.status] || STATUS_COPY.pending;

  return (
    <main className="tf-page-anim">
      <section style={{ padding: '48px 0 32px' }}>
        <div className="tf-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div
              className={'tf-consultant-photo' + (!profile.photo_url ? ' empty' : '')}
              style={{ width: 96, height: 96, ...(profile.photo_url ? { backgroundImage: `url(${profile.photo_url})` } : {}) }}
            >
              {!profile.photo_url && (profile.name || '?')[0]?.toUpperCase()}
            </div>
            <div>
              <div className="tf-eyebrow tf-eyebrow-rule">Consultant dashboard</div>
              <h1 className="tf-section-title" style={{ marginTop: 12, fontSize: 36 }}>{profile.name}</h1>
              <div style={{ marginTop: 8, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: statusInfo.color }}>
                  {statusInfo.label}
                </span>
                <Stars value={profile.rating} />
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                  {profile.jobs_completed || 0} job{profile.jobs_completed === 1 ? '' : 's'} done
                </span>
              </div>
            </div>
            <span style={{ flex: 1 }} />
            <Link to="/consultant-edit" className="tf-cta-ghost" style={{ textDecoration: 'none' }}>
              Edit profile
            </Link>
          </div>

          {profile.status === 'pending' && (
            <div style={{ marginTop: 24, padding: 16, background: 'var(--paper)', border: '1px dashed var(--gold)', fontSize: 13, color: 'var(--ink)' }}>
              <strong>Your profile is in review.</strong> It will appear in the public directory
              once an admin approves it. We aim to review within 1-2 working days.
            </div>
          )}
          {profile.status === 'rejected' && (
            <div style={{ marginTop: 24, padding: 16, background: 'var(--paper)', border: '1px dashed var(--danger)', fontSize: 13 }}>
              <strong>Your application was not approved.</strong> Please update your profile and
              resubmit, or contact us at hello@tenderflow.africa.
            </div>
          )}
        </div>
      </section>

      <section style={{ padding: '24px 0', background: 'var(--paper)', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}>
        <div className="tf-container">
          <div className="tf-eyebrow tf-eyebrow-rule">Incoming requests</div>
          <h2 className="tf-section-title" style={{ marginTop: 12 }}>Hire requests</h2>
          {requests.length === 0 ? (
            <p style={{ marginTop: 16, color: 'var(--muted)' }}>
              No requests yet. Bidders will be able to find you in the directory once approved.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
              {requests.map(r => (
                <div key={r.id} style={{ background: 'var(--cream)', border: '1px solid var(--rule)', padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 18, alignItems: 'start' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--navy)', fontWeight: 500 }}>
                      {r.tender?.title || 'No tender attached'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      From: {r.user_name || r.user_email} · {r.user_email}
                      {r.user_phone ? ` · ${r.user_phone}` : ''}
                      {' · '}{fmtDate(r.created_at)}
                    </div>
                    {r.message && <p style={{ fontSize: 13, marginTop: 8 }}>{r.message}</p>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <span className="tf-badge" data-source={r.status === 'completed' ? 'Government' : 'SME'} style={{ textTransform: 'uppercase' }}>
                      {r.status}
                    </span>
                    {r.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <button className="tf-cta-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => updateRequest(r.id, 'accepted')}>Accept</button>
                        <button className="tf-cta-ghost" style={{ padding: '6px 12px', fontSize: 12, color: 'var(--danger)' }} onClick={() => updateRequest(r.id, 'declined')}>Decline</button>
                      </div>
                    )}
                    {r.status === 'accepted' && (
                      <button className="tf-cta-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => updateRequest(r.id, 'completed')}>Mark complete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
