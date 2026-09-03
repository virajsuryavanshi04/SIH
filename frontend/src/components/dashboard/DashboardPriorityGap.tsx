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
      <div className="bg-[#FFFDF9] rounded-2xl p-6 border border-[#E2DDD5] shadow-[0_1px_4px_rgba(45, 48, 48, 0.04)] text-center text-xs text-[#7A756E] h-full flex items-center justify-center">
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

  // Target course and learning URL for priority gap
  const targetCourseId = recommendation?.id || recommendation?.course_id;
  const targetCompId = item.id || recommendation?.competency_id;
  const learningUrl = !isAssessed
    ? '/assessment'
    : targetCourseId
    ? `/igot-learning?course_id=${targetCourseId}${targetCompId ? `&competency_id=${targetCompId}` : ''}`
    : '/igot-learning';

  return (
    <div className="bg-[#FFFDF9] rounded-2xl p-5 sm:p-6 border border-[#E2DDD5] shadow-[0_1px_4px_rgba(45, 48, 48, 0.04)] space-y-5 text-left h-full flex flex-col justify-between">
      
      {/* 1. Header with Badge & Competency Title */}
      <div className="space-y-2 border-b border-[#E2DDD5] pb-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#B38A3D] flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            <span>{isCritical ? 'PRIORITY GAP DEFICIT' : isTargetMet ? 'PROFICIENT ASSET' : 'COMPETENCY AUDIT'}</span>
          </span>
          <span
            className={cn(
              "text-xs font-semibold px-2.5 py-0.5 rounded-full border font-mono",
              !isAssessed
                ? "bg-[#EFEBE4] text-[#7A756E] border-[#E2DDD5]"
                : isTargetMet
                ? "bg-[#2E8B57]/10 text-[#2E8B57] border-[#2E8B57]/30"
                : isCritical
                ? "bg-[#D9534F]/10 text-[#D9534F] border-[#D9534F]/30"
                : "bg-[#B38A3D]/15 text-[#292B2B] border-[#B38A3D]/35"
            )}
          >
            {!isAssessed ? 'PENDING' : isTargetMet ? 'BENCHMARK MET' : `${item.gap}pt GAP`}
          </span>
        </div>

        <h3 className="text-xl font-bold text-[#292B2B] tracking-tight">
          {item.name}
        </h3>
        <p className="text-xs text-[#7A756E]">
          {item.domain || 'Statistical Standard & Role Requirement'}
        </p>
      </div>

      {/* 2. Transition Metric Visualization: Current ──→ Target */}
      <div className="p-4 rounded-xl bg-[#EFEBE4] border border-[#E2DDD5] space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] font-mono text-[#7A756E] uppercase block font-semibold">Current</span>
            <span className="text-2xl font-bold text-[#292B2B] font-mono">
              {isAssessed ? `${score}%` : '0%'}
            </span>
          </div>

          <div className="flex-1 px-4 flex flex-col items-center">
            <span className={cn("text-xs font-semibold font-mono", isTargetMet ? "text-[#2E8B57]" : "text-[#B38A3D]")}>
              {item.gapText}
            </span>
            <div className="w-full h-0.5 bg-[#E2DDD5] relative my-1">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#A85D4C]" />
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-[#A85D4C] uppercase block font-semibold">Target</span>
            <span className="text-2xl font-bold text-[#A85D4C] font-mono">
              {target}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. Diagnostic Evidence / Why This Matters */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-mono font-bold text-[#292B2B] uppercase tracking-wider">
            DIAGNOSTIC EVIDENCE
          </h4>
          <span className="text-[10px] font-mono text-[#A85D4C] font-semibold">
            {diagnosis?.confidence ? `AI Confidence ${Math.round(diagnosis.confidence)}%` : 'Calibrated'}
          </span>
        </div>

        <ul className="space-y-1.5 p-3.5 rounded-xl bg-[#EFEBE4] border border-[#E2DDD5] text-xs text-[#292B2B]">
          {item.weakest_subtopic && (
            <li className="flex items-start gap-2 leading-relaxed font-medium text-[#292B2B]">
              <span className="text-[#B38A3D] font-bold mt-0.5">•</span>
              <span>Subtopic focus deficit: <strong className="text-[#292B2B]">{item.weakest_subtopic}</strong></span>
            </li>
          )}
          <li className="flex items-start gap-2 leading-relaxed text-[#7A756E]">
            <span className="text-[#A85D4C] font-bold mt-0.5">•</span>
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
      <div className="space-y-3 pt-3 border-t border-[#E2DDD5]">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#A85D4C] uppercase tracking-wider block mb-0.5">
            RECOMMENDED INTERVENTION
          </span>
          <p className="text-sm font-bold text-[#292B2B] truncate">
            {courseTitle}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-[#7A756E] font-mono">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#A85D4C]" />
            <span>{courseDuration}</span>
          </span>
          <span className="bg-[#A85D4C]/10 text-[#A85D4C] px-2.5 py-0.5 rounded-full font-bold text-[10px]">
            {courseType}
          </span>
        </div>

        <Link to={learningUrl} className="block w-full">
          <Button className="w-full bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9] font-semibold text-xs sm:text-sm shadow-xs h-10 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ease-out">
            <span>{!isAssessed ? 'Take Baseline Assessment' : 'Start Learning Module'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

    </div>
  );
}

