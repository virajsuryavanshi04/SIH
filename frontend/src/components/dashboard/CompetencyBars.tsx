import { CompetencyScore } from '@/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface Props {
  competencies: CompetencyScore[];
}

export default function CompetencyBars({ competencies }: Props) {
  return (
    <div className="space-y-4 mt-2">
      {competencies.map((comp) => {
        const isTargetMet = comp.score >= comp.required_level;
        const isCritical = comp.gap > 20;
        const barColor = comp.score >= 80 ? "bg-[#2E7D32]" : "bg-[#1F7A8C]";
                         
        return (
          <div key={comp.competency_id} className="p-3 rounded-xl bg-[#FFFFFF] hover:bg-[#F4F6F9] transition-colors border border-[#2B2D42]/10">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="font-bold text-[#0B2545]">{comp.competency_name}</span>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-[#0B2545] font-mono">{comp.score}%</span>
                <span className="text-[#2B2D42]/60 text-xs font-mono">/ {comp.required_level}% req</span>
                {isTargetMet ? (
                  <span className="inline-flex items-center text-[11px] font-bold text-[#2E7D32] bg-[#2E7D32]/10 px-2 py-0.5 rounded-full border border-[#2E7D32]/30 font-mono">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Met
                  </span>
                ) : isCritical ? (
                  <span className="inline-flex items-center text-[11px] font-bold text-[#D4AF37] bg-[#D4AF37]/15 px-2 py-0.5 rounded-full border border-[#D4AF37]/30 font-mono">
                    <AlertCircle className="w-3 h-3 mr-1" /> -{comp.gap}pt Priority Gap
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[11px] font-bold text-[#D4AF37] bg-[#D4AF37]/15 px-2 py-0.5 rounded-full border border-[#D4AF37]/30 font-mono">
                    <AlertTriangle className="w-3 h-3 mr-1" /> -{comp.gap}pt Needs Attention
                  </span>
                )}
              </div>
            </div>
            <div className="relative h-2 w-full bg-[#2B2D42]/10 rounded-full overflow-hidden">
              <div 
                className={cn("absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out", barColor)} 
                style={{ width: `${comp.score}%` }} 
              />
              <div 
                className="absolute top-0 bottom-0 w-1 bg-[#0B2545] z-10 rounded"
                style={{ left: `${comp.required_level}%` }}
                title={`Required Target: ${comp.required_level}%`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
