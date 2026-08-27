import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UploadZone from '@/components/materials/UploadZone';
import QuestionGenerator from '@/components/materials/QuestionGenerator';
import { 
  FileText, 
  Sparkles, 
  Play, 
  BookOpen, 
  Target, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Layers,
  GraduationCap,
  UploadCloud,
  Plus,
  X,
  FileCheck,
  Zap,
  HelpCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { assessmentApi, competencyApi, materialApi } from '@/lib/api';

export default function Materials() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [competencies, setCompetencies] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [myNotes, setMyNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [startingPractice, setStartingPractice] = useState<boolean>(false);

  // Practice Form State
  const [selectedCompId, setSelectedCompId] = useState<string>('1');
  const [selectedDiff, setSelectedDiff] = useState<string>('2');
  const [selectedCount, setSelectedCount] = useState<string>('5');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Learner Personal Notes Upload State
  const [showNotesUploader, setShowNotesUploader] = useState<boolean>(false);
  const [notesFile, setNotesFile] = useState<File | null>(null);
  const [notesTitle, setNotesTitle] = useState<string>('');
  const [notesCompId, setNotesCompId] = useState<string>('1');
  const [notesUploading, setNotesUploading] = useState<boolean>(false);
  const [generatingQuizId, setGeneratingQuizId] = useState<number | null>(null);
  const [notesSuccessMsg, setNotesSuccessMsg] = useState<string | null>(null);
  const [notesError, setNotesError] = useState<string | null>(null);

  // Admin Content Management State
  const [showAdminUploadModal, setShowAdminUploadModal] = useState<boolean>(false);
  const [selectedMaterialForMCQ, setSelectedMaterialForMCQ] = useState<any | null>(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [cRes, mRes, notesRes] = await Promise.allSettled([
        competencyApi.getAll(),
        materialApi.getAll(),
        materialApi.getMyNotes()
      ]);

      if (cRes.status === 'fulfilled') {
        setCompetencies(cRes.value.data || []);
      }
      if (mRes.status === 'fulfilled' && mRes.value.data?.length > 0) {
        setMaterials(mRes.value.data);
      } else {
        setMaterials([
          { id: 1, title: 'National Survey Sampling Guidelines & Standards (NSS 2026)', competency: 'Sampling Techniques', detected_topics: ['Stratified Sampling', 'Cluster Allocation', 'Survey Design'], upload_date: '2026-08-22', processing_status: 'completed' },
          { id: 2, title: 'Periodic Labour Force Survey (PLFS) Field Manual', competency: 'Survey Methodology', detected_topics: ['Field Validation', 'Response Imputation', 'Data Quality'], upload_date: '2026-08-18', processing_status: 'completed' },
          { id: 3, title: 'Index of Industrial Production (IIP) Methodology Handbook', competency: 'Data Interpretation', detected_topics: ['Index Numbers', 'Weighting Schemes'], upload_date: '2026-08-14', processing_status: 'completed' },
        ]);
      }
      if (notesRes.status === 'fulfilled') {
        setMyNotes(notesRes.value.data || []);
      }
    } catch (err) {
      console.error('Failed to load practice data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleStartPractice = async (overrideCompId?: number) => {
    try {
      setStartingPractice(true);
      setErrorMsg(null);

      const targetCompId = overrideCompId || parseInt(selectedCompId) || 1;
      const res = await assessmentApi.start({
        assessment_type: 'practice',
        competency_ids: [targetCompId],
        difficulty: selectedDiff,
        question_count: parseInt(selectedCount) || 5
      });

      const assessmentId = res.data.assessment_id;
      navigate(`/quiz/${assessmentId}`, {
        state: {
          assessmentId: assessmentId,
          assessmentType: 'practice',
          questions: res.data.questions
        }
      });
    } catch (err: any) {
      console.error('Failed to start practice assessment:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to initialize practice session. Please try again.');
    } finally {
      setStartingPractice(false);
    }
  };

  const handleUploadLearnerNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notesFile) {
      setNotesError('Please select a PDF or notes file.');
      return;
    }

    try {
      setNotesUploading(true);
      setNotesError(null);

      const formData = new FormData();
      formData.append('file', notesFile);
      if (notesTitle.trim()) {
        formData.append('title', notesTitle.trim());
      }
      formData.append('competency_id', notesCompId);

      const res = await materialApi.uploadLearnerNotes(formData);

      setNotesSuccessMsg(`Notes processed! AI executive summary generated.`);
      setNotesFile(null);
      setNotesTitle('');
      setShowNotesUploader(false);
      setTimeout(() => setNotesSuccessMsg(null), 5000);
      fetchAllData();
    } catch (err: any) {
      console.error('Notes upload failed:', err);
      setNotesError(err.response?.data?.detail || 'Failed to upload and summarize notes.');
    } finally {
      setNotesUploading(false);
    }
  };

  const handleGenerateNotesQuiz = async (noteId: number, count: number = 3) => {
    try {
      setGeneratingQuizId(noteId);
      const res = await materialApi.generateNotesPracticeQuiz(noteId, count, '2');
      const assessmentId = res.data.assessment_id;
      
      navigate(`/quiz/${assessmentId}`, {
        state: {
          assessmentId: assessmentId,
          assessmentType: 'practice',
          questions: res.data.questions
        }
      });
    } catch (err: any) {
      console.error('Failed to generate notes quiz:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to generate quiz from personal notes.');
    } finally {
      setGeneratingQuizId(null);
    }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-16 text-left">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#1F7A8C] uppercase tracking-widest mb-1">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>LEARNER PRACTICE & STUDY HUB</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#102A43] tracking-tight leading-tight">
            Targeted Practice & Personal Notes
          </h1>
          <p className="text-sm text-[#62748A] mt-1.5 leading-relaxed">
            Launch targeted drills on official standards, upload your personal field notes for AI summaries, or synthesize 3-5 question comprehension quizzes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowNotesUploader(!showNotesUploader)}
            className="bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-semibold text-xs sm:text-sm shadow-xs cursor-pointer flex items-center gap-1.5 h-9"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{showNotesUploader ? 'Close Notes Uploader' : '+ Upload Notes / PDF'}</span>
          </Button>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#2E7D32]/10 text-[#2E7D32] border border-[#2E7D32]/20 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
            <span>Active Study Hub</span>
          </div>
        </div>
      </div>

      {notesSuccessMsg && (
        <div className="p-4 rounded-xl bg-[#2E7D32]/10 border border-[#2E7D32]/30 text-xs font-bold text-[#2E7D32] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notesSuccessMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-xs font-bold text-[#0B2545] flex items-center justify-between">
          <span>{errorMsg}</span>
          <Button size="sm" variant="ghost" onClick={() => setErrorMsg(null)} className="h-6 text-xs">Dismiss</Button>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 1: LEARNER PERSONAL NOTES UPLOADER & SUMMARIZER */}
      {/* ============================================================ */}
      {showNotesUploader && (
        <Card className="bg-[#FFFFFF] border-2 border-[#1F7A8C] shadow-md animate-in fade-in duration-200 rounded-2xl">
          <CardHeader className="bg-[#EEF5F7] border-b border-[#DCE5EA] p-5 flex flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#1F7A8C]" />
              <CardTitle className="text-sm sm:text-base font-bold text-[#102A43]">
                Upload Personal Notes / Handouts for AI Summary & Quiz Generation
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotesUploader(false)}
              className="h-8 w-8 p-0 cursor-pointer text-[#62748A] hover:text-[#102A43] hover:bg-[#FFFFFF]/50 rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleUploadLearnerNotes} className="space-y-4">
              {notesError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                  {notesError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#102A43] uppercase tracking-wider">
                    Notes Title
                  </label>
                  <Input
                    value={notesTitle}
                    onChange={(e) => setNotesTitle(e.target.value)}
                    placeholder="e.g., PLFS Stratification Field Notes"
                    className="text-xs rounded-xl border-[#DCE5EA] bg-[#FFFFFF] h-10"
                    disabled={notesUploading}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#102A43] uppercase tracking-wider">
                    Target Competency
                  </label>
                  <Select value={notesCompId} onValueChange={setNotesCompId} disabled={notesUploading}>
                    <SelectTrigger className="border-[#DCE5EA] bg-[#FFFFFF] text-xs h-10 rounded-xl">
                      <SelectValue placeholder="Select competency" />
                    </SelectTrigger>
                    <SelectContent>
                      {competencies.map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-2 border-dashed rounded-2xl p-6 text-center border-[#DCE5EA] hover:border-[#1F7A8C] transition-colors relative bg-[#EEF5F7]/40">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setNotesFile(e.target.files[0]);
                      if (!notesTitle) {
                        setNotesTitle(e.target.files[0].name.replace(/\.[^/.]+$/, "").replace(/_/g, " "));
                      }
                      setNotesError(null);
                    }
                  }}
                  disabled={notesUploading}
                />
                <div className="flex flex-col items-center space-y-1.5 pointer-events-none">
                  <FileText className="w-8 h-8 text-[#1F7A8C]" />
                  <p className="text-xs font-bold text-[#102A43]">
                    {notesFile ? notesFile.name : "Select or drop your study notes (PDF, DOCX, TXT)"}
                  </p>
                  <p className="text-[10px] text-[#62748A]">
                    {notesFile ? `${(notesFile.size / 1024).toFixed(1)} KB` : "Files are analyzed privately for your study profile"}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowNotesUploader(false)} 
                  disabled={notesUploading}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!notesFile || notesUploading}
                  className="bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-bold text-xs shadow-xs cursor-pointer px-5"
                >
                  {notesUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-[#FFFFFF] border-t-transparent rounded-full animate-spin" />
                      <span>Extracting & Summarizing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Upload & Generate AI Summary</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ============================================================ */}
      {/* SECTION 2: MY PERSONAL STUDY NOTES KNOWLEDGE BASE */}
      {/* ============================================================ */}
      {myNotes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-[#0B2545] flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#1F7A8C]" />
              <span>My Uploaded Study Notes & Summaries ({myNotes.length})</span>
            </h2>
            <span className="text-xs font-mono text-[#1F7A8C] font-bold">
              Instant AI Quiz Generation Ready
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myNotes.map((note) => {
              const isGenerating = generatingQuizId === note.id;
              return (
                <Card key={note.id} className="bg-[#FFFFFF] border border-[#DCE5EA] rounded-2xl shadow-[0_1px_3px_rgba(11,37,69,0.04)] flex flex-col justify-between hover:border-[#1F7A8C]/40 transition-all">
                  <CardContent className="p-5 sm:p-6 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 rounded-xl bg-[#1F7A8C]/10 text-[#1F7A8C]">
                          <FileText className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm sm:text-base text-[#102A43] leading-snug">
                            {note.title}
                          </h4>
                          <p className="text-[10px] text-[#62748A] font-mono mt-0.5">
                            Uploaded {note.upload_date} • {Math.round((note.file_size || 0) / 1024)} KB
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* AI Executive Summary Block */}
                    <div className="p-3.5 rounded-xl bg-[#EEF5F7] border border-[#DCE5EA] space-y-1">
                      <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-[#1F7A8C]">
                        <Sparkles className="w-3 h-3" />
                        <span>AI EXECUTIVE SUMMARY & CONCEPTS</span>
                      </div>
                      <p className="text-xs text-[#102A43] leading-relaxed">
                        {note.summary || 'Summary generated from uploaded notes.'}
                      </p>
                    </div>

                    {/* Topic Tags */}
                    {note.topics && note.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {note.topics.map((t: string, tIdx: number) => (
                          <span key={tIdx} className="px-2.5 py-0.5 rounded-md bg-[#1F7A8C]/10 text-[#1F7A8C] text-[10px] font-semibold border border-[#1F7A8C]/20 font-mono">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>

                  {/* Actions to Generate Short MCQ Quiz from Notes */}
                  <div className="p-5 pt-0 border-t border-[#DCE5EA] mt-2 flex flex-col sm:flex-row items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleGenerateNotesQuiz(note.id, 3)}
                      disabled={isGenerating}
                      className="w-full sm:flex-1 bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-semibold text-xs h-9 rounded-xl shadow-2xs cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 mr-1" />
                      <span>{isGenerating ? 'Synthesizing Drill...' : '🎯 3-MCQ Quick Drill'}</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateNotesQuiz(note.id, 5)}
                      disabled={isGenerating}
                      className="w-full sm:flex-1 border-[#DCE5EA] hover:bg-[#EEF5F7] text-[#102A43] font-semibold text-xs h-9 rounded-xl cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 mr-1 fill-current text-[#1F7A8C]" />
                      <span>5-MCQ Drill</span>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 3: TARGETED PRACTICE SESSION LAUNCHER */}
      {/* ============================================================ */}
      <Card className="bg-[#FFFFFF] shadow-[0_1px_3px_rgba(11,37,69,0.04)] border border-[#DCE5EA] rounded-2xl">
        <CardHeader className="bg-[#EEF5F7] border-b border-[#DCE5EA] p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-[#1F7A8C] text-[#FFFFFF] shadow-2xs">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-[#102A43]">
                  Configure Targeted Competency Drill
                </CardTitle>
                <p className="text-xs text-[#62748A] mt-0.5">
                  Select your focus competency and challenge tier to generate a customized assessment.
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Competency Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#102A43] uppercase tracking-wider">
                Competency Domain
              </label>
              <Select value={selectedCompId} onValueChange={setSelectedCompId}>
                <SelectTrigger className="border-[#DCE5EA] bg-[#FFFFFF] text-xs h-10 rounded-xl">
                  <SelectValue placeholder="Select competency" />
                </SelectTrigger>
                <SelectContent>
                  {competencies.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Difficulty */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#102A43] uppercase tracking-wider">
                Challenge Tier
              </label>
              <Select value={selectedDiff} onValueChange={setSelectedDiff}>
                <SelectTrigger className="border-[#DCE5EA] bg-[#FFFFFF] text-xs h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 — Foundational (Definitions & Recalls)</SelectItem>
                  <SelectItem value="2">2 — Applied (Survey Operations & Design)</SelectItem>
                  <SelectItem value="3">3 — Advanced (Variance & Policy Analysis)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Question Count */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#102A43] uppercase tracking-wider">
                Session Length
              </label>
              <Select value={selectedCount} onValueChange={setSelectedCount}>
                <SelectTrigger className="border-[#DCE5EA] bg-[#FFFFFF] text-xs h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Questions (Quick Drill)</SelectItem>
                  <SelectItem value="5">5 Questions (Standard Practice)</SelectItem>
                  <SelectItem value="10">10 Questions (Comprehensive Audit)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#DCE5EA]">
            <div className="text-xs text-[#62748A] font-medium">
              💡 Practice sessions draw strictly from calibrated questions and do not alter official benchmark scores until verified in an adaptive audit.
            </div>

            <Button
              size="lg"
              disabled={startingPractice}
              onClick={() => handleStartPractice()}
              className="w-full sm:w-auto bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-semibold text-xs sm:text-sm shadow-xs cursor-pointer px-6 h-10 rounded-xl"
            >
              {startingPractice ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-[#FFFFFF] border-t-transparent rounded-full animate-spin" />
                  <span>Preparing Session...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 fill-current" />
                  <span>Launch Practice Quiz</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* SECTION 4: OFFICIAL TRAINING HANDBOOKS & CURRICULA */}
      {/* ============================================================ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-[#102A43] flex items-center gap-2">
            <BookOpen className="w-4.5 h-4.5 text-[#1F7A8C]" />
            <span>Official MoSPI Handbooks & Curricula</span>
          </h2>
          <span className="text-xs font-mono text-[#62748A] font-semibold">
            Government Accredited Sources ({materials.length})
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {materials.map((m, idx) => {
            const topics = Array.isArray(m.detected_topics || m.topics) ? (m.detected_topics || m.topics) : ['Statistical Methods', 'Field Operations'];
            const compId = m.competency_id || (idx + 1);
            const isSelected = selectedMaterialForMCQ?.id === m.id;

            return (
              <Card key={m.id || idx} className="bg-[#FFFFFF] border border-[#DCE5EA] rounded-2xl shadow-[0_1px_3px_rgba(11,37,69,0.04)] hover:border-[#1F7A8C]/50 transition-all flex flex-col justify-between">
                <CardContent className="p-5 sm:p-6 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="p-2 rounded-xl bg-[#1F7A8C]/10 text-[#1F7A8C]">
                      <FileText className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[10px] font-mono text-[#62748A] font-semibold">
                      {m.upload_date || 'MoSPI 2026'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-[#102A43] leading-snug line-clamp-2">
                      {m.title}
                    </h4>
                    <p className="text-xs text-[#62748A] mt-1 line-clamp-2">
                      {m.summary || 'Official procedural standard guidelines for national survey sampling, field data collection, and estimation.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {topics.slice(0, 2).map((t: string, tIdx: number) => (
                      <span key={tIdx} className="px-2.5 py-0.5 rounded-md bg-[#EEF5F7] text-[#102A43] text-[10px] font-medium border border-[#DCE5EA]">
                        {t}
                      </span>
                    ))}
                  </div>
                </CardContent>

                <div className="p-5 pt-0 border-t border-[#DCE5EA] mt-2 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartPractice(compId)}
                    className="flex-1 text-xs font-semibold border-[#DCE5EA] hover:bg-[#1F7A8C] hover:text-[#FFFFFF] text-[#1F7A8C] transition-all cursor-pointer h-8.5 rounded-xl"
                  >
                    <Play className="w-3 h-3 mr-1 fill-current" />
                    <span>Practice</span>
                  </Button>

                  {isAdmin && (
                    <Button
                      size="sm"
                      onClick={() => setSelectedMaterialForMCQ(isSelected ? null : m)}
                      className={`text-xs font-semibold shadow-2xs cursor-pointer h-8.5 rounded-xl ${
                        isSelected 
                          ? 'bg-[#0B2545] text-[#FFFFFF]' 
                          : 'bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF]'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1" />
                      <span>{isSelected ? 'Configuring' : 'Generate MCQs'}</span>
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 5: ADMIN CONTENT MANAGEMENT & AI SYNTHESIS (ADMIN ONLY) */}
      {/* ============================================================ */}
      {isAdmin && (
        <div className="space-y-6 pt-4 border-t-2 border-[#1F7A8C]/20">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-widest mb-0.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>CONTENT MANAGEMENT & AI SYNTHESIS (ADMIN)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0B2545] tracking-tight">
                Official Knowledge Base & Question Bank Curation
              </h2>
              <p className="text-xs text-[#2B2D42]/80 mt-0.5">
                Upload official MoSPI manuals to synthesize and approve questions into the national adaptive assessment bank.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => setShowAdminUploadModal(!showAdminUploadModal)}
              className="self-start sm:self-auto bg-[#0B2545] hover:bg-[#0B2545]/90 text-[#FFFFFF] font-bold text-xs shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>{showAdminUploadModal ? 'Close Uploader' : '+ Upload Official Curriculum'}</span>
            </Button>
          </div>

          {showAdminUploadModal && (
            <Card className="bg-[#FFFFFF] border-2 border-[#1F7A8C] shadow-md animate-in fade-in duration-200">
              <CardHeader className="bg-[#F4F6F9] border-b border-[#2B2D42]/10 p-4 flex flex-row items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UploadCloud className="w-4 h-4 text-[#1F7A8C]" />
                  <CardTitle className="text-sm font-bold text-[#0B2545]">
                    Upload Official MoSPI Document
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdminUploadModal(false)}
                  className="h-7 w-7 p-0 cursor-pointer text-[#2B2D42]/60 hover:text-[#0B2545]"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                <UploadZone onUploadSuccess={() => { setShowAdminUploadModal(false); fetchAllData(); }} />
              </CardContent>
            </Card>
          )}

          {selectedMaterialForMCQ && (
            <Card className="bg-[#FFFFFF] border-2 border-[#1F7A8C] shadow-md animate-in fade-in duration-200">
              <CardHeader className="bg-[#0B2545] text-[#FFFFFF] p-4 flex flex-row items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <CardTitle className="text-sm sm:text-base font-bold text-[#FFFFFF]">
                    AI MCQ Synthesis & Curation: {selectedMaterialForMCQ.title}
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMaterialForMCQ(null)}
                  className="text-[#FFFFFF]/70 hover:text-[#FFFFFF] hover:bg-[#FFFFFF]/10 h-8 w-8 p-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                <QuestionGenerator 
                  materialId={selectedMaterialForMCQ.id}
                  initialCompetencyId={selectedMaterialForMCQ.competency_id}
                  onGenerationComplete={() => fetchAllData()}
                />
              </CardContent>
            </Card>
          )}

        </div>
      )}

    </div>
  );
}
