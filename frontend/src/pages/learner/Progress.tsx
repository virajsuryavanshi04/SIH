import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { progressApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ImprovementChart from '@/components/progress/ImprovementChart';
import CompetencyDelta from '@/components/progress/CompetencyDelta';
import { 
  TrendingUp, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  History, 
  AlertTriangle, 
  Layers, 
  ArrowUpRight, 
  Activity, 
  Clock, 
  Gauge, 
  Target, 
  BookOpen, 
  FileText, 
  Flame,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Progress() {
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [overview, setOverview] = useState<any>(null);
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'trajectories' | 'telemetry' | 'timeline'>('trajectories');

  const fetchProgressData = useCallback(async () => {
    try {
      const [ovRes, compRes, anaRes, timeRes] = await Promise.allSettled([
        progressApi.getOverview(),
        progressApi.getCompetencies(),
        progressApi.getAnalytics(),
        progressApi.getTimeline(20)
      ]);
      
      if (ovRes.status === 'fulfilled' && ovRes.value?.data) {
        setOverview(ovRes.value.data);
      }
      if (compRes.status === 'fulfilled' && compRes.value?.data) {
        setCompetencies(compRes.value.data);
      }
      if (anaRes.status === 'fulfilled' && anaRes.value?.data) {
        setAnalytics(anaRes.value.data);
      }
      if (timeRes.status === 'fulfilled' && timeRes.value?.data) {
        setTimeline(timeRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load progress intelligence:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgressData();
    const handleFocus = () => {
      fetchProgressData();
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchProgressData, location.key]);

  if (loading && !overview) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 border-3 border-[#A85D4C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#2D3030]">Aggregating longitudinal capability telemetry...</p>
        </div>
      </div>
    );
  }

  const roleName = overview?.role_name || user?.role_name || user?.designation || 'Statistical Officer';
  const overallReadiness = overview?.overall_readiness ?? 0.0;
  const hasAssessed = (overview?.assessed_competencies_count ?? 0) > 0;
  const totalGrowth = overview?.total_improvement_points ?? 0.0;
  const benchmarksMet = overview?.benchmarks_met ?? 0;
  const totalCompetencies = overview?.total_competencies ?? (competencies.length || 1);
  const milestones = overview?.milestones_completed || { courses: 0, learning_path_items: 0, material_quizzes: 0, reassessments: 0 };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-left">
      <div>
        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#A85D4C] uppercase tracking-widest mb-1">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>PHASE 5F • LEARNER PROGRESS INTELLIGENCE & ANALYTICS</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#292B2B] tracking-tight leading-tight">
          Learning Analytics & Progression
        </h1>
        <p className="text-sm text-[#7A756E] mt-1.5 leading-relaxed">
          Evidence-based capability trajectories, difficulty calibrations, and verified learning milestone timelines.
        </p>
      </div>

      {/* Hero Achievement Summary Banner */}
      <div className="bg-[#2D3030] rounded-2xl p-6 sm:p-8 text-[#FFFDF9] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-md border border-[#2D3030] relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFFDF9]/10 text-[#FFFDF9] border border-[#FFFDF9]/20">
            <Award className="w-3.5 h-3.5 text-[#B38A3D]" />
            <span>Target Role: {roleName}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#FFFDF9] leading-tight">
            Role Readiness: {hasAssessed ? `${overallReadiness}%` : '0% (Awaiting Baseline)'}
          </h2>
          <p className="text-sm text-[#FFFDF9]/80 max-w-xl leading-relaxed">
            Continuous evaluation across diagnostic assessments, adaptive modules, and closed-loop reassessments.
          </p>
          <div className="flex flex-wrap gap-4 pt-2 text-xs font-mono text-[#FFFDF9]/90">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#2E8B57]" />
              <strong>{benchmarksMet} of {totalCompetencies}</strong> Benchmarks Met
            </span>
            <span className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-[#B38A3D]" />
              <strong>{overview?.critical_gaps_count ?? 0}</strong> Critical Gaps Remaining
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 w-full lg:w-auto shrink-0 z-10">
          <div className="bg-[#FFFDF9]/10 p-4 rounded-xl border border-[#FFFDF9]/20 text-center">
            <span className="text-[10px] font-mono font-bold text-[#FFFDF9]/70 uppercase tracking-wider block">
              Net Points Gained
            </span>
            <div className="text-2xl font-extrabold text-[#FFFDF9] mt-0.5 font-mono">
              {overview?.has_baseline_history ? (
                totalGrowth > 0 ? `+${totalGrowth} pts` : `${totalGrowth} pts`
              ) : (
                "—"
              )}
            </div>
            <span className="text-[9px] font-mono text-[#FFFDF9]/60 block mt-0.5">
              {overview?.has_baseline_history ? "Cumulative delta" : "No baseline yet"}
            </span>
          </div>
          <div className="bg-[#FFFDF9]/10 p-4 rounded-xl border border-[#FFFDF9]/20 text-center">
            <span className="text-[10px] font-mono font-bold text-[#FFFDF9]/70 uppercase tracking-wider block">
              Reassessments
            </span>
            <div className="text-2xl font-extrabold text-[#B38A3D] mt-0.5 font-mono">
              {milestones.reassessments} Done
            </div>
          </div>
          <div className="bg-[#FFFDF9]/10 p-4 rounded-xl border border-[#FFFDF9]/20 text-center">
            <span className="text-[10px] font-mono font-bold text-[#FFFDF9]/70 uppercase tracking-wider block">
              Courses Mastered
            </span>
            <div className="text-xl font-extrabold text-[#FFFDF9] mt-0.5 font-mono">
              {milestones.courses} Completed
            </div>
          </div>
          <div className="bg-[#FFFDF9]/10 p-4 rounded-xl border border-[#FFFDF9]/20 text-center">
            <span className="text-[10px] font-mono font-bold text-[#FFFDF9]/70 uppercase tracking-wider block">
              Material Quizzes
            </span>
            <div className="text-xl font-extrabold text-[#FFFDF9] mt-0.5 font-mono">
              {milestones.material_quizzes} Completed
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2DDD5] pb-2">
        <button
          onClick={() => setActiveTab('trajectories')}
          className={cn(
            "px-4 py-2 text-xs font-mono font-bold rounded-xl transition-all flex items-center gap-2",
            activeTab === 'trajectories'
              ? "bg-[#2D3030] text-[#FFFDF9] shadow-sm"
              : "bg-[#EFEBE4] text-[#292B2B] hover:bg-[#E2DDD5]"
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          Competency Trajectories ({competencies.length})
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={cn(
            "px-4 py-2 text-xs font-mono font-bold rounded-xl transition-all flex items-center gap-2",
            activeTab === 'telemetry'
              ? "bg-[#2D3030] text-[#FFFDF9] shadow-sm"
              : "bg-[#EFEBE4] text-[#292B2B] hover:bg-[#E2DDD5]"
          )}
        >
          <Gauge className="w-3.5 h-3.5" />
          Calibration & Fluency
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={cn(
            "px-4 py-2 text-xs font-mono font-bold rounded-xl transition-all flex items-center gap-2",
            activeTab === 'timeline'
              ? "bg-[#2D3030] text-[#FFFDF9] shadow-sm"
              : "bg-[#EFEBE4] text-[#292B2B] hover:bg-[#E2DDD5]"
          )}
        >
          <History className="w-3.5 h-3.5" />
          Activity Timeline ({timeline.length})
        </button>
      </div>

      {/* TAB 1: Competency Trajectories */}
      {activeTab === 'trajectories' && (
        competencies.length === 0 ? (
          <Card className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-2xl shadow-sm">
            <CardContent className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EFEBE4] border border-[#E2DDD5] flex items-center justify-center mx-auto text-[#A85D4C]">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#292B2B]">No Competency Profile Found</h3>
              <p className="text-xs text-[#7A756E] max-w-md mx-auto leading-relaxed">
                Complete role onboarding to initialize your official cadre competency targets.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {competencies.map((comp) => {
                const isAssessed = comp.current_score !== null;
                const currentVal = comp.current_score ?? 0;
                const targetVal = comp.target_score;
                const isTargetMet = isAssessed && currentVal >= targetVal;
                const changePoints = comp.change_points ?? 0;
                const chartData = comp.history_points && comp.history_points.length > 0
                  ? comp.history_points.map((hp: any) => ({
                      date: hp.date ? new Date(hp.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent',
                      score: hp.score
                    }))
                  : [{ date: 'Initial', score: currentVal }];

                return (
                  <Card key={comp.competency_id} className="overflow-hidden bg-[#FFFDF9] shadow-[0_1px_3px_rgba(45, 48, 48, 0.04)] border border-[#E2DDD5] rounded-2xl flex flex-col justify-between">
                    <CardHeader className="bg-[#EFEBE4] border-b border-[#E2DDD5] p-5">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#A85D4C]">
                            {comp.domain || 'Statistical'} • {comp.trend?.toUpperCase() || 'UNASSESSED'}
                          </span>
                          <CardTitle className="text-base sm:text-lg font-bold text-[#292B2B] mt-1">
                            {comp.competency_name}
                          </CardTitle>
                        </div>
                        {isTargetMet ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#2E8B57]/10 text-[#2E8B57] border border-[#2E8B57]/30">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Target Met
                          </span>
                        ) : isAssessed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#B38A3D]/15 text-[#292B2B] border border-[#B38A3D]/35">
                            <AlertTriangle className="w-3.5 h-3.5 text-[#B38A3D]" /> Gap: -{comp.gap}%
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#EFEBE4] text-[#7A756E] border border-[#E2DDD5]">
                            Not Assessed
                          </span>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 sm:p-6 space-y-4">
                      {isAssessed && comp.previous_score !== null ? (
                        <CompetencyDelta 
                          start={comp.previous_score} 
                          current={currentVal} 
                          delta={changePoints} 
                        />
                      ) : isAssessed ? (
                        <div className="flex items-center justify-between p-3.5 bg-[#EFEBE4] rounded-xl border border-[#E2DDD5] text-xs">
                          <span className="font-mono text-[#7A756E] font-semibold">Baseline Verified Score</span>
                          <span className="font-mono font-bold text-base text-[#292B2B]">{currentVal}%</span>
                        </div>
                      ) : (
                        <div className="p-3.5 bg-[#EFEBE4] rounded-xl border border-[#E2DDD5] text-xs text-[#7A756E]">
                          Pending diagnostic evaluation.
                        </div>
                      )}

                      {chartData.length > 1 ? (
                        <div className="h-44 w-full pt-1">
                          <ImprovementChart data={chartData} target={targetVal} />
                        </div>
                      ) : null}

                      {comp.subtopics && comp.subtopics.length > 0 && (
                        <div className="space-y-2 pt-3 border-t border-[#E2DDD5]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-[#292B2B] uppercase tracking-wider">
                              Subtopic Mastery Breakdown
                            </span>
                            {comp.weakest_subtopic && (
                              <span className="text-xs font-mono text-[#B38A3D] font-bold">
                                Weakest: {comp.weakest_subtopic}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {comp.subtopics.map((st: any) => (
                              <div key={st.topic_id} className="p-2.5 rounded-xl bg-[#EFEBE4] border border-[#E2DDD5] text-xs flex items-center justify-between">
                                <span className="truncate max-w-[130px] text-[#292B2B] font-medium" title={st.topic_name}>
                                  {st.topic_name}
                                </span>
                                <span className={cn(
                                  "font-mono font-bold text-[11px] px-1.5 py-0.5 rounded",
                                  st.score === null 
                                    ? "text-[#7A756E]/60"
                                    : st.score >= 80 
                                    ? "bg-[#2E8B57]/10 text-[#2E8B57]" 
                                    : "bg-[#B38A3D]/15 text-[#292B2B]"
                                )}>
                                  {st.score !== null ? `${st.score}%` : 'Untested'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* TAB 2: Calibration & Fluency */}
      {activeTab === 'telemetry' && (
        (() => {
          const totalAnswered = (analytics?.difficulty_breakdown?.level_1?.total ?? 0) +
            (analytics?.difficulty_breakdown?.level_2?.total ?? 0) +
            (analytics?.difficulty_breakdown?.level_3?.total ?? 0);

          if (totalAnswered === 0) {
            return (
              <Card className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-2xl shadow-sm">
                <CardContent className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#EFEBE4] border border-[#E2DDD5] flex items-center justify-center mx-auto text-[#A85D4C]">
                    <Gauge className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-[#292B2B]">Insufficient Assessment History</h3>
                  <p className="text-xs text-[#7A756E] max-w-md mx-auto leading-relaxed">
                    Complete an adaptive diagnostic assessment to generate cognitive difficulty calibrations, metacognition matrix, and pacing telemetry.
                  </p>
                </CardContent>
              </Card>
            );
          }

          return (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Difficulty Breakdown */}
              <Card className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-2xl shadow-sm">
                <CardHeader className="bg-[#EFEBE4] border-b border-[#E2DDD5] p-5">
                  <CardTitle className="text-base font-bold text-[#292B2B] flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-[#A85D4C]" />
                    Accuracy by Question Difficulty
                  </CardTitle>
                  <CardDescription className="text-xs text-[#7A756E]">
                    Response accuracy distributed across cognitive complexity levels.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 sm:p-6 space-y-4">
                  {[
                    { label: 'Level 1 (Easy)', data: analytics?.difficulty_breakdown?.level_1 },
                    { label: 'Level 2 (Medium)', data: analytics?.difficulty_breakdown?.level_2 },
                    { label: 'Level 3 (Hard)', data: analytics?.difficulty_breakdown?.level_3 },
                  ].map((lvl, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="font-semibold text-[#292B2B]">{lvl.label}</span>
                        <span className="text-[#7A756E]">
                          {lvl.data?.correct ?? 0} / {lvl.data?.total ?? 0} ({lvl.data?.accuracy ?? 0}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#E2DDD5] h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#2D3030] h-full rounded-full transition-all"
                          style={{ width: `${lvl.data?.accuracy ?? 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Confidence Calibration */}
              <Card className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-2xl shadow-sm">
                <CardHeader className="bg-[#EFEBE4] border-b border-[#E2DDD5] p-5">
                  <CardTitle className="text-base font-bold text-[#292B2B] flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#A85D4C]" />
                    Confidence Calibration Matrix
                  </CardTitle>
                  <CardDescription className="text-xs text-[#7A756E]">
                    Identifies verified mastery vs overconfidence blind spots.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 sm:p-6 grid grid-cols-2 gap-3 text-center">
                  <div className="p-4 rounded-xl bg-[#2E8B57]/10 border border-[#2E8B57]/20">
                    <span className="text-[10px] font-mono font-bold text-[#2E8B57] uppercase tracking-wider block">
                      High Conf • Correct
                    </span>
                    <div className="text-2xl font-bold font-mono text-[#2E8B57] mt-1">
                      {analytics?.confidence_calibration?.high_confidence_correct ?? 0}
                    </div>
                    <span className="text-[10px] text-[#292B2B]/70 block mt-0.5">Verified Mastery</span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#A85D4C]/10 border border-[#A85D4C]/20">
                    <span className="text-[10px] font-mono font-bold text-[#A85D4C] uppercase tracking-wider block">
                      High Conf • Incorrect
                    </span>
                    <div className="text-2xl font-bold font-mono text-[#A85D4C] mt-1">
                      {analytics?.confidence_calibration?.high_confidence_incorrect ?? 0}
                    </div>
                    <span className="text-[10px] text-[#292B2B]/70 block mt-0.5">Misconceptions</span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#B38A3D]/10 border border-[#B38A3D]/20">
                    <span className="text-[10px] font-mono font-bold text-[#B38A3D] uppercase tracking-wider block">
                      Low Conf • Correct
                    </span>
                    <div className="text-2xl font-bold font-mono text-[#B38A3D] mt-1">
                      {analytics?.confidence_calibration?.low_confidence_correct ?? 0}
                    </div>
                    <span className="text-[10px] text-[#292B2B]/70 block mt-0.5">Lucky Guesses</span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#EFEBE4] border border-[#E2DDD5]">
                    <span className="text-[10px] font-mono font-bold text-[#7A756E] uppercase tracking-wider block">
                      Low Conf • Incorrect
                    </span>
                    <div className="text-2xl font-bold font-mono text-[#292B2B] mt-1">
                      {analytics?.confidence_calibration?.low_confidence_incorrect ?? 0}
                    </div>
                    <span className="text-[10px] text-[#7A756E] block mt-0.5">Known Gaps</span>
                  </div>
                </CardContent>
              </Card>

              {/* Fluency / Speed Stats */}
              <Card className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-2xl shadow-sm md:col-span-2">
                <CardHeader className="bg-[#EFEBE4] border-b border-[#E2DDD5] p-5">
                  <CardTitle className="text-base font-bold text-[#292B2B] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#A85D4C]" />
                    Cognitive Pacing & Fluency
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#7A756E] uppercase">Average Answer Speed</span>
                    <div className="text-3xl font-extrabold font-mono text-[#292B2B] mt-0.5">
                      {analytics?.average_response_time_seconds ?? 0.0}s <span className="text-xs font-normal text-[#7A756E]">/ question</span>
                    </div>
                    <p className="text-xs text-[#7A756E] mt-1">
                      Derived from actual item-level timer telemetry.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {Object.entries(analytics?.assessments_completed_by_type || {}).map(([type, count]) => (
                      <div key={type} className="p-3 bg-[#EFEBE4] rounded-xl border border-[#E2DDD5] text-xs font-mono text-center">
                        <span className="text-[#7A756E] capitalize block">{type.replace('_', ' ')}</span>
                        <strong className="text-base text-[#292B2B]">{count as number} sessions</strong>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })()
      )}

      {/* TAB 3: Activity Timeline */}
      {activeTab === 'timeline' && (
        <Card className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-2xl shadow-sm">
          <CardHeader className="bg-[#EFEBE4] border-b border-[#E2DDD5] p-5">
            <CardTitle className="text-base font-bold text-[#292B2B] flex items-center gap-2">
              <History className="w-4 h-4 text-[#A85D4C]" />
              Verified Event Timeline
            </CardTitle>
            <CardDescription className="text-xs text-[#7A756E]">
              Chronological ledger of completed evaluations, courses, and learning milestones.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 space-y-4">
            {timeline.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#7A756E] font-mono">
                No activity records logged yet. Complete a diagnostic or course to begin recording telemetry.
              </div>
            ) : (
              <div className="space-y-3">
                {timeline.map((event: any) => (
                  <div key={event.id} className="p-3.5 rounded-xl bg-[#EFEBE4] border border-[#E2DDD5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-[#2D3030] text-[#FFFDF9] mt-0.5">
                        {event.event_type === 'course' ? <BookOpen className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="font-bold text-[#292B2B] text-sm">{event.title}</div>
                        <p className="text-[#7A756E] mt-0.5">{event.description}</p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0 font-mono text-[11px] text-[#7A756E]">
                      {event.score !== null && (
                        <span className="font-bold text-sm text-[#292B2B] block">
                          Score: {event.score}%
                        </span>
                      )}
                      <span>{new Date(event.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
