import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// Users & Professional Profile
export const userApi = {
  getMe: () => api.get('/users/me'),
  getDepartments: () => api.get('/users/departments'),
  completeOnboarding: (data: { role_id: number; department_id?: number; department_name?: string; experience_years?: number; work_areas?: string[] }) =>
    api.post('/users/onboarding', data),
  updateRole: (role_id: number) => api.put('/users/me/role', { role_id }),
};

// Roles & Official Competency Targets
export const roleApi = {
  getAll: () => api.get('/roles/'),
  get: (id: number) => api.get(`/roles/${id}`),
  getCompetencies: (role_id: number) => api.get(`/roles/${role_id}/competencies`),
};

// Dashboard
export const dashboardApi = {
  getLearnerDashboard: () => api.get('/dashboard/learner'),
};

// Competencies
export const competencyApi = {
  getAll: () => api.get('/competencies/'),
  getMyCompetencies: () => api.get('/competencies/me'),
  getMyHistory: () => api.get('/competencies/me/history'),
  getMyGaps: () => api.get('/competencies/me/gaps'),
  getMyInsights: () => api.get('/competencies/me/insights'),
  getMyDiagnosis: () => api.get('/competencies/me/diagnosis'),
  getScores: () => api.get('/competencies/user/scores'),
  getGaps: () => api.get('/competencies/user/gaps'),
  getTree: () => api.get('/competencies/tree'),
  get: (id: number) => api.get(`/competencies/${id}`),
};

// Assessments
export const assessmentApi = {
  start: (data: any) => api.post('/assessments/start', data),
  get: (id: number) => api.get(`/assessments/${id}`),
  getResult: (id: number) => api.get(`/assessments/${id}/result`),
  submitAnswer: (id: number, data: any) => api.post(`/assessments/${id}/answer`, data),
  adaptiveNext: (id: number, data: any) => api.post(`/assessments/${id}/adaptive-next`, data),
  complete: (id: number) => api.post(`/assessments/${id}/complete`),
  getHistory: () => api.get('/assessments/history/list'),
};

// Courses  
export const courseApi = {
  getAll: () => api.get('/courses/'),
  getRecommended: () => api.get('/courses/recommended'),
  get: (id: number) => api.get(`/courses/${id}`),
  enroll: (id: number) => api.post(`/courses/${id}/enroll`),
  updateProgress: (id: number, progress: number) => api.patch(`/courses/${id}/progress`, { progress_percent: progress }),
  complete: (id: number) => api.post(`/courses/${id}/complete`),
};

// Recommendations
export const recommendationApi = {
  getNextAction: () => api.get('/recommendations/next-action'),
  getAll: (limit?: number) => api.get('/recommendations/', { params: { limit } }),
};

// Learning Path
export const learningPathApi = {
  get: () => api.get('/learning-path/'),
  generate: () => api.post('/learning-path/generate'),
  completeItem: (id: number) => api.patch(`/learning-path/items/${id}/complete`),
};

// Progress
export const progressApi = {
  getOverview: () => api.get('/progress/overview'),
  getCompetencies: () => api.get('/progress/competencies'),
  getAnalytics: () => api.get('/progress/analytics'),
  getTimeline: (limit?: number) => api.get('/progress/timeline', { params: { limit } }),
  get: () => api.get('/progress/competencies'),
  getImprovement: () => api.get('/progress/overview'),
};

// Materials
export const materialApi = {
  upload: (formData: FormData) => api.post('/materials/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll: () => api.get('/materials/'),
  get: (id: number) => api.get(`/materials/${id}`),
  update: (id: number, data: any) => api.patch(`/materials/${id}`, data),
  delete: (id: number) => api.delete(`/materials/${id}`),
  generateQuestions: (id: number, config: any) => api.post(`/materials/${id}/generate-questions`, config),
  uploadLearnerNotes: (formData: FormData) => api.post('/materials/learner-notes/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyNotes: () => api.get('/materials/learner-notes/my-notes'),
  generateNotesPracticeQuiz: (id: number, count?: number, difficulty?: string) => 
    api.post(`/materials/learner-notes/${id}/generate-practice-quiz?count=${count || 3}&difficulty=${difficulty || '2'}`),
  // Phase 5B Study Content
  getStudyContentStatus: (id: number) => api.get(`/materials/${id}/study-content-status`),
  generateNotes: (id: number) => api.post(`/materials/${id}/notes/generate`),
  getNotes: (id: number) => api.get(`/materials/${id}/notes`),
  generateFlashcards: (id: number, count?: number) => api.post(`/materials/${id}/flashcards/generate?count=${count || 8}`),
  getFlashcards: (id: number) => api.get(`/materials/${id}/flashcards`),
  generateMindMap: (id: number) => api.post(`/materials/${id}/mind-map/generate`),
  getMindMap: (id: number) => api.get(`/materials/${id}/mind-map`),
  startQuiz: (id: number, data: { question_count?: number; question_type?: string }) => api.post(`/materials/${id}/quiz/start`, data),
  // Material Workspace & History
  getWorkspace: (id: number) => api.get(`/materials/${id}/workspace`),
  getQuizHistory: (id: number) => api.get(`/materials/${id}/quiz/history`),
  getRelatedCourses: (id: number) => api.get(`/materials/${id}/related-courses`),
};

// Questions
export const questionApi = {
  getAll: (params?: any) => api.get('/questions/', { params }),
  getStats: () => api.get('/questions/stats'),
  get: (id: number) => api.get(`/questions/${id}`),
  generate: (data: { competency_id: number; topic_id?: number; difficulty?: string; count?: number }) => api.post('/questions/generate', data),
  update: (id: number, data: any) => api.put(`/questions/${id}`, data),
  updateStatus: (id: number, status: string, comment?: string) => api.patch(`/questions/${id}/status`, { status, comment }),
};

// Admin
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getEmployees: () => api.get('/admin/employees'),
  getHeatmap: (params?: any) => api.get('/admin/competencies/heatmap', { params }),
  getGapPriorities: () => api.get('/admin/gaps/priorities'),
  getTrainingEffectiveness: () => api.get('/admin/analytics/training-effectiveness'),
  getImprovementTrends: () => api.get('/admin/analytics/improvement-trends'),
};

// Diagnosis (Phase 5G)
export const diagnosisApi = {
  getAssessmentDiagnosis: (assessmentId: number) => api.get(`/diagnosis/assessment/${assessmentId}`),
  getRemediation: (competencyId: number) => api.get(`/diagnosis/remediation/${competencyId}`),
  getLatest: () => api.get('/diagnosis/latest'),
};

export default api;
