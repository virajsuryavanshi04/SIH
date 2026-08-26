import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Brain, ArrowRight, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface Props {
  data: any[];
  onNodeClick: (node: any) => void;
}

export default function CompetencyTree({ data, onNodeClick }: Props) {
  const domains = [
    { name: 'Core Theory', label: 'Foundational' },
    { name: 'Operations', label: 'Survey & Sampling' },
    { name: 'Analytics', label: 'Processing & Viz' },
    { name: 'Technology', label: 'Programming & ML' }
  ];

  return (
    <div className="p-6 min-w-[840px] flex flex-col items-center">
      {/* Root Node */}
      <div className="bg-[#0B2545] text-[#FFFFFF] px-6 py-3.5 rounded-xl font-bold shadow-md flex items-center space-x-2 border border-[#0B2545]">
        <Brain className="w-5 h-5 text-[#1F7A8C]" />
        <span>India's Official Statistical System Competency Framework</span>
      </div>
      
      {/* Branch Connectors */}
      <div className="w-0.5 h-6 bg-[#2B2D42]/40"></div>
      <div className="w-full max-w-3xl h-0.5 bg-[#2B2D42]/20 relative">
        <div className="absolute left-[10%] top-0 w-0.5 h-6 bg-[#2B2D42]/20"></div>
        <div className="absolute left-[36%] top-0 w-0.5 h-6 bg-[#2B2D42]/20"></div>
        <div className="absolute left-[63%] top-0 w-0.5 h-6 bg-[#2B2D42]/20"></div>
        <div className="absolute left-[90%] top-0 w-0.5 h-6 bg-[#2B2D42]/20"></div>
      </div>

      {/* Domain Branches */}
      <div className="grid grid-cols-4 w-full max-w-4xl gap-4 pt-6">
        {domains.map((dom) => {
          const domainComps = data.filter(d => d.domain === dom.name || d.domain.includes(dom.name.split(' ')[0])) || [];
          
          return (
            <div key={dom.name} className="flex flex-col items-center">
              <div className="bg-[#1F7A8C]/10 border border-[#1F7A8C]/20 px-3 py-1.5 rounded-lg text-xs font-bold text-[#1F7A8C] mb-4 text-center w-full shadow-2xs">
                {dom.name}
              </div>
              <div className="space-y-3 w-full">
                {domainComps.length > 0 ? domainComps.map(comp => {
                  const isMet = comp.gap === 0;
                  const isCritical = comp.gap > 20;

                  return (
                    <div 
                      key={comp.id} 
                      className="p-3.5 rounded-xl border border-[#2B2D42]/10 cursor-pointer transition-all hover:border-[#1F7A8C] shadow-xs hover:shadow-md bg-[#FFFFFF] group"
                      onClick={() => onNodeClick(comp)}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-[#0B2545] group-hover:text-[#1F7A8C] transition-colors truncate">
                          {comp.name}
                        </span>
                        {isMet ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
                        ) : isCritical ? (
                          <AlertCircle className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        )}
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-[#2B2D42]/60 font-medium">
                        <span>Score: <strong className="text-[#0B2545] font-mono">{comp.current_score}%</strong></span>
                        {comp.gap > 0 ? (
                          <span className={cn(
                            "px-1.5 py-0.2 rounded font-bold text-[10px] font-mono",
                            isCritical ? "bg-[#D4AF37]/15 text-[#D4AF37]" : "bg-[#D4AF37]/15 text-[#D4AF37]"
                          )}>
                            -{comp.gap}pt gap
                          </span>
                        ) : (
                          <span className="bg-[#2E7D32]/10 text-[#2E7D32] px-1.5 py-0.2 rounded font-bold text-[10px] font-mono">
                            Met
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="p-3 rounded-lg border border-dashed border-[#2B2D42]/20 text-center text-xs text-[#2B2D42]/40">
                    No nodes
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
