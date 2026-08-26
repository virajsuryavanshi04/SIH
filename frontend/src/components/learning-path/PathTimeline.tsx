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
    if (status === 'locked') return <Lock className="w-3.5 h-3.5 text-[#2B2D42]/40" />;
    if (status === 'completed') return <CheckCircle2 className="w-3.5 h-3.5 text-[#FFFFFF]" />;
    
    switch (type.toLowerCase()) {
      case 'course': return <BookOpen className="w-3.5 h-3.5 text-[#FFFFFF]" />;
      case 'module': return <PlayCircle className="w-3.5 h-3.5 text-[#FFFFFF]" />;
      case 'practice': return <Code className="w-3.5 h-3.5 text-[#FFFFFF]" />;
      default: return <Presentation className="w-3.5 h-3.5 text-[#FFFFFF]" />;
    }
  };

  return (
    <div className="relative pl-8 py-2 space-y-8">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isCompleted = item.status === 'completed';
        const isCurrent = item.status === 'current';
        
        return (
          <div key={item.id} className="relative">
            {/* Connecting line */}
            {!isLast && (
              <div 
                className={cn(
                  "absolute left-[-21px] top-7 bottom-[-32px] w-0.5",
                  isCompleted ? "bg-[#2E7D32]" : isCurrent ? "bg-[#1F7A8C]" : "bg-[#2B2D42]/20"
                )}
              />
            )}
            
            {/* Node Icon */}
            <div className={cn(
              "absolute left-[-31px] w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all",
              isCompleted ? "border-[#2E7D32] bg-[#2E7D32] text-[#FFFFFF] shadow-xs" : 
              isCurrent ? "border-[#1F7A8C] bg-[#1F7A8C] text-[#FFFFFF] ring-2 ring-[#1F7A8C]/20 shadow-xs" : 
              "border-[#2B2D42]/20 bg-[#FFFFFF]"
            )}>
              {getIcon(item.item_type, item.status)}
            </div>

            {/* Content Card */}
            <div className={cn(
              "ml-6 p-5 rounded-xl border transition-all bg-[#FFFFFF]",
              isCurrent ? "border-[#1F7A8C] shadow-sm" : 
              isCompleted ? "border-[#2E7D32]/30 bg-[#2E7D32]/5" : 
              "border-[#2B2D42]/10 opacity-80"
            )}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-[#1F7A8C] uppercase tracking-wider">{item.item_type}</span>
                    {item.competency_name && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1F7A8C]/10 text-[#1F7A8C] border border-[#1F7A8C]/20">
                        {item.competency_name}
                      </span>
                    )}
                  </div>
                  <h3 className={cn("text-base font-bold", isCurrent ? "text-[#1F7A8C]" : "text-[#0B2545]")}>
                    {item.title}
                  </h3>
                </div>
                {item.estimated_duration && (
                  <span className="text-xs font-semibold text-[#2B2D42] bg-[#F4F6F9] px-2.5 py-1 rounded-md border border-[#2B2D42]/10 shadow-xs self-start font-mono">
                    ⏱ {item.estimated_duration}
                  </span>
                )}
              </div>
              
              <p className="text-xs text-[#2B2D42] mb-4 leading-relaxed">{item.description}</p>
              
              <div className="flex justify-between items-center pt-2 border-t border-[#2B2D42]/10">
                <div className="flex gap-2">
                  {item.difficulty && (
                    <span className="text-[11px] font-medium text-[#2B2D42] bg-[#F4F6F9] px-2 py-0.5 rounded border border-[#2B2D42]/10">
                      Level: {item.difficulty}
                    </span>
                  )}
                </div>
                
                {isCurrent && (
                  <Link to="/courses">
                    <Button size="sm" className="bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-bold shadow-xs">
                      Start Module <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                )}
                {isCompleted && (
                  <span className="text-xs font-bold text-[#2E7D32] flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Competency Verified
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
