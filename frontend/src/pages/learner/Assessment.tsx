import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { assessmentApi, competencyApi, userApi, roleApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  Sparkles, 
  Clock, 
  Target, 
  History, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  FileText, 
  Briefcase, 
  Layers,
  Zap,
  Info
} from 'lucide-react';
import { User } from '@/types';

export default function Assessment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(user);
  const [competencies, setCompetencies] = useState<{ id: number; name: string }[]>([]);
  const [pastAssessments, setPastAssessments] = useState<any[]>([]);
  
  // Phase 3 Configuration
  const [selectedCompId, setSelectedCompId] = useState<string>(searchParams.get('competencyId') || 'all');
  const [questionType, setQuestionType] = useState<string>('MIXED');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [focusType, setFocusType] = useState<string>(searchParams.get('reassess') === 'true' ? 'adaptive_reassessment' : 'adaptive');

  useEffect(() => {
    const loadAssessmentDashboard = async () => {
      try {
        const [meRes, histRes] = await Promise.all([
          userApi.getMe(),
          assessmentApi.getHistory()
        ]);
        const profile = meRes.data;
        setUserProfile(profile);
        setPastAssessments(histRes.data || []);

        // Load role-specific competencies
        if (profile.role_id) {
          const compRes = await roleApi.getCompetencies(profile.role_id);
          const mapped = compRes.data.map((rc: any) => ({
            id: rc.competency_id,
            name: rc.competency_name
          }));
          setCompetencies(mapped);
        } else {
          const myCompRes = await competencyApi.getMyCompetencies();
          if (myCompRes.data && myCompRes.data.length > 0) {
            const mapped = myCompRes.data.map((mc: any) => ({
              id: mc.competency_id,
              name: mc.competency_name
            }));
            setCompetencies(mapped);
          } else {
            const allRes = await competencyApi.getAll();
            setCompetencies(allRes.data);
          }
        }
      } catch (err) {
        console.error('Failed to load assessment config:', err);
      }
    };
    loadAssessmentDashboard();
  }, [user]);

  const activeRoleName = userProfile?.role_name || userProfile?.designation || user?.role_name || user?.designation || 'Statistical Officer';

  const handleStartAssessment = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const compIds = selectedCompId !== 'all' ? [parseInt(selectedCompId)] : undefined;

      const res = await assessmentApi.start({
        assessment_type: focusType,
        competency_id: compIds && compIds.length === 1 ? compIds[0] : undefined,
        competency_ids: compIds,
        question_type: questionType,
        question_count: questionCount,
        adaptive_mode: true
      });

      const assessmentId = res.data.assessment_id;
      const questions = res.data.questions;

      navigate(`/quiz/${assessmentId}`, {
        state: {
          assessmentId,
          questions,
          assessmentType: res.data.assessment_type,
          competenciesCovered: res.data.competencies_covered,
          totalQuestions: res.data.total_questions || questionCount
        }
      });
    } catch (err: any) {
      console.error('Failed to start assessment:', err);
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setErrorMessage(detail);
      } else {
        setErrorMessage('Failed to initialize assessment session. Please try selecting different options.');
      }
    } finally {
      setLoading(false);
    }
  };

  const questionTypeOptions = [
    {
      id: 'SHORT_MCQ',
      label: 'Short MCQ',
      desc: 'Standard single-concept validation',
      icon: BookOpen
    },
    {
      id: 'WORD_PROBLEM',
      label: 'Word Problem',
      desc: 'Applied statistical calculation & logic',
      icon: FileText
    },
    {
      id: 'CASE_STUDY',
      label: 'Case Study',
      desc: 'Multi-variable policy & survey scenario',
      icon: Briefcase
    },
    {
      id: 'MIXED',
      label: 'Mixed',
      desc: 'Dynamic blend across all formats',
      icon: Layers
    }
  ];

  const questionCountOptions = [10, 15, 20];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 text-left">
      <div>
        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#A85D4C] uppercase tracking-widest mb-1">
          <Target className="w-3.5 h-3.5" />
          <span>EVIDENCE-BASED CAPABILITY DIAGNOSTICS</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#2D3030] tracking-tight">
          Competency Assessments & Diagnostics
        </h1>
        <p className="text-xs sm:text-sm text-[#292B2B]/80 mt-1">
          Calibrated diagnostic sessions that evaluate practical statistical mastery and separate genuine competence from guessing.
        </p>
      </div>

      {/* Role Context Notification */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#2D3030] text-[#FFFDF9] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#B38A3D]" />
            <span className="text-xs font-mono uppercase font-bold text-[#B38A3D]">Active Designation:</span>
            <span className="text-xs font-bold text-[#FFFDF9]">{activeRoleName}</span>
          </div>
          <p className="text-xs text-[#FFFDF9]/80">
            Diagnostics strictly sample approved questions mapped to {activeRoleName}'s official MoSPI competency framework.
          </p>
        </div>
        <div className="shrink-0">
          <span className="text-xs font-mono font-semibold bg-[#A85D4C] text-[#FFFDF9] px-3 py-1 rounded-lg">
            {competencies.length || 8} Role Benchmarks
          </span>
        </div>
      </div>

      {/* Error / Pool Sufficiency Warning Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 text-[#DC2626] flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm space-y-1">
            <p className="font-bold">Configuration Notice</p>
            <p className="text-xs sm:text-sm opacity-90">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Configuration Card */}
      <Card className="border-t-4 border-t-[#A85D4C] bg-[#FFFDF9] shadow-xs border-[#E2DDD5] rounded-2xl">
        <CardHeader className="pb-4 border-b border-[#E2DDD5]">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#A85D4C] uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#A85D4C]" />
            <span>Telemetry Question Engine</span>
          </div>
          <CardTitle className="text-lg sm:text-xl font-semibold text-[#292B2B]">Configure Assessment Session</CardTitle>
          <CardDescription className="text-sm text-[#7A756E]">
            Configure your competency target, question format, and length. Difficulty dynamically calibrates in real time.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          {/* 1. Competency Focus */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase font-bold tracking-wider text-[#292B2B] flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#A85D4C]" />
              <span>Competency</span>
            </label>
            <Select value={selectedCompId} onValueChange={(val) => { setSelectedCompId(val); setErrorMessage(null); }}>
              <SelectTrigger className="w-full border-[#E2DDD5] focus:ring-[#A85D4C]/20 bg-[#FFFDF9] text-sm font-medium text-[#292B2B] h-11 rounded-xl">
                <SelectValue placeholder="Select Competency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {activeRoleName} Framework ({competencies.length || 8} Competencies — Comprehensive)
                </SelectItem>
                {competencies.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Question Type */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase font-bold tracking-wider text-[#292B2B] flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#A85D4C]" />
              <span>Question Type</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {questionTypeOptions.map((opt) => {
                const isSelected = questionType === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { setQuestionType(opt.id); setErrorMessage(null); }}
                    className={`flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#A85D4C] bg-[#A85D4C]/5 ring-2 ring-[#A85D4C]/20 text-[#292B2B]'
                        : 'border-[#E2DDD5] bg-[#FFFDF9] hover:bg-[#F7F4EE] hover:border-[#A85D4C]/40 text-[#292B2B]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-[#A85D4C]' : 'text-[#7A756E]'}`} />
                        <span className="text-sm font-bold">{opt.label}</span>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-[#A85D4C] bg-[#A85D4C]' : 'border-[#7A756E]/40'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-[#7A756E] leading-tight mt-0.5">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Number of Questions & 4. Difficulty Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
            
            {/* Number of Questions */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase font-bold tracking-wider text-[#292B2B] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#A85D4C]" />
                <span>Number of Questions</span>
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {questionCountOptions.map((count) => {
                  const isSelected = questionCount === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => { setQuestionCount(count); setErrorMessage(null); }}
                      className={`py-2.5 px-3 rounded-xl border text-center font-bold text-sm transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#A85D4C] bg-[#A85D4C] text-[#FFFDF9] shadow-xs'
                          : 'border-[#E2DDD5] bg-[#FFFDF9] hover:bg-[#F7F4EE] hover:border-[#A85D4C]/40 text-[#292B2B]'
                      }`}
                    >
                      {count} Questions
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase font-bold tracking-wider text-[#292B2B] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#B38A3D]" />
                <span>Difficulty</span>
              </label>
              <div className="h-11 px-4 rounded-xl border border-[#B38A3D]/40 bg-[#B38A3D]/10 flex items-center justify-between text-xs sm:text-sm font-semibold text-[#292B2B]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#B38A3D] animate-pulse" />
                  <span className="font-bold">Adaptive Engine Active</span>
                </div>
                <span className="text-[11px] font-mono text-[#7A756E]">Autotunes by performance</span>
              </div>
            </div>

          </div>

          {/* Action Row */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E2DDD5]">
            <div className="text-xs text-[#7A756E] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#A85D4C]" />
              <span>Target: {questionCount} questions • Real-time streak adaptation active</span>
            </div>

            <Button 
              size="default" 
              className="w-full sm:w-auto font-semibold text-sm bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9] shadow-xs px-7 h-11 rounded-xl cursor-pointer" 
              onClick={handleStartAssessment} 
              disabled={loading}
            >
              {loading ? (
                <span>Validating Question Pool...</span>
              ) : (
                <span className="flex items-center gap-2">
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Assessment</span>
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Past Assessment History */}
      <Card className="bg-[#FFFDF9] shadow-xs border border-[#E2DDD5] rounded-2xl">
        <CardHeader className="border-b border-[#E2DDD5] p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg font-semibold text-[#292B2B] flex items-center gap-2">
              <History className="w-4.5 h-4.5 text-[#A85D4C]" />
              <span>Recorded Diagnostic Telemetry</span>
            </CardTitle>
            <span className="text-xs font-mono text-[#7A756E]">
              {pastAssessments.length} sessions logged
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {pastAssessments.length === 0 ? (
            <div className="text-center p-8 space-y-2">
              <AlertCircle className="w-8 h-8 text-[#7A756E]/30 mx-auto" />
              <p className="text-sm font-semibold text-[#292B2B]">No prior assessment sessions found.</p>
              <p className="text-xs text-[#7A756E]">Complete your first assessment above to populate your capability telemetry.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EFEBE4] border-b border-[#E2DDD5] text-[#292B2B] uppercase font-mono font-semibold text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Session ID</th>
                    <th className="px-5 py-3">Diagnostic Type</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Overall Score</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DDD5] font-medium text-[#292B2B]">
                  {pastAssessments.map(item => (
                    <tr key={item.id} className="hover:bg-[#EFEBE4]/50 transition-colors">
                      <td className="px-5 py-3 font-mono text-[#292B2B] font-bold">#{item.id}</td>
                      <td className="px-5 py-3 font-semibold text-[#A85D4C] uppercase text-xs">{item.assessment_type || item.type || 'Adaptive'}</td>
                      <td className="px-5 py-3 text-[#7A756E] font-mono">
                        {item.started_at ? new Date(item.started_at).toLocaleDateString() : 'Recent'}
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-bold text-sm text-[#292B2B] font-mono">
                          {item.overall_score !== null ? `${item.overall_score}%` : 'In Progress'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#2E8B57]/10 text-[#2E8B57] border border-[#2E8B57]/30">
                          {item.status || 'Completed'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {item.status === 'completed' || item.overall_score !== null ? (
                          <button
                            type="button"
                            onClick={() => navigate(`/quiz/${item.id}/result`)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#A85D4C] hover:text-[#7D4036] bg-[#A85D4C]/10 hover:bg-[#A85D4C]/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <span>Review Diagnostic</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigate(`/quiz/${item.id}`)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#B38A3D] hover:text-[#916E2E] bg-[#B38A3D]/10 hover:bg-[#B38A3D]/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-[#B38A3D]/30"
                          >
                            <span>Resume Assessment</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
