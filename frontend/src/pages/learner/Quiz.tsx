import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { assessmentApi } from '@/lib/api';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import QuestionCard, { QuestionData } from '@/components/quiz/QuestionCard';
import ConfidenceSelector from '@/components/quiz/ConfidenceSelector';
import { Brain, Clock, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Quiz() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [assessmentId, setAssessmentId] = useState<number | null>(
    id ? parseInt(id) : location.state?.assessmentId || null
  );
  const [questions, setQuestions] = useState<QuestionData[]>(location.state?.questions || []);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(!location.state?.questions);
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  // Track answers: { [qId]: { selectedOptionId: number|string, confidence: string } }
  const [answers, setAnswers] = useState<Record<number, { selectedOptionId: number | string; confidence: string }>>({});
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch or initialize session if not present in location state
  useEffect(() => {
    const initQuiz = async () => {
      if (questions.length === 0) {
        try {
          setLoading(true);
          const res = await assessmentApi.start({ assessment_type: 'baseline' });
          setAssessmentId(res.data.assessment_id);
          setQuestions(res.data.questions);
        } catch (err) {
          console.error('Failed to start quiz session:', err);
        } finally {
          setLoading(false);
        }
      }
    };
    initQuiz();
  }, [questions.length]);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const canProceed = Boolean(currentAnswer?.selectedOptionId && currentAnswer?.confidence);

  const handleOptionSelect = (optionId: number | string) => {
    if (!currentQuestion) return;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        selectedOptionId: optionId,
        confidence: prev[currentQuestion.id]?.confidence || ''
      }
    }));
  };

  const handleConfidenceSelect = (level: string) => {
    if (!currentQuestion) return;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        selectedOptionId: prev[currentQuestion.id]?.selectedOptionId || '',
        confidence: level
      }
    }));
  };

  const mapConfidenceToInt = (level?: string): number => {
    if (level === 'high') return 3;
    if (level === 'medium') return 2;
    return 1;
  };

  const handleNext = async () => {
    if (!currentQuestion || !currentAnswer || !assessmentId) return;
    
    try {
      setSubmitting(true);
      const timeTaken = Math.max(5, Math.round((Date.now() - startTime) / 1000));
      
      // Submit individual answer telemetry
      await assessmentApi.submitAnswer(assessmentId, {
        question_id: currentQuestion.id,
        selected_option_id: Number(currentAnswer.selectedOptionId),
        confidence_level: mapConfidenceToInt(currentAnswer.confidence),
        time_taken_seconds: timeTaken
      });

      // Reset start time for next question
      setStartTime(Date.now());

      if (currentIndex < questions.length - 1) {
        setCurrentIndex(curr => curr + 1);
      } else {
        // Finalize assessment with deterministic scoring engine
        const resultRes = await assessmentApi.complete(assessmentId);
        navigate(`/quiz/${assessmentId}/result`, {
          state: {
            result: resultRes.data,
            assessmentId
          }
        });
      }
    } catch (err) {
      console.error('Failed to submit answer or complete assessment:', err);
      // Fallback navigation if needed
      if (currentIndex === questions.length - 1 && assessmentId) {
        navigate(`/quiz/${assessmentId}/result`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#1F7A8C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#0B2545]">Calibrating questions across role competencies...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-4">
        <div className="bg-[#FFFFFF] p-8 rounded-2xl border border-[#2B2D42]/10 text-center space-y-4 max-w-md">
          <AlertCircle className="w-8 h-8 text-[#D4AF37] mx-auto" />
          <h2 className="text-lg font-bold text-[#0B2545]">No Assessment Questions Loaded</h2>
          <p className="text-xs text-[#2B2D42]">Please configure a new assessment session.</p>
          <Button onClick={() => navigate('/assessment')} className="bg-[#1F7A8C] text-[#FFFFFF]">
            Go to Assessments
          </Button>
        </div>
      </div>
    );
  }

  const progressPercent = ((currentIndex) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col">
      {/* Quiz Top Fixed Header */}
      <header className="h-16 border-b border-[#0B2545] flex items-center justify-between px-4 sm:px-8 bg-[#0B2545] text-[#FFFFFF] fixed top-0 w-full z-20 shadow-md">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1F7A8C] text-[#FFFFFF] flex items-center justify-center font-bold text-xs">
            <Brain className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-[#FFFFFF] hidden sm:inline">Baseline Competency Diagnostic</span>
          <span className="font-bold text-xs text-[#FFFFFF] sm:hidden">Diagnostic Session</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold text-[#FFFFFF] flex items-center gap-1.5 bg-[#FFFFFF]/10 border border-[#FFFFFF]/20 px-3 py-1 rounded-md font-mono">
            <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="pt-20 flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 pb-28">
        
        {/* Progress Bar & Header */}
        <div className="py-5 space-y-2">
          <div className="flex justify-between text-xs font-bold text-[#0B2545]">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span className="font-mono">{Math.round(progressPercent)}% Completed</span>
          </div>
          <Progress value={progressPercent} indicatorColor="bg-[#1F7A8C]" className="h-2" />
        </div>

        {/* Question Card Arena */}
        <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-2xl border border-[#2B2D42]/10 shadow-xs space-y-6">
          <QuestionCard 
            question={currentQuestion} 
            selectedOption={currentAnswer?.selectedOptionId}
            onSelect={handleOptionSelect}
          />

          {currentAnswer?.selectedOptionId && (
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-200">
              <ConfidenceSelector 
                selectedLevel={currentAnswer?.confidence}
                onSelect={handleConfidenceSelect}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation Bar */}
      <div className="fixed bottom-0 w-full border-t border-[#2B2D42]/10 bg-[#FFFFFF] p-4 shadow-lg z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-xs text-[#2B2D42]/60 font-medium">
            {!canProceed 
              ? 'Select answer & confidence rating to advance' 
              : 'Confidence recorded • Ready to submit'}
          </span>
          <Button 
            size="lg" 
            onClick={handleNext} 
            disabled={!canProceed || submitting}
            className="px-8 font-bold bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <span>
              {submitting 
                ? 'Submitting...' 
                : currentIndex === questions.length - 1 
                ? 'Finalize Assessment' 
                : 'Next Question'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
