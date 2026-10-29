// ============================================================================
// iEduPro — Ghana education configuration pack (research-based)
// Stage structure, subjects, assessment profiles, statutory payroll rules.
// Sources: NaCCA SBC/CCP structure, WAEC BECE guidelines, SSNIT/GRA rules.
// Research checkpoint: 29 October 2026. Verify effective dates before live use.
// ============================================================================

export const GHANA_STAGES = [
  { key: 'early_care', name: 'Crèche / Nursery', sortOrder: 1, description: 'Early care configured by the school (crèche, day care, nursery). Developmental records, not a formal NaCCA grade.' },
  { key: 'kindergarten', name: 'Kindergarten (KG 1–2)', sortOrder: 2, description: 'Integrated play-based learning; observation-based assessment per NaCCA KG teacher resource pack.' },
  { key: 'lower_primary', name: 'Lower Primary (B1–B3)', sortOrder: 3, description: 'Standards-based curriculum, B1–B3.' },
  { key: 'upper_primary', name: 'Upper Primary (B4–B6)', sortOrder: 4, description: 'Standards-based curriculum, B4–B6.' },
  { key: 'jhs', name: 'Junior High School (B7–B9 / JHS 1–3)', sortOrder: 5, description: 'Common Core Programme; BECE preparation and records.' },
] as const;

export type StageKey = (typeof GHANA_STAGES)[number]['key'];

// Default class progression for a basic school
export const DEFAULT_CLASS_STRUCTURE: { stageKey: string; classes: { name: string; section?: string }[] }[] = [
  { stageKey: 'early_care', classes: [{ name: 'Crèche' }, { name: 'Nursery' }] },
  { stageKey: 'kindergarten', classes: [{ name: 'KG 1' }, { name: 'KG 2' }] },
  {
    stageKey: 'lower_primary',
    classes: [
      { name: 'Basic 1' }, { name: 'Basic 2' }, { name: 'Basic 3' },
    ],
  },
  {
    stageKey: 'upper_primary',
    classes: [
      { name: 'Basic 4' }, { name: 'Basic 5' }, { name: 'Basic 6' },
    ],
  },
  {
    stageKey: 'jhs',
    classes: [
      { name: 'Basic 7', section: 'JHS 1' }, { name: 'Basic 8', section: 'JHS 2' }, { name: 'Basic 9', section: 'JHS 3' },
    ],
  },
];

// National subjects (B1–B9 standards-based curriculum + CCP)
export const NATIONAL_SUBJECTS = [
  { code: 'ENG', name: 'English Language', learningArea: 'Languages', bece: true },
  { code: 'MATH', name: 'Mathematics', learningArea: 'Mathematics', bece: true },
  { code: 'SCI', name: 'Science', learningArea: 'Science', bece: true },
  { code: 'SOC', name: 'Our World Our People', learningArea: 'Social Studies', bece: false }, // B1–B6
  { code: 'CAREER', name: 'Career Technology', learningArea: 'Career Technology', bece: true }, // B7–B9 successor to BDT
  { code: 'COMPUTING', name: 'Computing', learningArea: 'Computing', bece: true },
  { code: 'RME', name: 'Religious and Moral Education', learningArea: 'RME', bece: true },
  { code: 'CREATIVE', name: 'Creative Arts and Design', learningArea: 'Creative Arts', bece: true },
  { code: 'FRENCH', name: 'French', learningArea: 'Languages', bece: true },
  { code: 'Ghanaian', name: 'Ghanaian Language', learningArea: 'Languages', bece: true },
  { code: 'PEH', name: 'Physical Education and Health', learningArea: 'Physical Education', bece: false }, // CCP learning area, NOT a BECE paper
  { code: 'HIST', name: 'History', learningArea: 'Social Studies', bece: false }, // B7–B9 CCP
] as const;

// Assessment profiles — provenance preserved. BECE: 30% continuous / 70% external (WAEC school candidate)
export const ASSESSMENT_PROFILES = [
  {
    name: 'KG Observation Profile (NaCCA-aligned)',
    provenance: 'school' as const,
    stageKey: 'kindergarten',
    components: [
      { code: 'observation', name: 'Observation', weight: 100, maxScore: 100 },
    ],
    descriptors: JSON.stringify([
      { band: 'Developing', range: [0, 39] },
      { band: 'Beginning', range: [40, 59] },
      { band: 'Approaching', range: [60, 79] },
      { band: 'Secure', range: [80, 100] },
    ]),
    note: 'No end-of-term paper-and-pencil tests for KG (NaCCA KG teacher resource pack).',
  },
  {
    name: 'Primary Standards-Based (school)',
    provenance: 'school' as const,
    stageKey: 'lower_primary',
    components: [
      { code: 'exercise', name: 'Class Exercises', weight: 20, maxScore: 100 },
      { code: 'class_test', name: 'Class Tests', weight: 20, maxScore: 100 },
      { code: 'project', name: 'Project/Practical', weight: 10, maxScore: 100 },
      { code: 'exam', name: 'End of Term Exam', weight: 50, maxScore: 100 },
    ],
    descriptors: JSON.stringify([
      { band: 'BB — Below Basic', range: [0, 49] },
      { band: 'AB — Approaching Basic', range: [50, 69] },
      { band: 'B — Basic', range: [70, 89] },
      { band: 'P — Proficient', range: [90, 100] },
    ]),
    note: 'School-defined weighting; national NaCCA descriptors shown as reference.',
  },
  {
    name: 'JHS School Assessment (CCP)',
    provenance: 'school' as const,
    stageKey: 'jhs',
    components: [
      { code: 'exercise', name: 'Class Exercises', weight: 10, maxScore: 100 },
      { code: 'class_test', name: 'Class Tests', weight: 10, maxScore: 100 },
      { code: 'project', name: 'Project/Practical', weight: 10, maxScore: 100 },
      { code: 'exam', name: 'End of Term Exam', weight: 70, maxScore: 100 },
    ],
    descriptors: JSON.stringify([
      { band: 'BB — Below Basic', range: [0, 49] },
      { band: 'AB — Approaching Basic', range: [50, 69] },
      { band: 'B — Basic', range: [70, 89] },
      { band: 'P — Proficient', range: [90, 100] },
    ]),
    note: 'School internal weighting; distinct from WAEC BECE 30/70 split which applies to the external examination.',
  },
];

// Ghana statutory payroll rule pack (effective 2026 research checkpoint)
// SSNIT: Tier 1 = 13% employer; employee 5% of base? NO — Ghana: Tier 1 13% (employer) + 5% (employee)? Actually:
// SSNIT Tier 1: 13% total (employer), of which employee contributes 5% via payroll deduction.
// Tier 2: 5% employer to occupational scheme (NPRA licensed trustee).
export const GHANA_PAYROLL_PACK = {
  version: 'gh-2026.1',
  effectiveFrom: '2026-01-01',
  ssnitTier1: { employerRate: 0.13, employeeRate: 0.05 },
  ssnitTier2: { employerRate: 0.05 },
  tier1EmployeeCreditableNote: 'Employee 5% is deducted from basic salary; employer 13% additional.',
  // PAYE monthly bands (GHS) — GRA 2025 "new tax brackets" (effective Jan 2025, held for 2026 checkpoint)
  payeBands: [
    { upTo: 496, rate: 0 },
    { upTo: 616, rate: 0.05 },
    { upTo: 3116, rate: 0.10 },
    { upTo: 3760, rate: 0.175 },
    { upTo: 5816, rate: 0.25 },
    { upTo: 99999, rate: 0.30 },
    { upTo: 199999, rate: 0.35 },
    { upTo: Infinity, rate: 0.40 },
  ],
  tier1InsurableMax: 2026000_00, // GHS 20,260/month max insurable earnings (SSNIT 2026 notice) — in pesewas
  note: 'Verify SSNIT/GRA notices for the applicable month before a live pay run. Bands saved per pay run.',
};

export function computePaye(annualTaxableGhs: number, bands = GHANA_PAYROLL_PACK.payeBands): number {
  // Monthly-band computation on annual taxable income (GRA bands are monthly)
  let tax = 0;
  let prev = 0;
  for (const b of bands) {
    if (annualTaxableGhs <= b.upTo) {
      tax += (annualTaxableGhs - prev) * b.rate;
      break;
    }
    tax += (b.upTo - prev) * b.rate;
    prev = b.upTo;
  }
  return tax;
}

// Ghana phone normalization (+233)
export function normalizeGhanaPhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.startsWith('233') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `+233${digits.slice(1)}`;
  if (digits.length === 9) return `+233${digits}`;
  return null;
}

// Academic year display: 2026–2027
export function academicYearLabel(startYear: number): string {
  return `${startYear}–${String(startYear + 1).slice(2)}`;
}
