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
    if (diff === '1' || diff === 'beginner') return { label: 'Level 1: Foundational', color: 'bg-[#2E8B57]/10 text-[#2E8B57] border-[#2E8B57]/30' };
    if (diff === '2' || diff === 'intermediate') return { label: 'Level 2: Applied', color: 'bg-[#176B87]/10 text-[#176B87] border-[#176B87]/30' };
    return { label: 'Level 3: Policy & Analysis', color: 'bg-[#D49A2A]/15 text-[#123047] border-[#D49A2A]/40' };
  };

  const diffTag = getDifficultyLabel(question.difficulty);

  return (
    <div className="space-y-5 text-left">
      
      {/* Classification Metadata Badges */}
      <div className="flex flex-wrap items-center gap-2">
        {question.competency_name && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-mono font-bold bg-[#123B5D] text-[#FFFFFF]">
            <Target className="w-3.5 h-3.5 text-[#D49A2A]" />
            <span>{question.competency_name}</span>
          </span>
        )}

        {question.topic_name && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium bg-[#EAF3F7] text-[#123047] border border-[#D8E5EC]">
            <Layers className="w-3.5 h-3.5 text-[#176B87]" />
            <span>{question.topic_name}</span>
          </span>
        )}

        <span className={cn("px-3 py-1 rounded-md text-xs font-mono font-bold border", diffTag.color)}>
          {diffTag.label}
        </span>
      </div>

      {/* Question Text */}
      <h2 className="text-lg sm:text-xl font-bold text-[#123047] leading-snug pt-1">
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
                  ? "border-[#176B87] bg-[#176B87]/5 shadow-xs ring-2 ring-[#176B87]/20" 
                  : "border-[#D8E5EC] hover:border-[#176B87]/50 hover:bg-[#EAF3F7] bg-[#FFFFFF]"
              )}
              onClick={() => onSelect(option.id)}
            >
              <div className="p-4 sm:p-4.5 flex items-center gap-3.5">
                <div className={cn(
                  "flex-shrink-0 transition-colors",
                  isSelected ? "text-[#176B87]" : "text-[#5D7180]/40"
                )}>
                  {isSelected ? <CheckCircle2 className="w-5 h-5 text-[#176B87]" /> : <Circle className="w-5 h-5" />}
                </div>
                <span className={cn(
                  "text-sm sm:text-[15px] leading-relaxed",
                  isSelected ? "font-semibold text-[#123047]" : "text-[#123047] font-normal"
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

