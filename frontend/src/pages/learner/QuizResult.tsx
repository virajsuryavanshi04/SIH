import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { assessmentApi, diagnosisApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  XCircle,
  AlertTriangle, 
  ArrowRight, 
  RotateCcw, 
  Sparkles, 
  Target, 
  Layers, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle,
  BookOpen,
  Clock,
  Zap,
  HelpCircle,
  Filter,
  Check,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptionReview {
  id: number;
  text: string;
  order: number;
  is_correct: boolean;
}

interface QuestionReview {
  question_id: number;
  question_number: number;
  question_type: string;
  question_text: string;
  difficulty: string;
  competency_id: number;
  competency_name?: string;
  topic_id?: number;
  topic_name?: string;
  options: OptionReview[];
  learner_selected_option_id?: number;
  learner_selected_text?: string;
  correct_option_id?: number;
  correct_option_text?: string;
  is_correct: boolean;
  confidence_level?: number;
  time_taken_seconds?: number;
  explanation?: string;
}

export default function QuizResult() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const [result, setResult] = useState<any>(location.state?.result || null);
  const [loading, setLoading] = useState<boolean>(!location.state?.result);
  const [filterType, setFilterType] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [diagnosis, setDiagnosis] = useState<any>(null);

  useEffect(() => {
    const fetchResult = async () => {
      const assessmentId = id ? parseInt(id) : location.state?.assessmentId;
      if (assessmentId) {
        try {
          setLoading(true);
          const res = await assessmentApi.getResult(assessmentId);
          setResult(res.data);
        } catch (err) {
          console.error('Failed to load assessment result:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    // If result was passed in location.state but lacks responses review array, fetch complete result
    if (!result || !result.responses) {
      fetchResult();
    }
    
    // Fetch Phase 5G Cognitive Diagnosis
    const assessmentId = id ? parseInt(id) : (location.state?.assessmentId || result?.id);
    if (assessmentId) {
      diagnosisApi.getAssessmentDiagnosis(assessmentId)
        .then(res => setDiagnosis(res.data))
        .catch(err => console.warn('Diagnosis load skipped:', err));
    }
  }, [id, location.state, result?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EFEBE4] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#A85D4C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#2D3030]">Loading diagnostic evaluation and response review...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#EFEBE4] flex items-center justify-center p-4">
        <div className="bg-[#FFFDF9] p-8 rounded-2xl border border-[#E2DDD5] text-center space-y-4 max-w-md">
          <AlertCircle className="w-8 h-8 text-[#A85D4C] mx-auto" />
          <h2 className="text-lg font-bold text-[#2D3030]">Assessment Result Not Found</h2>
          <p className="text-xs text-[#7A756E]">Unable to load the requested assessment session results.</p>
          <Link to="/assessment">
            <Button className="bg-[#A85D4C] text-[#FFFDF9] font-semibold mt-2">
              Return to Assessments
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const overallScore = result.overall_score ?? result.overall_readiness ?? 0.0;
  const totalQuestions = result.total_questions ?? (result.responses?.length || 0);
  const totalCorrect = result.total_correct ?? result.responses?.filter((r: any) => r.is_correct).length ?? 0;
  const totalIncorrect = result.total_incorrect ?? Math.max(0, totalQuestions - totalCorrect);

  const config = result.configuration || {
    competency_summary: result.competencies_covered?.join(', ') || 'Role Competencies',
    question_type: 'Mixed',
    question_count: totalQuestions,
    difficulty_mode: result.assessment_type === 'adaptive' ? 'Adaptive Difficulty Engine' : 'Standard'
  };

  const competencyBreakdown = result.competency_breakdown || [];
  const questionTypePerf = result.question_type_performance || [];
  const difficultyPerf = result.difficulty_performance || [];
  const confidencePerf = result.confidence_performance;
  const weakAreas = result.weak_areas || [];
  const adaptiveSummary = result.adaptive_summary;
  const responses: QuestionReview[] = result.responses || [];

  const filteredResponses = responses.filter((r) => {
    if (filterType === 'correct') return r.is_correct;
    if (filterType === 'incorrect') return !r.is_correct;
    return true;
  });

  const getDifficultyBadge = (diff?: string) => {
    const raw = String(diff || '2').toLowerCase();
    if (raw === '1' || raw === 'easy' || raw === 'beginner') {
      return { label: 'Easy', color: 'bg-[#2E8B57]/10 text-[#2E8B57] border-[#2E8B57]/30' };
    }
    if (raw === '3' || raw === 'hard' || raw === 'advanced') {
      return { label: 'Hard', color: 'bg-[#B38A3D]/15 text-[#292B2B] border-[#B38A3D]/40' };
    }
    return { label: 'Medium', color: 'bg-[#A85D4C]/10 text-[#A85D4C] border-[#A85D4C]/30' };
  };

  const getTypeLabel = (type?: string) => {
    const raw = String(type || 'SHORT_MCQ').toUpperCase();
    if (raw === 'WORD_PROBLEM') return 'Word Problem';
    if (raw === 'CASE_STUDY') return 'Case Study';
    return 'Short MCQ';
  };

  const getConfidenceLabel = (level?: number) => {
    if (level === 3) return { label: 'High Confidence', color: 'text-[#2E8B57]' };
    if (level === 1) return { label: 'Low Confidence', color: 'text-[#B38A3D]' };
    return { label: 'Medium Confidence', color: 'text-[#7A756E]' };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 px-4 pb-16 text-left">
      
      {/* 1. Header Banner & Diagnostic Score Summary */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#A85D4C]/10 text-[#A85D4C] border border-[#A85D4C]/20 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-[#A85D4C]" />
          <span>{result.source_material_title ? 'MATERIAL QUIZ PERFORMANCE RECORDED' : 'DIAGNOSTIC TELEMETRY RECORDED'}</span>
        </div>
        {result.source_material_title && (
          <div className="flex items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-mono text-xs font-semibold shadow-xs">
              <BookOpen className="w-3.5 h-3.5 text-amber-700" />
              <span>Source Material: {result.source_material_title}</span>
              {result.material_scope && (
                <span className="px-1.5 py-0.5 rounded bg-amber-200/70 text-[10px] text-amber-900 uppercase">
                  {result.material_scope === 'OFFICIAL_COMPETENCY' ? 'Official' : 'Personal Study'}
                </span>
              )}
            </div>
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-black text-[#2D3030] tracking-tight">
          Assessment Performance & Diagnostic Evaluation
        </h1>
        <p className="text-xs sm:text-sm text-[#7A756E] max-w-lg mx-auto leading-relaxed">
          Authoritative evidence-based evaluation recorded across official role benchmarks.
        </p>

        {/* Primary Score Card Banner */}
        <div className="mt-6 bg-[#2D3030] text-[#FFFDF9] p-6 sm:p-7 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-[#A85D4C] text-[#FFFDF9] flex flex-col items-center justify-center font-mono shrink-0 shadow-inner">
              <span className="text-2xl font-black">{overallScore}%</span>
              <span className="text-[9px] uppercase font-bold text-[#FFFDF9]/80 tracking-wider">Score</span>
            </div>
            <div className="text-left space-y-1">
              <span className="text-xs font-mono uppercase font-bold text-[#B38A3D]">Performance Summary</span>
              <h2 className="text-lg sm:text-xl font-bold text-[#FFFDF9]">
                {overallScore >= 75 ? 'Strong Role Benchmark' : overallScore >= 50 ? 'Developing Competency Baseline' : 'Targeted Reinforcement Recommended'}
              </h2>
              <p className="text-xs text-[#FFFDF9]/80">
                Evaluation based on deterministic scoring and authenticated answer evidence.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:border-l sm:border-[#FFFDF9]/20 sm:pl-6 shrink-0 font-mono">
            <div className="text-center px-3 py-1.5 rounded-xl bg-[#FFFDF9]/10 border border-[#FFFDF9]/10">
              <span className="block text-lg font-bold text-[#2E8B57]">{totalCorrect}</span>
              <span className="text-[10px] uppercase text-[#FFFDF9]/70">Correct</span>
            </div>
            <div className="text-center px-3 py-1.5 rounded-xl bg-[#FFFDF9]/10 border border-[#FFFDF9]/10">
              <span className="block text-lg font-bold text-[#A85D4C]">{totalIncorrect}</span>
              <span className="text-[10px] uppercase text-[#FFFDF9]/70">Incorrect</span>
            </div>
            <div className="text-center px-3 py-1.5 rounded-xl bg-[#FFFDF9]/10 border border-[#FFFDF9]/10">
              <span className="block text-lg font-bold text-[#FFFDF9]">{totalQuestions}</span>
              <span className="text-[10px] uppercase text-[#FFFDF9]/70">Questions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Closed-Loop Targeted Reassessment Impact Card */}
      {result.reassessment_summary && (
        <Card className="bg-[#FFFDF9] border-2 border-[#2E8B57]/40 rounded-2xl shadow-md overflow-hidden">
          <CardHeader className="bg-[#2E8B57]/10 p-5 border-b border-[#2E8B57]/20 flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#2E8B57] block">
                CLOSED-LOOP REASSESSMENT EVALUATION
              </span>
              <CardTitle className="text-lg font-extrabold text-[#292B2B] flex items-center gap-2">
                <Target className="w-5 h-5 text-[#2E8B57]" />
                <span>Competency Impact: {result.reassessment_summary.competency_name}</span>
              </CardTitle>
            </div>
            <span className={cn(
              "text-xs font-mono font-bold px-3 py-1 rounded-full border",
              result.reassessment_summary.status === 'MET_BENCHMARK'
                ? "bg-[#2E8B57]/20 text-[#2E8B57] border-[#2E8B57]/40"
                : result.reassessment_summary.status === 'IMPROVED_ON_TRACK'
                ? "bg-[#B38A3D]/20 text-[#292B2B] border-[#B38A3D]/40"
                : "bg-[#A85D4C]/20 text-[#A85D4C] border-[#A85D4C]/40"
            )}>
              {result.reassessment_summary.status === 'MET_BENCHMARK' && '✓ Benchmark Met'}
              {result.reassessment_summary.status === 'IMPROVED_ON_TRACK' && '↑ Improved / On Track'}
              {result.reassessment_summary.status === 'NEEDS_ADDITIONAL_PRACTICE' && '⚠ Additional Practice Recommended'}
              {result.reassessment_summary.status === 'INITIAL_MEASUREMENT' && 'Baseline Established'}
            </span>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#EFEBE4]/60 border border-[#E2DDD5] text-center space-y-1">
                <span className="text-[11px] font-mono text-[#7A756E] uppercase font-bold block">Previous Score</span>
                <span className="text-2xl font-black font-mono text-[#7A756E]">
                  {result.reassessment_summary.previous_score !== null ? `${result.reassessment_summary.previous_score}%` : 'N/A'}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[#2E8B57]/10 border border-[#2E8B57]/30 text-center space-y-1">
                <span className="text-[11px] font-mono text-[#2E8B57] uppercase font-bold block">New Score</span>
                <span className="text-2xl font-black font-mono text-[#2E8B57]">
                  {result.reassessment_summary.current_score}%
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[#FFFDF9] border border-[#E2DDD5] text-center space-y-1">
                <span className="text-[11px] font-mono text-[#7A756E] uppercase font-bold block">Points Delta</span>
                <span className={cn(
                  "text-2xl font-black font-mono",
                  result.reassessment_summary.score_delta > 0 ? "text-[#2E8B57]" : result.reassessment_summary.score_delta < 0 ? "text-[#A85D4C]" : "text-[#7A756E]"
                )}>
                  {result.reassessment_summary.score_delta > 0 ? `+${result.reassessment_summary.score_delta}` : `${result.reassessment_summary.score_delta}`} pts
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[#FFFDF9] border border-[#E2DDD5] text-center space-y-1">
                <span className="text-[11px] font-mono text-[#7A756E] uppercase font-bold block">Target Benchmark</span>
                <span className="text-2xl font-black font-mono text-[#292B2B]">
                  {result.reassessment_summary.target_score}%
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E2DDD5]">
              <div className="text-xs text-[#7A756E] space-y-0.5">
                <p>
                  <strong>Previous Deficit:</strong> {result.reassessment_summary.previous_gap !== null ? `${result.reassessment_summary.previous_gap} points` : 'None recorded'} &bull; <strong>Remaining Gap:</strong> {result.reassessment_summary.current_gap} points
                </p>
                <p className="text-[11px]">
                  Verified competency measurement recorded in immutable CompetencyScore ledger.
                </p>
              </div>
              <Link to="/dashboard" className="w-full sm:w-auto shrink-0">
                <Button className="w-full bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9] font-bold text-xs shadow-xs px-6 py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-2">
                  <span>Return to Dashboard → Next Action</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase 5G: Cognitive Diagnostic Breakdown */}
      {diagnosis && (
        <Card className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="bg-[#EFEBE4] border-b border-[#E2DDD5] p-5 sm:p-6 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#A85D4C] uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#B38A3D]" />
                <span>COGNITIVE DIAGNOSTIC INTELLIGENCE</span>
              </div>
              <CardTitle className="text-lg font-bold text-[#292B2B]">
                {diagnosis.primary_bottleneck}
              </CardTitle>
            </div>
            <span className={cn(
              "text-xs font-mono font-bold px-3 py-1 rounded-full border",
              diagnosis.diagnostic_confidence === 'HIGH'
                ? "bg-[#2E8B57]/10 text-[#2E8B57] border-[#2E8B57]/30"
                : diagnosis.diagnostic_confidence === 'MEDIUM'
                ? "bg-[#B38A3D]/15 text-[#292B2B] border-[#B38A3D]/35"
                : "bg-[#EFEBE4] text-[#7A756E] border-[#E2DDD5]"
            )}>
              Confidence: {diagnosis.diagnostic_confidence}
            </span>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 space-y-6">
            <div className="p-4 rounded-xl bg-[#EFEBE4]/60 border border-[#E2DDD5] text-xs text-[#292B2B] leading-relaxed">
              <p className="font-medium">{diagnosis.evidence_summary}</p>
            </div>

            {/* Misconceptions & Observed Error Patterns */}
            {diagnosis.misconceptions && diagnosis.misconceptions.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold text-[#292B2B] uppercase tracking-wider">
                  Observed Misconceptions & Telemetry Patterns ({diagnosis.misconceptions.length})
                </h4>
                <div className="grid gap-3">
                  {diagnosis.misconceptions.map((m: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-[#EFEBE4] border border-[#E2DDD5] space-y-2 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-sm text-[#292B2B]">{m.topic}</span>
                        <div className="flex items-center gap-2">
                          {m.high_confidence_error && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#A85D4C]/10 text-[#A85D4C] border border-[#A85D4C]/20">
                              High-Confidence Error
                            </span>
                          )}
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-mono font-bold border",
                            m.classification === 'LIKELY_MISCONCEPTION'
                              ? "bg-[#A85D4C]/10 text-[#A85D4C] border-[#A85D4C]/30"
                              : m.classification === 'OBSERVED_PATTERN'
                              ? "bg-[#B38A3D]/15 text-[#292B2B] border-[#B38A3D]/30"
                              : "bg-[#FFFDF9] text-[#7A756E] border-[#E2DDD5]"
                          )}>
                            {m.classification.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <p className="text-[#292B2B] font-medium">{m.pattern}</p>
                      <p className="text-[#7A756E] text-[11px] leading-relaxed">{m.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Targeted Remediation Focus & Recommended Actions */}
            <div className="space-y-3 pt-3 border-t border-[#E2DDD5]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#292B2B] uppercase tracking-wider">
                  Targeted Remediation Plan
                </span>
                <span className="text-xs font-mono text-[#A85D4C] font-semibold">
                  {diagnosis.remediation_focus}
                </span>
              </div>

              {diagnosis.recommended_actions && diagnosis.recommended_actions.length > 0 && (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {diagnosis.recommended_actions.map((act: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-[#FFFDF9] border border-[#E2DDD5] flex flex-col justify-between space-y-3 shadow-2xs">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-[#A85D4C] uppercase tracking-wider block">
                          {act.action_type.replace('_', ' ')}
                        </span>
                        <h5 className="font-bold text-xs text-[#292B2B] mt-0.5">{act.title}</h5>
                        <p className="text-[11px] text-[#7A756E] mt-1 leading-relaxed">{act.reason}</p>
                      </div>
                      <Link to={act.route} className="block mt-2">
                        <Button size="sm" className="w-full text-xs font-semibold bg-[#2D3030] text-[#FFFDF9] hover:bg-[#A85D4C] h-7 rounded-lg">
                          Launch →
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Assessment Configuration Summary */}
      <Card className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-2xl shadow-xs">
        <CardHeader className="p-5 pb-3 border-b border-[#E2DDD5]">
          <CardTitle className="text-sm font-bold text-[#292B2B] uppercase font-mono tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#A85D4C]" />
            <span>Assessment Session Parameters</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-[#7A756E] uppercase font-mono text-[10px] font-bold block">Competency Target</span>
            <span className="font-bold text-[#292B2B] block text-sm">{config.competency_summary}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[#7A756E] uppercase font-mono text-[10px] font-bold block">Question Format</span>
            <span className="font-bold text-[#292B2B] block text-sm">{config.question_type}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[#7A756E] uppercase font-mono text-[10px] font-bold block">Question Count</span>
            <span className="font-bold text-[#292B2B] block text-sm font-mono">{config.question_count} Questions</span>
          </div>
          <div className="space-y-1">
            <span className="text-[#7A756E] uppercase font-mono text-[10px] font-bold block">Difficulty Mode</span>
            <span className="font-bold text-[#A85D4C] block text-sm">{config.difficulty_mode}</span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Adaptive Summary Note (if applicable) */}
      {adaptiveSummary && (
        <div className="p-4 rounded-xl bg-[#EFEBE4] border border-[#A85D4C]/30 text-xs font-mono text-[#292B2B] flex items-center gap-3 shadow-xs">
          <Sparkles className="w-4 h-4 text-[#A85D4C] shrink-0" />
          <span>{adaptiveSummary}</span>
        </div>
      )}

      {/* 4. Performance Dimensions Grid: Competency | Question Type | Difficulty */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Question Type Performance */}
        {questionTypePerf.length > 0 && (
          <Card className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-2xl shadow-xs">
            <CardHeader className="p-5 pb-3 border-b border-[#E2DDD5]">
              <CardTitle className="text-xs font-bold text-[#292B2B] uppercase font-mono tracking-wider flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-[#A85D4C]" />
                <span>Performance by Question Type</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {questionTypePerf.map((qt: any) => (
                <div key={qt.name} className="flex items-center justify-between text-xs pb-2 border-b border-[#E2DDD5] last:border-0 last:pb-0">
                  <div>
                    <span className="font-bold text-[#292B2B] block">{qt.name}</span>
                    <span className="text-[10px] text-[#7A756E] font-mono">{qt.correct} of {qt.total} correct</span>
                  </div>
                  <span className="font-mono font-black text-sm text-[#292B2B]">{qt.accuracy_percent}%</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Difficulty Performance */}
        {difficultyPerf.length > 0 && (
          <Card className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-2xl shadow-xs">
            <CardHeader className="p-5 pb-3 border-b border-[#E2DDD5]">
              <CardTitle className="text-xs font-bold text-[#292B2B] uppercase font-mono tracking-wider flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-[#B38A3D]" />
                <span>Performance by Difficulty Level</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {difficultyPerf.map((df: any) => (
                <div key={df.name} className="flex items-center justify-between text-xs pb-2 border-b border-[#E2DDD5] last:border-0 last:pb-0">
                  <div>
                    <span className="font-bold text-[#292B2B] block">{df.name}</span>
                    <span className="text-[10px] text-[#7A756E] font-mono">{df.correct} of {df.total} correct</span>
                  </div>
                  <span className="font-mono font-black text-sm text-[#292B2B]">{df.accuracy_percent}%</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

      </div>

      {/* 5. Confidence Telemetry Pattern */}
      {confidencePerf && (
        <Card className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-2xl shadow-xs">
          <CardHeader className="p-5 pb-3 border-b border-[#E2DDD5]">
            <CardTitle className="text-xs font-bold text-[#292B2B] uppercase font-mono tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2E8B57]" />
              <span>Confidence Telemetry Calibration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-[#EFEBE4]/60 border border-[#E2DDD5] space-y-1">
              <span className="text-[#2E8B57] font-bold block">High Confidence</span>
              <span className="text-[#292B2B] font-black text-sm">{confidencePerf.high_correct} / {confidencePerf.high_count}</span>
              <span className="text-[10px] text-[#7A756E] block">
                {confidencePerf.high_count > 0 ? `${Math.round((confidencePerf.high_correct / confidencePerf.high_count) * 100)}% accuracy` : 'None recorded'}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#EFEBE4]/60 border border-[#E2DDD5] space-y-1">
              <span className="text-[#7A756E] font-bold block">Medium Confidence</span>
              <span className="text-[#292B2B] font-black text-sm">{confidencePerf.medium_correct} / {confidencePerf.medium_count}</span>
              <span className="text-[10px] text-[#7A756E] block">
                {confidencePerf.medium_count > 0 ? `${Math.round((confidencePerf.medium_correct / confidencePerf.medium_count) * 100)}% accuracy` : 'None recorded'}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#EFEBE4]/60 border border-[#E2DDD5] space-y-1">
              <span className="text-[#B38A3D] font-bold block">Low Confidence</span>
              <span className="text-[#292B2B] font-black text-sm">{confidencePerf.low_correct} / {confidencePerf.low_count}</span>
              <span className="text-[10px] text-[#7A756E] block">
                {confidencePerf.low_count > 0 ? `${Math.round((confidencePerf.low_correct / confidencePerf.low_count) * 100)}% accuracy` : 'None recorded'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 6. Areas to Review (if any below 70%) */}
      {weakAreas.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#FFFDF9] border border-[#B38A3D]/40 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-[#B38A3D]">
            <AlertTriangle className="w-4 h-4 text-[#B38A3D]" />
            <span>Target Areas to Review</span>
          </div>
          <p className="text-xs text-[#7A756E]">
            Identified from lower-accuracy responses in this assessment session:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {weakAreas.map((area: string, i: number) => (
              <span key={i} className="px-3 py-1 rounded-lg text-xs font-mono font-semibold bg-[#B38A3D]/10 text-[#292B2B] border border-[#B38A3D]/25">
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 7. Comprehensive Competency Breakdown Table */}
      {competencyBreakdown.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#292B2B] uppercase font-mono tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#A85D4C]" />
              <span>Competency Telemetry Breakdown</span>
            </h3>
            <span className="text-xs font-mono text-[#7A756E]">
              {competencyBreakdown.length} Competencies Evaluated
            </span>
          </div>

          <div className="bg-[#FFFDF9] rounded-2xl border border-[#E2DDD5] overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs border-collapse min-w-[500px]">
              <thead className="bg-[#EFEBE4] border-b border-[#E2DDD5] text-[#292B2B] uppercase font-mono font-semibold text-[10px]">
                <tr>
                  <th className="p-3.5 sm:px-5">Competency Area</th>
                  <th className="p-3.5 sm:px-5">Questions</th>
                  <th className="p-3.5 sm:px-5">Score</th>
                  <th className="p-3.5 sm:px-5">Benchmark</th>
                  <th className="p-3.5 sm:px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD5] font-medium text-[#292B2B]">
                {competencyBreakdown.map((item: any) => {
                  const isStrong = item.status === 'strong';
                  const isCritical = item.status === 'critical_gap';

                  return (
                    <tr key={item.competency_id} className="hover:bg-[#EFEBE4]/50 transition-colors">
                      <td className="p-3.5 sm:px-5 font-semibold text-[#292B2B]">{item.competency_name}</td>
                      <td className="p-3.5 sm:px-5 font-mono text-[#7A756E]">{item.questions_correct} / {item.questions_total}</td>
                      <td className="p-3.5 sm:px-5 font-mono font-bold text-[#292B2B]">{item.accuracy_percent ?? item.current_score}%</td>
                      <td className="p-3.5 sm:px-5 font-mono text-[#7A756E]">{item.target_score}%</td>
                      <td className="p-3.5 sm:px-5 text-right">
                        <span className={cn(
                          "inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border uppercase",
                          isStrong 
                            ? "bg-[#2E8B57]/10 text-[#2E8B57] border-[#2E8B57]/30"
                            : isCritical
                            ? "bg-[#B38A3D]/15 text-[#292B2B] border-[#B38A3D]/35"
                            : "bg-[#A85D4C]/10 text-[#A85D4C] border-[#A85D4C]/20"
                        )}>
                          {item.status?.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. Question-by-Question Response Review Arena */}
      <div className="space-y-4 pt-4 border-t border-[#E2DDD5]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#292B2B] flex items-center gap-2">
              <BookOpen className="w-4.5 h-4.5 text-[#A85D4C]" />
              <span>Question-by-Question Response Review</span>
            </h3>
            <p className="text-xs text-[#7A756E]">
              Detailed breakdown of your submitted answers, verified solutions, and official explanations.
            </p>
          </div>

          {/* Response Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-[#EFEBE4] p-1 rounded-xl border border-[#E2DDD5] self-start sm:self-auto font-mono text-xs">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={cn(
                "px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer",
                filterType === 'all'
                  ? "bg-[#2D3030] text-[#FFFDF9] shadow-xs"
                  : "text-[#7A756E] hover:text-[#2D3030]"
              )}
            >
              All ({responses.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('correct')}
              className={cn(
                "px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer",
                filterType === 'correct'
                  ? "bg-[#2E8B57] text-[#FFFDF9] shadow-xs"
                  : "text-[#7A756E] hover:text-[#2E8B57]"
              )}
            >
              Correct ({totalCorrect})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('incorrect')}
              className={cn(
                "px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer",
                filterType === 'incorrect'
                  ? "bg-[#A85D4C] text-[#FFFDF9] shadow-xs"
                  : "text-[#7A756E] hover:text-[#A85D4C]"
              )}
            >
              Incorrect ({totalIncorrect})
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredResponses.length === 0 ? (
            <div className="p-8 text-center bg-[#FFFDF9] rounded-2xl border border-[#E2DDD5] space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#2E8B57] mx-auto" />
              <p className="text-sm font-semibold text-[#292B2B]">No questions match the selected filter.</p>
            </div>
          ) : (
            filteredResponses.map((item) => {
              const diffBadge = getDifficultyBadge(item.difficulty);
              const confLabel = getConfidenceLabel(item.confidence_level);

              return (
                <Card 
                  key={item.question_id || item.question_number} 
                  className={cn(
                    "bg-[#FFFDF9] rounded-2xl border transition-all shadow-xs",
                    item.is_correct ? "border-[#2E8B57]/30" : "border-[#A85D4C]/40"
                  )}
                >
                  <CardHeader className="p-5 pb-3 border-b border-[#E2DDD5]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-[#2D3030] text-[#FFFDF9] px-2.5 py-0.5 rounded-md">
                          Question {item.question_number}
                        </span>
                        <span className="text-xs font-mono font-semibold bg-[#EFEBE4] text-[#A85D4C] px-2.5 py-0.5 rounded-md border border-[#E2DDD5]">
                          {getTypeLabel(item.question_type)}
                        </span>
                        {item.competency_name && (
                          <span className="text-xs font-medium text-[#7A756E] bg-[#EFEBE4] px-2.5 py-0.5 rounded-md border border-[#E2DDD5]">
                            {item.competency_name}
                          </span>
                        )}
                        <span className={cn("text-xs font-mono font-semibold px-2 py-0.5 rounded-md border", diffBadge.color)}>
                          {diffBadge.label}
                        </span>
                      </div>

                      {/* Correct / Incorrect Status Badge */}
                      <div>
                        {item.is_correct ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#2E8B57]/10 text-[#2E8B57] border border-[#2E8B57]/30">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Correct</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#A85D4C]/10 text-[#A85D4C] border border-[#A85D4C]/30">
                            <X className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Incorrect</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 sm:p-6 space-y-5">
                    {/* Question Text */}
                    <div className="space-y-1">
                      <p className="text-sm sm:text-base font-bold text-[#292B2B] leading-relaxed whitespace-pre-line">
                        {item.question_text}
                      </p>
                    </div>

                    {/* Options Breakdown */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#7A756E] tracking-wider block">
                        Options & Selected Response
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {item.options.map((opt) => {
                          const isLearnerPick = item.learner_selected_option_id === opt.id;
                          const isCorrectPick = opt.is_correct;

                          let optionStyle = "border-[#E2DDD5] bg-[#FFFDF9] text-[#292B2B]";
                          if (isCorrectPick) {
                            optionStyle = "border-[#2E8B57] bg-[#2E8B57]/10 text-[#292B2B] ring-1 ring-[#2E8B57]/30";
                          } else if (isLearnerPick && !isCorrectPick) {
                            optionStyle = "border-[#A85D4C] bg-[#A85D4C]/10 text-[#292B2B] ring-1 ring-[#A85D4C]/30";
                          }

                          return (
                            <div
                              key={opt.id}
                              className={cn(
                                "p-3.5 rounded-xl border text-xs sm:text-sm flex items-start justify-between gap-3 transition-all",
                                optionStyle
                              )}
                            >
                              <div className="flex items-start gap-2.5">
                                <span className="font-mono font-bold text-[#7A756E] shrink-0 mt-0.5">
                                  {String.fromCharCode(65 + opt.order - 1)}.
                                </span>
                                <span className="font-medium leading-normal">{opt.text}</span>
                              </div>

                              <div className="shrink-0 flex items-center gap-1.5 font-mono text-[11px] font-bold">
                                {isLearnerPick && isCorrectPick && (
                                  <span className="px-2 py-0.5 rounded bg-[#2E8B57] text-[#FFFDF9]">
                                    Your Answer (Correct)
                                  </span>
                                )}
                                {isLearnerPick && !isCorrectPick && (
                                  <span className="px-2 py-0.5 rounded bg-[#A85D4C] text-[#FFFDF9]">
                                    Your Answer
                                  </span>
                                )}
                                {!isLearnerPick && isCorrectPick && (
                                  <span className="px-2 py-0.5 rounded bg-[#2E8B57]/20 text-[#2E8B57] border border-[#2E8B57]/30">
                                    Correct Answer
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Official Explanation Box */}
                    {item.explanation && (
                      <div className="p-4 rounded-xl bg-[#EFEBE4]/80 border border-[#E2DDD5] text-xs space-y-1.5">
                        <span className="font-mono uppercase font-bold text-[#A85D4C] text-[10px] tracking-wider block">
                          Official Diagnostic Rationale & Explanation
                        </span>
                        <p className="text-[#292B2B] leading-relaxed">
                          {item.explanation}
                        </p>
                      </div>
                    )}

                    {/* Telemetry Footer */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-[#7A756E] border-t border-[#E2DDD5]/60">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#7A756E]" />
                          <span className={confLabel.color}>{confLabel.label}</span>
                        </span>
                        {item.time_taken_seconds && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#7A756E]" />
                            <span>{item.time_taken_seconds}s response time</span>
                          </span>
                        )}
                      </div>
                      {item.topic_name && (
                        <span>Topic: {item.topic_name}</span>
                      )}
                    </div>

                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* 9. Action Navigation Row */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E2DDD5]">
        <Link to="/assessment" className="w-full sm:w-auto">
          <Button 
            size="default" 
            className="w-full sm:w-auto font-semibold text-sm bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9] shadow-xs px-6 h-11 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake / Configure New Assessment</span>
          </Button>
        </Link>

        {/* Only show Capability Landscape for official competency-based assessments, not material quizzes */}
        {result.assessment_type !== 'material_quiz' && result.type !== 'material_quiz' && (location.state?.assessmentType !== 'material_quiz') ? (
          <Link to="/competencies" className="w-full sm:w-auto">
            <Button 
              size="default" 
              className="w-full sm:w-auto font-semibold text-sm bg-[#2D3030] hover:bg-[#1A1C1C] text-[#FFFDF9] shadow-xs px-6 h-11 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>View Capability Landscape</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        ) : result.source_material_id ? (
          <Link to={`/materials/${result.source_material_id}`} className="w-full sm:w-auto">
            <Button 
              size="default" 
              className="w-full sm:w-auto font-semibold text-sm bg-[#2D3030] hover:bg-[#1A1C1C] text-[#FFFDF9] shadow-xs px-6 h-11 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Back to Material Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        ) : (
          <Link to="/materials" className="w-full sm:w-auto">
            <Button 
              size="default" 
              className="w-full sm:w-auto font-semibold text-sm bg-[#2D3030] hover:bg-[#1A1C1C] text-[#FFFDF9] shadow-xs px-6 h-11 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Back to Materials</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        )}
      </div>

    </div>
  );
}
