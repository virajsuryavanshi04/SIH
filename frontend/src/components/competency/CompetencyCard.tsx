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
      className="cursor-pointer hover:border-[#1F7A8C] hover:shadow-md transition-all group bg-[#FFFFFF] border-[#2B2D42]/10" 
      onClick={onClick}
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-[#0B2545] group-hover:text-[#1F7A8C] transition-colors text-sm">
              {data.name}
            </h3>
            <span className="text-xs font-semibold text-[#2B2D42]/60">{data.domain}</span>
          </div>
          {data.gap > 0 ? (
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono",
              isCritical ? "bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30" : "bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30"
            )}>
              {data.priority === 'CRITICAL' ? 'Priority Gap' : 'Needs Attention'}
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2E7D32]/10 text-[#2E7D32] border border-[#2E7D32]/30 font-mono">
              Proficient
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span>Current: <strong className="text-[#0B2545] font-mono">{data.current_score}%</strong></span>
            <span className="text-[#2B2D42]/60 font-mono">Target: {data.required_level}%</span>
          </div>
          <Progress 
            value={data.current_score} 
            indicatorColor={isTargetMet ? 'bg-[#2E7D32]' : 'bg-[#1F7A8C]'} 
          />
        </div>

        {data.prerequisite_gaps?.length > 0 ? (
          <div className="flex items-start gap-1.5 bg-[#D4AF37]/15 text-[#D4AF37] p-2 rounded-lg text-[11px] border border-[#D4AF37]/30 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Prerequisite: {data.prerequisite_gaps.join(', ')}</span>
          </div>
        ) : (
          <div className="flex justify-end text-[11px] font-bold text-[#1F7A8C] group-hover:translate-x-0.5 transition-transform items-center">
            Inspect Gap Diagnosis <ChevronRight className="w-3 h-3 ml-0.5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
