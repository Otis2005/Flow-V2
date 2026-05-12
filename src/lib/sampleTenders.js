// Demo data used as a fallback when Supabase is not yet configured,
// or when the database has no published tenders. Mirrors the shape
// of the real tenders table.

export const SAMPLE_TENDERS = [
  {
    id: 'TF-2026-0501',
    title: 'Supply, Delivery, and Deployment of VMware Licences',
    issuer: 'Retirement Benefits Authority (RBA)',
    country: 'Kenya',
    region: 'East Africa',
    source: 'Government',
    sector: 'ICT',
    value: 0,
    currency: 'USD',
    published: '2026-05-04',
    closes: '2026-05-15',
    refNo: 'RBA/eGP/VMW/2026',
    summary:
      'The Retirement Benefits Authority invites sealed tenders for the supply, delivery and deployment of VMware licences under open competitive (National) method. Bid documents available free from the eGP portal.',
    documents: [
      { name: 'Invitation to Tender,RBA VMware.pdf', size: '184 KB' },
      { name: 'Tender Document (eGP).pdf', size: '1.6 MB' }
    ],
    submission: 'Electronic,eGP Kenya portal · Public opening: Rahimtulla Towers, 14th Floor Boardroom'
  },
  {
    id: 'TF-2026-0412',
    title: 'Supply and Installation of Solar Mini-Grid Infrastructure in Rural Schools',
    issuer: 'Rural Electrification & Renewable Energy Corporation',
    country: 'Kenya',
    region: 'East Africa',
    source: 'Government',
    sector: 'Energy',
    value: 4_200_000,
    currency: 'USD',
    published: '2026-04-28',
    closes: '2026-05-22',
    refNo: 'REREC/T/008/2026',
    summary:
      'Design, supply, install and commission off-grid solar PV mini-grids serving 14 primary schools in Marsabit and Turkana counties, including battery storage and metering.',
    documents: [
      { name: 'Tender Notice.pdf', size: '412 KB' },
      { name: 'Technical Specifications.pdf', size: '2.1 MB' },
      { name: 'Bill of Quantities.xlsx', size: '186 KB' }
    ],
    submission: 'Sealed bids,REREC HQ, Nairobi'
  },
  {
    id: 'TF-2026-0411',
    title: 'Provision of Last-Mile Delivery Services for E-Commerce Operations',
    issuer: 'Jumia Logistics Nigeria Ltd',
    country: 'Nigeria',
    region: 'West Africa',
    source: 'NGO',
    sector: 'Logistics',
    value: 850_000,
    currency: 'USD',
    published: '2026-04-27',
    closes: '2026-05-15',
    refNo: 'JLN-2026-LMD-04',
    summary:
      'Two-year framework for last-mile delivery across Lagos, Abuja, and Port Harcourt. Open to fleet operators with minimum 25 vehicles and tracked dispatch capability.',
    documents: [
      { name: 'RFP Document.pdf', size: '780 KB' },
      { name: 'Service Level Agreement.pdf', size: '240 KB' }
    ],
    submission: 'Online,vendor portal'
  },
  {
    id: 'TF-2026-0410',
    title: 'Digitisation of Patient Records,Phase II',
    issuer: 'Ministry of Health, Republic of Rwanda',
    country: 'Rwanda',
    region: 'East Africa',
    source: 'Government',
    sector: 'Healthcare',
    value: 1_650_000,
    currency: 'USD',
    published: '2026-04-26',
    closes: '2026-05-30',
    refNo: 'MOH-RW-EMR-26-002',
    summary:
      'Implementation partner sought for nationwide rollout of an EMR system across 47 district hospitals. Includes training, change management, and 12 months hyper-care.',
    documents: [{ name: 'Bidding Document.pdf', size: '1.4 MB' }],
    submission: 'Online,RPPA portal'
  },
  {
    id: 'TF-2026-0409',
    title: 'Catering Services for Staff Cafeteria,One-Year Contract',
    issuer: 'Bamako Bites SARL',
    country: 'Mali',
    region: 'West Africa',
    source: 'SME',
    sector: 'Hospitality',
    value: 96_000,
    currency: 'USD',
    published: '2026-04-25',
    closes: '2026-05-12',
    refNo: 'BB-CAT-2026-01',
    summary:
      'Daily lunch service for 120-person office. Lots: hot meals, beverages, fresh fruit. SMEs encouraged.',
    documents: [{ name: 'Brief.pdf', size: '210 KB' }],
    submission: 'Email'
  },
  {
    id: 'TF-2026-0408',
    title: 'Supply of School Uniforms,National Tender',
    issuer: 'Ministry of Education, Ghana',
    country: 'Ghana',
    region: 'West Africa',
    source: 'Government',
    sector: 'Apparel',
    value: 2_400_000,
    currency: 'USD',
    published: '2026-04-24',
    closes: '2026-06-01',
    refNo: 'MoE-GH-UNI-26-007',
    summary:
      'Production and distribution of school uniforms to 312 public primary schools across all 16 regions. Local manufacturers preferred.',
    documents: [{ name: 'Tender Document.pdf', size: '980 KB' }],
    submission: 'Sealed, Ministry HQ, Accra',
    agpo_category: 'women'
  },
  {
    id: 'TF-2026-0407',
    title: 'Cybersecurity Audit & Penetration Testing,Banking Group',
    issuer: 'Equity Group Holdings',
    country: 'Kenya',
    region: 'East Africa',
    source: 'NGO',
    sector: 'ICT',
    value: 320_000,
    currency: 'USD',
    published: '2026-04-23',
    closes: '2026-05-18',
    refNo: 'EQB-CSEC-2026',
    summary:
      'Independent annual security audit including external/internal pentesting, application security review, and red team exercise across six countries of operation.',
    documents: [{ name: 'RFP.pdf', size: '540 KB' }],
    submission: 'Vendor portal'
  },
  {
    id: 'TF-2026-0406',
    title: 'Borehole Drilling and Equipping,12 Sites',
    issuer: 'African Christian Initiatives (NGO)',
    country: 'Uganda',
    region: 'East Africa',
    source: 'SME',
    sector: 'Water & Sanitation',
    value: 220_000,
    currency: 'USD',
    published: '2026-04-22',
    closes: '2026-05-25',
    refNo: 'ACI-WASH-2026-12',
    summary:
      'Drilling, casing, and solar pump installation for 12 boreholes in Karamoja sub-region. Hand-pump back-up required.',
    documents: [{ name: 'ToR.pdf', size: '380 KB' }],
    submission: 'Email + sealed copy',
    agpo_category: 'youth'
  },
  {
    id: 'TF-2026-0405',
    title: 'Construction of Office Block,Phase I (Substructure)',
    issuer: 'Ministry of Works & Estates',
    country: 'Uganda',
    region: 'East Africa',
    source: 'Government',
    sector: 'Construction',
    value: 1_100_000,
    currency: 'USD',
    published: '2026-04-21',
    closes: '2026-06-04',
    refNo: 'MWE-CIV-2026-15',
    summary:
      'Substructure works for a 6-storey government office block. Lots may be subdivided to encourage SME participation.',
    documents: [
      { name: 'Drawings.zip', size: '14 MB' },
      { name: 'BoQ.xlsx', size: '420 KB' }
    ],
    submission: 'Sealed,MWE Procurement Office'
  },
  {
    id: 'TF-2026-0404',
    title: 'Agricultural Extension Mobile App,UX Research & Design',
    issuer: 'GreenSprout Digital (Pty) Ltd',
    country: 'South Africa',
    region: 'Southern Africa',
    source: 'SME',
    sector: 'ICT',
    value: 62_000,
    currency: 'USD',
    published: '2026-04-20',
    closes: '2026-05-14',
    refNo: 'GSD-DSGN-2026-02',
    summary:
      'Six-week design sprint for a smallholder-facing app. Field research in two provinces, prototyping, and final UI deliverables.',
    documents: [{ name: 'Brief.pdf', size: '320 KB' }],
    submission: 'Email'
  },
  {
    id: 'TF-2026-0403',
    title: 'Bulk Procurement of Vaccine Cold Chain Equipment',
    issuer: 'Federal Ministry of Health, Nigeria',
    country: 'Nigeria',
    region: 'West Africa',
    source: 'Government',
    sector: 'Healthcare',
    value: 6_800_000,
    currency: 'USD',
    published: '2026-04-19',
    closes: '2026-06-12',
    refNo: 'FMOH/NG/CCE/2026/07',
    summary:
      'Supply, installation, and commissioning of solar direct-drive refrigerators and ice-lined refrigerators for 312 PHC facilities.',
    documents: [
      { name: 'Bidding Document.pdf', size: '2.8 MB' },
      { name: 'Technical Annex.pdf', size: '1.1 MB' }
    ],
    submission: 'FMOH Tender Box, Abuja'
  },
  {
    id: 'TF-2026-0401',
    title: 'Data Centre Co-Location & Connectivity Services',
    issuer: 'Safaricom PLC',
    country: 'Kenya',
    region: 'East Africa',
    source: 'NGO',
    sector: 'ICT',
    value: 5_500_000,
    currency: 'USD',
    published: '2026-04-17',
    closes: '2026-05-31',
    refNo: 'SAF-DC-CL-2026',
    summary:
      'Tier-III certified co-location with redundant connectivity for a regional disaster-recovery deployment. Five-year framework.',
    documents: [{ name: 'RFP.pdf', size: '1.2 MB' }],
    submission: 'Vendor portal'
  }
];
