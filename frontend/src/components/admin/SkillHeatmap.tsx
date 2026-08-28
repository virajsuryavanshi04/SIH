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
    if (!score) return "bg-[#FFFFFF] text-[#5D7180]/40 border-[#D8E5EC]";
    if (score >= 80) return "bg-[#2E8B57]/15 text-[#2E8B57] border-[#2E8B57]/30 font-bold hover:bg-[#2E8B57]/25";
    if (score >= 65) return "bg-[#176B87]/15 text-[#176B87] border-[#176B87]/30 font-bold hover:bg-[#176B87]/25";
    return "bg-[#D49A2A]/15 text-[#D49A2A] border-[#D49A2A]/30 font-bold hover:bg-[#D49A2A]/25";
  };

  return (
    <div className="min-w-[800px] border border-[#D8E5EC] rounded-xl overflow-hidden shadow-xs bg-[#FFFFFF]">
      <table className="w-full text-xs text-center border-collapse">
        <thead>
          <tr className="bg-[#EAF3F7] border-b border-[#D8E5EC]">
            <th className="p-3.5 border-r border-[#D8E5EC] text-left font-bold text-[#123047] uppercase tracking-wider w-56">
              Competency Domain
            </th>
            {data.departments.map(dept => (
              <th key={dept} className="p-3.5 font-bold text-[#123047] border-r last:border-0 border-[#D8E5EC] text-xs">
                {dept}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D8E5EC]">
          {data.competencies.map(comp => (
            <tr key={comp} className="hover:bg-[#EAF3F7] transition-colors">
              <td className="p-3.5 border-r border-[#D8E5EC] text-left font-bold text-[#123047] bg-[#FFFFFF]">
                {comp}
              </td>
              {data.departments.map(dept => {
                const cell = data.cells.find(c => c.comp === comp && c.dept === dept);
                const score = cell ? cell.score : 0;
                
                return (
                  <td key={`${comp}-${dept}`} className="p-2 border-r last:border-0 border-[#D8E5EC] bg-[#FFFFFF]">
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
                        <TooltipContent className="bg-[#123B5D] text-[#FFFFFF] text-xs border-0 p-2.5 rounded-lg shadow-lg">
                          <p className="font-bold text-[#35A7A0]">{comp}</p>
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

