import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Circle, CheckCircle2, BookOpen, Layers, Target } from 'lucide-react';

interface Option {
  id: number | string;
  text: string;
  order: number;
}

export interface QuestionData {
  id: number;
  text: string;
  question_text?: string;
  difficulty?: string;
  competency_id?: number;
  competency_name?: string;
  topic_id?: number;
  topic_name?: string;
  cognitive_level?: string;
  options: Option[];
}

interface Props {
  question: QuestionData;
  selectedOption?: number | string;
  onSelect: (optionId: number | string) => void;
}

export default function QuestionCard({ question, selectedOption, onSelect }: Props) {
  const getDifficultyLabel = (diff?: string) => {
    if (diff === '1' || diff === 'beginner') return { label: 'Level 1: Foundational', color: 'bg-[#2E7D32]/10 text-[#2E7D32] border-[#2E7D32]/30' };
    if (diff === '2' || diff === 'intermediate') return { label: 'Level 2: Applied', color: 'bg-[#1F7A8C]/10 text-[#1F7A8C] border-[#1F7A8C]/30' };
    return { label: 'Level 3: Policy & Analysis', color: 'bg-[#D4AF37]/15 text-[#0B2545] border-[#D4AF37]/40' };
  };

  const diffTag = getDifficultyLabel(question.difficulty);

  return (
    <div className="space-y-5 text-left">
      
      {/* Classification Metadata Badges */}
      <div className="flex flex-wrap items-center gap-2">
        {question.competency_name && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#0B2545] text-[#FFFFFF]">
            <Target className="w-3 h-3 text-[#D4AF37]" />
            <span>{question.competency_name}</span>
          </span>
        )}

        {question.topic_name && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-[#F4F6F9] text-[#2B2D42] border border-[#2B2D42]/15">
            <Layers className="w-3 h-3 text-[#1F7A8C]" />
            <span>{question.topic_name}</span>
          </span>
        )}

        <span className={cn("px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold border", diffTag.color)}>
          {diffTag.label}
        </span>
      </div>

      {/* Question Text */}
      <h2 className="text-lg sm:text-xl font-bold text-[#0B2545] leading-relaxed pt-1">
        {question.question_text || question.text}
      </h2>
      
      {/* Options List */}
      <div className="space-y-3 pt-2">
        {question.options.map((option) => {
          const isSelected = String(selectedOption) === String(option.id);
          
          return (
            <Card 
              key={option.id}
              className={cn(
                "cursor-pointer transition-all border rounded-xl",
                isSelected 
                  ? "border-[#1F7A8C] bg-[#1F7A8C]/5 shadow-xs ring-2 ring-[#1F7A8C]/20" 
                  : "border-[#2B2D42]/15 hover:border-[#1F7A8C]/50 hover:bg-[#F4F6F9] bg-[#FFFFFF]"
              )}
              onClick={() => onSelect(option.id)}
            >
              <div className="p-4 flex items-center gap-3.5">
                <div className={cn(
                  "flex-shrink-0 transition-colors",
                  isSelected ? "text-[#1F7A8C]" : "text-[#2B2D42]/40"
                )}>
                  {isSelected ? <CheckCircle2 className="w-5 h-5 text-[#1F7A8C]" /> : <Circle className="w-5 h-5" />}
                </div>
                <span className={cn(
                  "text-xs sm:text-sm leading-relaxed",
                  isSelected ? "font-bold text-[#0B2545]" : "text-[#2B2D42] font-medium"
                )}>
                  {option.text}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
