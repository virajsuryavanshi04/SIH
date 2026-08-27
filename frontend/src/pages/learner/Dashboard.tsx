import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2, TrendingUp, Clock, BookOpen, Route, Award, Play, AlertCircle, AlertTriangle } from 'lucide-react';
import RadialCapabilityOverview, { RadialCompetencyNode } from '@/components/dashboard/RadialCapabilityOverview';
import { CompetencyScorecardItem } from '@/components/dashboard/CompetencyScorecard';
import DashboardPriorityGap from '@/components/dashboard/DashboardPriorityGap';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { competencyApi, courseApi, learningPathApi } from '@/lib/api';

export default function Dashboard() {
  const [loading, setLoading] = useState<boolean>(true);
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [learningPath, setLearningPath] = useState<any>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);
  
  const [scorecardItems, setScorecardItems] = useState<CompetencyScorecardItem[]>([]);
  const [selectedScorecardItem, setSelectedScorecardItem] = useState<CompetencyScorecardItem | null>(null);
  const [radialNodes, setRadialNodes] = useState<RadialCompetencyNode[]>([]);
  const [selectedRadialNode, setSelectedRadialNode] = useState<RadialCompetencyNode | null>(null);

  useEffect(() => {
    const fetchDashboardTelemetry = async () => {
      try {
        setLoading(true);
        const [compRes, insightRes, diagRes, recRes, pathRes, histRes] = await Promise.allSettled([
          competencyApi.getMyCompetencies(),
          competencyApi.getMyInsights(),
          competencyApi.getMyDiagnosis(),
          courseApi.getRecommended(),
          learningPathApi.get(),
          competencyApi.getMyHistory(),
        ]);

        const rawComps = compRes.status === 'fulfilled' ? compRes.value.data || [] : [];
        const rawInsights = insightRes.status === 'fulfilled' ? insightRes.value.data || null : null;
        const rawDiag = diagRes.status === 'fulfilled' ? diagRes.value.data || null : null;
        const rawRecs = recRes.status === 'fulfilled' ? recRes.value.data || [] : [];
        const rawPath = pathRes.status === 'fulfilled' ? pathRes.value.data || null : null;
        const rawHist = histRes.status === 'fulfilled' ? histRes.value.data || [] : [];

        setCompetencies(rawComps);
        setInsights(rawInsights);
        setDiagnosis(rawDiag);
        setRecommendations(rawRecs);
        setLearningPath(rawPath);
        setHistoryList(rawHist);

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
          <div className="w-10 h-10 border-3 border-[#1F7A8C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#0B2545]">Loading live capability telemetry & recommendations...</p>
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

  // Stepper milestones from live learning path or defaults
  const journeySteps = pathItems.length > 0 ? pathItems.slice(0, 5).map((it: any) => ({
    label: it.title,
    status: it.status,
    number: it.status === 'completed' ? '✓' : String(it.order)
  })) : [
    { label: 'Baseline Diagnostic', status: assessmentsCount > 0 ? 'completed' : 'current', number: assessmentsCount > 0 ? '✓' : '1' },
    { label: 'Priority Gap Learning', status: assessmentsCount > 0 ? 'current' : 'upcoming', number: '2' },
    { label: 'Adaptive Reassessment', status: 'upcoming', number: '3' },
    { label: 'Benchmark Verification', status: 'upcoming', number: '◎' }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-left">
      
      {/* If brand new user with 0 assessments, show prompt */}
      {assessmentsCount === 0 && (
        <div className="bg-[#0B2545] rounded-2xl p-6 text-[#FFFFFF] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md border border-[#0B2545]">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFFFFF]/10 text-[#D4AF37] border border-[#FFFFFF]/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Initial Setup Required</span>
            </div>
            <h3 className="text-xl font-bold text-[#FFFFFF]">Welcome to SmartLearn</h3>
            <p className="text-xs text-[#FFFFFF]/80 max-w-xl">
              Complete your initial baseline diagnostic to establish verified competency scores for your official role.
            </p>
          </div>
          <Link to="/assessment">
            <Button className="bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-bold text-xs shadow-xs px-6">
              <span>Take Baseline Assessment</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. TOP HIGH-PRIORITY TRIAD (Readiness, Gap, Next Step)       */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* A. YOUR READINESS */}
        <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCE5EA] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#62748A] block">
              YOUR READINESS
            </span>
            <div className="flex items-baseline gap-2.5 mt-2">
              <span className="text-4xl font-black text-[#102A43] font-mono">{overallReadiness}%</span>
              {deltaPoints > 0 && (
                <span className="text-xs font-bold text-[#2E7D32] font-mono">↑ +{deltaPoints} pts</span>
              )}
            </div>
            <p className="text-xs text-[#62748A] mt-1">
              {assessmentsCount > 0 
                ? `${assessmentsCount} assessment${assessmentsCount > 1 ? 's' : ''} recorded • Live evidence profile`
                : 'Pending initial assessment evaluation'}
            </p>
          </div>

          {/* Sparkline from historical records */}
          <div className="pt-2">
            <div className="flex items-end gap-1.5 h-8 w-full bg-[#EEF5F7] p-2 rounded-lg border border-[#DCE5EA]">
              {historyList.length > 0 ? (
                historyList.slice(-5).map((h: any, i: number) => (
                  <div 
                    key={i} 
                    style={{ height: `${Math.max(20, Math.min(100, h.score))}%` }} 
                    className="bg-[#1F7A8C] flex-1 rounded-xs transition-all"
                    title={`${h.competency_name}: ${h.score}%`}
                  />
                ))
              ) : (
                <>
                  <div className="bg-[#1F7A8C]/20 w-1/4 h-[30%] rounded-xs" />
                  <div className="bg-[#1F7A8C]/40 w-1/4 h-[50%] rounded-xs" />
                  <div className="bg-[#1F7A8C]/60 w-1/4 h-[70%] rounded-xs" />
                  <div className="bg-[#1F7A8C] w-1/4 h-[90%] rounded-xs" />
                </>
              )}
            </div>
          </div>
        </div>

        {/* B. BIGGEST GAP */}
        <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCE5EA] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#D4AF37]">
                BIGGEST GAP
              </span>
              {bottleneckGap && (
                <span className="text-xs font-mono font-bold text-[#102A43]">
                  {bottleneckGap.current_score !== null ? `${bottleneckGap.current_score}%` : 'Unassessed'} → {bottleneckGap.target_score}%
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-[#102A43] mt-2">
              {bottleneckGap ? bottleneckGap.competency_name : (diagnosis?.primary_gap || 'Sampling Techniques')}
            </h3>
            <p className="text-xs text-[#62748A] mt-1 line-clamp-2">
              {diagnosis?.root_cause || (bottleneckGap ? `Active ${bottleneckGap.gap}% gap below official role standard` : 'Evaluate gaps across competencies')}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (bottleneckGap) {
                const targetItem = scorecardItems.find(n => n.name === bottleneckGap.competency_name || n.id === bottleneckGap.competency_id);
                if (targetItem) setSelectedScorecardItem(targetItem);
                const targetNode = radialNodes.find(n => n.name === bottleneckGap.competency_name || n.id === bottleneckGap.competency_id);
                if (targetNode) setSelectedRadialNode(targetNode);
              }
            }}
            className="w-full border-[#D4AF37]/50 text-[#102A43] hover:bg-[#D4AF37]/10 font-bold text-xs h-9 cursor-pointer"
          >
            Inspect Primary Gap
          </Button>
        </div>

        {/* C. NEXT STEP */}
        <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCE5EA] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#1F7A8C] block">
              NEXT STEP
            </span>
            <h3 className="text-base font-bold text-[#102A43] mt-2 truncate">
              {topRecommendation ? topRecommendation.title : 'Take Adaptive Assessment'}
            </h3>
            <p className="text-xs text-[#62748A] mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#1F7A8C]" />
              <span>
                {topRecommendation 
                  ? `${topRecommendation.duration_hours}h • ${topRecommendation.provider}` 
                  : '15 min • Multi-Competency Diagnostic'}
              </span>
            </p>
          </div>

          <Link to="/learning-path" className="block w-full">
            <Button
              size="sm"
              className="w-full bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-bold text-xs shadow-xs h-9 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{topRecommendation ? 'Launch Recommended Module' : 'View Learning Path'}</span>
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
        <div className="lg:col-span-5">
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
      <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCE5EA] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#DCE5EA] pb-3">
          <div className="flex items-center space-x-2">
            <Route className="w-4 h-4 text-[#1F7A8C]" />
            <h3 className="text-xs font-mono font-bold text-[#102A43] uppercase tracking-wider">
              YOUR LEARNING JOURNEY
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#62748A]">
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
                    ? "bg-[#2E7D32]/5 border-[#2E7D32]/30 text-[#2E7D32]"
                    : isCurrent
                    ? "bg-[#1F7A8C]/5 border-[#1F7A8C] ring-2 ring-[#1F7A8C]/20 text-[#102A43]"
                    : "bg-[#EEF5F7] border-[#DCE5EA] text-[#62748A]"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px]",
                    isCompleted ? "bg-[#2E7D32] text-[#FFFFFF]" : isCurrent ? "bg-[#1F7A8C] text-[#FFFFFF]" : "bg-[#62748A]/20 text-[#102A43]"
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
        <div className="lg:col-span-5 bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCE5EA] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#DCE5EA] pb-3">
            <h3 className="text-xs font-mono font-bold text-[#102A43] uppercase tracking-wider">
              ACCREDITED RECOMMENDATIONS
            </h3>
            <span className="text-[10px] font-mono text-[#1F7A8C] font-semibold">Ranked by Gap Deficit</span>
          </div>

          <div className="space-y-3">
            {recommendations.slice(0, 3).map((course: any) => (
              <div key={course.id} className="p-3 rounded-xl bg-[#EEF5F7] border border-[#DCE5EA] flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-[#102A43] line-clamp-1">{course.title}</h4>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#62748A]">
                    <span className="truncate max-w-[120px]">{course.competency_name}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-[#1F7A8C]" /> {course.duration_hours}h</span>
                  </div>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#1F7A8C]/10 text-[#1F7A8C] border border-[#1F7A8C]/20 text-[10px] font-mono font-bold">
                  {Math.round(course.match_percent)}% Match
                </span>
              </div>
            ))}
          </div>

          <Link to="/courses" className="block pt-1">
            <Button variant="outline" className="w-full text-xs font-bold border-[#DCE5EA] text-[#102A43] hover:bg-[#EEF5F7] h-8.5">
              Explore All Courses <ArrowRight className="w-3 h-3 ml-1.5" />
            </Button>
          </Link>
        </div>

        {/* Right: AI Diagnosis & Root Cause Insight */}
        <div className="lg:col-span-7 bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCE5EA] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#DCE5EA] pb-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono font-bold uppercase text-[#1F7A8C]">
                DIAGNOSTIC EVIDENCE INSIGHT
              </span>
              <h3 className="text-sm font-bold text-[#102A43]">
                {diagnosis?.primary_gap || 'Role Benchmark Calibration'}
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-[#1F7A8C] bg-[#1F7A8C]/10 px-2.5 py-1 rounded-full border border-[#1F7A8C]/20">
              Confidence: {Math.round(diagnosis?.confidence || 88)}%
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#EEF5F7] border border-[#DCE5EA] text-xs space-y-2">
            <span className="text-[10px] font-mono font-bold text-[#1F7A8C] uppercase block">
              AI Root-Cause Explanation
            </span>
            <p className="text-[#102A43] leading-relaxed">
              {diagnosis?.explanation || insights?.diagnostic_summary || 'Your competency scores are calculated deterministically from assessment answers. Recommended modules target your diagnosed weak areas.'}
            </p>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="font-mono text-[#62748A]">
              Deterministic scoring verified • Zero self-rating bias
            </span>
            <Link to="/assessment">
              <Button size="sm" variant="ghost" className="text-xs font-bold text-[#1F7A8C] hover:bg-[#1F7A8C]/10 h-8">
                Take Reassessment <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
