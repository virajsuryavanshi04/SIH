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
      <div className="bg-[#2D3030] text-[#FFFDF9] px-6 py-3.5 rounded-xl font-bold shadow-md flex items-center space-x-2 border border-[#2D3030]">
        <Brain className="w-5 h-5 text-[#A85D4C]" />
        <span>India's Official Statistical System Competency Framework</span>
      </div>
      
      {/* Branch Connectors */}
      <div className="w-0.5 h-6 bg-[#E2DDD5]"></div>
      <div className="w-full max-w-3xl h-0.5 bg-[#E2DDD5] relative">
        <div className="absolute left-[10%] top-0 w-0.5 h-6 bg-[#E2DDD5]"></div>
        <div className="absolute left-[36%] top-0 w-0.5 h-6 bg-[#E2DDD5]"></div>
        <div className="absolute left-[63%] top-0 w-0.5 h-6 bg-[#E2DDD5]"></div>
        <div className="absolute left-[90%] top-0 w-0.5 h-6 bg-[#E2DDD5]"></div>
      </div>

      {/* Domain Branches */}
      <div className="grid grid-cols-4 w-full max-w-4xl gap-4 pt-6">
        {domains.map((dom) => {
          const domainComps = data.filter(d => d.domain === dom.name || d.domain.includes(dom.name.split(' ')[0])) || [];
          
          return (
            <div key={dom.name} className="flex flex-col items-center">
              <div className="bg-[#A85D4C]/10 border border-[#A85D4C]/20 px-3 py-1.5 rounded-lg text-xs font-bold text-[#A85D4C] mb-4 text-center w-full shadow-2xs">
                {dom.name}
              </div>
              <div className="space-y-3 w-full">
                {domainComps.length > 0 ? domainComps.map(comp => {
                  const isMet = comp.gap === 0;
                  const isCritical = comp.gap > 20;

                  return (
                    <div 
                      key={comp.id} 
                      className="p-3.5 rounded-xl border border-[#E2DDD5] cursor-pointer transition-all hover:border-[#A85D4C] shadow-xs hover:shadow-md bg-[#FFFDF9] group"
                      onClick={() => onNodeClick(comp)}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-[#292B2B] group-hover:text-[#7D4036] transition-colors truncate">
                          {comp.name}
                        </span>
                        {isMet ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2E8B57] shrink-0" />
                        ) : isCritical ? (
                          <AlertCircle className="w-3.5 h-3.5 text-[#D9534F] shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-[#B38A3D] shrink-0" />
                        )}
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-[#7A756E] font-medium">
                        <span>Score: <strong className="text-[#292B2B] font-mono">{comp.current_score}%</strong></span>
                        {comp.gap > 0 ? (
                          <span className={cn(
                            "px-1.5 py-0.2 rounded font-bold text-[10px] font-mono",
                            isCritical ? "bg-[#D9534F]/10 text-[#D9534F]" : "bg-[#B38A3D]/15 text-[#292B2B]"
                          )}>
                            -{comp.gap}pt gap
                          </span>
                        ) : (
                          <span className="bg-[#2E8B57]/10 text-[#2E8B57] px-1.5 py-0.2 rounded font-bold text-[10px] font-mono">
                            Met
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="p-3 rounded-lg border border-dashed border-[#E2DDD5] text-center text-xs text-[#8C857B]">
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

