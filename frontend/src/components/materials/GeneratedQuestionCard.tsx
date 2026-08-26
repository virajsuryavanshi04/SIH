import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  question: any;
}

export default function GeneratedQuestionCard({ question }: Props) {
  return (
    <Card className="border border-[#2B2D42]/10 bg-[#FFFFFF] shadow-sm">
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-start gap-4">
          <h4 className="font-bold text-base text-[#0B2545]">{question.text}</h4>
          <div className="flex gap-2 shrink-0">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1F7A8C]/10 text-[#1F7A8C] border border-[#1F7A8C]/20 font-mono">
              {question.competency_tag}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#0B2545]/10 text-[#0B2545] border border-[#0B2545]/20 font-mono">
              {question.difficulty}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {question.options.map((opt: any, i: number) => (
            <div 
              key={i} 
              className={cn(
                "p-3 rounded-lg border text-xs flex items-center justify-between font-medium",
                opt.is_correct 
                  ? "border-[#2E7D32]/30 bg-[#2E7D32]/10 text-[#2E7D32] font-bold" 
                  : "border-[#2B2D42]/15 bg-[#FFFFFF] text-[#2B2D42]"
              )}
            >
              <span>{opt.text}</span>
              {opt.is_correct && <Check className="w-4 h-4 text-[#2E7D32]" />}
            </div>
          ))}
        </div>

        <div className="bg-[#F4F6F9] p-3.5 rounded-lg border border-[#2B2D42]/10 text-xs flex gap-2 items-start mt-4">
          <Info className="w-4 h-4 text-[#1F7A8C] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#0B2545]">Source Explanation: </span>
            <span className="text-[#2B2D42]/80">{question.explanation}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
