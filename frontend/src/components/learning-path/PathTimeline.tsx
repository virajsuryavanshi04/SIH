import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Lock, PlayCircle, BookOpen, Presentation, Code, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

interface PathItem {
  id: number;
  title: string;
  description: string;
  item_type: string;
  status: string;
  estimated_duration?: string;
  difficulty?: string;
  competency_name?: string;
}

interface Props {
  items: PathItem[];
}

export default function PathTimeline({ items }: Props) {
  const getIcon = (type: string, status: string) => {
    if (status === 'locked') return <Lock className="w-3.5 h-3.5 text-[#7A756E]/40" />;
    if (status === 'completed') return <CheckCircle2 className="w-3.5 h-3.5 text-[#FFFDF9]" />;
    
    switch (type.toLowerCase()) {
      case 'course': return <BookOpen className="w-3.5 h-3.5 text-[#FFFDF9]" />;
      case 'module': return <PlayCircle className="w-3.5 h-3.5 text-[#FFFDF9]" />;
      case 'practice': return <Code className="w-3.5 h-3.5 text-[#FFFDF9]" />;
      default: return <Presentation className="w-3.5 h-3.5 text-[#FFFDF9]" />;
    }
  };

  return (
    <div className="relative pl-8 py-2 space-y-8">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isCompleted = item.status === 'completed';
        const isCurrent = item.status === 'current';
        
        return (
          <div key={item.id} className="relative text-left">
            {/* Connecting line */}
            {!isLast && (
              <div 
                className={cn(
                  "absolute left-[-21px] top-7 bottom-[-32px] w-0.5",
                  isCompleted ? "bg-[#2E8B57]" : isCurrent ? "bg-[#A85D4C]" : "bg-[#E2DDD5]"
                )}
              />
            )}
            
            {/* Node Icon */}
            <div className={cn(
              "absolute left-[-31px] w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all",
              isCompleted ? "border-[#2E8B57] bg-[#2E8B57] text-[#FFFDF9] shadow-xs" : 
              isCurrent ? "border-[#A85D4C] bg-[#A85D4C] text-[#FFFDF9] ring-2 ring-[#A85D4C]/20 shadow-xs" : 
              "border-[#E2DDD5] bg-[#FFFDF9]"
            )}>
              {getIcon(item.item_type, item.status)}
            </div>

            {/* Content Card */}
            <div className={cn(
              "ml-6 p-5 sm:p-6 rounded-2xl border transition-all bg-[#FFFDF9]",
              isCurrent ? "border-[#A85D4C] shadow-sm ring-1 ring-[#A85D4C]/20" : 
              isCompleted ? "border-[#2E8B57]/30 bg-[#2E8B57]/5" : 
              "border-[#E2DDD5] opacity-85"
            )}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-[#A85D4C] uppercase tracking-wider">{item.item_type}</span>
                    {item.competency_name && (
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#A85D4C]/10 text-[#A85D4C] border border-[#A85D4C]/20">
                        {item.competency_name}
                      </span>
                    )}
                  </div>
                  <h3 className={cn("text-base sm:text-lg font-bold leading-snug", isCurrent ? "text-[#A85D4C]" : "text-[#292B2B]")}>
                    {item.title}
                  </h3>
                </div>
                {item.estimated_duration && (
                  <span className="text-xs font-mono font-semibold text-[#292B2B] bg-[#EFEBE4] px-2.5 py-1 rounded-md border border-[#E2DDD5] shadow-2xs self-start">
                    ⏱ {item.estimated_duration}
                  </span>
                )}
              </div>
              
              <p className="text-sm text-[#7A756E] mb-4 leading-relaxed">{item.description}</p>
              
              <div className="flex justify-between items-center pt-3 border-t border-[#E2DDD5]">
                <div className="flex gap-2">
                  {item.difficulty && (
                    <span className="text-xs font-medium text-[#292B2B] bg-[#EFEBE4] px-2.5 py-0.5 rounded border border-[#E2DDD5]">
                      Level: {item.difficulty}
                    </span>
                  )}
                </div>

                {isCurrent && (
                  <Link to="/courses">
                    <Button size="sm" className="bg-[#A85D4C] hover:bg-[#2D3030] text-[#FFFDF9] font-semibold text-xs sm:text-sm shadow-xs h-8.5 px-4 flex items-center gap-1.5 cursor-pointer">
                      <span>Start Learning</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                )}

                {isCompleted && (
                  <span className="text-xs font-bold font-mono text-[#2E8B57] flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Completed
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

