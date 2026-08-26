import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Globe, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  course: any;
}

export default function CourseCard({ course }: Props) {
  return (
    <div className="flex flex-col h-full rounded-2xl border border-[#2B2D42]/10 bg-[#FFFFFF] hover:border-[#1F7A8C]/60 transition-all p-6 space-y-4 shadow-xs text-left group">
      {/* Header: Title + Match Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <span className="text-[10px] font-mono font-bold text-[#1F7A8C] uppercase tracking-wider block">
            {course.provider}
          </span>
          <h3 className="text-base font-bold text-[#0B2545] group-hover:text-[#1F7A8C] transition-colors leading-snug">
            {course.title}
          </h3>
        </div>
        {course.match_percent && (
          <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#0B2545] border border-[#D4AF37]/30 text-xs font-mono font-bold">
            {course.match_percent}% Match
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-[#2B2D42]/80 leading-relaxed line-clamp-2">
        {course.description}
      </p>

      {/* Meta Pills */}
      <div className="flex items-center gap-3 text-xs font-mono text-[#2B2D42]/70 pt-1">
        <span className="px-2 py-0.5 rounded bg-[#F4F6F9] border border-[#2B2D42]/10 text-[#0B2545] text-[10px] font-bold">
          {course.difficulty}
        </span>
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#1F7A8C]" /> {course.duration_hours}h</span>
        <span>•</span>
        <span>{course.competencies[0]}</span>
      </div>

      {/* Single Reason if available */}
      {course.recommendation_reasons?.length > 0 && (
        <div className="p-3 rounded-xl bg-[#F4F6F9] border border-[#2B2D42]/10 text-xs text-[#2B2D42] space-y-1">
          <span className="text-[10px] font-mono font-bold text-[#1F7A8C] uppercase block">
            Why recommended?
          </span>
          <p className="text-[11px] leading-snug text-[#2B2D42]/90">
            {course.recommendation_reasons[0]}
          </p>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-2 mt-auto border-t border-[#2B2D42]/10">
        <Link to="/learning-path">
          <Button className="w-full bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-bold text-xs shadow-xs h-9 flex items-center justify-center gap-1.5 cursor-pointer">
            <span>Start Learning Journey</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
