import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, AlertTriangle, Clock, BookOpen, CheckCircle2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CompetencyScorecardItem } from './CompetencyScorecard';

interface DashboardPriorityGapProps {
  item: CompetencyScorecardItem | null;
  diagnosis?: any;
  recommendation?: any;
}

export default function DashboardPriorityGap({
  item,
  diagnosis,
  recommendation
}: DashboardPriorityGapProps) {
  if (!item) {
    return (
      <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#2B2D42]/10 shadow-[0_1px_4px_rgba(11,37,69,0.04)] text-center text-xs text-[#2B2D42]/60 h-full flex items-center justify-center">
        Select a competency row to inspect detailed evidence.
      </div>
    );
  }

  const isAssessed = item.current_score !== null && item.status !== 'PENDING';
  const isTargetMet = isAssessed && (item.current_score ?? 0) >= item.target_score;
  const isCritical = item.status === 'CRITICAL';
  const gapVal = item.gap ?? 0;
  const score = item.current_score ?? 0;
  const target = item.target_score;

  // Use matching course recommendation or fallback
  const courseTitle = recommendation?.title || item.recommendation?.title || `Curriculum Module for ${item.name}`;
  const courseDuration = recommendation?.duration_hours ? `${recommendation.duration_hours}h` : (item.recommendation?.duration || '25 min');
  const courseType = recommendation?.resource_type ? recommendation.resource_type.toUpperCase().replace('_', ' ') : (item.recommendation?.type || 'iGOT Micro-Learning');

  return (
    <div className="bg-[#FFFFFF] rounded-2xl p-5 sm:p-6 border border-[#2B2D42]/10 shadow-[0_1px_4px_rgba(11,37,69,0.04)] space-y-5 text-left h-full flex flex-col justify-between">
      
      {/* 1. Header with Badge & Competency Title */}
      <div className="space-y-2 border-b border-[#2B2D42]/10 pb-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            <span>{isCritical ? 'PRIORITY GAP DEFICIT' : isTargetMet ? 'PROFICIENT ASSET' : 'COMPETENCY AUDIT'}</span>
          </span>
          <span
            className={cn(
              "text-xs font-semibold px-2.5 py-0.5 rounded-full border font-mono",
              !isAssessed
                ? "bg-[#2B2D42]/5 text-[#2B2D42]/70 border-[#2B2D42]/20"
                : isTargetMet
                ? "bg-[#2E7D32]/10 text-[#2E7D32] border-[#2E7D32]/30"
                : isCritical
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-[#D4AF37]/15 text-[#0B2545] border-[#D4AF37]/35"
            )}
          >
            {!isAssessed ? 'PENDING' : isTargetMet ? 'BENCHMARK MET' : `${item.gap}pt GAP`}
          </span>
        </div>

        <h3 className="text-xl font-bold text-[#0B2545] tracking-tight">
          {item.name}
        </h3>
        <p className="text-xs text-[#2B2D42]/70">
          {item.domain || 'Statistical Standard & Role Requirement'}
        </p>
      </div>

      {/* 2. Transition Metric Visualization: Current ──→ Target */}
      <div className="p-4 rounded-xl bg-[#F4F6F9] border border-[#2B2D42]/10 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] font-mono text-[#2B2D42]/60 uppercase block font-semibold">Current</span>
            <span className="text-2xl font-bold text-[#0B2545] font-mono">
              {isAssessed ? `${score}%` : '0%'}
            </span>
          </div>

          <div className="flex-1 px-4 flex flex-col items-center">
            <span className={cn("text-xs font-semibold font-mono", isTargetMet ? "text-[#2E7D32]" : "text-[#D4AF37]")}>
              {item.gapText}
            </span>
            <div className="w-full h-0.5 bg-[#2B2D42]/20 relative my-1">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#1F7A8C]" />
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-[#1F7A8C] uppercase block font-semibold">Target</span>
            <span className="text-2xl font-bold text-[#1F7A8C] font-mono">
              {target}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. Diagnostic Evidence / Why This Matters */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-mono font-bold text-[#0B2545] uppercase tracking-wider">
            DIAGNOSTIC EVIDENCE
          </h4>
          <span className="text-[10px] font-mono text-[#1F7A8C] font-semibold">
            {diagnosis?.confidence ? `AI Confidence ${Math.round(diagnosis.confidence)}%` : 'Calibrated'}
          </span>
        </div>

        <ul className="space-y-1.5 p-3.5 rounded-xl bg-[#F4F6F9] border border-[#2B2D42]/10 text-xs text-[#2B2D42]/85">
          {item.weakest_subtopic && (
            <li className="flex items-start gap-2 leading-relaxed font-medium text-[#0B2545]">
              <span className="text-[#D4AF37] font-bold mt-0.5">•</span>
              <span>Subtopic focus deficit: <strong className="text-[#0B2545]">{item.weakest_subtopic}</strong></span>
            </li>
          )}
          <li className="flex items-start gap-2 leading-relaxed">
            <span className="text-[#1F7A8C] font-bold mt-0.5">•</span>
            <span>
              {isTargetMet
                ? 'Proficiency exceeds calibrated role benchmark with verified telemetry.'
                : isAssessed
                ? `Active ${gapVal} point deficit against national MoSPI operational benchmark.`
                : 'Initial diagnostic assessment required to establish verified score.'}
            </span>
          </li>
        </ul>
      </div>

      {/* 4. Recommended Intervention & Action CTA */}
      <div className="space-y-3 pt-3 border-t border-[#2B2D42]/10">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#1F7A8C] uppercase tracking-wider block mb-0.5">
            RECOMMENDED INTERVENTION
          </span>
          <p className="text-sm font-bold text-[#0B2545] truncate">
            {courseTitle}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-[#2B2D42]/70 font-mono">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#1F7A8C]" />
            <span>{courseDuration}</span>
          </span>
          <span className="bg-[#1F7A8C]/10 text-[#1F7A8C] px-2.5 py-0.5 rounded-full font-bold text-[10px]">
            {courseType}
          </span>
        </div>

        <Link to={!isAssessed ? '/assessment' : '/courses'} className="block w-full">
          <Button className="w-full bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-semibold text-xs sm:text-sm shadow-xs h-10 rounded-xl flex items-center justify-center gap-2 cursor-pointer">
            <span>{!isAssessed ? 'Take Baseline Assessment' : 'Start Learning Module'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

    </div>
  );
}
