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
    <div className="flex flex-col h-full rounded-2xl border border-[#2B2D42]/10 bg-[#FFFFFF] hover:border-[#1F7A8C]/60 transition-all p-6 space-y-4 shadow-xs text-left group">
      
      {/* Header: Title + Match Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <span className="text-[10px] font-mono font-bold text-[#1F7A8C] uppercase tracking-wider block">
            {course.provider || 'iGOT Karmayogi'} // {course.resource_type?.toUpperCase().replace('_', ' ') || 'COURSE'}
          </span>
          <h3 className="text-base font-bold text-[#0B2545] group-hover:text-[#1F7A8C] transition-colors leading-snug">
            {course.title}
          </h3>
        </div>
        
        {course.match_percent !== undefined && (
          <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#0B2545] border border-[#D4AF37]/30 text-xs font-mono font-bold">
            {Math.round(course.match_percent)}% Match
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-[#2B2D42]/80 leading-relaxed line-clamp-2">
        {course.description}
      </p>

      {/* Meta Badges */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#2B2D42]/70 pt-1">
        <span className="px-2 py-0.5 rounded bg-[#F4F6F9] border border-[#2B2D42]/10 text-[#0B2545] text-[10px] font-bold uppercase">
          {course.difficulty || 'Intermediate'}
        </span>
        <span className="flex items-center gap-1 text-[11px]">
          <Clock className="w-3.5 h-3.5 text-[#1F7A8C]" /> 
          {course.duration_hours}h
        </span>
        <span>•</span>
        <span className="text-[11px] font-bold text-[#1F7A8C] truncate max-w-[180px]">
          {compLabel}
        </span>
      </div>

      {/* Transparent Explanation Callout */}
      {explanation && (
        <div className="p-3 rounded-xl bg-[#F4F6F9] border border-[#2B2D42]/10 text-xs text-[#2B2D42] space-y-1">
          <span className="text-[10px] font-mono font-bold text-[#1F7A8C] uppercase flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#1F7A8C]" />
            Why recommended?
          </span>
          <p className="text-[11px] leading-snug text-[#2B2D42]/90">
            {explanation}
          </p>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-2 mt-auto border-t border-[#2B2D42]/10 flex items-center gap-2">
        {isCompleted ? (
          <div className="w-full py-2 rounded-lg bg-[#2E7D32]/10 border border-[#2E7D32]/30 text-center text-xs font-bold font-mono text-[#2E7D32] flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Completed (Take Reassessment to Update Evidence)</span>
          </div>
        ) : (
          <Link to="/learning-path" className="w-full">
            <Button 
              className={cn(
                "w-full font-bold text-xs shadow-xs h-9 flex items-center justify-center gap-1.5 cursor-pointer",
                isEnrolled 
                  ? "bg-[#0B2545] text-[#FFFFFF] hover:bg-[#0B2545]/90" 
                  : "bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF]"
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
