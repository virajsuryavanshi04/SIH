import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2, TrendingUp, Clock, BookOpen, Route, Award, Play, AlertCircle, AlertTriangle } from 'lucide-react';
import RadialCapabilityOverview, { RadialCompetencyNode } from '@/components/dashboard/RadialCapabilityOverview';
import { CompetencyScorecardItem } from '@/components/dashboard/CompetencyScorecard';
import DashboardPriorityGap from '@/components/dashboard/DashboardPriorityGap';
import AIDiagnosticCard from '@/components/dashboard/AIDiagnosticCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { competencyApi, courseApi, learningPathApi, recommendationApi } from '@/lib/api';

export default function Dashboard() {
  const [loading, setLoading] = useState<boolean>(true);
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [learningPath, setLearningPath] = useState<any>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [nextAction, setNextAction] = useState<any>(null);
  
  const [scorecardItems, setScorecardItems] = useState<CompetencyScorecardItem[]>([]);
  const [selectedScorecardItem, setSelectedScorecardItem] = useState<CompetencyScorecardItem | null>(null);
  const [radialNodes, setRadialNodes] = useState<RadialCompetencyNode[]>([]);
  const [selectedRadialNode, setSelectedRadialNode] = useState<RadialCompetencyNode | null>(null);

  const priorityGapRef = useRef<HTMLDivElement>(null);
  const [isPriorityGapHighlighted, setIsPriorityGapHighlighted] = useState<boolean>(false);

  useEffect(() => {
    const fetchDashboardTelemetry = async () => {
      try {
        setLoading(true);
        const [compRes, insightRes, diagRes, recRes, pathRes, histRes, nextActionRes] = await Promise.allSettled([
          competencyApi.getMyCompetencies(),
          competencyApi.getMyInsights(),
          competencyApi.getMyDiagnosis(),
          courseApi.getRecommended(),
          learningPathApi.get(),
          competencyApi.getMyHistory(),
          recommendationApi.getNextAction(),
        ]);

        const rawComps = compRes.status === 'fulfilled' ? compRes.value.data || [] : [];
        const rawInsights = insightRes.status === 'fulfilled' ? insightRes.value.data || null : null;
        const rawDiag = diagRes.status === 'fulfilled' ? diagRes.value.data || null : null;
        const rawRecs = recRes.status === 'fulfilled' ? recRes.value.data || [] : [];
        const rawPath = pathRes.status === 'fulfilled' ? pathRes.value.data || null : null;
        const rawHist = histRes.status === 'fulfilled' ? histRes.value.data || [] : [];
        const rawNextAction = nextActionRes.status === 'fulfilled' ? nextActionRes.value.data || null : null;

        setCompetencies(rawComps);
        setInsights(rawInsights);
        setDiagnosis(rawDiag);
        setRecommendations(rawRecs);
        setLearningPath(rawPath);
        setHistoryList(rawHist);
        setNextAction(rawNextAction);

        // 1. Build Radial Competency Nodes
        const builtRadialNodes: RadialCompetencyNode[] = rawComps.map((c: any) => {
          const isAssessed = c.current_score !== null;
          const score = c.current_score ?? 0;
          const target = c.target_score ?? 70;
          const gap = c.gap ?? Math.max(0, target - score);
          const matchingRec = rawRecs.find((r: any) => r.competency_id === c.competency_id);

          let status: 'proficient' | 'on_track' | 'needs_attention' | 'critical' | 'not_assessed' = 'not_assessed';
          if (isAssessed) {
            if (score >= target) status = 'proficient';
            else if (gap <= 10) status = 'on_track';
            else if (gap <= 20) status = 'needs_attention';
            else status = 'critical';
          }

          return {
            id: c.competency_id,
            name: c.competency_name,
            domain: c.domain || 'Statistical Standard',
            score: c.current_score,
            required: target,
            gap: gap,
            status: status,
            weakestSubtopic: c.weakest_subtopic,
            aiConfidence: Math.round(rawDiag?.confidence || 88),
            recommendedCourse: {
              title: matchingRec?.title || `Curriculum Module for ${c.competency_name}`,
              duration: matchingRec?.duration_hours ? `${matchingRec.duration_hours}h` : '20 min',
              type: matchingRec?.resource_type ? matchingRec.resource_type.toUpperCase().replace('_', ' ') : 'iGOT Course'
            }
          };
        });

        // 2. Build Scorecard Items for Inspector Synchronization
        const builtScorecardItems: CompetencyScorecardItem[] = rawComps.map((c: any) => {
          const isAssessed = c.current_score !== null;
          const score = c.current_score ?? 0;
          const target = c.target_score ?? 70;
          const gap = c.gap ?? Math.max(0, target - score);
          const matchingRec = rawRecs.find((r: any) => r.competency_id === c.competency_id);

          let status: 'STRONG' | 'GOOD' | 'NEEDS_WORK' | 'CRITICAL' | 'PENDING' = 'PENDING';
          let gapText = 'Pending baseline evaluation';

          if (isAssessed) {
            if (score >= target) {
              status = 'STRONG';
              const pts = score - target;
              gapText = pts > 0 ? `+${pts} pts above target` : 'Target benchmark met';
            } else if (gap <= 10) {
              status = 'GOOD';
              gapText = `${gap} points below target`;
            } else if (gap <= 20) {
              status = 'NEEDS_WORK';
              gapText = `${gap} points below target`;
            } else {
              status = 'CRITICAL';
              gapText = `${gap} points below target`;
            }
          }

          return {
            id: c.competency_id,
            name: c.competency_name,
            domain: c.domain || 'Statistical Standard',
            current_score: c.current_score,
            target_score: target,
            gap: gap,
            weakest_subtopic: c.weakest_subtopic,
            status: status,
            gapText: gapText,
            recommendation: {
              title: matchingRec?.title || `Targeted Module for ${c.competency_name}`,
              duration: matchingRec?.duration_hours ? `${matchingRec.duration_hours}h` : '25 min',
              type: matchingRec?.resource_type ? matchingRec.resource_type.toUpperCase().replace('_', ' ') : 'iGOT Micro-Learning'
            }
          };
        });

        setRadialNodes(builtRadialNodes);
        setScorecardItems(builtScorecardItems);

        // Select the biggest gap node by default, or the first node
        if (builtRadialNodes.length > 0) {
          const bottleneck = builtRadialNodes.find(i => i.status === 'critical') 
            || builtRadialNodes.find(i => i.status === 'needs_attention')
            || builtRadialNodes[0];
          setSelectedRadialNode(bottleneck);

          const matchingScorecard = builtScorecardItems.find(s => s.id === bottleneck.id) || builtScorecardItems[0];
          setSelectedScorecardItem(matchingScorecard);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardTelemetry();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[450px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#A85D4C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#2D3030]">Loading live capability telemetry & recommendations...</p>
        </div>
      </div>
    );
  }

  const overallReadiness = insights?.overall_readiness ?? 0.0;
  const deltaPoints = insights?.total_improvement_points ?? 0.0;
  const assessmentsCount = insights?.total_assessments_taken ?? 0;
  const bottleneckGap = insights?.priority_bottleneck_gap;
  const topRecommendation = recommendations.length > 0 ? recommendations[0] : null;
  const pathItems = learningPath?.items || [];

  // Stepper milestones from live learning path or active recommendations
  const activeSequence = pathItems.length > 0
    ? pathItems.slice(0, 5)
    : recommendations.slice(0, 5).map((r: any, i: number) => ({
        title: r.title,
        status: i === 0 ? 'current' : 'recommended',
        order: i + 1,
        competency_name: r.competency_name,
        external_url: r.external_url
      }));

  const journeySteps = activeSequence.map((it: any, idx: number) => ({
    label: it.title,
    status: it.status || (idx === 0 ? 'current' : 'recommended'),
    number: it.status === 'completed' ? '✓' : String(it.order || idx + 1),
    external_url: it.external_url,
    competency_name: it.competency_name
  }));

  // Handler to inspect and focus primary gap
  const handleInspectPrimaryGap = () => {
    let targetItem: CompetencyScorecardItem | undefined;
    let targetNode: RadialCompetencyNode | undefined;

    if (bottleneckGap) {
      targetItem = scorecardItems.find(n => n.name === bottleneckGap.competency_name || n.id === bottleneckGap.competency_id);
      targetNode = radialNodes.find(n => n.name === bottleneckGap.competency_name || n.id === bottleneckGap.competency_id);
    } else if (diagnosis?.primary_gap) {
      targetItem = scorecardItems.find(n => n.name.toLowerCase() === diagnosis.primary_gap.toLowerCase());
      targetNode = radialNodes.find(n => n.name.toLowerCase() === diagnosis.primary_gap.toLowerCase());
    } else if (scorecardItems.length > 0) {
      const sorted = [...scorecardItems].sort((a, b) => (b.gap ?? 0) - (a.gap ?? 0));
      targetItem = sorted[0];
      targetNode = radialNodes.find(n => n.id === targetItem?.id);
    }

    if (targetItem) setSelectedScorecardItem(targetItem);
    if (targetNode) setSelectedRadialNode(targetNode);

    if (priorityGapRef.current) {
      priorityGapRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setIsPriorityGapHighlighted(true);
    setTimeout(() => {
      setIsPriorityGapHighlighted(false);
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-left">
      
      {/* If brand new user with 0 assessments, show prompt */}
      {assessmentsCount === 0 && (
        <div className="bg-[#2D3030] rounded-2xl p-6 text-[#FFFDF9] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md border border-[#2D3030]">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFFDF9]/10 text-[#B38A3D] border border-[#FFFDF9]/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Initial Setup Required</span>
            </div>
            <h3 className="text-xl font-bold text-[#FFFDF9]">Welcome to SmartLearn</h3>
            <p className="text-xs text-[#FFFDF9]/80 max-w-xl">
              Complete your initial baseline diagnostic to establish verified competency scores for your official role.
            </p>
          </div>
          <Link to="/assessment">
            <Button className="bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9] font-bold text-xs shadow-xs px-6">
              <span>Take Baseline Assessment</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. TOP HIGH-PRIORITY TRIAD (Readiness, Gap, Next Step)       */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* A. YOUR READINESS */}
        <div className="bg-[#FFFDF9] rounded-2xl p-6 border border-[#E2DDD5] shadow-[0_1px_3px_rgba(45, 48, 48, 0.04)] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#7A756E] block">
              YOUR READINESS
            </span>
            <div className="flex items-baseline gap-2.5">
              <span className="text-4xl sm:text-5xl font-extrabold text-[#292B2B] font-mono tracking-tight">{overallReadiness}%</span>
              {deltaPoints > 0 && (
                <span className="text-xs font-bold text-[#2E8B57] font-mono bg-[#2E8B57]/10 px-2.5 py-1 rounded-md border border-[#2E8B57]/20">
                  ↑ +{deltaPoints} pts
                </span>
              )}
            </div>
          </div>
          <div className="pt-3 border-t border-[#E2DDD5]/70">
            <p className="text-xs text-[#7A756E] leading-relaxed">
              {assessmentsCount > 0 
                ? `${assessmentsCount} verified assessment${assessmentsCount > 1 ? 's' : ''} recorded • Continuous evidence`
                : 'Pending initial assessment evaluation'}
            </p>
          </div>
        </div>

        {/* B. BIGGEST GAP */}
        <div className="bg-[#FFFDF9] rounded-2xl p-6 border border-[#E2DDD5] shadow-[0_1px_3px_rgba(45, 48, 48, 0.04)] flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#B38A3D]">
                BIGGEST GAP
              </span>
              {bottleneckGap && (
                <span className="text-xs font-mono font-bold text-[#292B2B] bg-[#B38A3D]/15 px-2 py-0.5 rounded-md border border-[#B38A3D]/30">
                  {bottleneckGap.current_score !== null ? `${bottleneckGap.current_score}%` : 'Unassessed'} → {bottleneckGap.target_score}%
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#292B2B] leading-snug">
              {bottleneckGap ? bottleneckGap.competency_name : (diagnosis?.primary_gap || 'Sampling Techniques')}
            </h3>
            <p className="text-xs text-[#7A756E] leading-relaxed line-clamp-2">
              {diagnosis?.root_cause || (bottleneckGap ? `Active ${bottleneckGap.gap}% gap below official role benchmark` : 'Evaluate gaps across competencies')}
            </p>
          </div>

          <Button
            variant="outline"
            size="default"
            onClick={handleInspectPrimaryGap}
            className="w-full border-[#B38A3D]/40 text-[#292B2B] hover:bg-[#B38A3D]/10 font-semibold text-xs sm:text-sm h-9.5 rounded-xl cursor-pointer transition-all duration-200"
          >
            Inspect Primary Gap
          </Button>
        </div>

        {/* C. NEXT STEP */}
        <div className="bg-[#FFFDF9] rounded-2xl p-6 border border-[#E2DDD5] shadow-[0_1px_3px_rgba(45, 48, 48, 0.04)] flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#A85D4C]">
                NEXT STEP
              </span>
              {nextAction && (
                <span className="text-[10px] font-mono font-bold text-[#A85D4C] bg-[#A85D4C]/10 px-2 py-0.5 rounded-md border border-[#A85D4C]/25">
                  {nextAction.action_type.replace('_', ' ')}
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#292B2B] leading-snug truncate">
              {nextAction ? nextAction.title : (topRecommendation ? topRecommendation.title : 'Take Adaptive Assessment')}
            </h3>
            <p className="text-xs text-[#7A756E] leading-relaxed line-clamp-2">
              {nextAction ? nextAction.reason : (topRecommendation ? `${topRecommendation.duration_hours}h • ${topRecommendation.provider}` : '15 min • Multi-Competency Diagnostic')}
            </p>
          </div>

          <Link to={nextAction ? nextAction.next_step.route : "/learning-path"} className="block w-full">
            <Button
              size="default"
              className="w-full bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9] font-semibold text-xs sm:text-sm shadow-xs h-9.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{nextAction ? nextAction.next_step.label : (topRecommendation ? 'Launch Recommended Module' : 'View Learning Path')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. RADIAL CAPABILITY OVERVIEW & PRIORITY GAP INSPECTOR       */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Mathematical Radial Capability Overview */}
        <div className="lg:col-span-7">
          <RadialCapabilityOverview
            nodes={radialNodes}
            selectedNode={selectedRadialNode}
            onSelectNode={(node) => {
              setSelectedRadialNode(node);
              const matchingScorecard = scorecardItems.find(s => s.id === node.id);
              if (matchingScorecard) setSelectedScorecardItem(matchingScorecard);
            }}
          />
        </div>

        {/* Right: Priority Gap / Selected Competency Inspector */}
        <div 
          ref={priorityGapRef}
          id="priority-gap-section"
          className={cn(
            "lg:col-span-5 transition-all duration-300 rounded-2xl",
            isPriorityGapHighlighted && "ring-3 ring-[#B38A3D] shadow-[0_0_24px_rgba(179,138,61,0.25)]"
          )}
        >
          <DashboardPriorityGap
            item={selectedScorecardItem}
            diagnosis={diagnosis}
            recommendation={recommendations.find(r => r.competency_id === selectedScorecardItem?.id) || recommendations[0]}
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. LEARNING JOURNEY (Horizontal Sequence)                     */}
      {/* ============================================================ */}
      <div className="bg-[#FFFDF9] rounded-2xl p-6 border border-[#E2DDD5] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-3">
          <div className="flex items-center space-x-2">
            <Route className="w-4 h-4 text-[#A85D4C]" />
            <h3 className="text-xs font-mono font-bold text-[#292B2B] uppercase tracking-wider">
              YOUR LEARNING JOURNEY
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#7A756E]">
            {pathItems.filter((p: any) => p.status === 'completed').length} of {Math.max(pathItems.length, journeySteps.length)} Milestones Completed
          </span>
        </div>

        {/* Horizontal Journey Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
          {journeySteps.map((step: any, idx: number) => {
            const isCompleted = step.status === 'completed';
            const isCurrent = step.status === 'current';

            return (
              <div
                key={idx}
                className={cn(
                  "p-3 rounded-xl border flex flex-col justify-between space-y-2 transition-all text-left",
                  isCompleted 
                    ? "bg-[#2E8B57]/5 border-[#2E8B57]/30 text-[#2E8B57]"
                    : isCurrent
                    ? "bg-[#A85D4C]/5 border-[#A85D4C] ring-2 ring-[#A85D4C]/20 text-[#292B2B]"
                    : "bg-[#EFEBE4] border-[#E2DDD5] text-[#7A756E]"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px]",
                    isCompleted ? "bg-[#2E8B57] text-[#FFFDF9]" : isCurrent ? "bg-[#A85D4C] text-[#FFFDF9]" : "bg-[#7A756E]/20 text-[#292B2B]"
                  )}>
                    {step.number}
                  </span>
                  <span className="text-[9px] font-mono uppercase font-bold">
                    {isCompleted ? 'Done' : isCurrent ? 'Active' : `0${idx + 1}`}
                  </span>
                </div>
                <h4 className="text-xs font-bold leading-tight line-clamp-2">
                  {step.label}
                </h4>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. iGOT RECOMMENDATIONS & IMPROVEMENT TRAJECTORY GRID         */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: iGOT Recommendations (Compact Data List) */}
        <div className="lg:col-span-5 bg-[#FFFDF9] rounded-2xl p-6 border border-[#E2DDD5] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-3">
            <h3 className="text-xs font-mono font-bold text-[#292B2B] uppercase tracking-wider">
              ACCREDITED RECOMMENDATIONS
            </h3>
            <span className="text-[10px] font-mono text-[#A85D4C] font-semibold">Ranked by Gap Deficit</span>
          </div>

          <div className="space-y-3">
            {recommendations.slice(0, 3).map((course: any) => (
              <Link 
                key={course.id} 
                to={`/igot-learning?course_id=${course.id}${course.competency_id ? `&competency_id=${course.competency_id}` : ''}`}
                className="p-3 rounded-xl bg-[#EFEBE4] border border-[#E2DDD5] hover:border-[#A85D4C]/40 hover:bg-[#EAE4DC] flex items-center justify-between gap-3 transition-all cursor-pointer block"
              >
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-[#292B2B] line-clamp-1">{course.title}</h4>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#7A756E]">
                    <span className="truncate max-w-[120px]">{course.competency_name}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-[#A85D4C]" /> {course.duration_hours}h</span>
                  </div>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#A85D4C]/10 text-[#A85D4C] border border-[#A85D4C]/20 text-[10px] font-mono font-bold">
                  {Math.round(course.match_percent)}% Match
                </span>
              </Link>
            ))}
          </div>

          <Link to="/courses" className="block pt-1">
            <Button variant="outline" className="w-full text-xs font-bold border-[#E2DDD5] text-[#292B2B] hover:bg-[#EFEBE4] h-8.5">
              Explore All Courses <ArrowRight className="w-3 h-3 ml-1.5" />
            </Button>
          </Link>
        </div>

        {/* Right: AI Diagnosis & Root Cause Insight */}
        <div className="lg:col-span-7">
          <AIDiagnosticCard
            diagnosis={diagnosis}
            competencyName={selectedScorecardItem?.name || bottleneckGap?.competency_name || diagnosis?.competency_name}
            fallbackSummary={insights?.diagnostic_summary}
          />
        </div>
      </div>
    </div>
  );
}
