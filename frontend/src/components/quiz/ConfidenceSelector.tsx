import { cn } from '@/lib/utils';
import { HelpCircle, ThumbsUp, CheckCircle } from 'lucide-react';

interface Props {
  selectedLevel?: string;
  onSelect: (level: string) => void;
}

export default function ConfidenceSelector({ selectedLevel, onSelect }: Props) {
  const levels = [
    { id: 'low', label: 'Not Sure', icon: HelpCircle, color: 'text-[#B38A3D]', bg: 'bg-[#B38A3D]/15', activeBg: 'bg-[#B38A3D]/25 border-[#B38A3D] ring-2 ring-[#B38A3D]/20' },
    { id: 'medium', label: 'Somewhat Confident', icon: ThumbsUp, color: 'text-[#A85D4C]', bg: 'bg-[#A85D4C]/10', activeBg: 'bg-[#A85D4C]/20 border-[#A85D4C] ring-2 ring-[#A85D4C]/20' },
    { id: 'high', label: 'Very Confident', icon: CheckCircle, color: 'text-[#2E8B57]', bg: 'bg-[#2E8B57]/10', activeBg: 'bg-[#2E8B57]/20 border-[#2E8B57] ring-2 ring-[#2E8B57]/20' },
  ];

  return (
    <div className="space-y-1.5">
      <div className="text-center space-y-0.5">
        <span className="text-[11px] sm:text-xs font-semibold text-[#292B2B] uppercase tracking-wider">Metacognition: How confident are you in this answer?</span>
      </div>
      <div className="flex gap-2 sm:gap-3">
        {levels.map((level) => {
          const isSelected = selectedLevel === level.id;
          
          return (
            <button
              key={level.id}
              onClick={() => onSelect(level.id)}
              className={cn(
                "flex-1 py-1.5 sm:py-2 px-2.5 rounded-lg border flex flex-row items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer",
                isSelected 
                  ? `${level.activeBg} ${level.color} shadow-2xs font-semibold` 
                  : `border-[#E2DDD5] ${level.bg} text-[#292B2B] hover:border-[#A85D4C] font-medium`
              )}
            >
              <level.icon className="w-4 h-4" />
              <span className="text-xs sm:text-sm font-semibold">{level.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
