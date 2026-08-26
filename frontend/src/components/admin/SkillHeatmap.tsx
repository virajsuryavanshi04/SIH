import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  data: {
    departments: string[];
    competencies: string[];
    cells: { comp: string; dept: string; score: number }[];
  }
}

export default function SkillHeatmap({ data }: Props) {
  const getCellColor = (score: number) => {
    if (!score) return "bg-[#FFFFFF] text-[#2B2D42]/40 border-[#2B2D42]/10";
    if (score >= 80) return "bg-[#2E7D32]/15 text-[#2E7D32] border-[#2E7D32]/30 font-bold hover:bg-[#2E7D32]/25";
    if (score >= 65) return "bg-[#1F7A8C]/15 text-[#1F7A8C] border-[#1F7A8C]/30 font-bold hover:bg-[#1F7A8C]/25";
    return "bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30 font-bold hover:bg-[#D4AF37]/25";
  };

  return (
    <div className="min-w-[800px] border border-[#2B2D42]/10 rounded-xl overflow-hidden shadow-xs bg-[#FFFFFF]">
      <table className="w-full text-xs text-center border-collapse">
        <thead>
          <tr className="bg-[#F4F6F9] border-b border-[#2B2D42]/10">
            <th className="p-3.5 border-r border-[#2B2D42]/10 text-left font-bold text-[#0B2545] uppercase tracking-wider w-56">
              Competency Domain
            </th>
            {data.departments.map(dept => (
              <th key={dept} className="p-3.5 font-bold text-[#0B2545] border-r last:border-0 border-[#2B2D42]/10 text-xs">
                {dept}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2B2D42]/10">
          {data.competencies.map(comp => (
            <tr key={comp} className="hover:bg-[#F4F6F9] transition-colors">
              <td className="p-3.5 border-r border-[#2B2D42]/10 text-left font-bold text-[#0B2545] bg-[#FFFFFF]">
                {comp}
              </td>
              {data.departments.map(dept => {
                const cell = data.cells.find(c => c.comp === comp && c.dept === dept);
                const score = cell ? cell.score : 0;
                
                return (
                  <td key={`${comp}-${dept}`} className="p-2 border-r last:border-0 border-[#2B2D42]/10 bg-[#FFFFFF]">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={cn(
                            "w-full py-2.5 rounded-lg border text-xs transition-all cursor-help shadow-2xs font-mono",
                            getCellColor(score)
                          )}>
                            {score ? `${score}%` : '—'}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#0B2545] text-[#FFFFFF] text-xs border-0 p-2.5 rounded-lg shadow-lg">
                          <p className="font-bold text-[#1F7A8C]">{comp}</p>
                          <p className="text-[#FFFFFF]/80">{dept}</p>
                          <p className="mt-1 text-[#FFFFFF] font-bold font-mono">Department Average: {score}%</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
