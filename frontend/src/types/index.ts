export interface Role {
  id: number;
  name: string;
  description: string;
  created_at?: string;
}

export interface RoleCompetencyItem {
  competency_id: number;
  competency_name: string;
  target_score: number;
  target_level: number;
  weight: number;
}

export interface Department {
  id: number;
  name: string;
  code: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  name?: string;
  role: 'learner' | 'admin';
  role_id?: number;
  role_name?: string;
  department_id?: number;
  department_name?: string;
  designation?: string;
  experience_years?: number;
  is_onboarded?: boolean;
  baseline_completed?: boolean;
  active_assessment_id?: number | null;
  created_at: string;
}

export interface Competency {
  id: number;
  name: string;
  description: string;
  domain: string;
  category?: string;
  level: string;
}

export interface UserCompetencyState {
  competency_id: number;
  competency_name: string;
  domain?: string;
  current_score: number | null; // null if not assessed yet
  target_score: number;
  confidence: number;
  status: 'not_assessed' | 'strong' | 'on_track' | 'needs_attention' | 'critical_gap';
  gap: number | null;
  last_assessed?: string | null;
}

export interface CompetencyScore {
  competency_id: number;
  competency_name: string;
  score: number;
  required_level: number;
  gap: number;
  priority: string;
}

export interface CompetencyGap {
  competency: Competency;
  current_score: number | null;
  required_level: number;
  target_score?: number;
  gap: number;
  priority: string;
  prerequisite_gaps: string[];
}

export interface Assessment {
  id: number;
  type: string;
  assessment_type?: string;
  status: string;
  started_at: string;
  completed_at?: string;
  overall_score?: number;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: number;
  text: string;
  question_type: string;
  difficulty: string;
  competency_id: number;
  competency_name: string;
  cognitive_level: string;
  options: QuestionOption[];
}

export interface QuestionOption {
  id: number;
  text: string;
  order: number;
}

export interface QuestionFull extends QuizQuestion {
  explanation: string;
  source: string;
  status: string;
  created_at: string;
  options: (QuestionOption & { is_correct: boolean })[];
}

export interface AssessmentResult {
  assessment_id: number;
  overall_score: number;
  competency_breakdown: { competency_name: string; score: number; questions_total: number; questions_correct: number }[];
  ai_diagnosis: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  duration_hours: number;
  language: string;
  provider: string;
  competencies: string[];
  match_percent?: number;
  recommendation_reasons?: string[];
}

export interface LearningPath {
  id: number;
  items: LearningPathItem[];
  ai_reasoning: string;
  created_at: string;
}

export interface LearningPathItem {
  id: number;
  title: string;
  description: string;
  item_type: string;
  competency_name?: string;
  order: number;
  status: string;
  estimated_duration?: string;
  difficulty?: string;
}

export interface LearningMaterial {
  id: number;
  title: string;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  processing_status: string;
  detected_topics?: string[];
  mapped_competencies?: string[];
  upload_date: string;
}

export interface ProgressData {
  competency_name: string;
  scores_over_time: { date: string; score: number; source: string }[];
  improvement_delta: number;
}

export interface LearnerDashboard {
  user_name: string;
  overall_score: number;
  score_delta: number;
  competency_scores: CompetencyScore[];
  ai_insight: { strongest: string; weakest: string; recommendation: string; potential_improvement: string };
  recent_activity: { type: string; title: string; date: string; detail: string }[];
}

export interface AdminDashboard {
  total_employees: number;
  avg_competency: number;
  critical_gaps_count: number;
  courses_completed: number;
  avg_improvement: number;
  competency_overview: { name: string; avg_score: number; status: string }[];
  recent_activity: { type: string; title: string; date: string }[];
}

export interface HeatmapData {
  cells: { competency_name: string; department_name: string; avg_score: number; status: string }[];
  departments: string[];
  competencies: string[];
}

export interface GapPriority {
  competency_name: string;
  percent_below_target: number;
  severity: string;
  affected_count: number;
  priority_rank: number;
  priority_formula: string;
}
