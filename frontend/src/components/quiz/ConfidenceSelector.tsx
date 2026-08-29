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
    <div className="space-y-3 pt-6 border-t border-[#E2DDD5]">
      <div className="text-center space-y-0.5">
        <span className="text-xs sm:text-sm font-semibold text-[#292B2B] uppercase tracking-wider">Metacognition: How confident are you?</span>
        <p className="text-xs text-[#7A756E]">Helps AI distinguish genuine mastery from lucky guessing</p>
      </div>
      <div className="flex gap-3 sm:gap-4">
        {levels.map((level) => {
          const isSelected = selectedLevel === level.id;
          
          return (
            <button
              key={level.id}
              onClick={() => onSelect(level.id)}
              className={cn(
                "flex-1 py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer",
                isSelected 
                  ? `${level.activeBg} ${level.color} shadow-xs font-semibold` 
                  : `border-[#E2DDD5] ${level.bg} text-[#292B2B] hover:border-[#A85D4C] font-medium`
              )}
            >
              <level.icon className="w-5 h-5" />
              <span className="text-xs sm:text-sm font-semibold">{level.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
