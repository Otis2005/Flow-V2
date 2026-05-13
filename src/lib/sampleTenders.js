// Demo data used as a fallback when Supabase is not yet configured,
// or when the database has no published tenders. Mirrors the shape
// of the real tenders table.
//
// Focused on East Africa (Kenya, Uganda, Tanzania) to match the current
// platform scope. When we expand to more countries, add more samples.

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
      { name: 'Invitation to Tender. RBA VMware.pdf', size: '184 KB' },
      { name: 'Tender Document (eGP).pdf', size: '1.6 MB' }
    ],
    submission: 'Electronic. eGP Kenya portal. Public opening: Rahimtulla Towers, 14th Floor Boardroom'
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
    submission: 'Sealed bids. REREC HQ, Nairobi'
  },
  {
    id: 'TF-2026-0407',
    title: 'Cybersecurity Audit & Penetration Testing. Banking Group',
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
    title: 'Borehole Drilling and Equipping, 12 Sites',
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
    title: 'Construction of Office Block, Phase I (Substructure)',
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
    submission: 'Sealed. MWE Procurement Office'
  },
  {
    id: 'TF-2026-0413',
    title: 'Supply of Fortified Maize Flour for School Feeding Programme',
    issuer: 'Tanzania Social Action Fund (TASAF)',
    country: 'Tanzania',
    region: 'East Africa',
    source: 'Government',
    sector: 'Supplies',
    value: 1_800_000,
    currency: 'USD',
    published: '2026-04-29',
    closes: '2026-05-28',
    refNo: 'TASAF/SCH/MAIZE/2026',
    summary:
      'Supply of 4,200 metric tonnes of vitamin-A fortified maize flour over 12 months for the national school feeding programme. Delivery to 28 regional warehouses on a rolling schedule.',
    documents: [
      { name: 'Bidding Document.pdf', size: '1.1 MB' },
      { name: 'Delivery Schedule.xlsx', size: '94 KB' }
    ],
    submission: 'TANePS portal. Sealed copy to TASAF HQ, Dodoma'
  },
  {
    id: 'TF-2026-0414',
    title: 'Branding and Print Services. Annual Stakeholder Report',
    issuer: 'Uwezo Tanzania (Education NGO)',
    country: 'Tanzania',
    region: 'East Africa',
    source: 'SME',
    sector: 'Creative',
    value: 24_000,
    currency: 'USD',
    published: '2026-04-26',
    closes: '2026-05-19',
    refNo: 'UWEZO-PR-2026-04',
    summary:
      'Design, layout and print of 1,200 copies of the annual stakeholder report (English + Swahili). Eco-paper preferred. Local SMEs and women-owned print shops strongly encouraged.',
    documents: [{ name: 'Creative Brief.pdf', size: '210 KB' }],
    submission: 'Email proposal + portfolio sample',
    agpo_category: 'women'
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
