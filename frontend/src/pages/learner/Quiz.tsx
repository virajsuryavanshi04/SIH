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
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#1F7A8C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#0B2545]">Calibrating questions across official role competencies...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-4">
        <div className="bg-[#FFFFFF] p-8 rounded-2xl border border-[#2B2D42]/10 text-center space-y-4 max-w-md">
          <AlertCircle className="w-8 h-8 text-[#D4AF37] mx-auto" />
          <h2 className="text-lg font-bold text-[#0B2545]">Assessment Ready</h2>
          <p className="text-xs text-[#2B2D42]">Please configure a new assessment session.</p>
          <Button onClick={() => navigate('/assessment')} className="bg-[#1F7A8C] text-[#FFFFFF]">
            Go to Assessments
          </Button>
        </div>
      </div>
    );
  }

  const progressPercent = questions.length > 0 ? ((currentIndex) / Math.max(questions.length, 8)) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#F4F7FA] flex flex-col selection:bg-[#1F7A8C]/20 selection:text-[#0B2545]">
      {/* Quiz Top Fixed Header */}
      <header className="h-16 border-b border-[#0B2545] flex items-center justify-between px-4 sm:px-8 bg-[#0B2545] text-[#FFFFFF] fixed top-0 w-full z-20 shadow-md">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1F7A8C] text-[#FFFFFF] flex items-center justify-center font-bold text-xs">
            <Brain className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm text-[#FFFFFF] hidden sm:inline">
            {assessmentType === 'adaptive' ? 'Adaptive Capability Assessment' : 'Baseline Competency Diagnostic'}
          </span>
          <span className="font-semibold text-xs text-[#FFFFFF] sm:hidden">Diagnostic Session</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold text-[#FFFFFF] flex items-center gap-1.5 bg-[#FFFFFF]/10 border border-[#FFFFFF]/20 px-3 py-1 rounded-lg font-mono">
            <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="pt-20 flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 pb-28">
        
        {/* Subtle Adaptive Transition Feedback Alert */}
        {adaptiveMessage && (
          <div className="mb-3 p-3.5 rounded-xl bg-[#EEF5F7] border border-[#1F7A8C]/30 text-xs font-mono font-semibold text-[#102A43] flex items-center justify-between gap-2 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#1F7A8C] shrink-0" />
              <span>{adaptiveMessage}</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-[#1F7A8C] bg-[#1F7A8C]/10 px-2 py-0.5 rounded">
              Adaptive Engine
            </span>
          </div>
        )}

        {/* Progress Bar & Header */}
        <div className="py-4 space-y-2 text-left">
          <div className="flex justify-between text-xs font-semibold text-[#102A43]">
            <span>Question {currentIndex + 1} {questions.length > 0 ? `of ${Math.max(questions.length, 8)}` : ''}</span>
            <span className="font-mono flex items-center gap-1 text-[#1F7A8C]">
              <Sparkles className="w-3 h-3" />
              <span>Real-Time Difficulty Calibration</span>
            </span>
          </div>
          <Progress value={Math.min(100, Math.max(10, progressPercent))} indicatorColor="bg-[#1F7A8C]" className="h-2 bg-[#DCE5EA]" />
        </div>

        {/* Question Card Arena */}
        <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-2xl border border-[#DCE5EA] shadow-[0_1px_3px_rgba(11,37,69,0.04)] space-y-6">
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
      <div className="fixed bottom-0 w-full border-t border-[#DCE5EA] bg-[#FFFFFF] p-4 shadow-lg z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-xs text-[#62748A] font-medium">
            {!canProceed 
              ? 'Select an option & confidence level to proceed' 
              : 'Confidence recorded • Ready to advance'}
          </span>
          <Button 
            size="default" 
            onClick={handleNext} 
            disabled={!canProceed || submitting}
            className="px-6 h-10 rounded-xl font-semibold bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] shadow-xs flex items-center gap-2 cursor-pointer"
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
