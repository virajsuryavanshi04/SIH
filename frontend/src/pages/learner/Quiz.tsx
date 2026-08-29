import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { assessmentApi } from '@/lib/api';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import QuestionCard, { QuestionData } from '@/components/quiz/QuestionCard';
import ConfidenceSelector from '@/components/quiz/ConfidenceSelector';
import { Brain, Clock, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, Sparkles, TrendingUp, RefreshCw } from 'lucide-react';

export default function Quiz() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [assessmentId, setAssessmentId] = useState<number | null>(
    id ? parseInt(id) : location.state?.assessmentId || null
  );
  const [assessmentType, setAssessmentType] = useState<string>(
    location.state?.assessmentType || 'baseline'
  );
  const [questions, setQuestions] = useState<QuestionData[]>(location.state?.questions || []);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(!location.state?.questions);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [adaptiveMessage, setAdaptiveMessage] = useState<string | null>(null);
  
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
          const res = await assessmentApi.start({ assessment_type: 'adaptive' });
          setAssessmentId(res.data.assessment_id);
          setAssessmentType(res.data.assessment_type || 'adaptive');
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
      
      if (assessmentType === 'adaptive') {
        // Dynamic adaptive step progression
        const stepRes = await assessmentApi.adaptiveNext(assessmentId, {
          question_id: currentQuestion.id,
          selected_option_id: Number(currentAnswer.selectedOptionId),
          confidence_level: mapConfidenceToInt(currentAnswer.confidence),
          time_taken_seconds: timeTaken
        });

        setStartTime(Date.now());

        if (stepRes.data.is_completed) {
          navigate(`/quiz/${assessmentId}/result`, {
            state: {
              result: stepRes.data.result,
              assessmentId
            }
          });
          return;
        }

        // Show subtle non-leaky transition prompt
        const wasCorrect = stepRes.data.feedback?.is_correct;
        if (wasCorrect) {
          setAdaptiveMessage("Let's calibrate at a higher difficulty tier...");
        } else {
          setAdaptiveMessage("Let's reinforce this foundational concept...");
        }
        setTimeout(() => setAdaptiveMessage(null), 2000);

        if (stepRes.data.next_question) {
          setQuestions(prev => [...prev, stepRes.data.next_question]);
          setCurrentIndex(curr => curr + 1);
        } else if (currentIndex < questions.length - 1) {
          setCurrentIndex(curr => curr + 1);
        }
      } else {
        // Standard baseline flow
        await assessmentApi.submitAnswer(assessmentId, {
          question_id: currentQuestion.id,
          selected_option_id: Number(currentAnswer.selectedOptionId),
          confidence_level: mapConfidenceToInt(currentAnswer.confidence),
          time_taken_seconds: timeTaken
        });

        setStartTime(Date.now());

        if (currentIndex < questions.length - 1) {
          setCurrentIndex(curr => curr + 1);
        } else {
          const resultRes = await assessmentApi.complete(assessmentId);
          navigate(`/quiz/${assessmentId}/result`, {
            state: {
              result: resultRes.data,
              assessmentId
            }
          });
        }
      }
    } catch (err) {
      console.error('Failed to submit answer or advance adaptive step:', err);
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
      <div className="min-h-screen bg-[#EFEBE4] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#A85D4C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#2D3030]">Calibrating questions across official role competencies...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-[#EFEBE4] flex items-center justify-center p-4">
        <div className="bg-[#FFFDF9] p-8 rounded-2xl border border-[#292B2B]/10 text-center space-y-4 max-w-md">
          <AlertCircle className="w-8 h-8 text-[#B38A3D] mx-auto" />
          <h2 className="text-lg font-bold text-[#2D3030]">Assessment Ready</h2>
          <p className="text-xs text-[#292B2B]">Please configure a new assessment session.</p>
          <Button onClick={() => navigate('/assessment')} className="bg-[#A85D4C] text-[#FFFDF9]">
            Go to Assessments
          </Button>
        </div>
      </div>
    );
  }

  const progressPercent = questions.length > 0 ? ((currentIndex) / Math.max(questions.length, 8)) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#F7F4EE] flex flex-col selection:bg-[#A85D4C]/20 selection:text-[#2D3030]">
      {/* Quiz Top Fixed Header */}
      <header className="h-16 border-b border-[#2D3030] flex items-center justify-between px-4 sm:px-8 bg-[#2D3030] text-[#FFFDF9] fixed top-0 w-full z-20 shadow-md">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#A85D4C] text-[#FFFDF9] flex items-center justify-center font-bold text-xs">
            <Brain className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm text-[#FFFDF9] hidden sm:inline">
            {assessmentType === 'adaptive' ? 'Adaptive Capability Assessment' : 'Baseline Competency Diagnostic'}
          </span>
          <span className="font-semibold text-xs text-[#FFFDF9] sm:hidden">Diagnostic Session</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold text-[#FFFDF9] flex items-center gap-1.5 bg-[#FFFDF9]/10 border border-[#FFFDF9]/20 px-3 py-1 rounded-lg font-mono">
            <Clock className="w-3.5 h-3.5 text-[#B38A3D]" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="pt-20 flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 pb-28">
        
        {/* Subtle Adaptive Transition Feedback Alert */}
        {adaptiveMessage && (
          <div className="mb-3 p-3.5 rounded-xl bg-[#EFEBE4] border border-[#A85D4C]/30 text-xs font-mono font-semibold text-[#292B2B] flex items-center justify-between gap-2 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#A85D4C] shrink-0" />
              <span>{adaptiveMessage}</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-[#A85D4C] bg-[#A85D4C]/10 px-2 py-0.5 rounded">
              Adaptive Engine
            </span>
          </div>
        )}

        {/* Progress Bar & Header */}
        <div className="py-4 space-y-2 text-left">
          <div className="flex justify-between text-xs font-semibold text-[#292B2B]">
            <span>Question {currentIndex + 1} {questions.length > 0 ? `of ${Math.max(questions.length, 8)}` : ''}</span>
            <span className="font-mono flex items-center gap-1 text-[#A85D4C]">
              <Sparkles className="w-3 h-3" />
              <span>Real-Time Difficulty Calibration</span>
            </span>
          </div>
          <Progress value={Math.min(100, Math.max(10, progressPercent))} indicatorColor="bg-[#A85D4C]" className="h-2 bg-[#E2DDD5]" />
        </div>

        {/* Question Card Arena */}
        <div className="bg-[#FFFDF9] p-6 sm:p-8 rounded-2xl border border-[#E2DDD5] shadow-[0_1px_3px_rgba(45, 48, 48, 0.04)] space-y-6">
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
      <div className="fixed bottom-0 w-full border-t border-[#E2DDD5] bg-[#FFFDF9] p-4 shadow-lg z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-xs text-[#7A756E] font-medium">
            {!canProceed 
              ? 'Select an option & confidence level to proceed' 
              : 'Confidence recorded • Ready to advance'}
          </span>
          <Button 
            size="default" 
            onClick={handleNext} 
            disabled={!canProceed || submitting}
            className="px-6 h-10 rounded-xl font-semibold bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9] shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <span>
              {submitting 
                ? 'Calibrating Question...' 
                : currentIndex >= questions.length - 1 && assessmentType !== 'adaptive'
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
