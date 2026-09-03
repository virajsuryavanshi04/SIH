import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ExternalLink, Sparkles, CheckCircle2, Bookmark, Award, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  course: any;
  isPriorityFocus?: boolean;
  gapDetails?: {
    competencyName?: string;
    gapPoints?: number;
    reason?: string;
  };
  onEnroll?: (courseId: number) => void;
}

export default function CourseCard({ course, isPriorityFocus, gapDetails, onEnroll }: Props) {
  const [isHighlightActive, setIsHighlightActive] = useState<boolean>(Boolean(isPriorityFocus));

  useEffect(() => {
    if (isPriorityFocus) {
      setIsHighlightActive(true);
      const timer = setTimeout(() => {
        setIsHighlightActive(false);
      }, 2000); // 1-2 sec focus duration
      return () => clearTimeout(timer);
    }
  }, [isPriorityFocus]);

  const compLabel = course.competency_name || (Array.isArray(course.competencies) && course.competencies.length > 0
    ? (typeof course.competencies[0] === 'string' ? course.competencies[0] : course.competencies[0]?.competency_name || course.competencies[0]?.name)
    : course.competency || 'Official Statistical Framework');

  const explanation = course.explanation || course.reason || (course.recommendation_reasons && course.recommendation_reasons[0]);
  const durationText = course.duration_display || course.duration || (course.duration_hours ? `${course.duration_hours}h` : '2h');
  const externalUrl = course.external_url || course.url || 'https://igotkarmayogi.gov.in/';
  const isCompleted = course.progress_status === 'completed';
  const confidence = course.confidence || 'High';

  const cardId = `course-card-${course.id || course.igot_identifier || course.external_id}`;

  return (
    <div 
      id={cardId}
      tabIndex={isPriorityFocus ? 0 : undefined}
      aria-label={isPriorityFocus ? `Highest Priority Recommended Course: ${course.title || course.name}` : undefined}
      className={cn(
        "flex flex-col h-full rounded-2xl border transition-all duration-700 ease-out p-6 space-y-4 text-left group bg-[#FFFDF9]",
        isPriorityFocus && isHighlightActive
          ? "border-[#EAB308] ring-4 ring-[#EAB308]/35 shadow-[0_0_24px_rgba(234,179,8,0.25)] -translate-y-1"
          : isPriorityFocus
          ? "border-[#EAB308] shadow-[0_1px_4px_rgba(234,179,8,0.15)]"
          : "border-[#E2DDD5] hover:border-[#A85D4C]/60 hover:-translate-y-0.5 hover:shadow-md shadow-[0_1px_3px_rgba(45,48,48,0.04)]"
      )}
    >
      
      {/* Header: Provider + iGOT Badge + Priority Badge + Match Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {isPriorityFocus ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047] uppercase tracking-wider shadow-2xs">
                <Target className="w-3 h-3 text-[#854D0E]" />
                HIGHEST PRIORITY
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#A85D4C]/10 text-[#A85D4C] border border-[#A85D4C]/25 uppercase tracking-wider">
                iGOT Course
              </span>
            )}
            <span className="text-[11px] font-mono font-bold text-[#7A756E] truncate max-w-[200px]">
              {course.provider || 'iGOT Karmayogi'}
            </span>
          </div>
          <h3 className={cn(
            "text-base sm:text-lg font-bold transition-colors leading-snug",
            isPriorityFocus ? "text-[#292B2B]" : "text-[#292B2B] group-hover:text-[#7D4036]"
          )}>
            {course.title || course.name}
          </h3>
        </div>
        
        {typeof course.match_percent === 'number' && !isNaN(course.match_percent) && (
          <span className={cn(
            "shrink-0 px-2.5 py-0.5 rounded-full border text-xs font-mono font-bold",
            isPriorityFocus 
              ? "bg-[#FEF9C3] text-[#854D0E] border-[#FDE047]" 
              : "bg-[#B38A3D]/15 text-[#292B2B] border-[#B38A3D]/30"
          )}>
            {Math.round(course.match_percent)}% Match
          </span>
        )}
      </div>

      {/* Focused Priority Gap Callout */}
      {isPriorityFocus && (
        <div className="p-3.5 rounded-xl bg-[#FEFCE8] border border-[#FEF08A] text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#854D0E] uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-[#854D0E]" />
              Addresses Your Gap
            </span>
            {gapDetails?.gapPoints !== undefined && (
              <span className="text-[10px] font-mono font-bold text-[#854D0E] bg-[#FEF9C3] px-2 py-0.5 rounded border border-[#FDE047]">
                {gapDetails.gapPoints} pt deficit
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-[#292B2B]">
            ◎ {gapDetails?.competencyName || compLabel}
          </p>
        </div>
      )}

      {/* Description */}
      {course.description && (
        <p className="text-sm text-[#7A756E] leading-relaxed line-clamp-2">
          {course.description}
        </p>
      )}

      {/* Meta Badges */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#7A756E] pt-1">
        <span className="px-2 py-0.5 rounded bg-[#EFEBE4] border border-[#E2DDD5] text-[#292B2B] text-[10px] font-bold uppercase">
          {course.difficulty || 'Intermediate'}
        </span>
        <span className="flex items-center gap-1 text-xs">
          <Clock className="w-3.5 h-3.5 text-[#A85D4C]" /> 
          {durationText}
        </span>
        <span>•</span>
        <span className="text-xs font-bold text-[#A85D4C] truncate max-w-[190px]" title={compLabel}>
          {compLabel}
        </span>
        {confidence && (
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#EFEBE4] text-[#7A756E]">
            {confidence} Conf.
          </span>
        )}
      </div>

      {/* Transparent Explanation / Why this course Callout */}
      {explanation && !isPriorityFocus && (
        <div className="p-3.5 rounded-xl bg-[#EFEBE4] border border-[#E2DDD5] text-xs text-[#292B2B] space-y-1">
          <span className="text-[10px] font-mono font-bold text-[#A85D4C] uppercase flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#A85D4C]" />
            Why this course?
          </span>
          <p className="text-xs leading-relaxed text-[#292B2B]">
            {explanation}
          </p>
        </div>
      )}

      {/* Action Footer: Verified iGOT Destination */}
      <div className="pt-2 mt-auto border-t border-[#E2DDD5] flex items-center gap-2">
        {isCompleted ? (
          <div className="w-full py-2 rounded-lg bg-[#2E8B57]/10 border border-[#2E8B57]/30 text-center text-xs font-bold font-mono text-[#2E8B57] flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Completed on iGOT</span>
          </div>
        ) : (
          <a 
            href={externalUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-full"
          >
            <Button 
              className="w-full font-semibold text-xs sm:text-sm shadow-xs h-9.5 flex items-center justify-center gap-1.5 cursor-pointer rounded-xl bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9] transition-all"
            >
              <span>{isPriorityFocus ? 'Start Learning on iGOT' : 'Learn on iGOT'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}

