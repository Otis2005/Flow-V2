import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { useTenders } from '../lib/useTenders.js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { SECTOR_OPTIONS } from '../lib/constants.js';

const COUNTRIES = [
  'Kenya', 'Nigeria', 'South Africa', 'Ghana', 'Rwanda',
  'Uganda', 'Tanzania', 'Senegal', "Côte d'Ivoire", 'Ethiopia',
  'Mali', 'Egypt', 'Zambia', 'Botswana'
];

function StepDots({ step, total }) {
  return (
    <div className="tf-ob-dots" aria-label={`Step ${step} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={'tf-ob-dot' + (i < step ? ' is-done' : '') + (i === step - 1 ? ' is-active' : '')}
        />
      ))}
      <span className="tf-ob-step-text">Step {step} of {total}</span>
    </div>
  );
}

export default function Onboard() {
  const navigate = useNavigate();
  const { tenders } = useTenders();
  const [step, setStep] = useState(1);
  const [sectors, setSectors] = useState(['ICT', 'Consulting']);
  const [countries, setCountries] = useState(['Kenya']);
  const [email, setEmail] = useState('');
  const [cadence, setCadence] = useState('weekly');
  const [skipEmpty, setSkipEmpty] = useState(true);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const toggle = (arr, v, set) => set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  const validEmail = /.+@.+\..+/.test(email);
  const firstName = email && email.includes('@') ? email.split('@')[0].split(/[._-]/)[0] : 'there';
  const niceFirst = firstName ? firstName[0].toUpperCase() + firstName.slice(1) : 'there';

  const matches = tenders.filter(t => {
    const sectorOk = sectors.length === 0 || sectors.includes(t.sector);
    const countryOk = countries.length === 0 || countries.includes(t.country);
    return sectorOk && countryOk;
  }).slice(0, 5);

  const next = () => setStep(s => s + 1);
  const prev = () => setStep(s => Math.max(1, s - 1));

  async function submit() {
    setSubmitError(null);
    setSubmitting(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('digest_subscribers').upsert(
          {
            email: email.toLowerCase().trim(),
            sectors,
            countries,
            cadence,
            skip_empty: skipEmpty,
            confirmed_at: null
          },
          { onConflict: 'email' }
        );
        if (error) throw error;
      }
      setDone(true);
    } catch (e) {
      setSubmitError(e.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="tf-ob-shell">
        <div className="tf-ob-topbar">
          <Logo onClick={() => navigate('/')} />
          <button className="tf-ob-close" onClick={() => navigate('/')} aria-label="Close">&times;</button>
        </div>
        <section className="tf-ob-success">
          <div className="tf-container" style={{ maxWidth: 920 }}>
            <div className="tf-eyebrow tf-eyebrow-rule">You're in, {niceFirst}.</div>
            <h1 className="tf-display" style={{ fontSize: 'clamp(40px, 4.4vw, 60px)', marginTop: 18 }}>
              Your first digest lands <em>{cadence === 'daily' ? 'tomorrow morning' : 'next Tuesday'}</em>.
            </h1>
            <p className="tf-ob-success-sub">
              Based on what you picked, we'd have sent you {matches.length} tender{matches.length === 1 ? '' : 's'} this week.
            </p>
            <div className="tf-ob-success-actions">
              <button className="tf-cta" onClick={() => navigate('/tenders')}>Browse the live feed</button>
              <button className="tf-cta-ghost" onClick={() => navigate('/')}>Back to home</button>
            </div>
          </div>
        </section>
        <section className="tf-ob-after">
          <div className="tf-container" style={{ maxWidth: 720, textAlign: 'center' }}>
            <p className="tf-ob-after-text">
              You can update your sectors, countries, or cadence any time.
              We won't share your email, and one click unsubscribes.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="tf-ob-shell">
      <div className="tf-ob-topbar">
        <Logo onClick={() => navigate('/')} />
        <StepDots step={step} total={3} />
        <button className="tf-ob-close" onClick={() => navigate('/')} aria-label="Close">&times;</button>
      </div>

      {step === 1 && (
        <section className="tf-ob-step">
          <div className="tf-container" style={{ maxWidth: 1080 }}>
            <div className="tf-eyebrow tf-eyebrow-rule">First — what do you bid on?</div>
            <h1 className="tf-ob-h1">Pick the sectors you work in.</h1>
            <p className="tf-ob-sub">
              Choose as many as fit. We'll tune your feed so you only see tenders worth your time.
            </p>
            <div className="tf-ob-grid tf-ob-grid-sectors">
              {SECTOR_OPTIONS.map(s => {
                const on = sectors.includes(s.k);
                return (
                  <button
                    key={s.k}
                    className={'tf-ob-card' + (on ? ' is-selected' : '')}
                    onClick={() => toggle(sectors, s.k, setSectors)}
                  >
                    <span className="tf-ob-card-check" aria-hidden="true">{on ? '✓' : ''}</span>
                    <span className="tf-ob-card-h">{s.h}</span>
                    <span className="tf-ob-card-b">{s.b}</span>
                  </button>
                );
              })}
            </div>
            <div className="tf-ob-actions">
              <span className="tf-ob-helper">{sectors.length} selected</span>
              <div style={{ flex: 1 }} />
              <button className="tf-cta-ghost" onClick={() => navigate('/')}>Maybe later</button>
              <button className="tf-cta" onClick={next} disabled={sectors.length === 0}>Continue</button>
            </div>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="tf-ob-step">
          <div className="tf-container" style={{ maxWidth: 1080 }}>
            <div className="tf-eyebrow tf-eyebrow-rule">Step two — where do you operate?</div>
            <h1 className="tf-ob-h1">Pick your active markets.</h1>
            <p className="tf-ob-sub">
              We'll filter the feed to countries you can actually deliver in. If you bid pan-Africa, pick everything you'd consider.
            </p>
            <div className="tf-ob-grid tf-ob-grid-countries">
              {COUNTRIES.map(c => {
                const on = countries.includes(c);
                return (
                  <button
                    key={c}
                    className={'tf-ob-chip' + (on ? ' is-selected' : '')}
                    onClick={() => toggle(countries, c, setCountries)}
                  >
                    <span className="tf-ob-chip-dot" aria-hidden="true" />
                    {c}
                  </button>
                );
              })}
            </div>
            <div className="tf-ob-actions">
              <span className="tf-ob-helper">{countries.length} selected</span>
              <div style={{ flex: 1 }} />
              <button className="tf-cta-ghost" onClick={prev}>← Back</button>
              <button className="tf-cta" onClick={next} disabled={countries.length === 0}>Continue</button>
            </div>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="tf-ob-step">
          <div className="tf-container" style={{ maxWidth: 720 }}>
            <div className="tf-eyebrow tf-eyebrow-rule">Last bit — where should we send it?</div>
            <h1 className="tf-ob-h1">One email, every {cadence === 'daily' ? 'morning' : 'Tuesday'}.</h1>
            <p className="tf-ob-sub">
              We'll send a curated list of tenders matching your interests. No marketing, no daily spam.
            </p>

            <label className="tf-ob-label">
              <span className="tf-ob-label-text">Work email</span>
              <input
                type="email"
                className="tf-ob-input"
                placeholder="esther@yourcompany.co.ke"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
              <span className="tf-ob-label-hint">We'll send a short confirmation. No password yet — just one click.</span>
            </label>

            <div className="tf-ob-cadence">
              <span className="tf-ob-label-text">How often?</span>
              <div className="tf-ob-cadence-options">
                <label className={'tf-ob-cad-card' + (cadence === 'weekly' ? ' is-selected' : '')}>
                  <input type="radio" name="cad" checked={cadence === 'weekly'} onChange={() => setCadence('weekly')} />
                  <span className="tf-ob-cad-h">Weekly digest</span>
                  <span className="tf-ob-cad-b">Tuesdays at 7am · best for most</span>
                </label>
                <label className={'tf-ob-cad-card' + (cadence === 'daily' ? ' is-selected' : '')}>
                  <input type="radio" name="cad" checked={cadence === 'daily'} onChange={() => setCadence('daily')} />
                  <span className="tf-ob-cad-h">Daily brief</span>
                  <span className="tf-ob-cad-b">Mon–Fri · for active bidders</span>
                </label>
              </div>
            </div>

            <label className="tf-ob-checkbox">
              <input type="checkbox" checked={skipEmpty} onChange={(e) => setSkipEmpty(e.target.checked)} />
              <span>Skip days with nothing relevant — don't send empty emails.</span>
            </label>

            <div className="tf-ob-summary">
              <div className="tf-eyebrow">Your feed</div>
              <p>
                <strong>{sectors.length} sectors</strong> across <strong>{countries.length} {countries.length === 1 ? 'country' : 'countries'}</strong>,
                delivered <strong>{cadence}</strong>.
                Based on this week's published tenders, you'd have received about <strong>{matches.length}</strong> match{matches.length === 1 ? '' : 'es'}.
              </p>
            </div>

            {submitError && (
              <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12 }}>
                {submitError}
              </p>
            )}

            <div className="tf-ob-actions">
              <button className="tf-cta-ghost" onClick={prev} disabled={submitting}>← Back</button>
              <div style={{ flex: 1 }} />
              <button className="tf-cta" onClick={submit} disabled={!validEmail || submitting}>
                {submitting ? 'Subscribing…' : validEmail ? 'Send my first digest →' : 'Enter your email to finish'}
              </button>
            </div>

            <p className="tf-ob-fineprint">
              Free for SMEs. By continuing you agree to our terms — we don't share your email and unsubscribe takes one click.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
