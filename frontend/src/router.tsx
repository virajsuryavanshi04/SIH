import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Layouts
import PublicLayout from '@/components/layout/PublicLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';

// Public pages
import Landing from '@/pages/public/Landing';
import Login from '@/pages/public/Login';
import About from '@/pages/public/About';

// Learner pages
import Onboarding from '@/pages/learner/Onboarding';
import LearnerDashboard from '@/pages/learner/Dashboard';
import Competencies from '@/pages/learner/Competencies';
import Assessment from '@/pages/learner/Assessment';
import Quiz from '@/pages/learner/Quiz';
import QuizResult from '@/pages/learner/QuizResult';
import LearningPath from '@/pages/learner/LearningPath';
import Courses from '@/pages/learner/Courses';
import Materials from '@/pages/learner/Materials';
import Progress from '@/pages/learner/Progress';
import Profile from '@/pages/learner/Profile';

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import EmployeeList from '@/pages/admin/EmployeeList';
import AdminCompetencies from '@/pages/admin/AdminCompetencies';
import WorkforceGaps from '@/pages/admin/WorkforceGaps';
import AdminMaterials from '@/pages/admin/AdminMaterials';
import QuestionBank from '@/pages/admin/QuestionBank';
import AdminAnalytics from '@/pages/admin/AdminAnalytics';

import React from 'react';

const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: 'learner' | 'admin' }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  
  return children;
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route path="/onboarding" element={<ProtectedRoute role="learner"><Onboarding /></ProtectedRoute>} />
      </Route>

      <Route element={<DashboardLayout />}>
        {/* Learner Routes */}
        <Route path="/dashboard" element={<ProtectedRoute role="learner"><LearnerDashboard /></ProtectedRoute>} />
        <Route path="/competencies" element={<ProtectedRoute role="learner"><Competencies /></ProtectedRoute>} />
        <Route path="/assessment" element={<ProtectedRoute role="learner"><Assessment /></ProtectedRoute>} />
        <Route path="/quiz/:id" element={<ProtectedRoute role="learner"><Quiz /></ProtectedRoute>} />
        <Route path="/quiz/:id/result" element={<ProtectedRoute role="learner"><QuizResult /></ProtectedRoute>} />
        <Route path="/learning-path" element={<ProtectedRoute role="learner"><LearningPath /></ProtectedRoute>} />
        <Route path="/courses" element={<ProtectedRoute role="learner"><Courses /></ProtectedRoute>} />
        <Route path="/materials" element={<ProtectedRoute role="learner"><Materials /></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute role="learner"><Progress /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute role="learner"><Profile /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/employees" element={<ProtectedRoute role="admin"><EmployeeList /></ProtectedRoute>} />
        <Route path="/admin/competencies" element={<ProtectedRoute role="admin"><AdminCompetencies /></ProtectedRoute>} />
        <Route path="/admin/gaps" element={<ProtectedRoute role="admin"><WorkforceGaps /></ProtectedRoute>} />
        <Route path="/admin/materials" element={<ProtectedRoute role="admin"><AdminMaterials /></ProtectedRoute>} />
        <Route path="/admin/question-bank" element={<ProtectedRoute role="admin"><QuestionBank /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute role="admin"><AdminAnalytics /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}
