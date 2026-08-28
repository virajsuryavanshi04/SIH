import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getPriorityColor } from '@/lib/utils';
import { AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  data: any;
  onClick: () => void;
}

export default function CompetencyCard({ data, onClick }: Props) {
  const isTargetMet = data.current_score >= data.required_level;
  const isCritical = data.gap > 20;
  
  return (
    <Card 
      className="cursor-pointer hover:border-[#176B87] hover:shadow-md transition-all group bg-[#FFFFFF] border-[#D8E5EC] rounded-2xl" 
      onClick={onClick}
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-[#123047] group-hover:text-[#176B87] transition-colors text-sm">
              {data.name}
            </h3>
            <span className="text-xs font-semibold text-[#5D7180]">{data.domain}</span>
          </div>
          {data.gap > 0 ? (
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono",
              isCritical ? "bg-[#D9534F]/10 text-[#D9534F] border-[#D9534F]/30" : "bg-[#D49A2A]/15 text-[#123047] border-[#D49A2A]/30"
            )}>
              {data.priority === 'CRITICAL' ? 'Priority Gap' : 'Needs Attention'}
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2E8B57]/10 text-[#2E8B57] border border-[#2E8B57]/30 font-mono">
              Proficient
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span>Current: <strong className="text-[#123047] font-mono">{data.current_score}%</strong></span>
            <span className="text-[#5D7180] font-mono">Target: {data.required_level}%</span>
          </div>
          <Progress 
            value={data.current_score} 
            indicatorColor={isTargetMet ? 'bg-[#2E8B57]' : 'bg-[#176B87]'} 
          />
        </div>

        {data.prerequisite_gaps?.length > 0 ? (
          <div className="flex items-start gap-1.5 bg-[#D49A2A]/15 text-[#123047] p-2 rounded-lg text-[11px] border border-[#D49A2A]/30 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#D49A2A]" />
            <span>Prerequisite: {data.prerequisite_gaps.join(', ')}</span>
          </div>
        ) : (
          <div className="flex justify-end text-[11px] font-bold text-[#176B87] group-hover:translate-x-0.5 transition-transform items-center">
            Inspect Gap Diagnosis <ChevronRight className="w-3 h-3 ml-0.5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

