import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Check, 
  X, 
  Edit3, 
  BookOpen, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GeneratedQuestionCardProps {
  question: any;
  index: number;
  total: number;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onEditSave?: (id: number, updatedData: any) => void;
}

export default function GeneratedQuestionCard({
  question,
  index,
  total,
  onApprove,
  onReject,
  onEditSave
}: GeneratedQuestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(question.text || question.question_text || '');
  const [editExplanation, setEditExplanation] = useState(question.explanation || '');

  const qText = question.text || question.question_text || '';
  const options = question.options || [];
  const compName = question.competency_name || question.competency_tag || question.competency || 'Sampling Techniques';
  const topicName = question.topic_name || question.topic || 'Stratified Sampling';
  const difficultyLabel = question.difficulty === '1' || question.difficulty === 'Easy' ? 'Foundational'
    : question.difficulty === '3' || question.difficulty === 'Hard' ? 'Advanced'
    : 'Intermediate';
  const sourceRef = question.source_reference || 'MoSPI Official Handbook (Section 4.2)';
  const status = question.status || 'pending_review';

  // Find correct answer text and option letter
  const correctOptIndex = options.findIndex((o: any) => o.is_correct || o.text === question.correct_answer || o.option_text === question.correct_answer);
  const correctOptLetter = correctOptIndex >= 0 ? String.fromCharCode(65 + correctOptIndex) : 'A';
  const correctOptText = correctOptIndex >= 0 
    ? (options[correctOptIndex].text || options[correctOptIndex].option_text) 
    : (question.correct_answer || 'Neyman Optimal Allocation Stratified Sampling');

  const handleSaveEdit = () => {
    if (onEditSave) {
      onEditSave(question.id, {
        text: editText,
        explanation: editExplanation
      });
    }
    setIsEditing(false);
  };

  return (
    <Card className="border border-[#E2DDD5] bg-[#FFFDF9] shadow-sm text-left rounded-2xl">
      <CardContent className="p-6 space-y-5">
        
        {/* Top Header: Question Index & Metadata Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2DDD5]">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#292B2B]">
              QUESTION {index + 1} OF {total}
            </span>
            <span className={cn(
              "text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border",
              status === 'approved' 
                ? "bg-[#2E8B57]/10 text-[#2E8B57] border-[#2E8B57]/30"
                : status === 'rejected'
                ? "bg-[#E2DDD5]/50 text-[#8C857B] border-[#E2DDD5]"
                : "bg-[#B38A3D]/15 text-[#292B2B] border-[#B38A3D]/35"
            )}>
              {status.replace('_', ' ')}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#A85D4C]/10 text-[#A85D4C] border border-[#A85D4C]/20 font-mono">
              {compName}
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#EFEBE4] text-[#292B2B] border border-[#E2DDD5]">
              {topicName}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#2D3030]/10 text-[#2D3030] border border-[#2D3030]/20 font-mono">
              {difficultyLabel}
            </span>
          </div>
        </div>

        {/* Question Text / Inline Edit Mode */}
        {isEditing ? (
          <div className="space-y-3 p-3 bg-[#EFEBE4] rounded-xl border border-[#E2DDD5]">
            <label className="text-xs font-bold text-[#292B2B] uppercase">Edit Question Scenario</label>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full text-xs p-2.5 border rounded-lg bg-[#FFFDF9] border-[#E2DDD5] font-medium focus:ring-1 focus:ring-[#A85D4C] text-[#292B2B]"
              rows={3}
            />
            <label className="text-xs font-bold text-[#292B2B] uppercase">Edit Explanation</label>
            <textarea
              value={editExplanation}
              onChange={(e) => setEditExplanation(e.target.value)}
              className="w-full text-xs p-2.5 border rounded-lg bg-[#FFFDF9] border-[#E2DDD5] font-medium focus:ring-1 focus:ring-[#A85D4C] text-[#292B2B]"
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button size="sm" className="bg-[#A85D4C] text-[#FFFDF9]" onClick={handleSaveEdit}>
                <Save className="w-3.5 h-3.5 mr-1" /> Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <h4 className="font-bold text-sm sm:text-base text-[#292B2B] leading-snug">
              {qText}
            </h4>
          </div>
        )}

        {/* Options List (Neutral Format A, B, C, D) */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase font-bold text-[#7A756E] block">
            Generated Candidate Options
          </span>
          <div className="grid grid-cols-1 gap-2">
            {options.map((opt: any, i: number) => {
              const letter = String.fromCharCode(65 + i);
              const optText = opt.text || opt.option_text || '';
              return (
                <div 
                  key={i} 
                  className="p-3 rounded-lg border border-[#E2DDD5] bg-[#EFEBE4]/40 text-xs flex items-center justify-between font-medium text-[#292B2B]"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono font-bold text-[#292B2B]">{letter}.</span>
                    <span>{optText}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distinct Correct Answer Key Section (Admin Review) */}
        <div className="p-3.5 rounded-xl bg-[#2E8B57]/10 border border-[#2E8B57]/30 space-y-1">
          <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-[#2E8B57] uppercase">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>CORRECT ANSWER KEY</span>
          </div>
          <p className="text-xs font-bold text-[#292B2B] pl-5">
            {correctOptLetter}. {correctOptText}
          </p>
        </div>

        {/* Source Reference & Explanation Section */}
        <div className="bg-[#EFEBE4] p-3.5 rounded-xl border border-[#E2DDD5] text-xs space-y-1.5">
          <div className="flex items-center space-x-1.5 text-[#A85D4C] font-mono font-bold text-[11px] uppercase">
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>SOURCE & EXPLANATION</span>
          </div>
          <p className="text-[11px] text-[#7A756E] font-mono">
            <span className="font-bold text-[#292B2B]">Source Citation: </span>{sourceRef}
          </p>
          <p className="text-xs text-[#7A756E] leading-relaxed">
            <span className="font-bold text-[#292B2B]">Rationale: </span>{question.explanation || editExplanation}
          </p>
        </div>

        {/* Admin Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2DDD5]">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs font-semibold border-[#E2DDD5] hover:bg-[#EFEBE4] text-[#292B2B] cursor-pointer rounded-xl"
          >
            <Edit3 className="w-3.5 h-3.5 mr-1 text-[#A85D4C]" />
            <span>Edit Question</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onReject && onReject(question.id)}
              disabled={status === 'rejected'}
              className="text-xs font-bold text-[#7A756E] border-[#E2DDD5] hover:bg-[#EFEBE4] cursor-pointer rounded-xl"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              <span>Reject</span>
            </Button>

            <Button 
              size="sm" 
              onClick={() => onApprove && onApprove(question.id)}
              disabled={status === 'approved'}
              className="text-xs font-bold bg-[#2E8B57] hover:bg-[#2E8B57]/90 text-[#FFFDF9] shadow-xs cursor-pointer rounded-xl"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              <span>{status === 'approved' ? 'Approved' : 'Approve for Pool'}</span>
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
