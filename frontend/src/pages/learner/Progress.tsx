import React, { useState, useEffect } from 'react';
import { competencyApi, assessmentApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ImprovementChart from '@/components/progress/ImprovementChart';
import CompetencyDelta from '@/components/progress/CompetencyDelta';
import { TrendingUp, Sparkles, Award, CheckCircle2, History, AlertTriangle, Layers, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Progress() {
  const [loading, setLoading] = useState<boolean>(true);
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);
        const [compRes, histRes, insightRes] = await Promise.all([
          competencyApi.getMyCompetencies(),
          competencyApi.getMyHistory(),
          competencyApi.getMyInsights()
        ]);
        setCompetencies(compRes.data || []);
        setHistoryList(histRes.data || []);
        setInsights(insightRes.data || null);
      } catch (err) {
        console.error('Failed to load progress telemetry:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProgressData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 border-3 border-[#176B87] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#123B5D]">Aggregating longitudinal capability telemetry...</p>
        </div>
      </div>
    );
  }

  // Build history series per competency
  const historyByComp: Record<number, { date: string; score: number }[]> = {};
  const reversedHist = [...historyList].reverse();
  reversedHist.forEach(h => {
    if (!historyByComp[h.competency_id]) {
      historyByComp[h.competency_id] = [];
    }
    const dStr = h.assessed_at ? new Date(h.assessed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent';
    historyByComp[h.competency_id].push({
      date: dStr,
      score: h.score
    });
  });

  const overallReadiness = insights?.overall_readiness ?? 0.0;
  const totalGrowth = insights?.total_improvement_points ?? 0.0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-left">
      <div>
        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#176B87] uppercase tracking-widest mb-1">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>LONGITUDINAL CONTINUOUS EVALUATION</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#123047] tracking-tight leading-tight">
          Competency Progression Over Time
        </h1>
        <p className="text-sm text-[#5D7180] mt-1.5 leading-relaxed">
          Verified capability growth trajectories tracked across baseline diagnostics, adaptive learning modules, and reassessments.
        </p>
      </div>

      {/* Hero Achievement Summary Banner */}
      <div className="bg-[#123B5D] rounded-2xl p-6 sm:p-8 text-[#FFFFFF] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-md border border-[#123B5D] relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFFFFF]/10 text-[#FFFFFF] border border-[#FFFFFF]/20">
            <Award className="w-3.5 h-3.5 text-[#D49A2A]" />
            <span>Continuous Evidence Pipeline Active</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#FFFFFF] leading-tight">
            Overall Role Readiness: {overallReadiness}%
          </h2>
          <p className="text-sm text-[#FFFFFF]/80 max-w-xl leading-relaxed">
            {insights?.diagnostic_summary || 'Continuous evaluation tracks capability gains without relying on unverified self-ratings.'}
          </p>
        </div>
        
        <div className="text-left sm:text-right bg-[#FFFFFF]/10 p-4 sm:p-5 rounded-2xl border border-[#FFFFFF]/20 z-10 shrink-0">
          <span className="text-[11px] font-mono font-bold text-[#FFFFFF]/70 uppercase tracking-wider block">
            Net Capacity Gained
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold text-[#FFFFFF] mt-0.5 font-mono">
            {totalGrowth > 0 ? `+${totalGrowth} pts` : `${totalGrowth} pts`}
          </div>
          <span className="text-[11px] font-mono text-[#D49A2A] block mt-0.5">
            {insights?.total_assessments_taken ?? 0} Assessments Completed
          </span>
        </div>
      </div>

      {/* Skill Trajectory Cards */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-[#123047] flex items-center gap-2">
            <Layers className="w-4.5 h-4.5 text-[#176B87]" />
            Skill Trajectory Curves by Competency
          </h2>
          <span className="text-xs font-mono text-[#5D7180] font-semibold">
            {competencies.length} Competencies Monitored
          </span>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-6">
          {competencies.map((comp) => {
            const isAssessed = comp.current_score !== null;
            const currentVal = comp.current_score ?? 0;
            const targetVal = comp.target_score;
            const isTargetMet = isAssessed && currentVal >= targetVal;
            const changePoints = comp.change_points ?? 0;
            const chartData = historyByComp[comp.competency_id] && historyByComp[comp.competency_id].length > 0
              ? historyByComp[comp.competency_id]
              : [{ date: 'Initial', score: currentVal }];

            return (
              <Card key={comp.competency_id} className="overflow-hidden bg-[#FFFFFF] shadow-[0_1px_3px_rgba(11,37,69,0.04)] border border-[#D8E5EC] rounded-2xl flex flex-col justify-between">
                <CardHeader className="bg-[#EAF3F7] border-b border-[#D8E5EC] p-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#176B87]">
                        {comp.domain || 'Statistical'} // {comp.trend?.toUpperCase() || 'UNASSESSED'}
                      </span>
                      <CardTitle className="text-base sm:text-lg font-bold text-[#123047] mt-1">
                        {comp.competency_name}
                      </CardTitle>
                    </div>
                    {isTargetMet ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#2E8B57]/10 text-[#2E8B57] border border-[#2E8B57]/30">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Target Met
                      </span>
                    ) : isAssessed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#D49A2A]/15 text-[#123047] border border-[#D49A2A]/35">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#D49A2A]" /> Gap: -{comp.gap}%
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#EAF3F7] text-[#5D7180] border border-[#D8E5EC]">
                        Not Assessed
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-5 sm:p-6 space-y-4">
                  {/* Delta Component */}
                  {isAssessed && comp.previous_score !== null ? (
                    <CompetencyDelta 
                      start={comp.previous_score} 
                      current={currentVal} 
                      delta={changePoints} 
                    />
                  ) : isAssessed ? (
                    <div className="flex items-center justify-between p-3.5 bg-[#EAF3F7] rounded-xl border border-[#D8E5EC] text-xs">
                      <span className="font-mono text-[#5D7180] font-semibold">Baseline Verified Score</span>
                      <span className="font-mono font-bold text-base text-[#123047]">{currentVal}%</span>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-[#EAF3F7] rounded-xl border border-[#D8E5EC] text-xs text-[#5D7180]">
                      Pending baseline assessment to establish initial evidence score.
                    </div>
                  )}

                  {/* Longitudinal Chart */}
                  {chartData.length > 1 ? (
                    <div className="h-44 w-full pt-1">
                      <ImprovementChart data={chartData} target={targetVal} />
                    </div>
                  ) : null}

                  {/* Subtopics Granular Breakdown */}
                  {comp.subtopics && comp.subtopics.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-[#D8E5EC]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#123047] uppercase tracking-wider">
                          Subtopic Evidence
                        </span>
                        {comp.weakest_subtopic && (
                          <span className="text-xs font-mono text-[#D49A2A] font-bold">
                            Weakest: {comp.weakest_subtopic}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {comp.subtopics.map((st: any) => (
                          <div key={st.topic_id} className="p-2.5 rounded-xl bg-[#EAF3F7] border border-[#D8E5EC] text-xs flex items-center justify-between">
                            <span className="truncate max-w-[140px] text-[#123047] font-medium" title={st.topic_name}>
                              {st.topic_name}
                            </span>
                            <span className={cn(
                              "font-mono font-bold text-[11px] px-1.5 py-0.5 rounded",
                              st.score === null 
                                ? "text-[#5D7180]/60"
                                : st.score >= 80 
                                ? "bg-[#2E8B57]/10 text-[#2E8B57]" 
                                : "bg-[#D49A2A]/15 text-[#123047]"
                            )}>
                              {st.score !== null ? `${st.score}%` : 'Pending'}
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
    </div>
  );
}
