import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { SAMPLE_TENDERS } from './sampleTenders.js';

// Convert a Supabase row (snake_case) to the camelCase shape the UI expects.
function rowToTender(r) {
  return {
    id: r.id,
    title: r.title,
    issuer: r.issuer,
    country: r.country,
    region: r.region,
    source: r.source,
    sector: r.sector,
    value: r.value ?? 0,
    currency: r.currency ?? 'USD',
    published: r.published_at,
    closes: r.closes_at,
    refNo: r.ref_no,
    summary: r.summary,
    scope: r.scope,
    eligibility: r.eligibility,
    submission: r.submission,
    documents: r.documents ?? [],
    status: r.status,
    bid_security: r.bid_security,
    issuer_rating: r.issuer_rating,
    issuer_logo_url: r.issuer_logo_url,
    issuer_logo_path: r.issuer_logo_path,
    checklist: r.checklist ?? [],
    agpo_category: r.agpo_category,
    download_count: r.download_count ?? 0,
    created_at: r.created_at
  };
}

export function useTenders({ status = 'published' } = {}) {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingSample, setUsingSample] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!isSupabaseConfigured) {
        setTenders(SAMPLE_TENDERS);
        setUsingSample(true);
        setLoading(false);
        return;
      }
      // Sort by created_at (when admin uploaded to TenderFlow), not
      // published_at (the date stamped on the tender notice itself).
      // Kennedy wants newest-uploaded first on Latest Tenders + listings.
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });
      if (!active) return;
      if (error) {
        console.error('[useTenders]', error);
        setError(error);
        setTenders(SAMPLE_TENDERS);
        setUsingSample(true);
      } else if (!data || data.length === 0) {
        setTenders(SAMPLE_TENDERS);
        setUsingSample(true);
      } else {
        setTenders(data.map(rowToTender));
        setUsingSample(false);
      }
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [status]);

  return { tenders, loading, error, usingSample };
}

export function useTender(id) {
  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!id) { setLoading(false); return; }
      if (!isSupabaseConfigured) {
        setTender(SAMPLE_TENDERS.find(t => t.id === id) ?? null);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.from('tenders').select('*').eq('id', id).maybeSingle();
      if (!active) return;
      if (error || !data) {
        setTender(SAMPLE_TENDERS.find(t => t.id === id) ?? null);
      } else {
        setTender(rowToTender(data));
      }
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [id]);

  return { tender, loading };
}
