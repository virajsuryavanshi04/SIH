import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { materialApi } from '@/lib/api';
import { NotesViewer } from '@/components/materials/NotesViewer';
import { FlashcardDeck } from '@/components/materials/FlashcardDeck';
import { MindMapViewer } from '@/components/materials/MindMapViewer';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  FileText,
  Layers,
  GitBranch,
  Zap,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  BookOpen,
  FileType,
  Play,
  Eye,
  RotateCcw,
  History,
  Trophy,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  X,
  Video,
  GraduationCap,
  Globe,
  FlaskConical,
} from 'lucide-react';

type GenerationStatus = 'generating' | 'ready' | 'failed' | null;

interface WorkspaceData {
  material: {
    id: number;
    title: string;
    original_filename: string;
    file_type: string;
    file_size: number;
    material_scope: string;
    competency_id: number | null;
    competency_name: string | null;
    topic_id: number | null;
    topic_name: string | null;
    processing_status: string;
    detected_topics: string[];
    upload_date: string;
    created_at: string;
  };
  generation_state: {
    notes: GenerationStatus;
    flashcards: GenerationStatus;
    mind_map: GenerationStatus;
    quiz: GenerationStatus;
  };
  latest_versions: {
    notes_version: number | null;
    flashcards_version: number | null;
    flashcards_count: number | null;
    mind_map_version: number | null;
    quiz_version: number | null;
  };
  history: {
    notes: any[];
    flashcards: any[];
    mind_maps: any[];
    quiz_sets: any[];
  };
}

export default function MaterialWorkspace() {
  const { materialId } = useParams<{ materialId: string }>();
  const navigate = useNavigate();
  const id = materialId ? parseInt(materialId) : 0;

  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Content viewer modal
  const [activeViewer, setActiveViewer] = useState<'notes' | 'flashcards' | 'mindmap' | null>(null);
  const [viewerData, setViewerData] = useState<any>(null);
  const [loadingViewer, setLoadingViewer] = useState(false);

  // Quiz modal
  const [showQuizConfig, setShowQuizConfig] = useState(false);
  const [quizCount, setQuizCount] = useState(10);
  const [quizType, setQuizType] = useState<string>('MIXED');
  const [isStartingQuiz, setIsStartingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [adaptiveCalibration, setAdaptiveCalibration] = useState<boolean>(true);

  // History panel toggle
  const [showHistory, setShowHistory] = useState(false);

  // Related recommendations
  const [relatedCourses, setRelatedCourses] = useState<any[]>([]);
  const [learningRecommendations, setLearningRecommendations] = useState<any>(null);

  // Polling ref
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchWorkspace = useCallback(async () => {
    try {
      const res = await materialApi.getWorkspace(id);
      setWorkspace(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load workspace.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchWorkspace();
      // Fetch related courses / recommendations
      materialApi.getRelatedCourses(id)
        .then(res => {
          if (Array.isArray(res.data)) {
            setRelatedCourses(res.data);
          } else if (res.data) {
            setLearningRecommendations(res.data);
            setRelatedCourses(res.data.official_courses || []);
          }
        })
        .catch(() => {
          setRelatedCourses([]);
          setLearningRecommendations(null);
        });
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id, fetchWorkspace]);

  // Polling: if any generation is in progress, poll every 3 seconds
  useEffect(() => {
    if (!workspace) return;
    const gs = workspace.generation_state;
    const anyGenerating = gs.notes === 'generating' || gs.flashcards === 'generating' || gs.mind_map === 'generating' || gs.quiz === 'generating';

    if (anyGenerating && !pollRef.current) {
      pollRef.current = setInterval(() => {
        fetchWorkspace();
      }, 3000);
    } else if (!anyGenerating && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [workspace, fetchWorkspace]);

  // Auto-fetch viewer content when generation completes while viewer is open
  useEffect(() => {
    if (!workspace || !activeViewer || loadingViewer) return;
    const gs = workspace.generation_state;
    const readyKey = activeViewer === 'mindmap' ? 'mind_map' : activeViewer;
    if (gs[readyKey] === 'ready') {
      const needsData = !viewerData || (activeViewer === 'notes' && (!viewerData.sections || viewerData.sections.length === 0));
      if (needsData) {
        handleViewContent(activeViewer);
      }
    }
  }, [workspace, activeViewer, viewerData, loadingViewer]);

  const handleGenerate = async (type: 'notes' | 'flashcards' | 'mindmap') => {
    try {
      setError(null);
      if (type === 'notes') {
        await materialApi.generateNotes(id);
      } else if (type === 'flashcards') {
        await materialApi.generateFlashcards(id);
      } else if (type === 'mindmap') {
        await materialApi.generateMindMap(id);
      }
      setSuccessMsg(`${type.charAt(0).toUpperCase() + type.slice(1)} generation started.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchWorkspace();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError(`${type} generation is already in progress.`);
      } else {
        setError(err.response?.data?.detail || `Failed to start ${type} generation.`);
      }
    }
  };

  const handleViewContent = async (type: 'notes' | 'flashcards' | 'mindmap') => {
    setActiveViewer(type);
    setLoadingViewer(true);
    setError(null);
    try {
      if (type === 'notes') {
        const res = await materialApi.getNotes(id);
        setViewerData(res.data);
      } else if (type === 'flashcards') {
        const res = await materialApi.getFlashcards(id);
        setViewerData(res.data);
      } else if (type === 'mindmap') {
        const res = await materialApi.getMindMap(id);
        setViewerData(res.data);
      }
    } catch (err: any) {
      setViewerData(null);
      if (err.response?.status !== 404) {
        setError(err.response?.data?.detail || `Failed to load ${type}.`);
      }
    } finally {
      setLoadingViewer(false);
    }
  };

  const handleStartQuiz = async () => {
    try {
      setIsStartingQuiz(true);
      setQuizError(null);
      const res = await materialApi.startQuiz(id, {
        question_count: quizCount,
        question_type: quizType,
        adaptive_mode: adaptiveCalibration
      });
      setShowQuizConfig(false);
      navigate(`/quiz/${res.data.assessment_id}`, {
        state: {
          questions: res.data.questions,
          assessmentId: res.data.assessment_id,
          assessmentType: 'material_quiz',
          totalQuestions: res.data.total_questions || res.data.total_steps || quizCount
        }
      });
    } catch (err: any) {
      setQuizError(err.response?.data?.detail || 'Failed to start quiz.');
    } finally {
      setIsStartingQuiz(false);
    }
  };

  const getStatusConfig = (status: GenerationStatus, hasReady: boolean) => {
    if (status === 'generating') return { icon: Loader2, label: 'Generating...', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', spin: true };
    if (status === 'failed') return { icon: AlertCircle, label: 'Failed', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200', spin: false };
    if (hasReady || status === 'ready') return { icon: CheckCircle2, label: 'Ready', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', spin: false };
    return { icon: Sparkles, label: 'Not Generated', color: 'text-[#7A756E]', bg: 'bg-[#EFEBE4] border-[#E2DDD5]', spin: false };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#A85D4C] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#2D3030]">Loading material workspace...</p>
        </div>
      </div>
    );
  }

  if (error && !workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm text-rose-700">{error}</p>
          <Button onClick={() => navigate('/materials')} className="bg-[#A85D4C] text-[#FFFDF9]">
            Back to Materials
          </Button>
        </div>
      </div>
    );
  }

  if (!workspace) return null;

  const { material, generation_state, latest_versions, history } = workspace;
  const isReady = material.processing_status === 'completed';
  const isOfficial = material.material_scope === 'OFFICIAL_COMPETENCY';

  const resourceCards = [
    {
      key: 'notes',
      title: 'Summary / Notes',
      description: 'AI-generated executive study notes with key concepts and takeaways.',
      icon: FileText,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
      btnStyle: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200',
      status: generation_state.notes,
      hasReady: latest_versions.notes_version !== null,
      version: latest_versions.notes_version,
      historyCount: history.notes.length,
    },
    {
      key: 'flashcards',
      title: 'Flashcards',
      description: 'Active recall flashcards for spaced repetition study.',
      icon: Layers,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      btnStyle: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200',
      status: generation_state.flashcards,
      hasReady: latest_versions.flashcards_version !== null,
      version: latest_versions.flashcards_version,
      extra: latest_versions.flashcards_count ? `${latest_versions.flashcards_count} cards` : null,
      historyCount: history.flashcards.length,
    },
    {
      key: 'mindmap',
      title: 'Mind Map',
      description: 'Hierarchical concept visualization of material structure.',
      icon: GitBranch,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
      btnStyle: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200',
      status: generation_state.mind_map,
      hasReady: latest_versions.mind_map_version !== null,
      version: latest_versions.mind_map_version,
      historyCount: history.mind_maps.length,
    },
    {
      key: 'quiz',
      title: 'Material Quiz',
      description: 'AI-generated adaptive quiz grounded in the uploaded material.',
      icon: Zap,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
      btnStyle: 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300',
      status: generation_state.quiz,
      hasReady: latest_versions.quiz_version !== null,
      version: latest_versions.quiz_version,
      historyCount: history.quiz_sets.length,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/materials')}
            className="text-xs font-mono font-bold text-[#7A756E] hover:text-[#292B2B] border-[#E2DDD5] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Materials
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2 flex-1">
            <h1 className="text-2xl sm:text-3xl font-black text-[#292B2B] tracking-tight">
              {material.title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold border",
                isOfficial
                  ? "bg-[#A85D4C]/10 text-[#A85D4C] border-[#A85D4C]/30"
                  : "bg-[#2D3030]/10 text-[#2D3030] border-[#2D3030]/30"
              )}>
                {isOfficial ? <BookOpen className="w-3 h-3" /> : <FileType className="w-3 h-3" />}
                {isOfficial ? 'Official Competency' : 'Other Learning'}
              </span>
              {material.competency_name && (
                <span className="text-xs font-semibold text-[#292B2B] bg-[#EFEBE4] px-2 py-0.5 rounded-md">
                  {material.competency_name}
                </span>
              )}
              {material.topic_name && (
                <span className="text-xs font-mono text-[#7A756E]">
                  / {material.topic_name}
                </span>
              )}
              <span className={cn(
                "inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border",
                material.processing_status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                material.processing_status === 'processing' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                material.processing_status === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                'bg-slate-50 text-slate-700 border-slate-200'
              )}>
                {material.processing_status === 'completed' ? 'Ready' : material.processing_status}
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#7A756E]">
              {material.original_filename} · {material.file_size ? `${(material.file_size / 1024).toFixed(1)} KB` : ''}
              {material.created_at && ` · Uploaded ${new Date(material.created_at).toLocaleDateString()}`}
            </p>
          </div>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resourceCards.map((card) => {
          const statusCfg = getStatusConfig(card.status, card.hasReady);
          const StatusIcon = statusCfg.icon;
          const CardIcon = card.icon;

          return (
            <Card key={card.key} className="bg-[#FFFDF9] border-[#E2DDD5] shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", card.iconBg)}>
                    <CardIcon className={cn("w-6 h-6", card.iconColor)} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-black text-[#292B2B]">{card.title}</h3>
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border",
                        statusCfg.bg
                      )}>
                        <StatusIcon className={cn("w-3 h-3", statusCfg.color, statusCfg.spin && "animate-spin")} />
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#7A756E] leading-relaxed">{card.description}</p>

                    {/* Version info */}
                    {card.version && (
                      <div className="flex items-center gap-3 text-[10px] font-mono text-[#7A756E]">
                        <span>v{card.version}</span>
                        {card.extra && <span>· {card.extra}</span>}
                        {card.historyCount > 1 && (
                          <span>· {card.historyCount} versions</span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      {card.key === 'quiz' ? (
                        // Quiz-specific actions
                        <>
                          {isReady && (
                            <Button
                              size="sm"
                              onClick={() => { setShowQuizConfig(true); setQuizError(null); }}
                              className={cn("text-[11px] font-bold h-7 px-3 rounded-lg cursor-pointer shadow-xs", card.btnStyle)}
                            >
                              <Play className="w-3 h-3 mr-1" />
                              {card.hasReady ? 'New Quiz' : 'Start Quiz'}
                            </Button>
                          )}
                          {card.hasReady && history.quiz_sets.some(qs => qs.attempts?.length > 0) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowHistory(true)}
                              className="text-[11px] font-bold h-7 px-3 border-[#E2DDD5] text-[#7A756E] rounded-lg cursor-pointer"
                            >
                              <Trophy className="w-3 h-3 mr-1" />
                              Results
                            </Button>
                          )}
                        </>
                      ) : (
                        // Notes/Flashcards/MindMap actions
                        <>
                          {card.hasReady && (
                            <Button
                              size="sm"
                              onClick={() => handleViewContent(card.key as 'notes' | 'flashcards' | 'mindmap')}
                              className={cn("text-[11px] font-bold h-7 px-3 rounded-lg cursor-pointer shadow-xs", card.btnStyle)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          )}
                          {isReady && card.status !== 'generating' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerate(card.key as 'notes' | 'flashcards' | 'mindmap')}
                              className="text-[11px] font-bold h-7 px-3 border-[#E2DDD5] text-[#7A756E] hover:text-[#292B2B] rounded-lg cursor-pointer"
                            >
                              {card.hasReady ? (
                                <><RotateCcw className="w-3 h-3 mr-1" />Regenerate</>
                              ) : card.status === 'failed' ? (
                                <><RefreshCw className="w-3 h-3 mr-1" />Retry</>
                              ) : (
                                <><Sparkles className="w-3 h-3 mr-1" />Generate</>
                              )}
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resource History Section */}
      <Card className="bg-[#FFFDF9] border-[#E2DDD5] shadow-sm">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => setShowHistory(!showHistory)}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-black text-[#292B2B] flex items-center gap-2">
              <History className="w-4 h-4 text-[#A85D4C]" />
              Resource History
            </CardTitle>
            {showHistory ? <ChevronUp className="w-4 h-4 text-[#7A756E]" /> : <ChevronDown className="w-4 h-4 text-[#7A756E]" />}
          </div>
        </CardHeader>
        {showHistory && (
          <CardContent className="pt-0 space-y-5">
            {/* Notes History */}
            {history.notes.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-[#292B2B] uppercase flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-indigo-500" /> Summary / Notes
                </h4>
                <div className="space-y-1">
                  {history.notes.map((n: any) => (
                    <div key={n.id} className="flex items-center justify-between px-3 py-1.5 bg-[#EFEBE4]/50 rounded-lg text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#292B2B]">v{n.version}</span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold",
                          n.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                          n.status === 'generating' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        )}>{n.status}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#7A756E]">{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flashcard History */}
            {history.flashcards.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-[#292B2B] uppercase flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-emerald-500" /> Flashcards
                </h4>
                <div className="space-y-1">
                  {history.flashcards.map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between px-3 py-1.5 bg-[#EFEBE4]/50 rounded-lg text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#292B2B]">v{d.version}</span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold",
                          d.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                          d.status === 'generating' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        )}>{d.status}</span>
                        {d.card_count > 0 && <span className="text-[10px] text-[#7A756E]">{d.card_count} cards</span>}
                      </div>
                      <span className="text-[10px] font-mono text-[#7A756E]">{new Date(d.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mind Map History */}
            {history.mind_maps.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-[#292B2B] uppercase flex items-center gap-1.5">
                  <GitBranch className="w-3 h-3 text-purple-500" /> Mind Map
                </h4>
                <div className="space-y-1">
                  {history.mind_maps.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between px-3 py-1.5 bg-[#EFEBE4]/50 rounded-lg text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#292B2B]">v{m.version}</span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold",
                          m.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                          m.status === 'generating' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        )}>{m.status}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#7A756E]">{new Date(m.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quiz Set + Attempt History */}
            {history.quiz_sets.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-[#292B2B] uppercase flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-amber-500" /> Material Quiz
                </h4>
                <div className="space-y-2">
                  {history.quiz_sets.map((qs: any) => (
                    <div key={qs.id} className="px-3 py-2 bg-[#EFEBE4]/50 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#292B2B]">{qs.title}</span>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold",
                            qs.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                            qs.status === 'generating' ? 'bg-amber-100 text-amber-700' :
                            'bg-rose-100 text-rose-700'
                          )}>{qs.status}</span>
                          <span className="text-[10px] text-[#7A756E]">{qs.question_count} questions</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#7A756E]">{new Date(qs.created_at).toLocaleString()}</span>
                      </div>
                      {qs.attempts && qs.attempts.length > 0 && (
                        <div className="pl-4 space-y-1 border-l-2 border-amber-200/60">
                          {qs.attempts.map((att: any) => (
                            <div key={att.assessment_id} className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-2">
                                <Trophy className="w-3 h-3 text-amber-500" />
                                <span className={cn(
                                  "font-semibold",
                                  att.status === 'completed' ? 'text-emerald-700' : 'text-amber-700'
                                )}>
                                  {att.status === 'completed' ? `Score: ${att.score != null ? `${att.score}%` : '—'}` : 'In Progress'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {att.completed_at && (
                                  <span className="text-[10px] text-[#7A756E]">{new Date(att.completed_at).toLocaleString()}</span>
                                )}
                                {att.status === 'completed' && (
                                  <Link
                                    to={`/quiz/${att.assessment_id}/result`}
                                    className="text-[10px] font-bold text-[#A85D4C] hover:underline flex items-center gap-0.5"
                                  >
                                    View Result <ExternalLink className="w-2.5 h-2.5" />
                                  </Link>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {history.notes.length === 0 && history.flashcards.length === 0 && history.mind_maps.length === 0 && history.quiz_sets.length === 0 && (
              <p className="text-xs text-[#7A756E] text-center py-4">No resources generated yet. Use the cards above to start.</p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Two-Layer Recommendation: Layer 1 (Document-Level Generic Recommendations) */}
      {/* 1A: Official Competency Material -> Related Official Courses */}
      {material.material_scope === 'OFFICIAL_COMPETENCY' && relatedCourses.length > 0 && (
        <Card className="bg-[#FFFDF9] border-[#E2DDD5] shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black text-[#292B2B] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#A85D4C]" />
                Related Official Courses
              </CardTitle>
              <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                Official iGOT Modules
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {relatedCourses.map((course: any) => (
              <div key={course.course_id} className="flex items-start justify-between p-3 bg-[#EFEBE4]/50 rounded-xl text-xs gap-3">
                <div className="space-y-1 flex-1">
                  <h4 className="font-bold text-[#292B2B]">{course.title}</h4>
                  <p className="text-[#7A756E] text-[11px] line-clamp-2">{course.description}</p>
                  <p className="text-[10px] font-mono text-indigo-600">{course.similarity_reason}</p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {course.provider}
                  </span>
                  {course.confidence && (
                    <p className="text-[10px] font-mono text-[#7A756E]">{Math.round(course.confidence * 100)}% match</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 1B: User-Uploaded / Other Learning Material -> Document-Level External Learning Resources */}
      {material.material_scope !== 'OFFICIAL_COMPETENCY' && learningRecommendations?.external_learning_resources?.length > 0 && (
        <Card className="bg-[#FFFDF9] border-[#E2DDD5] shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <CardTitle className="text-sm font-black text-[#292B2B] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#A85D4C]" />
                  Recommended Learning Resources for this Material
                </CardTitle>
                <p className="text-[11px] text-[#7A756E] mt-0.5">
                  Curated external educational resources covering {learningRecommendations.subject || material.title} across video, structured course, reading, and practice modalities.
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold text-[#A85D4C] bg-[#A85D4C]/10 px-2.5 py-1 rounded-md self-start sm:self-auto border border-[#A85D4C]/20">
                Document-Level Overview
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {learningRecommendations.external_learning_resources.map((item: any, idx: number) => {
                const categoryMeta: Record<string, { label: string; icon: any; badge: string }> = {
                  YOUTUBE: { label: 'YouTube Video', icon: Video, badge: 'bg-red-50 text-red-700 border-red-200' },
                  COURSE: { label: 'Structured Course', icon: GraduationCap, badge: 'bg-blue-50 text-blue-700 border-blue-200' },
                  ARTICLE: { label: 'Article / Guide', icon: Globe, badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                  OPEN_TEXTBOOK: { label: 'Open Textbook', icon: BookOpen, badge: 'bg-amber-50 text-amber-800 border-amber-200' },
                  PRACTICE: { label: 'Practice Resource', icon: FlaskConical, badge: 'bg-purple-50 text-purple-700 border-purple-200' }
                };
                const meta = categoryMeta[item.category] || { 
                  label: item.category_display || item.category, 
                  icon: BookOpen, 
                  badge: 'bg-[#A85D4C]/10 text-[#A85D4C] border-[#A85D4C]/20' 
                };
                const IconComp = meta.icon;

                return (
                  <div 
                    key={idx} 
                    className="p-4 rounded-xl bg-[#FFFDF9] border border-[#E2DDD5] flex flex-col justify-between space-y-3 shadow-2xs hover:border-[#A85D4C]/40 hover:shadow-xs transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1", meta.badge)}>
                          <IconComp className="w-3 h-3" />
                          <span>{meta.label}</span>
                        </span>
                        <span className="text-[10px] font-mono text-[#7A756E] truncate max-w-[130px]" title={item.provider}>
                          {item.provider}
                        </span>
                      </div>
                      <h5 className="font-bold text-xs text-[#292B2B] leading-snug line-clamp-2">
                        {item.title}
                      </h5>
                      <p className="text-[11px] text-[#7A756E] leading-relaxed line-clamp-3">
                        {item.reason}
                      </p>
                    </div>

                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="block mt-2 pt-2 border-t border-[#E2DDD5]"
                    >
                      <Button 
                        size="sm" 
                        className="w-full text-xs font-semibold bg-[#2D3030] text-[#FFFDF9] hover:bg-[#A85D4C] h-7 rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>Open Resource</span>
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </a>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiz Config Modal */}
      {showQuizConfig && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-2xl max-w-md sm:max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-[#E2DDD5] shrink-0 bg-[#FFFDF9]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#292B2B]">Personal Adaptive Material Quiz</h3>
                  <p className="text-[11px] font-mono text-[#7A756E] truncate max-w-xs">{material.title}</p>
                </div>
              </div>
              <button
                onClick={() => setShowQuizConfig(false)}
                className="text-[#7A756E] hover:text-[#2D3030] p-1 rounded-lg hover:bg-[#EFEBE4] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs">
              {quizError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{quizError}</span>
                </div>
              )}

              {/* Question Type Selection */}
              <div className="space-y-2">
                <label className="font-mono uppercase font-bold text-[#292B2B] block">Question Format</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'MIXED', label: 'Mixed Mode', desc: 'Balanced short MCQs, word problems & case studies' },
                    { id: 'SHORT_MCQ', label: 'Short MCQ', desc: 'Direct factual & conceptual multiple choice' },
                    { id: 'WORD_PROBLEM', label: 'Word Problem', desc: 'Applied numerical and theoretical scenarios' },
                    { id: 'CASE_STUDY', label: 'Case Study', desc: 'Realistic workplace situational problems' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setQuizType(t.id)}
                      className={cn(
                        "p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                        quizType === t.id
                          ? "border-[#A85D4C] bg-[#A85D4C]/10 text-[#292B2B]"
                          : "border-[#E2DDD5] bg-[#FFFDF9] text-[#7A756E] hover:border-[#292B2B]"
                      )}
                    >
                      <span className="font-bold text-xs text-[#292B2B] block mb-1">{t.label}</span>
                      <span className="text-[10px] text-[#7A756E] block leading-tight">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count Selection */}
              <div className="space-y-2">
                <label className="font-mono uppercase font-bold text-[#292B2B] block">Question Count</label>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 15, 20].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuizCount(cnt)}
                      className={cn(
                        "p-2.5 rounded-lg border text-center font-bold font-mono transition-all cursor-pointer",
                        quizCount === cnt
                          ? "border-[#A85D4C] bg-[#A85D4C] text-[#FFFDF9]"
                          : "border-[#E2DDD5] bg-[#FFFDF9] text-[#7A756E] hover:border-[#292B2B]"
                      )}
                    >
                      {cnt} Questions
                    </button>
                  ))}
                </div>
              </div>

              {/* Adaptive Calibration Toggle */}
              <div className="p-3 bg-[#EFEBE4]/60 border border-[#E2DDD5] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#A85D4C]" />
                  <div>
                    <span className="font-bold text-[#292B2B] block text-[11px]">Adaptive Calibration</span>
                    <span className="text-[10px] text-[#7A756E] block">
                      {adaptiveCalibration ? "Difficulty adjusts dynamically to learner performance" : "Fixed sequential question delivery without calibration"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAdaptiveCalibration(prev => !prev)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer",
                    adaptiveCalibration
                      ? "bg-[#A85D4C]/15 text-[#A85D4C] hover:bg-[#A85D4C]/25"
                      : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                  )}
                >
                  {adaptiveCalibration ? "Active" : "Disabled"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 sm:p-5 pt-3 border-t border-[#E2DDD5] shrink-0 bg-[#EFEBE4]/20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQuizConfig(false)}
                className="text-xs cursor-pointer"
                disabled={isStartingQuiz}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleStartQuiz}
                disabled={isStartingQuiz}
                className="bg-[#A85D4C] hover:bg-[#8F4E3F] text-[#FFFDF9] font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {isStartingQuiz ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generating Quiz...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Start Quiz ({quizCount}Q)</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content Viewer Modal */}
      {activeViewer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-2xl max-w-3xl lg:max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 sm:px-6 py-3.5 shrink-0 bg-[#FFFDF9]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleViewContent('notes')}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer",
                    activeViewer === 'notes' ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <FileText className="w-3.5 h-3.5" /> Notes
                </button>
                <button
                  onClick={() => handleViewContent('flashcards')}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer",
                    activeViewer === 'flashcards' ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <Layers className="w-3.5 h-3.5" /> Flashcards
                </button>
                <button
                  onClick={() => handleViewContent('mindmap')}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer",
                    activeViewer === 'mindmap' ? "bg-purple-600 text-white" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <GitBranch className="w-3.5 h-3.5" /> Mind Map
                </button>
              </div>
              <button onClick={() => { setActiveViewer(null); setViewerData(null); }} className="text-[#7A756E] hover:text-[#2D3030] p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 sm:p-6 min-h-0 bg-[#FFFDF9]/60">
              {loadingViewer ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-8 h-8 text-[#A85D4C] animate-spin mx-auto mb-3" />
                  <p className="text-sm text-[#7A756E]">Loading content...</p>
                </div>
              ) : !viewerData ? (
                <div className="py-16 text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-[#7A756E]/40 mx-auto" />
                  <p className="text-sm text-[#7A756E]">No content available yet. Generate it first.</p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setActiveViewer(null);
                      handleGenerate(activeViewer as 'notes' | 'flashcards' | 'mindmap');
                    }}
                    className="bg-[#A85D4C] text-[#FFFDF9] text-xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1" />Generate Now
                  </Button>
                </div>
              ) : (
                <>
                  {activeViewer === 'notes' && (
                    <NotesViewer
                      materialId={material.id}
                      materialTitle={material.title}
                      materialScope={material.material_scope}
                      competencyName={material.competency_name || undefined}
                      topicName={material.topic_name || undefined}
                      initialData={viewerData}
                      onRegenerate={async () => { handleGenerate('notes'); }}
                      isGenerating={generation_state.notes === 'generating'}
                    />
                  )}
                  {activeViewer === 'flashcards' && (
                    <FlashcardDeck
                      materialId={material.id}
                      materialTitle={material.title}
                      materialScope={material.material_scope}
                      competencyName={material.competency_name || undefined}
                      topicName={material.topic_name || undefined}
                      initialData={viewerData}
                      onRegenerate={async () => { handleGenerate('flashcards'); }}
                      isGenerating={generation_state.flashcards === 'generating'}
                    />
                  )}
                  {activeViewer === 'mindmap' && (
                    <MindMapViewer
                      materialId={material.id}
                      materialTitle={material.title}
                      materialScope={material.material_scope}
                      competencyName={material.competency_name || undefined}
                      topicName={material.topic_name || undefined}
                      initialData={viewerData}
                      onRegenerate={async () => { handleGenerate('mindmap'); }}
                      isGenerating={generation_state.mind_map === 'generating'}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
