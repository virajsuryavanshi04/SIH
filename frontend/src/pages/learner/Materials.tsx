import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import UploadZone from '@/components/materials/UploadZone';
import { NotesViewer } from '@/components/materials/NotesViewer';
import { FlashcardDeck } from '@/components/materials/FlashcardDeck';
import { MindMapViewer } from '@/components/materials/MindMapViewer';
import { 
  FileText, 
  Sparkles, 
  Play, 
  BookOpen, 
  Target, 
  CheckCircle2, 
  ArrowRight, 
  Layers,
  UploadCloud,
  Plus,
  X,
  Zap,
  HelpCircle,
  Clock,
  AlertCircle,
  Trash2,
  Edit2,
  FileType,
  Check,
  RotateCcw,
  GitBranch
} from 'lucide-react';
import { assessmentApi, competencyApi, materialApi } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function Materials() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [materials, setMaterials] = useState<any[]>([]);
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showUploader, setShowUploader] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit Modal State
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editScope, setEditScope] = useState<'OFFICIAL_COMPETENCY' | 'OTHER_LEARNING'>('OFFICIAL_COMPETENCY');
  const [editCompId, setEditCompId] = useState<string>('');
  const [editTopicId, setEditTopicId] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // Filter State
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'OFFICIAL' | 'OTHER'>('ALL');

  // Study Content Modal State (Phase 5B)
  const [activeStudyTool, setActiveStudyTool] = useState<{
    material: any;
    tool: 'notes' | 'flashcards' | 'mindmap';
  } | null>(null);

  // Quiz Modal State (Phase 5C)
  const [quizMaterial, setQuizMaterial] = useState<any | null>(null);
  const [quizCount, setQuizCount] = useState<number>(10);
  const [quizType, setQuizType] = useState<'SHORT_MCQ' | 'WORD_PROBLEM' | 'CASE_STUDY' | 'MIXED'>('MIXED');
  const [isStartingQuiz, setIsStartingQuiz] = useState<boolean>(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  const handleStartMaterialQuiz = async () => {
    if (!quizMaterial) return;
    try {
      setIsStartingQuiz(true);
      setQuizError(null);
      const res = await materialApi.startQuiz(quizMaterial.id, {
        question_count: quizCount,
        question_type: quizType
      });
      setQuizMaterial(null);
      navigate(`/quiz/${res.data.assessment_id}`, {
        state: {
          questions: res.data.questions,
          assessmentId: res.data.assessment_id,
          assessmentType: 'material_quiz'
        }
      });
    } catch (err: any) {
      console.error('Failed to start material quiz:', err);
      setQuizError(err.response?.data?.detail || 'Failed to generate and start quiz session. Please try again.');
    } finally {
      setIsStartingQuiz(false);
    }
  };

  const [notesData, setNotesData] = useState<any | null>(null);
  const [flashcardsData, setFlashcardsData] = useState<any | null>(null);
  const [mindMapData, setMindMapData] = useState<any | null>(null);
  const [loadingContent, setLoadingContent] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [mRes, cRes] = await Promise.allSettled([
        materialApi.getAll(),
        competencyApi.getAll()
      ]);

      if (mRes.status === 'fulfilled') {
        setMaterials(mRes.value.data || []);
      }
      if (cRes.status === 'fulfilled') {
        setCompetencies(cRes.value.data || []);
      }
    } catch (err) {
      console.error('Failed to load study materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const openEditModal = (mat: any) => {
    setEditingMaterial(mat);
    setEditTitle(mat.title || '');
    setEditScope(mat.material_scope === 'OTHER_LEARNING' ? 'OTHER_LEARNING' : 'OFFICIAL_COMPETENCY');
    setEditCompId(mat.competency_id ? String(mat.competency_id) : (competencies[0]?.id ? String(competencies[0].id) : ''));
    setEditTopicId(mat.topic_id ? String(mat.topic_id) : '');
  };

  const handleSaveEdit = async () => {
    if (!editingMaterial) return;
    try {
      setSavingEdit(true);
      setErrorMsg(null);

      const payload: any = {
        title: editTitle.trim(),
        material_scope: editScope
      };

      if (editScope === 'OFFICIAL_COMPETENCY') {
        if (!editCompId) {
          setErrorMsg('Please select an official competency.');
          setSavingEdit(false);
          return;
        }
        payload.competency_id = parseInt(editCompId);
        payload.topic_id = editTopicId ? parseInt(editTopicId) : null;
      } else {
        payload.competency_id = null;
        payload.topic_id = null;
      }

      await materialApi.update(editingMaterial.id, payload);
      setSuccessMsg(`Material #${editingMaterial.id} updated successfully.`);
      setEditingMaterial(null);
      fetchAllData();
    } catch (err: any) {
      console.error('Failed to update material:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to update material metadata.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    if (!window.confirm(`Are you sure you want to delete material #${id}? This cannot be undone.`)) {
      return;
    }
    try {
      setErrorMsg(null);
      await materialApi.delete(id);
      setSuccessMsg(`Material #${id} deleted successfully.`);
      fetchAllData();
    } catch (err: any) {
      console.error('Failed to delete material:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to delete material.');
    }
  };

  // Phase 5B Study Tools Open Handler
  const openStudyTool = async (mat: any, tool: 'notes' | 'flashcards' | 'mindmap') => {
    setActiveStudyTool({ material: mat, tool });
    setLoadingContent(true);
    setErrorMsg(null);

    try {
      if (tool === 'notes') {
        try {
          const res = await materialApi.getNotes(mat.id);
          setNotesData(res.data);
        } catch (e) {
          setNotesData(null);
        }
      } else if (tool === 'flashcards') {
        try {
          const res = await materialApi.getFlashcards(mat.id);
          setFlashcardsData(res.data);
        } catch (e) {
          setFlashcardsData(null);
        }
      } else if (tool === 'mindmap') {
        try {
          const res = await materialApi.getMindMap(mat.id);
          setMindMapData(res.data);
        } catch (e) {
          setMindMapData(null);
        }
      }
    } finally {
      setLoadingContent(false);
    }
  };

  const handleRegenerateNotes = async () => {
    if (!activeStudyTool) return;
    setIsGenerating(true);
    try {
      const res = await materialApi.generateNotes(activeStudyTool.material.id);
      setNotesData(res.data);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateFlashcards = async () => {
    if (!activeStudyTool) return;
    setIsGenerating(true);
    try {
      const res = await materialApi.generateFlashcards(activeStudyTool.material.id);
      setFlashcardsData(res.data);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateMindMap = async () => {
    if (!activeStudyTool) return;
    setIsGenerating(true);
    try {
      const res = await materialApi.generateMindMap(activeStudyTool.material.id);
      setMindMapData(res.data);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredMaterials = materials.filter(m => {
    if (activeFilter === 'OFFICIAL') return m.material_scope === 'OFFICIAL_COMPETENCY';
    if (activeFilter === 'OTHER') return m.material_scope === 'OTHER_LEARNING';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: 'Ready', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'processing':
        return { label: 'Processing', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'error':
        return { label: 'Failed', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { label: 'Uploaded', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const selectedCompObj = competencies.find(c => String(c.id) === String(editCompId));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Header Section */}
      <div className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#A85D4C]/10 text-[#A85D4C] border border-[#A85D4C]/20">
                <BookOpen className="w-3.5 h-3.5" /> Study Material Intelligence
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#292B2B] tracking-tight">
              Curriculum Documents & AI Study Tools
            </h1>
            <p className="text-[#7A756E] text-sm max-w-2xl leading-relaxed">
              Upload official handbooks or custom study notes to synthesize source-grounded executive summaries, active-recall flashcards, and concept mind maps.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowUploader(!showUploader)}
              className="bg-[#A85D4C] hover:bg-[#8F4E3F] text-[#FFFDF9] font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-2 cursor-pointer"
            >
              {showUploader ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{showUploader ? 'Close Uploader' : 'Upload Material'}</span>
            </Button>
          </div>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-800">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Upload Zone Drawer */}
      {showUploader && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-200">
          <UploadZone
            onUploadSuccess={() => {
              setShowUploader(false);
              setSuccessMsg('Material uploaded and classified successfully!');
              fetchAllData();
            }}
          />
        </div>
      )}

      {/* 3. Materials Repository */}
      <div className="space-y-4">
        {/* Scope Filters */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[#FFFDF9] border border-[#E2DDD5] rounded-xl p-1 shadow-xs">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer",
                activeFilter === 'ALL'
                  ? "bg-[#292B2B] text-[#FFFDF9]"
                  : "text-[#7A756E] hover:text-[#292B2B]"
              )}
            >
              All Materials ({materials.length})
            </button>
            <button
              onClick={() => setActiveFilter('OFFICIAL')}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer",
                activeFilter === 'OFFICIAL'
                  ? "bg-[#A85D4C] text-[#FFFDF9]"
                  : "text-[#7A756E] hover:text-[#292B2B]"
              )}
            >
              Official Competency ({materials.filter(m => m.material_scope === 'OFFICIAL_COMPETENCY').length})
            </button>
            <button
              onClick={() => setActiveFilter('OTHER')}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer",
                activeFilter === 'OTHER'
                  ? "bg-[#2D3030] text-[#FFFDF9]"
                  : "text-[#7A756E] hover:text-[#292B2B]"
              )}
            >
              Other Learning ({materials.filter(m => m.material_scope === 'OTHER_LEARNING').length})
            </button>
          </div>

          <span className="text-xs font-mono text-[#7A756E]">
            Showing {filteredMaterials.length} of {materials.length} documents
          </span>
        </div>

        {/* Materials Table */}
        <Card className="bg-[#FFFDF9] border-[#E2DDD5] shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-[#7A756E] font-mono text-xs">
              Loading study material repository...
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <BookOpen className="w-8 h-8 text-[#7A756E]/40 mx-auto" />
              <p className="text-sm font-bold text-[#292B2B]">No study documents found.</p>
              <p className="text-xs text-[#7A756E] max-w-sm mx-auto">
                Upload your first official handbook or personal notes to establish your study repository.
              </p>
              <Button
                onClick={() => setShowUploader(true)}
                className="bg-[#A85D4C] text-[#FFFDF9] font-bold text-xs mt-2"
              >
                Upload Document Now
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EFEBE4] border-b border-[#E2DDD5] text-[#292B2B] uppercase font-mono font-semibold text-[10px]">
                  <tr>
                    <th className="p-3.5 sm:px-5">Document Title</th>
                    <th className="p-3.5 sm:px-5">Scope & Purpose</th>
                    <th className="p-3.5 sm:px-5">Competency / Topic</th>
                    <th className="p-3.5 sm:px-5">Status</th>
                    <th className="p-3.5 sm:px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DDD5] font-medium text-[#292B2B]">
                  {filteredMaterials.map((mat) => {
                    const statusBadge = getStatusBadge(mat.processing_status);
                    const isOfficial = mat.material_scope === 'OFFICIAL_COMPETENCY';
                    const isReady = mat.processing_status === 'completed';

                    return (
                      <tr key={mat.id} className="hover:bg-[#EFEBE4]/40 transition-colors cursor-pointer" onClick={() => navigate(`/materials/${mat.id}`)}>
                        <td className="p-3.5 sm:px-5">
                          <div className="space-y-0.5">
                            <span className="font-bold text-sm text-[#A85D4C] hover:underline block">
                              {mat.title}
                            </span>
                            <span className="text-[11px] font-mono text-[#7A756E] block">
                              {mat.original_filename || mat.filename} {mat.file_size ? `• ${(mat.file_size / 1024).toFixed(1)} KB` : ''}
                            </span>
                          </div>
                        </td>

                        <td className="p-3.5 sm:px-5">
                          {isOfficial ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#A85D4C]/10 text-[#A85D4C] border border-[#A85D4C]/30">
                              <BookOpen className="w-3 h-3" />
                              <span>Official Competency</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#2D3030]/10 text-[#2D3030] border border-[#2D3030]/30">
                              <FileType className="w-3 h-3" />
                              <span>Other Learning</span>
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 sm:px-5">
                          {mat.competency_name ? (
                            <div className="space-y-0.5">
                              <span className="font-semibold text-xs text-[#292B2B] block">
                                {mat.competency_name}
                              </span>
                              {mat.topic_name && (
                                <span className="text-[10px] font-mono text-[#7A756E] block">
                                  Topic: {mat.topic_name}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#7A756E] font-mono text-xs">—</span>
                          )}
                        </td>

                        <td className="p-3.5 sm:px-5">
                          <span className={cn("inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border", statusBadge.color)}>
                            {statusBadge.label}
                          </span>
                        </td>

                        <td className="p-3.5 sm:px-5 text-right">
                          <div className="inline-flex items-center gap-2">
                            {isReady && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); navigate(`/materials/${mat.id}`); }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#A85D4C]/10 hover:bg-[#A85D4C]/20 text-[#A85D4C] border border-[#A85D4C]/30 rounded-lg text-xs font-bold transition cursor-pointer"
                                title="Open Material Workspace"
                              >
                                <ArrowRight className="w-3 h-3" />
                                Workspace
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); openEditModal(mat); }}
                              className="p-1.5 rounded-lg text-[#7A756E] hover:text-[#2D3030] hover:bg-[#EFEBE4] transition-colors cursor-pointer"
                              title="Edit Metadata"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDeleteMaterial(mat.id); }}
                              className="p-1.5 rounded-lg text-[#7A756E] hover:text-[#A85D4C] hover:bg-[#A85D4C]/10 transition-colors cursor-pointer"
                              title="Delete Material"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* 4. Edit Metadata Modal */}
      {editingMaterial && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2DDD5]">
              <h3 className="font-bold text-base text-[#292B2B] flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#A85D4C]" />
                <span>Edit Material Metadata</span>
              </h3>
              <button
                onClick={() => setEditingMaterial(null)}
                className="text-[#7A756E] hover:text-[#2D3030] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-mono uppercase font-bold text-[#292B2B]">Document Title</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-[#FFFDF9] border-[#E2DDD5] text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono uppercase font-bold text-[#292B2B]">Material Scope</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditScope('OFFICIAL_COMPETENCY')}
                    className={cn(
                      "p-2.5 rounded-lg border text-center font-bold transition-all cursor-pointer",
                      editScope === 'OFFICIAL_COMPETENCY'
                        ? "border-[#A85D4C] bg-[#A85D4C]/10 text-[#A85D4C]"
                        : "border-[#E2DDD5] bg-[#FFFDF9] text-[#7A756E] hover:border-[#292B2B]"
                    )}
                  >
                    Official Competency
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditScope('OTHER_LEARNING')}
                    className={cn(
                      "p-2.5 rounded-lg border text-center font-bold transition-all cursor-pointer",
                      editScope === 'OTHER_LEARNING'
                        ? "border-[#2D3030] bg-[#2D3030]/10 text-[#2D3030]"
                        : "border-[#E2DDD5] bg-[#FFFDF9] text-[#7A756E] hover:border-[#292B2B]"
                    )}
                  >
                    Other Learning Material
                  </button>
                </div>
              </div>

              {editScope === 'OFFICIAL_COMPETENCY' && (
                <div className="space-y-3 p-3 bg-[#EFEBE4]/50 border border-[#E2DDD5] rounded-xl">
                  <div className="space-y-1">
                    <label className="font-mono uppercase font-bold text-[#292B2B]">Competency</label>
                    <select
                      value={editCompId}
                      onChange={(e) => {
                        setEditCompId(e.target.value);
                        setEditTopicId('');
                      }}
                      className="w-full bg-[#FFFDF9] border border-[#E2DDD5] rounded-lg p-2 text-xs text-[#292B2B] focus:outline-none"
                    >
                      {competencies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {selectedCompObj?.topics && selectedCompObj.topics.length > 0 && (
                    <div className="space-y-1">
                      <label className="font-mono uppercase font-bold text-[#292B2B]">Topic (Optional)</label>
                      <select
                        value={editTopicId}
                        onChange={(e) => setEditTopicId(e.target.value)}
                        className="w-full bg-[#FFFDF9] border border-[#E2DDD5] rounded-lg p-2 text-xs text-[#292B2B] focus:outline-none"
                      >
                        <option value="">-- General Topic / Unspecified --</option>
                        {selectedCompObj.topics.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2DDD5]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingMaterial(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="bg-[#A85D4C] text-[#FFFDF9] font-bold text-xs"
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Phase 5B Study Content Modal Viewer */}
      {activeStudyTool && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150 my-8">
            {/* Modal Tab Switcher */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openStudyTool(activeStudyTool.material, 'notes')}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer",
                    activeStudyTool.tool === 'notes'
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <FileText className="w-3.5 h-3.5" /> Study Notes
                </button>
                <button
                  onClick={() => openStudyTool(activeStudyTool.material, 'flashcards')}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer",
                    activeStudyTool.tool === 'flashcards'
                      ? "bg-emerald-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <Layers className="w-3.5 h-3.5" /> Flashcards
                </button>
                <button
                  onClick={() => openStudyTool(activeStudyTool.material, 'mindmap')}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer",
                    activeStudyTool.tool === 'mindmap'
                      ? "bg-purple-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <GitBranch className="w-3.5 h-3.5" /> Mind Map
                </button>
              </div>

              <button
                onClick={() => setActiveStudyTool(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Viewer Content */}
            {loadingContent ? (
              <div className="py-16 text-center text-slate-500 text-sm font-mono">
                Loading study content...
              </div>
            ) : (
              <>
                {activeStudyTool.tool === 'notes' && (
                  <NotesViewer
                    materialId={activeStudyTool.material.id}
                    materialTitle={activeStudyTool.material.title}
                    materialScope={activeStudyTool.material.material_scope}
                    competencyName={activeStudyTool.material.competency_name}
                    topicName={activeStudyTool.material.topic_name}
                    initialData={notesData}
                    onRegenerate={handleRegenerateNotes}
                    onClose={() => setActiveStudyTool(null)}
                    isGenerating={isGenerating}
                  />
                )}

                {activeStudyTool.tool === 'flashcards' && (
                  <FlashcardDeck
                    materialId={activeStudyTool.material.id}
                    materialTitle={activeStudyTool.material.title}
                    materialScope={activeStudyTool.material.material_scope}
                    competencyName={activeStudyTool.material.competency_name}
                    topicName={activeStudyTool.material.topic_name}
                    initialData={flashcardsData}
                    onRegenerate={handleRegenerateFlashcards}
                    onClose={() => setActiveStudyTool(null)}
                    isGenerating={isGenerating}
                  />
                )}

                {activeStudyTool.tool === 'mindmap' && (
                  <MindMapViewer
                    materialId={activeStudyTool.material.id}
                    materialTitle={activeStudyTool.material.title}
                    materialScope={activeStudyTool.material.material_scope}
                    competencyName={activeStudyTool.material.competency_name}
                    topicName={activeStudyTool.material.topic_name}
                    initialData={mindMapData}
                    onRegenerate={handleRegenerateMindMap}
                    onClose={() => setActiveStudyTool(null)}
                    isGenerating={isGenerating}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
      {/* 6. Phase 5C Material Quiz Modal */}
      {quizMaterial && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2DDD5]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#292B2B]">Personal Adaptive Material Quiz</h3>
                  <p className="text-[11px] font-mono text-[#7A756E]">{quizMaterial.title}</p>
                </div>
              </div>
              <button
                onClick={() => setQuizMaterial(null)}
                className="text-[#7A756E] hover:text-[#2D3030] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {quizError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{quizError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
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
                      onClick={() => setQuizType(t.id as any)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
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

              {/* Adaptive Calibration Note */}
              <div className="p-3 bg-[#EFEBE4]/60 border border-[#E2DDD5] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#A85D4C]" />
                  <div>
                    <span className="font-bold text-[#292B2B] block text-[11px]">Adaptive Calibration</span>
                    <span className="text-[10px] text-[#7A756E] block">Difficulty adjusts dynamically to learner performance</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#A85D4C]/15 text-[#A85D4C]">
                  Active
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2DDD5]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuizMaterial(null)}
                className="text-xs"
                disabled={isStartingQuiz}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleStartMaterialQuiz}
                disabled={isStartingQuiz}
                className="bg-[#A85D4C] hover:bg-[#8F4E3F] text-[#FFFDF9] font-bold text-xs flex items-center gap-1.5 shadow-sm"
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

    </div>
  );
}
