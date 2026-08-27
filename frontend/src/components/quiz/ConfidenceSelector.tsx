import { cn } from '@/lib/utils';
import { HelpCircle, ThumbsUp, CheckCircle } from 'lucide-react';

interface Props {
  selectedLevel?: string;
  onSelect: (level: string) => void;
}

export default function ConfidenceSelector({ selectedLevel, onSelect }: Props) {
  const levels = [
    { id: 'low', label: 'Not Sure', icon: HelpCircle, color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/15', activeBg: 'bg-[#D4AF37]/25 border-[#D4AF37] ring-2 ring-[#D4AF37]/20' },
    { id: 'medium', label: 'Somewhat Confident', icon: ThumbsUp, color: 'text-[#1F7A8C]', bg: 'bg-[#1F7A8C]/10', activeBg: 'bg-[#1F7A8C]/20 border-[#1F7A8C] ring-2 ring-[#1F7A8C]/20' },
    { id: 'high', label: 'Very Confident', icon: CheckCircle, color: 'text-[#2E7D32]', bg: 'bg-[#2E7D32]/10', activeBg: 'bg-[#2E7D32]/20 border-[#2E7D32] ring-2 ring-[#2E7D32]/20' },
  ];

  return (
    <div className="space-y-3 pt-6 border-t border-[#DCE5EA]">
      <div className="text-center space-y-0.5">
        <span className="text-xs sm:text-sm font-semibold text-[#102A43] uppercase tracking-wider">Metacognition: How confident are you?</span>
        <p className="text-xs text-[#62748A]">Helps AI distinguish genuine mastery from lucky guessing</p>
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
                  : `border-[#DCE5EA] ${level.bg} text-[#102A43] hover:border-[#1F7A8C] font-medium`
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
