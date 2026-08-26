import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ArrowUp, Award } from 'lucide-react';

interface Props {
  score: number;
  delta: number;
}

export default function CompetencyRadial({ score, delta }: Props) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const size = 190;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-[190px] h-[190px]">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            className="text-[#2B2D42]/10"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Progress circle */}
          <circle
            className={cn(
              "transition-all duration-1000 ease-out",
              score >= 80 ? "text-[#2E7D32]" : score >= 60 ? "text-[#1F7A8C]" : "text-[#D4AF37]"
            )}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-[#0B2545] font-mono">{Math.round(animatedScore)}%</span>
          <span className="text-xs text-[#2B2D42]/60 font-bold uppercase tracking-wider mt-0.5">Proficiency</span>
        </div>
      </div>
      
      {delta > 0 && (
        <div className="mt-3 flex items-center bg-[#2E7D32]/10 text-[#2E7D32] border border-[#2E7D32]/20 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
          <ArrowUp className="w-3.5 h-3.5 mr-1 text-[#2E7D32]" />
          +{delta}% improvement this month
        </div>
      )}
    </div>
  );
}
