import { cn } from '@/lib/utils';
import { HelpCircle, ThumbsUp, CheckCircle } from 'lucide-react';

interface Props {
  selectedLevel?: string;
  onSelect: (level: string) => void;
}

export default function ConfidenceSelector({ selectedLevel, onSelect }: Props) {
  const levels = [
    { id: 'low', label: 'Not Sure', icon: HelpCircle, color: 'text-[#D49A2A]', bg: 'bg-[#D49A2A]/15', activeBg: 'bg-[#D49A2A]/25 border-[#D49A2A] ring-2 ring-[#D49A2A]/20' },
    { id: 'medium', label: 'Somewhat Confident', icon: ThumbsUp, color: 'text-[#176B87]', bg: 'bg-[#176B87]/10', activeBg: 'bg-[#176B87]/20 border-[#176B87] ring-2 ring-[#176B87]/20' },
    { id: 'high', label: 'Very Confident', icon: CheckCircle, color: 'text-[#2E8B57]', bg: 'bg-[#2E8B57]/10', activeBg: 'bg-[#2E8B57]/20 border-[#2E8B57] ring-2 ring-[#2E8B57]/20' },
  ];

  return (
    <div className="space-y-3 pt-6 border-t border-[#D8E5EC]">
      <div className="text-center space-y-0.5">
        <span className="text-xs sm:text-sm font-semibold text-[#123047] uppercase tracking-wider">Metacognition: How confident are you?</span>
        <p className="text-xs text-[#5D7180]">Helps AI distinguish genuine mastery from lucky guessing</p>
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
                  : `border-[#D8E5EC] ${level.bg} text-[#123047] hover:border-[#176B87] font-medium`
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
