/**
 * Demonstration Dataset for SmartLearn National Workforce Competency Intelligence
 * 
 * NOTE: All statistics in this file are illustrative sample datasets designed
 * for product demonstration and SIH 2026 evaluation. They do not represent
 * live Government of India census records.
 */

export interface CompetencyNodeData {
  id: string;
  name: string;
  domain: string;
  current: number;
  target: number;
  gap: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'proficient' | 'on_track' | 'priority_gap';
  rootDependency: string;
  recommendedAction: string;
  description: string;
  x?: number; // relative coordinate for canvas positioning
  y?: number;
}

export const HERO_NETWORK_NODES = [
  { id: 'stat-methods', label: 'STATISTICAL METHODS', score: 86, target: 80, status: 'proficient', x: 50, y: 15 },
  { id: 'sampling', label: 'SAMPLING TECHNIQUES', score: 48, target: 70, status: 'priority_gap', isGap: true, x: 22, y: 50 },
  { id: 'data-analysis', label: 'DATA ANALYSIS', score: 64, target: 80, status: 'on_track', x: 78, y: 50 },
  { id: 'survey-meth', label: 'SURVEY METHODOLOGY', score: 51, target: 75, status: 'priority_gap', x: 35, y: 85 },
  { id: 'data-quality', label: 'DATA QUALITY', score: 72, target: 70, status: 'proficient', x: 68, y: 85 },
];

export const HERO_NETWORK_EDGES = [
  { from: 'stat-methods', to: 'sampling', label: 'Prerequisite' },
  { from: 'stat-methods', to: 'data-analysis', label: 'Foundational' },
  { from: 'sampling', to: 'survey-meth', label: 'Critical Path', active: true },
  { from: 'data-analysis', to: 'data-quality', label: 'Validation' },
  { from: 'survey-meth', to: 'data-quality', label: 'Audit Link' },
];

export const WORKFORCE_COMPETENCIES: CompetencyNodeData[] = [
  {
    id: 'stat-methods',
    name: 'Statistical Methods',
    domain: 'Core Theory',
    current: 86,
    target: 80,
    gap: 0,
    priority: 'LOW',
    status: 'proficient',
    rootDependency: 'Mathematical Statistics & Inference',
    recommendedAction: 'Maintain mastery via advanced quarterly micro-checks.',
    description: 'Probability distributions, central limit theorem, hypothesis testing, and standard errors.'
  },
  {
    id: 'sampling-techniques',
    name: 'Sampling Techniques',
    domain: 'Field Operations',
    current: 48,
    target: 70,
    gap: 22,
    priority: 'CRITICAL',
    status: 'priority_gap',
    rootDependency: 'Stratified Variance Calculation (Prerequisite)',
    recommendedAction: 'Deploy 6-Hour iGOT module: NSS Stratification & Neyman Allocation.',
    description: 'Stratified random sampling, cluster allocation, multistage survey weighting, and design effect formulas.'
  },
  {
    id: 'survey-methodology',
    name: 'Survey Methodology',
    domain: 'Field Operations',
    current: 51,
    target: 75,
    gap: 24,
    priority: 'HIGH',
    status: 'priority_gap',
    rootDependency: 'Directly blocked by Sampling Techniques deficit',
    recommendedAction: 'Study PLFS Field Guidelines & Non-Response Imputation Manuals.',
    description: 'Questionnaire design, household listing protocols, non-response adjustments, and audit trails.'
  },
  {
    id: 'data-quality',
    name: 'Data Quality & Validation',
    domain: 'Governance & Audits',
    current: 62,
    target: 80,
    gap: 18,
    priority: 'HIGH',
    status: 'priority_gap',
    rootDependency: 'Administrative Record Verification Rules',
    recommendedAction: 'Strengthen Data Validation & Anomaly Detection protocols.',
    description: 'Outlier detection, duplicate identification via probabilistic record linkage, and field telemetry verification.'
  },
  {
    id: 'data-analysis',
    name: 'Data Analysis & Modeling',
    domain: 'Analytics',
    current: 64,
    target: 80,
    gap: 16,
    priority: 'MEDIUM',
    status: 'on_track',
    rootDependency: 'Multivariate Regression Foundations',
    recommendedAction: 'Enroll in Applied Regression for Socioeconomic Indicators.',
    description: 'Linear & logistic regression, econometric modeling, index number computation, and trend forecasting.'
  },
  {
    id: 'data-viz',
    name: 'Data Visualization',
    domain: 'Reporting & Dissemination',
    current: 81,
    target: 75,
    gap: 0,
    priority: 'LOW',
    status: 'proficient',
    rootDependency: 'Cartographic & Dashboard Design Standards',
    recommendedAction: 'Ready for national open-data dashboard publication clearances.',
    description: 'Thematic spatial choropleth maps, statistical infographics, executive summary dashboards, and MoSPI reporting templates.'
  },
  {
    id: 'stat-programming',
    name: 'Statistical Programming',
    domain: 'Technology & Automation',
    current: 43,
    target: 70,
    gap: 27,
    priority: 'CRITICAL',
    status: 'priority_gap',
    rootDependency: 'Python / R Scripting for Tabulation Pipelines',
    recommendedAction: 'Complete Interactive Coding Lab on Automated Survey Ingestion.',
    description: 'Automated survey cleaning in Pandas/R, pipeline scheduling, reproducible analytical notebooks, and API integration.'
  }
];

export const WORKFORCE_GAP_DISTRIBUTION = [
  { name: 'Statistical Programming', gap: 27, target: 70, current: 43, highlight: true },
  { name: 'Survey Methodology', gap: 24, target: 75, current: 51, highlight: true },
  { name: 'Sampling Techniques', gap: 22, target: 70, current: 48, highlight: true },
  { name: 'Data Quality & Validation', gap: 18, target: 80, current: 62, highlight: false },
  { name: 'Data Analysis & Modeling', gap: 16, target: 80, current: 64, highlight: false },
  { name: 'Data Visualization', gap: 0, target: 75, current: 81, highlight: false },
  { name: 'Statistical Methods', gap: 0, target: 80, current: 86, highlight: false },
];

export const WORKFORCE_HEATMAP_DATA = {
  roles: ['Statistical Officer', 'Survey Officer', 'Data Analyst', 'Investigator'],
  rows: [
    { competency: 'Statistical Methods', scores: [86, 68, 88, 72] },
    { competency: 'Sampling Techniques', scores: [48, 64, 52, 40] },
    { competency: 'Survey Methodology', scores: [51, 74, 50, 45] },
    { competency: 'Data Quality & Validation', scores: [62, 68, 78, 70] },
    { competency: 'Data Analysis', scores: [64, 62, 90, 60] },
    { competency: 'Statistical Programming', scores: [43, 38, 86, 42] },
    { competency: 'Data Visualization', scores: [81, 64, 88, 70] },
  ]
};

export const PRIORITY_MATRIX_DATA = [
  { id: 'sampling', name: 'Sampling Techniques', affectedCount: 12, gapSeverity: 22, domain: 'Operations', priority: 'TRAIN FIRST' },
  { id: 'prog', name: 'Statistical Programming', affectedCount: 10, gapSeverity: 27, domain: 'Technology', priority: 'TRAIN FIRST' },
  { id: 'survey', name: 'Survey Methodology', affectedCount: 11, gapSeverity: 24, domain: 'Operations', priority: 'HIGH PRIORITY' },
  { id: 'quality', name: 'Data Quality', affectedCount: 7, gapSeverity: 18, domain: 'Governance', priority: 'MEDIUM PRIORITY' },
  { id: 'analysis', name: 'Data Analysis', affectedCount: 6, gapSeverity: 16, domain: 'Analytics', priority: 'MEDIUM PRIORITY' },
  { id: 'viz', name: 'Data Visualization', affectedCount: 2, gapSeverity: 0, domain: 'Reporting', priority: 'MAINTAINED' },
  { id: 'methods', name: 'Statistical Methods', affectedCount: 1, gapSeverity: 0, domain: 'Core Theory', priority: 'MAINTAINED' },
];

export const AI_DIAGNOSIS_SAMPLE = {
  officerRole: 'Statistical Officer (Level II)',
  baselineReadiness: '51.2%',
  rootGap: 'Sampling Techniques',
  gapPoints: 22,
  upstreamPrerequisite: 'Stratified Variance Calculation (Mathematical Foundations)',
  evidencePoints: [
    { title: 'Telemetry Evidence', detail: '4 out of 7 assessment calculation questions on Neyman allocation and multistage weights were incorrect.' },
    { title: 'Confidence Calibration', detail: 'Metacognitive confidence was recorded as "Not Sure" on stratified variance formulas, signaling knowledge deficit rather than slip.' },
    { title: 'Prerequisite Dependency', detail: 'Upstream descriptive statistics passed (86%), but applied variance weighting to official NSS clusters failed.' },
    { title: 'Role Benchmark Mandate', detail: 'Statistical Officer Level II role requires 70% threshold for independent field survey audit clearance.' }
  ],
  recommendedIntervention: {
    title: 'iGOT Karmayogi: Stratified & Cluster Sampling in Official Statistics',
    code: 'MOSPI-NSS-2026',
    duration: '6 Hours',
    format: 'Micro-learning + Applied Tabulation Lab'
  }
};

export const LEARNING_JOURNEY_STEPS = [
  {
    step: '01',
    title: 'Diagnostic Benchmark Assessment',
    duration: '15 min',
    status: 'completed',
    type: 'Assessment',
    note: 'Identified 22pt gap in Stratified Variance weighting'
  },
  {
    step: '02',
    title: 'Sampling Fundamentals (Waived)',
    duration: '0 min',
    status: 'waived',
    type: 'Fast-Track',
    note: 'Basic theory waived due to 86% verified score in Core Methods'
  },
  {
    step: '03',
    title: 'Neyman Allocation & Cluster Weighting',
    duration: '25 min',
    status: 'current',
    type: 'Interactive Lab',
    note: 'Active focus: Hands-on variance formulas on NSS data'
  },
  {
    step: '04',
    title: 'PLFS Non-Response Imputation Practice',
    duration: '30 min',
    status: 'upcoming',
    type: 'Applied Practice',
    note: 'Practical case study applying weights to field survey anomalies'
  },
  {
    step: '05',
    title: 'Targeted Competency Check',
    duration: '10 min',
    status: 'upcoming',
    type: 'Reassessment',
    note: '5 calibrated MCQs testing newly acquired competency'
  }
];

export const IGOT_RECOMMENDATIONS = [
  {
    title: 'Survey Sampling Fundamentals & Stratified Design',
    provider: 'National Statistical Training Institute (NSTI)',
    competency: 'Sampling Techniques',
    matchScore: 94,
    reason: 'Directly addresses your primary diagnosed root bottleneck in stratified survey weighting.',
    duration: '6h • 100% Free'
  },
  {
    title: 'Data Quality Audits & Anomaly Detection Frameworks',
    provider: 'Ministry of Statistics & Programme Implementation',
    competency: 'Data Quality & Validation',
    matchScore: 87,
    reason: 'Strengthens essential prerequisite protocols for national census and survey clearances.',
    duration: '8h • Official Accreditation'
  },
  {
    title: 'Python for Statistical Automation & Tabulation',
    provider: 'Indian Statistical Institute (ISI)',
    competency: 'Statistical Programming',
    matchScore: 78,
    reason: 'Supports role transition to automated administrative data pipelines and quality validation.',
    duration: '10h • Hands-on Notebooks'
  }
];

export const TRAJECTORY_MILESTONES = [
  { phase: '1. ASSESS', score: 45, label: 'Initial Baseline', detail: 'Uncalibrated baseline assessment across 8 statistical domains.' },
  { phase: '2. DIAGNOSE', score: 51, label: 'AI Root Cause', detail: 'Telemetry isolated underlying sampling formula deficits.' },
  { phase: '3. LEARN', score: 67, label: 'iGOT Targeted Module', detail: 'Completed 6h personalized curriculum without redundant chapters.' },
  { phase: '4. PRACTICE', score: 72, label: 'Official Guideline Lab', detail: 'Applied cluster weights to PLFS survey dataset.' },
  { phase: '5. REASSESS', score: 78, label: 'Validated Capability', detail: 'Verified +33pt capability growth meeting role threshold.' },
  { phase: 'BENCHMARK', score: 75, label: 'Role Standard', isTarget: true, detail: 'Certified threshold for Statistical Officer Level II.' }
];
