import React, { useState, useEffect } from 'react';
import { Layers, ChevronLeft, ChevronRight, RotateCw, RefreshCw, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface FlashcardItem {
  id?: number;
  front: string;
  back: string;
  order: number;
}

interface FlashcardDeckData {
  deck_id: number;
  material_id: number;
  title: string;
  material_title?: string;
  material_scope?: string;
  competency_name?: string;
  topic_name?: string;
  version: number;
  total_cards: number;
  status: string;
  cards: FlashcardItem[];
  created_at?: string;
}

interface FlashcardDeckProps {
  materialId: number;
  materialTitle: string;
  materialScope?: string;
  competencyName?: string;
  topicName?: string;
  initialData?: FlashcardDeckData | null;
  onRegenerate: () => Promise<void>;
  onClose?: () => void;
  isGenerating?: boolean;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({
  materialTitle,
  materialScope,
  competencyName,
  topicName,
  initialData,
  onRegenerate,
  onClose,
  isGenerating = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cards = initialData?.cards || [];
  const currentCard = cards[currentIndex];

  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        handleNext();
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, cards.length]);

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    setErrorMsg(null);
    try {
      await onRegenerate();
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Failed to regenerate flashcards.');
    } finally {
      setRegenerating(false);
    }
  };

  if (!initialData && isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
        <h3 className="text-lg font-semibold text-slate-800">Generating Active-Recall Flashcards...</h3>
        <p className="text-sm text-slate-500 max-w-md">
          Synthesizing high-yield prompts and calibrated explanations from your material.
        </p>
      </div>
    );
  }

  if (!initialData || cards.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <Layers className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-base font-semibold text-slate-800">No Flashcard Deck Yet</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Generate an active-recall study deck calibrated strictly from "{materialTitle}".
        </p>
        <button
          onClick={handleRegenerate}
          disabled={regenerating || isGenerating}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm transition shadow-sm"
        >
          {regenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate Flashcards
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-4.5 shadow-xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Layers className="w-3 h-3" /> Flashcard Deck
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                Deck v{initialData.version} ({cards.length} Cards)
              </span>
              {materialScope === 'OFFICIAL_COMPETENCY' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                  Official Competency
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">{initialData.title || materialTitle}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRegenerate}
              disabled={regenerating || isGenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating || isGenerating ? 'animate-spin' : ''}`} />
              {regenerating ? 'Regenerating...' : 'Regenerate Deck'}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {(competencyName || topicName) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
            {competencyName && (
              <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                <strong>Competency:</strong> {competencyName}
              </span>
            )}
            {topicName && (
              <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                <strong>Topic:</strong> {topicName}
              </span>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-500 font-medium">
          <span>Card {currentIndex + 1} of {cards.length}</span>
          <span>{Math.round(((currentIndex + 1) / cards.length) * 100)}% Reviewed</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Flashcard Arena */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="cursor-pointer select-none min-h-[190px] sm:min-h-[220px] bg-white border-2 border-slate-200 hover:border-emerald-400 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-all duration-200"
      >
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
          <span className={`px-2 py-0.5 rounded-md text-[11px] ${isFlipped ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
            {isFlipped ? 'Answer / Explanation' : 'Question / Prompt'}
          </span>
          <span className="text-slate-400 flex items-center gap-1 font-normal lowercase text-[11px]">
            <RotateCw className="w-3 h-3" /> click to flip (Space)
          </span>
        </div>

        <div className="py-4 sm:py-6 text-center my-auto px-2">
          <p className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed max-w-xl mx-auto">
            {isFlipped ? currentCard.back : currentCard.front}
          </p>
        </div>

        <div className="text-center text-[11px] text-slate-400">
          Card {currentIndex + 1} / {cards.length}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="inline-flex items-center gap-1 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-medium rounded-lg text-xs sm:text-sm transition shadow-xs cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
          {isFlipped ? 'Show Question' : 'Show Answer'}
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
          className="inline-flex items-center gap-1 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-medium rounded-lg text-xs sm:text-sm transition shadow-xs cursor-pointer"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 pt-0.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Grounded directly in {initialData.material_title || materialTitle}</span>
      </div>
    </div>
  );
};
