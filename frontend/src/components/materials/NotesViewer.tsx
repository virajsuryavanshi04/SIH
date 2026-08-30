import React, { useState } from 'react';
import { BookOpen, RefreshCw, FileText, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';

interface NoteSection {
  heading: string;
  content: string;
}

interface NotesData {
  id: number;
  material_id: number;
  title: string;
  material_title?: string;
  material_scope?: string;
  competency_name?: string;
  topic_name?: string;
  sections: NoteSection[];
  version: number;
  status: string;
  created_at?: string;
}

interface NotesViewerProps {
  materialId: number;
  materialTitle: string;
  materialScope?: string;
  competencyName?: string;
  topicName?: string;
  initialData?: NotesData | null;
  onRegenerate: () => Promise<void>;
  onClose?: () => void;
  isGenerating?: boolean;
}

export const NotesViewer: React.FC<NotesViewerProps> = ({
  materialTitle,
  materialScope,
  competencyName,
  topicName,
  initialData,
  onRegenerate,
  onClose,
  isGenerating = false,
}) => {
  const [regenerating, setRegenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegenerate = async () => {
    setRegenerating(true);
    setErrorMsg(null);
    try {
      await onRegenerate();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Failed to regenerate notes.');
    } finally {
      setRegenerating(false);
    }
  };

  if (!initialData && isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
        <h3 className="text-lg font-semibold text-slate-800">Synthesizing Executive Study Notes...</h3>
        <p className="text-sm text-slate-500 max-w-md">
          Extracting key concepts, formulas, and definitions grounded strictly in your uploaded material.
        </p>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="text-center py-12 space-y-4">
        <FileText className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-base font-semibold text-slate-800">No Study Notes Yet</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Generate structured, high-yield executive summary notes from "{materialTitle}".
        </p>
        <button
          onClick={handleRegenerate}
          disabled={regenerating || isGenerating}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition shadow-sm"
        >
          {regenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate Notes
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <BookOpen className="w-3 h-3" /> Study Notes
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                Version {initialData.version}
              </span>
              {materialScope === 'OFFICIAL_COMPETENCY' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                  Official Competency
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{initialData.title || materialTitle}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRegenerate}
              disabled={regenerating || isGenerating}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating || isGenerating ? 'animate-spin' : ''}`} />
              {regenerating ? 'Regenerating...' : 'Regenerate'}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {(competencyName || topicName) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
            {competencyName && (
              <span className="bg-slate-100 px-2 py-1 rounded">
                <strong>Competency:</strong> {competencyName}
              </span>
            )}
            {topicName && (
              <span className="bg-slate-100 px-2 py-1 rounded">
                <strong>Topic:</strong> {topicName}
              </span>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Structured Sections */}
      <div className="space-y-4">
        {initialData.sections.map((sec, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs hover:border-slate-300 transition"
          >
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                {idx + 1}
              </div>
              <h3 className="text-base font-semibold text-slate-900">{sec.heading}</h3>
            </div>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line pl-8">
              {sec.content}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-xs text-slate-400 pt-2 flex items-center justify-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Grounded directly in {initialData.material_title || materialTitle}</span>
      </div>
    </div>
  );
};
