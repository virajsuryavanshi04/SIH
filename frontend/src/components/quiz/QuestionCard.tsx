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
  question_type?: string;
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
    if (diff === '2' || diff === 'intermediate') return { label: 'Level 2: Applied', color: 'bg-[#A85D4C]/10 text-[#A85D4C] border-[#A85D4C]/30' };
    return { label: 'Level 3: Policy & Analysis', color: 'bg-[#B38A3D]/15 text-[#292B2B] border-[#B38A3D]/40' };
  };

  const getTypeLabel = (type?: string) => {
    if (type === 'WORD_PROBLEM') return 'Word Problem';
    if (type === 'CASE_STUDY') return 'Case Study';
    return 'Short MCQ';
  };

  const diffTag = getDifficultyLabel(question.difficulty);

  return (
    <div className="space-y-5 text-left">
      
      {/* Classification Metadata Badges */}
      <div className="flex flex-wrap items-center gap-2">
        {question.competency_name && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-mono font-bold bg-[#2D3030] text-[#FFFDF9]">
            <Target className="w-3.5 h-3.5 text-[#B38A3D]" />
            <span>{question.competency_name}</span>
          </span>
        )}

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-[#EFEBE4] text-[#A85D4C] border border-[#E2DDD5]">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{getTypeLabel(question.question_type)}</span>
        </span>

        {question.topic_name && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium bg-[#EFEBE4] text-[#292B2B] border border-[#E2DDD5]">
            <Layers className="w-3.5 h-3.5 text-[#A85D4C]" />
            <span>{question.topic_name}</span>
          </span>
        )}

        <span className={cn("px-3 py-1 rounded-md text-xs font-mono font-bold border", diffTag.color)}>
          {diffTag.label}
        </span>
      </div>

      {/* Question Text */}
      <h2 className="text-lg sm:text-xl font-bold text-[#292B2B] leading-snug pt-1">
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
                "cursor-pointer transition-all duration-200 ease-out border rounded-xl active:scale-[0.995]",
                isSelected 
                  ? "border-[#A85D4C] bg-[#A85D4C]/5 shadow-[0_1px_3px_rgba(168,93,76,0.15)] ring-2 ring-[#A85D4C]/25" 
                  : "border-[#E2DDD5] hover:border-[#A85D4C]/50 hover:bg-[#F7F4EE] hover:shadow-xs bg-[#FFFDF9]"
              )}
              onClick={() => onSelect(option.id)}
            >
              <div className="p-4 sm:p-4.5 flex items-center gap-3.5">
                <div className={cn(
                  "flex-shrink-0 transition-colors",
                  isSelected ? "text-[#A85D4C]" : "text-[#7A756E]/40"
                )}>
                  {isSelected ? <CheckCircle2 className="w-5 h-5 text-[#A85D4C]" /> : <Circle className="w-5 h-5" />}
                </div>
                <span className={cn(
                  "text-sm sm:text-[15px] leading-relaxed",
                  isSelected ? "font-semibold text-[#292B2B]" : "text-[#292B2B] font-normal"
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

