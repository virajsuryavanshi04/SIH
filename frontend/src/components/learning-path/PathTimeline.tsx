import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Lock, BookOpen, ExternalLink, ArrowRight, Sparkles, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export interface PathItem {
  id: number;
  learning_path_id?: number;
  title: string;
  description: string;
  item_type: string;
  reference_id?: number;
  competency_id?: number;
  competency_name?: string;
  provider?: string;
  igot_identifier?: string;
  external_url?: string;
  duration_display?: string;
  estimated_duration?: string;
  difficulty?: string;
  poster_image?: string;
  app_icon?: string;
  is_igot?: boolean;
  order: number;
  status: string; // completed, current, recommended, in_progress, locked
}

interface Props {
  items: PathItem[];
  onCompleteItem?: (id: number) => void;
}

export default function PathTimeline({ items, onCompleteItem }: Props) {
  const getIcon = (status: string) => {
    if (status === 'locked') return <Lock className="w-3.5 h-3.5 text-[#7A756E]/40" />;
    if (status === 'completed') return <CheckCircle2 className="w-3.5 h-3.5 text-[#FFFDF9]" />;
    return <BookOpen className="w-3.5 h-3.5 text-[#FFFDF9]" />;
  };

  return (
    <div className="relative pl-8 py-2 space-y-8 text-left">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isCompleted = item.status === 'completed';
        const isCurrent = item.status === 'current' || item.status === 'in_progress';
        const externalUrl = item.external_url || 'https://igotkarmayogi.gov.in/';
        const duration = item.duration_display || item.estimated_duration || '2h';
        const provider = item.provider || 'iGOT Karmayogi';

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
              {getIcon(item.status)}
            </div>

            {/* Content Card */}
            <div className={cn(
              "ml-6 p-5 sm:p-6 rounded-2xl border transition-all bg-[#FFFDF9]",
              isCurrent ? "border-[#A85D4C] shadow-sm ring-1 ring-[#A85D4C]/20" : 
              isCompleted ? "border-[#2E8B57]/30 bg-[#2E8B57]/5" : 
              "border-[#E2DDD5] opacity-90"
            )}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#A85D4C]/10 text-[#A85D4C] border border-[#A85D4C]/20 uppercase tracking-wider">
                      iGOT Module #{item.order}
                    </span>
                    {item.competency_name && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#EFEBE4] text-[#292B2B] border border-[#E2DDD5]">
                        {item.competency_name}
                      </span>
                    )}
                    {item.igot_identifier && (
                      <span className="text-[9px] font-mono text-[#7A756E] border border-[#E2DDD5] px-1.5 py-0.5 rounded bg-[#FFFDF9]">
                        {item.igot_identifier}
                      </span>
                    )}
                  </div>
                  <h3 className={cn("text-base sm:text-lg font-bold leading-snug", isCurrent ? "text-[#A85D4C]" : "text-[#292B2B]")}>
                    {item.title}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-start">
                  <span className="text-xs font-mono font-semibold text-[#292B2B] bg-[#EFEBE4] px-2.5 py-1 rounded-md border border-[#E2DDD5] shadow-2xs flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#A85D4C]" /> {duration}
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-[#7A756E] mb-4 leading-relaxed">{item.description}</p>
              
              <div className="flex flex-wrap justify-between items-center gap-3 pt-3 border-t border-[#E2DDD5]">
                <div className="flex items-center gap-2 text-xs font-mono text-[#7A756E]">
                  <span>Provider: <strong className="text-[#292B2B] font-semibold">{provider}</strong></span>
                  {item.difficulty && (
                    <>
                      <span>•</span>
                      <span className="capitalize font-medium text-[#292B2B] bg-[#EFEBE4] px-2 py-0.5 rounded border border-[#E2DDD5]">
                        {item.difficulty}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {onCompleteItem && !isCompleted && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onCompleteItem(item.id)}
                      className="text-xs font-semibold border-[#E2DDD5] text-[#292B2B] hover:bg-[#EFEBE4] h-8.5 px-3 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 mr-1 text-[#2E8B57]" />
                      <span>Mark Complete</span>
                    </Button>
                  )}

                  <a 
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button 
                      size="sm" 
                      className={cn(
                        "font-semibold text-xs sm:text-sm shadow-xs h-8.5 px-4 flex items-center gap-1.5 cursor-pointer transition-all duration-200 ease-out",
                        isCompleted 
                          ? "bg-[#2E8B57] hover:bg-[#236B43] text-[#FFFDF9]" 
                          : "bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9]"
                      )}
                    >
                      <span>Learn on iGOT</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

