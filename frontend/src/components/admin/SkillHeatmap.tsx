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
    if (!score) return "bg-[#FFFDF9] text-[#7A756E]/40 border-[#E2DDD5]";
    if (score >= 80) return "bg-[#2E8B57]/15 text-[#2E8B57] border-[#2E8B57]/30 font-bold hover:bg-[#2E8B57]/25";
    if (score >= 65) return "bg-[#A85D4C]/15 text-[#A85D4C] border-[#A85D4C]/30 font-bold hover:bg-[#A85D4C]/25";
    return "bg-[#B38A3D]/15 text-[#B38A3D] border-[#B38A3D]/30 font-bold hover:bg-[#B38A3D]/25";
  };

  return (
    <div className="min-w-[800px] border border-[#E2DDD5] rounded-xl overflow-hidden shadow-xs bg-[#FFFDF9]">
      <table className="w-full text-xs text-center border-collapse">
        <thead>
          <tr className="bg-[#EFEBE4] border-b border-[#E2DDD5]">
            <th className="p-3.5 border-r border-[#E2DDD5] text-left font-bold text-[#292B2B] uppercase tracking-wider w-56">
              Competency Domain
            </th>
            {data.departments.map(dept => (
              <th key={dept} className="p-3.5 font-bold text-[#292B2B] border-r last:border-0 border-[#E2DDD5] text-xs">
                {dept}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2DDD5]">
          {data.competencies.map(comp => (
            <tr key={comp} className="hover:bg-[#EFEBE4] transition-colors">
              <td className="p-3.5 border-r border-[#E2DDD5] text-left font-bold text-[#292B2B] bg-[#FFFDF9]">
                {comp}
              </td>
              {data.departments.map(dept => {
                const cell = data.cells.find(c => c.comp === comp && c.dept === dept);
                const score = cell ? cell.score : 0;
                
                return (
                  <td key={`${comp}-${dept}`} className="p-2 border-r last:border-0 border-[#E2DDD5] bg-[#FFFDF9]">
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
                        <TooltipContent className="bg-[#2D3030] text-[#FFFDF9] text-xs border-0 p-2.5 rounded-lg shadow-lg">
                          <p className="font-bold text-[#7D4036]">{comp}</p>
                          <p className="text-[#FFFDF9]/80">{dept}</p>
                          <p className="mt-1 text-[#FFFDF9] font-bold font-mono">Department Average: {score}%</p>
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

