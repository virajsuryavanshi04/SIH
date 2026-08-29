import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight, Sparkles, CheckCircle2, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Props {
  course: any;
  onEnroll?: (courseId: number) => void;
}

export default function CourseCard({ course, onEnroll }: Props) {
  const compLabel = course.competency_name || (Array.isArray(course.competencies) && course.competencies.length > 0
    ? (typeof course.competencies[0] === 'string' ? course.competencies[0] : course.competencies[0]?.name)
    : 'Statistical Standard');

  const explanation = course.explanation || (course.recommendation_reasons && course.recommendation_reasons[0]);
  const isEnrolled = course.progress_status === 'in_progress' || course.progress_status === 'completed';
  const isCompleted = course.progress_status === 'completed';

  return (
    <div className="flex flex-col h-full rounded-2xl border border-[#E2DDD5] bg-[#FFFDF9] hover:border-[#A85D4C]/60 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 ease-out p-6 space-y-4 shadow-[0_1px_3px_rgba(45,48,48,0.04)] text-left group">
      
      {/* Header: Title + Match Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <span className="text-[11px] font-mono font-bold text-[#A85D4C] uppercase tracking-wider block">
            {course.provider || 'iGOT Karmayogi'} // {course.resource_type?.toUpperCase().replace('_', ' ') || 'COURSE'}
          </span>
          <h3 className="text-base sm:text-lg font-bold text-[#292B2B] group-hover:text-[#7D4036] transition-colors leading-snug">
            {course.title}
          </h3>
        </div>
        
        {course.match_percent !== undefined && (
          <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-[#B38A3D]/15 text-[#292B2B] border border-[#B38A3D]/30 text-xs font-mono font-bold">
            {Math.round(course.match_percent)}% Match
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-[#7A756E] leading-relaxed line-clamp-2">
        {course.description}
      </p>

      {/* Meta Badges */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#7A756E] pt-1">
        <span className="px-2 py-0.5 rounded bg-[#EFEBE4] border border-[#E2DDD5] text-[#292B2B] text-[10px] font-bold uppercase">
          {course.difficulty || 'Intermediate'}
        </span>
        <span className="flex items-center gap-1 text-xs">
          <Clock className="w-3.5 h-3.5 text-[#A85D4C]" /> 
          {course.duration_hours}h
        </span>
        <span>•</span>
        <span className="text-xs font-bold text-[#A85D4C] truncate max-w-[180px]">
          {compLabel}
        </span>
      </div>

      {/* Transparent Explanation Callout */}
      {explanation && (
        <div className="p-3.5 rounded-xl bg-[#EFEBE4] border border-[#E2DDD5] text-xs text-[#292B2B] space-y-1">
          <span className="text-[10px] font-mono font-bold text-[#A85D4C] uppercase flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#A85D4C]" />
            Why recommended?
          </span>
          <p className="text-xs leading-relaxed text-[#292B2B]">
            {explanation}
          </p>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-2 mt-auto border-t border-[#E2DDD5] flex items-center gap-2">
        {isCompleted ? (
          <div className="w-full py-2 rounded-lg bg-[#2E8B57]/10 border border-[#2E8B57]/30 text-center text-xs font-bold font-mono text-[#2E8B57] flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Completed (Take Reassessment to Update Evidence)</span>
          </div>
        ) : (
          <Link to="/learning-path" className="w-full">
            <Button 
              className={cn(
                "w-full font-semibold text-xs sm:text-sm shadow-xs h-9 flex items-center justify-center gap-1.5 cursor-pointer rounded-xl",
                isEnrolled 
                  ? "bg-[#2D3030] text-[#FFFDF9] hover:bg-[#2D3030]/90" 
                  : "bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9]"
              )}
            >
              <span>{isEnrolled ? 'Continue Module' : 'Launch Accredited Resource'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

