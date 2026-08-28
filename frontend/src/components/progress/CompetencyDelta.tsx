import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  start: number;
  current: number;
  delta: number;
}

export default function CompetencyDelta({ start, current, delta }: Props) {
  const isPositive = delta > 0;
  const isNegative = delta < 0;
  
  return (
    <div className="flex items-center justify-between p-4 bg-[#EAF3F7] rounded-xl border border-[#D8E5EC]">
      <div className="flex items-center gap-4 text-center">
        <div>
          <div className="text-[10px] text-[#5D7180] uppercase font-bold mb-1 font-mono">Initial</div>
          <div className="text-2xl font-bold text-[#123047] font-mono">{start}%</div>
        </div>
        
        <div className="text-[#5D7180]/30 w-12 flex items-center justify-center">
          <div className="w-full h-px bg-[#D8E5EC] relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t border-r border-[#5D7180] transform rotate-45" />
          </div>
        </div>
        
        <div>
          <div className="text-[10px] text-[#176B87] uppercase font-bold mb-1 font-mono">Current</div>
          <div className="text-2xl font-bold text-[#176B87] font-mono">{current}%</div>
        </div>
      </div>
      
      <div className={cn(
        "flex flex-col items-end justify-center px-4 py-2 rounded-lg text-sm font-bold font-mono",
        isPositive ? "bg-[#2E8B57]/10 text-[#2E8B57] border border-[#2E8B57]/30" : isNegative ? "bg-[#D9534F]/10 text-[#D9534F] border border-[#D9534F]/30" : "bg-[#FFFFFF] text-[#123047] border border-[#D8E5EC]"
      )}>
        <div className="flex items-center gap-1">
          {isPositive ? <TrendingUp className="w-4 h-4" /> : isNegative ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          {Math.abs(delta)}%
        </div>
        <div className="text-[10px] uppercase opacity-80">Growth</div>
      </div>
    </div>
  );
}

