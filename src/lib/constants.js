export const SECTORS = [
  'Construction',
  'ICT',
  'Energy',
  'Healthcare',
  'Logistics',
  'Water & Sanitation',
  'Apparel',
  'Hospitality',
  'Professional Services',
  'Creative',
  'Agriculture',
  'Education',
  'Security',
  'Media',
  'Consulting',
  'Supplies'
];

// We focus on East Africa to start: Kenya, Uganda, Tanzania.
// As the platform scales we'll re-add neighbours (Rwanda, Burundi, etc.)
// and eventually West and Southern Africa.
export const COUNTRIES = [
  'Kenya',
  'Uganda',
  'Tanzania'
];

export const SOURCES = ['Government', 'NGO', 'SME'];

export const CURRENCIES = ['USD', 'EUR', 'KES', 'NGN', 'ZAR', 'GHS', 'RWF', 'UGX', 'TZS'];

export const SECTOR_OPTIONS = [
  { k: 'ICT', h: 'ICT & software', b: 'Cloud, hardware, licences, dev services' },
  { k: 'Construction', h: 'Construction & civil works', b: 'Buildings, roads, infrastructure' },
  { k: 'Energy', h: 'Energy & utilities', b: 'Solar, grid, water, sanitation' },
  { k: 'Healthcare', h: 'Health & medical', b: 'Equipment, drugs, services' },
  { k: 'Agriculture', h: 'Agriculture & agribusiness', b: 'Inputs, processing, irrigation' },
  { k: 'Logistics', h: 'Logistics & transport', b: 'Fleet, freight, warehousing' },
  { k: 'Consulting', h: 'Consulting & advisory', b: 'M&E, training, research, audit' },
  { k: 'Supplies', h: 'General supplies', b: 'Stationery, PPE, uniforms, catering' },
  { k: 'Security', h: 'Security & cleaning', b: 'Guarding, janitorial, fumigation' },
  { k: 'Media', h: 'Media & creative', b: 'Print, design, video, comms' }
];
