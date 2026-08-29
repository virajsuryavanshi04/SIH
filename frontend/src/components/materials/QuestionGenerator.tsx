import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, CheckCheck, RefreshCw, Layers } from 'lucide-react';
import GeneratedQuestionCard from './GeneratedQuestionCard';
import { questionApi, materialApi, competencyApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface QuestionGeneratorProps {
  materialId?: number;
  initialCompetencyId?: number;
  onGenerationComplete?: (questions: any[]) => void;
}

export default function QuestionGenerator({ 
  materialId, 
  initialCompetencyId, 
  onGenerationComplete 
}: QuestionGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [competencies, setCompetencies] = useState<any[]>([]);
  
  // Form Configuration
  const [count, setCount] = useState<string>('10');
  const [difficulty, setDifficulty] = useState<string>('2');
  const [competencyId, setCompetencyId] = useState<string>(initialCompetencyId ? String(initialCompetencyId) : '1');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompetencies = async () => {
      try {
        const res = await competencyApi.getAll();
        setCompetencies(res.data || []);
      } catch (err) {
        console.error('Failed to load competencies:', err);
      }
    };
    fetchCompetencies();
  }, []);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      let generatedList: any[] = [];

      if (materialId) {
        const res = await materialApi.generateQuestions(materialId, {
          count: parseInt(count) || 10,
          difficulty: difficulty,
          competency_id: parseInt(competencyId) || 1
        });
        generatedList = res.data.questions || [];
      } else {
        const res = await questionApi.generate({
          competency_id: parseInt(competencyId) || 1,
          difficulty: difficulty,
          count: parseInt(count) || 10
        });
        generatedList = res.data.questions || [];
      }

      if (generatedList.length > 0) {
        setQuestions(generatedList);
        setCurrentIndex(0);
        setSuccessMsg(`Successfully generated and validated ${generatedList.length} questions.`);
        if (onGenerationComplete) {
          onGenerationComplete(generatedList);
        }
      } else {
        setErrorMsg('AI generation completed but returned 0 valid questions. Please try again.');
      }
    } catch (err: any) {
      console.error('Generation failed:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to generate questions. Please ensure backend services are active.');
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (qId: number) => {
    try {
      await questionApi.updateStatus(qId, 'approved');
      setQuestions(prev => prev.map(q => q.id === qId ? { ...q, status: 'approved' } : q));
    } catch (err) {
      console.error('Failed to approve question:', err);
    }
  };

  const handleReject = async (qId: number) => {
    try {
      await questionApi.updateStatus(qId, 'rejected');
      setQuestions(prev => prev.map(q => q.id === qId ? { ...q, status: 'rejected' } : q));
    } catch (err) {
      console.error('Failed to reject question:', err);
    }
  };

  const handleEditSave = async (qId: number, updated: any) => {
    try {
      await questionApi.update(qId, updated);
      setQuestions(prev => prev.map(q => q.id === qId ? { ...q, ...updated } : q));
    } catch (err) {
      console.error('Failed to save edited question:', err);
    }
  };

  const handleApproveAll = async () => {
    try {
      for (const q of questions) {
        if (q.status !== 'approved') {
          await questionApi.updateStatus(q.id, 'approved');
        }
      }
      setQuestions(prev => prev.map(q => ({ ...q, status: 'approved' })));
    } catch (err) {
      console.error('Failed to approve all questions:', err);
    }
  };

  const approvedCount = questions.filter(q => q.status === 'approved').length;
  const rejectedCount = questions.filter(q => q.status === 'rejected').length;
  const pendingCount = questions.filter(q => q.status !== 'approved' && q.status !== 'rejected').length;

  if (questions.length > 0) {
    const currentQ = questions[currentIndex];

    return (
      <div className="space-y-6 text-left">
        
        {/* Success Header Banner with Real Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#2E8B57]/10 text-[#2E8B57] border border-[#2E8B57]/30 p-4 rounded-xl shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#2E8B57] shrink-0" />
            <div>
              <span className="font-bold text-sm block leading-snug">
                Successfully generated {questions.length} questions
              </span>
              <span className="text-xs font-normal text-[#2E8B57]/80">
                {questions.length} candidate questions stored in pending review queue.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleApproveAll}
              className="text-xs font-bold border-[#2E8B57]/40 text-[#2E8B57] hover:bg-[#2E8B57] hover:text-[#FFFDF9] cursor-pointer rounded-xl"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" /> Approve All {questions.length}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { setQuestions([]); setCurrentIndex(0); }}
              className="text-xs text-[#292B2B] hover:bg-[#EFEBE4] cursor-pointer rounded-xl"
            >
              Configure Again
            </Button>
          </div>
        </div>

        {/* Question Counter Toolbar & Jump Pills */}
        <div className="p-4 rounded-xl bg-[#FFFDF9] border border-[#E2DDD5] shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#292B2B] uppercase font-mono tracking-wider">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-xs font-mono text-[#7A756E] font-semibold">
                ({approvedCount} approved, {pendingCount} pending, {rejectedCount} rejected)
              </span>
            </div>

            {/* Previous / Next Navigation Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                className="h-8 px-3 text-xs border-[#E2DDD5] text-[#292B2B] cursor-pointer disabled:opacity-40 rounded-xl"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentIndex === questions.length - 1}
                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                className="h-8 px-3 text-xs border-[#E2DDD5] text-[#292B2B] cursor-pointer disabled:opacity-40 rounded-xl"
              >
                Next <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>

          {/* Quick Jump Question Number Pills */}
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[#E2DDD5]">
            {questions.map((q, idx) => {
              const isSelected = idx === currentIndex;
              const isApproved = q.status === 'approved';
              const isRejected = q.status === 'rejected';

              return (
                <button
                  key={q.id || idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer border flex items-center gap-1",
                    isSelected 
                      ? "bg-[#2D3030] text-[#FFFDF9] border-[#2D3030] shadow-xs ring-2 ring-[#A85D4C]/40"
                      : isApproved
                      ? "bg-[#2E8B57]/10 text-[#2E8B57] border-[#2E8B57]/30 hover:bg-[#2E8B57]/20"
                      : isRejected
                      ? "bg-[#E2DDD5]/50 text-[#8C857B] border-[#E2DDD5] line-through"
                      : "bg-[#EFEBE4] text-[#292B2B] border-[#E2DDD5] hover:border-[#A85D4C]"
                  )}
                >
                  <span>Q{idx + 1}</span>
                  {isApproved && <span className="w-1.5 h-1.5 rounded-full bg-[#2E8B57]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Active Question Card */}
        {currentQ && (
          <GeneratedQuestionCard 
            question={currentQ}
            index={currentIndex}
            total={questions.length}
            onApprove={handleApprove}
            onReject={handleReject}
            onEditSave={handleEditSave}
          />
        )}

        {/* Bottom Fast Review Controls */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            className="text-xs font-semibold cursor-pointer border-[#E2DDD5] rounded-xl text-[#292B2B]"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Previous Question
          </Button>

          <Button
            size="sm"
            disabled={currentIndex === questions.length - 1}
            onClick={() => {
              if (currentQ?.status !== 'approved') {
                handleApprove(currentQ.id);
              }
              setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1));
            }}
            className="bg-[#A85D4C] hover:bg-[#2D3030] text-[#FFFDF9] font-bold text-xs shadow-xs cursor-pointer rounded-xl"
          >
            <span>Approve & Next</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {errorMsg && (
        <div className="p-4 rounded-xl bg-[#B38A3D]/15 border border-[#B38A3D]/35 text-xs font-bold text-[#292B2B] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#B38A3D] shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Competency Area */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#292B2B] uppercase tracking-wider">Competency Area</label>
          <Select value={competencyId} onValueChange={setCompetencyId}>
            <SelectTrigger className="border-[#E2DDD5] bg-[#FFFDF9] text-xs text-[#292B2B]">
              <SelectValue placeholder="Select competency" />
            </SelectTrigger>
            <SelectContent>
              {competencies.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Number of Questions */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#292B2B] uppercase tracking-wider">Question Count</label>
          <Select value={count} onValueChange={setCount}>
            <SelectTrigger className="border-[#E2DDD5] bg-[#FFFDF9] text-xs text-[#292B2B]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 Questions</SelectItem>
              <SelectItem value="5">5 Questions</SelectItem>
              <SelectItem value="10">10 Questions</SelectItem>
              <SelectItem value="15">15 Questions</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Target Difficulty */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#292B2B] uppercase tracking-wider">Target Difficulty</label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="border-[#E2DDD5] bg-[#FFFDF9] text-xs text-[#292B2B]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 — Foundational (Recall/Definitions)</SelectItem>
              <SelectItem value="2">2 — Applied (Survey Operations)</SelectItem>
              <SelectItem value="3">3 — Advanced (Variance/Policy)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button 
        size="lg" 
        className="w-full bg-[#A85D4C] hover:bg-[#2D3030] text-[#FFFDF9] font-bold shadow-xs cursor-pointer flex items-center justify-center gap-2 rounded-xl" 
        onClick={handleGenerate} 
        disabled={generating}
      >
        {generating ? (
          <>
            <div className="w-4 h-4 border-2 border-[#FFFDF9] border-t-transparent rounded-full animate-spin" />
            <span>AI Synthesizing & Validating {count} MCQs...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-1" /> 
            <span>Generate {count} Calibrated MCQs with AI</span>
          </>
        )}
      </Button>
    </div>
  );
}

