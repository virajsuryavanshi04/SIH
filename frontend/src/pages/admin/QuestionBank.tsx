import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { questionApi, competencyApi } from '@/lib/api';
import { 
  Search, Eye, Check, X, Sparkles, Database, 
  Layers, CheckCircle2, AlertCircle, Edit3, Filter, HelpCircle, 
  BookOpen, Clock, ShieldCheck, FileText, ChevronRight, History, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function QuestionBank() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filter States
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedComp, setSelectedComp] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDiff, setSelectedDiff] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [aiOnlyFilter, setAiOnlyFilter] = useState<boolean>(false);
  
  // Modals & Dialogs
  const [inspectingQ, setInspectingQ] = useState<any | null>(null);
  const [editingQ, setEditingQ] = useState<any | null>(null);
  const [rejectingQ, setRejectingQ] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [customRejectReason, setCustomRejectReason] = useState<string>('');
  const [showGenModal, setShowGenModal] = useState<boolean>(false);
  
  // Generation Form State
  const [genCompId, setGenCompId] = useState<string>('1');
  const [genTopicName, setGenTopicName] = useState<string>('Stratified Sampling');
  const [genDiff, setGenDiff] = useState<string>('2');
  const [genCount, setGenCount] = useState<number>(5);
  const [generating, setGenerating] = useState<boolean>(false);
  
  // Feedback Messages
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const res = await questionApi.getStats();
      if (res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load question stats:', err);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const [qRes, cRes] = await Promise.allSettled([
        questionApi.getAll({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          competency_id: selectedComp !== 'all' ? parseInt(selectedComp) : undefined,
          question_type: selectedType !== 'all' ? selectedType : undefined,
          difficulty: selectedDiff !== 'all' ? selectedDiff : undefined,
          source: selectedSource !== 'all' ? selectedSource : undefined,
          is_ai_generated: aiOnlyFilter ? true : undefined,
          search: search.trim() || undefined
        }),
        competencyApi.getAll()
      ]);

      if (qRes.status === 'fulfilled') {
        setQuestions(qRes.value.data || []);
      }
      if (cRes.status === 'fulfilled') {
        setCompetencies(cRes.value.data || []);
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
      setActionError('Failed to retrieve question records from the database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [statusFilter, selectedComp, selectedType, selectedDiff, selectedSource, aiOnlyFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuestions();
  };

  const handleOpenInspect = async (q: any) => {
    try {
      const res = await questionApi.get(q.id);
      setInspectingQ(res.data || q);
    } catch (err) {
      setInspectingQ(q);
    }
  };

  const handleApprove = async (questionId: number) => {
    try {
      setActionError(null);
      await questionApi.updateStatus(questionId, 'approved');
      setActionSuccess(`Question #${questionId} approved and added to the active assessment pool.`);
      setTimeout(() => setActionSuccess(null), 3500);
      setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, status: 'approved' } : q));
      if (inspectingQ?.id === questionId) {
        setInspectingQ(null);
      }
      fetchStats();
    } catch (err: any) {
      console.error('Approval failed:', err);
      setActionError(err.response?.data?.detail || 'Failed to approve question. Admin permission required.');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingQ) return;
    const finalReason = customRejectReason.trim() || rejectReason || 'Administrative rejection';
    try {
      setActionError(null);
      await questionApi.updateStatus(rejectingQ.id, 'rejected', finalReason);
      setActionSuccess(`Question #${rejectingQ.id} marked as rejected.`);
      setTimeout(() => setActionSuccess(null), 3500);
      setQuestions(prev => prev.map(q => q.id === rejectingQ.id ? { ...q, status: 'rejected' } : q));
      if (inspectingQ?.id === rejectingQ.id) {
        setInspectingQ(null);
      }
      setRejectingQ(null);
      setRejectReason('');
      setCustomRejectReason('');
      fetchStats();
    } catch (err: any) {
      console.error('Rejection failed:', err);
      setActionError(err.response?.data?.detail || 'Failed to reject question.');
    }
  };

  const handleGenerateSet = async () => {
    try {
      setGenerating(true);
      setActionError(null);
      const res = await questionApi.generate({
        competency_id: parseInt(genCompId),
        topic_id: undefined,
        difficulty: genDiff,
        count: genCount
      });
      setShowGenModal(false);
      setActionSuccess(`Synthesized ${res.data?.generated_count || genCount} candidate questions. Ready for administrative review.`);
      setTimeout(() => setActionSuccess(null), 4000);
      setStatusFilter('pending_review');
      fetchStats();
      fetchQuestions();
    } catch (err: any) {
      console.error('Generation set failed:', err);
      setActionError(err.response?.data?.detail || 'On-demand AI generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingQ) return;
    try {
      setActionError(null);

      // Validate exactly 4 options
      if (!editingQ.options || editingQ.options.length !== 4) {
        setActionError('Question must contain exactly 4 options.');
        return;
      }

      // Validate exactly 1 correct answer
      const correctCount = editingQ.options.filter((o: any) => o.is_correct).length;
      if (correctCount !== 1) {
        setActionError('Please select exactly 1 correct option.');
        return;
      }

      await questionApi.update(editingQ.id, {
        question_text: editingQ.question_text || editingQ.text,
        text: editingQ.question_text || editingQ.text,
        explanation: editingQ.explanation,
        difficulty: editingQ.difficulty,
        question_type: editingQ.question_type,
        competency_id: editingQ.competency_id ? Number(editingQ.competency_id) : undefined,
        source_reference: editingQ.source_reference,
        options: editingQ.options.map((opt: any, idx: number) => ({
          id: opt.id,
          option_text: opt.option_text || opt.text || '',
          is_correct: opt.is_correct,
          order: idx + 1
        }))
      });

      setActionSuccess(`Question #${editingQ.id} modifications saved to database.`);
      setTimeout(() => setActionSuccess(null), 3000);
      setEditingQ(null);
      fetchQuestions();
      fetchStats();
    } catch (err: any) {
      console.error('Failed to save question edit:', err);
      setActionError(err.response?.data?.detail || 'Failed to save question edit.');
    }
  };

  const formatDifficultyLabel = (diff: string) => {
    if (diff === '1' || diff?.toLowerCase() === 'easy') return 'Easy (1)';
    if (diff === '3' || diff?.toLowerCase() === 'hard') return 'Hard (3)';
    return 'Medium (2)';
  };

  const formatQuestionTypeBadge = (type: string) => {
    if (type === 'WORD_PROBLEM') return { label: 'Word Problem', bg: 'bg-[#B38A3D]/10 text-[#B38A3D] border-[#B38A3D]/30' };
    if (type === 'CASE_STUDY') return { label: 'Case Study', bg: 'bg-[#A85D4C]/10 text-[#A85D4C] border-[#A85D4C]/30' };
    return { label: 'Short MCQ', bg: 'bg-[#7A756E]/10 text-[#7A756E] border-[#7A756E]/30' };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 text-left select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#A85D4C] uppercase tracking-widest mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>INSTITUTIONAL GOVERNANCE & QUALITY CONTROL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#292B2B] tracking-tight">
            Official Question Bank
          </h1>
          <p className="text-xs sm:text-sm text-[#7A756E] mt-1">
            Review, calibrate, and approve source-grounded questions. Only approved questions enter the active assessment pool.
          </p>
        </div>
        
        <Button 
          onClick={() => setShowGenModal(true)}
          className="bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9] font-semibold text-xs sm:text-sm shadow-xs cursor-pointer h-10 px-4 rounded-xl"
        >
          <Sparkles className="w-4 h-4 mr-1.5 text-[#B38A3D]" />
          <span>Synthesize AI Candidate</span>
        </Button>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-[#2E8B57]/10 border border-[#2E8B57]/30 text-xs font-bold font-mono text-[#2E8B57] flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3.5 rounded-xl bg-[#D9534F]/10 border border-[#D9534F]/30 text-xs font-bold font-mono text-[#D9534F] flex items-center gap-2 animate-in fade-in duration-200">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Real-time Dynamic KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Questions */}
        <div className="p-4 bg-[#FFFDF9] rounded-2xl border border-[#E2DDD5] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#7A756E]">
            <span className="text-[11px] font-mono font-bold uppercase">Total Questions</span>
            <Database className="w-4 h-4 text-[#7A756E]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-[#292B2B]">
            {stats ? stats.total : '—'}
          </p>
          <span className="text-[10px] text-[#7A756E] block font-mono">
            {stats ? `${stats.by_source?.ai_generated || 0} AI • ${stats.by_source?.seeded || 0} Seeded` : 'Live repository count'}
          </span>
        </div>

        {/* Pending Review */}
        <div className="p-4 bg-[#FFFDF9] rounded-2xl border border-[#E2DDD5] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#B38A3D]">
            <span className="text-[11px] font-mono font-bold uppercase">Pending Review</span>
            <Clock className="w-4 h-4 text-[#B38A3D]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-[#B38A3D]">
            {stats ? stats.pending_review : '—'}
          </p>
          <span className="text-[10px] text-[#B38A3D] block font-mono">
            Requires administrator review
          </span>
        </div>

        {/* Approved Active Pool */}
        <div className="p-4 bg-[#FFFDF9] rounded-2xl border border-[#E2DDD5] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#2E8B57]">
            <span className="text-[11px] font-mono font-bold uppercase">Approved Pool</span>
            <CheckCircle2 className="w-4 h-4 text-[#2E8B57]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-[#2E8B57]">
            {stats ? stats.approved : '—'}
          </p>
          <span className="text-[10px] text-[#2E8B57] block font-mono">
            Active in adaptive assessments
          </span>
        </div>

        {/* Rejected */}
        <div className="p-4 bg-[#FFFDF9] rounded-2xl border border-[#E2DDD5] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#7D4036]">
            <span className="text-[11px] font-mono font-bold uppercase">Rejected</span>
            <X className="w-4 h-4 text-[#7D4036]" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-[#7D4036]">
            {stats ? stats.rejected : '—'}
          </p>
          <span className="text-[10px] text-[#7A756E] block font-mono">
            Auditable archive
          </span>
        </div>

      </div>

      {/* Quick Status & AI Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#FFFDF9] rounded-2xl border border-[#E2DDD5] shadow-2xs">
        <button
          type="button"
          onClick={() => { setStatusFilter('all'); setAiOnlyFilter(false); }}
          className={cn(
            "px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer",
            statusFilter === 'all' && !aiOnlyFilter
              ? "bg-[#292B2B] text-[#FFFDF9] shadow-xs"
              : "text-[#7A756E] hover:text-[#292B2B] hover:bg-[#EFEBE4]"
          )}
        >
          All Questions ({stats ? stats.total : '—'})
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('pending_review'); setAiOnlyFilter(true); }}
          className={cn(
            "px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5",
            statusFilter === 'pending_review' && aiOnlyFilter
              ? "bg-[#B38A3D] text-[#FFFDF9] shadow-xs"
              : "text-[#B38A3D] bg-[#B38A3D]/10 hover:bg-[#B38A3D]/20"
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Pending AI Review</span>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('pending_review'); setAiOnlyFilter(false); }}
          className={cn(
            "px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer",
            statusFilter === 'pending_review' && !aiOnlyFilter
              ? "bg-[#B38A3D] text-[#FFFDF9] shadow-xs"
              : "text-[#7A756E] hover:text-[#292B2B] hover:bg-[#EFEBE4]"
          )}
        >
          All Pending ({stats ? stats.pending_review : '—'})
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('approved'); setAiOnlyFilter(false); }}
          className={cn(
            "px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer",
            statusFilter === 'approved' && !aiOnlyFilter
              ? "bg-[#2E8B57] text-[#FFFDF9] shadow-xs"
              : "text-[#7A756E] hover:text-[#292B2B] hover:bg-[#EFEBE4]"
          )}
        >
          Approved Pool ({stats ? stats.approved : '—'})
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('rejected'); setAiOnlyFilter(false); }}
          className={cn(
            "px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer",
            statusFilter === 'rejected' && !aiOnlyFilter
              ? "bg-[#7D4036] text-[#FFFDF9] shadow-xs"
              : "text-[#7A756E] hover:text-[#292B2B] hover:bg-[#EFEBE4]"
          )}
        >
          Rejected ({stats ? stats.rejected : '—'})
        </button>
      </div>

      {/* Multi-Attribute Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-[#FFFDF9] rounded-2xl shadow-[0_1px_3px_rgba(45, 48, 48, 0.04)] border border-[#E2DDD5]">
        
        {/* Search */}
        <div className="sm:col-span-4 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A756E]/60 w-4 h-4" />
          <form onSubmit={handleSearchSubmit}>
            <Input 
              placeholder="Search Bank ID, prompt, source..." 
              className="pl-10 border-[#E2DDD5] focus:border-[#A85D4C] text-xs h-10 bg-[#FFFDF9] rounded-xl text-[#292B2B]" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </form>
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="border-[#E2DDD5] bg-[#FFFDF9] text-xs h-10 rounded-xl">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Competency Filter */}
        <div className="sm:col-span-2">
          <Select value={selectedComp} onValueChange={setSelectedComp}>
            <SelectTrigger className="border-[#E2DDD5] bg-[#FFFDF9] text-xs h-10 rounded-xl">
              <SelectValue placeholder="All Competencies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Competencies</SelectItem>
              {competencies.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Question Type Filter */}
        <div className="sm:col-span-2">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="border-[#E2DDD5] bg-[#FFFDF9] text-xs h-10 rounded-xl">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="SHORT_MCQ">Short MCQ</SelectItem>
              <SelectItem value="WORD_PROBLEM">Word Problem</SelectItem>
              <SelectItem value="CASE_STUDY">Case Study</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Difficulty Filter */}
        <div className="sm:col-span-2">
          <Select value={selectedDiff} onValueChange={setSelectedDiff}>
            <SelectTrigger className="border-[#E2DDD5] bg-[#FFFDF9] text-xs h-10 rounded-xl">
              <SelectValue placeholder="All Difficulties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="1">1 - Foundational (Easy)</SelectItem>
              <SelectItem value="2">2 - Intermediate (Medium)</SelectItem>
              <SelectItem value="3">3 - Advanced (Hard)</SelectItem>
            </SelectContent>
          </Select>
        </div>

      </div>

      {/* Main Questions Table */}
      <Card className="bg-[#FFFDF9] shadow-[0_1px_3px_rgba(45, 48, 48, 0.04)] border border-[#E2DDD5] rounded-2xl overflow-hidden">
        <CardHeader className="bg-[#EFEBE4] border-b border-[#E2DDD5] p-5 pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xs font-mono font-bold text-[#292B2B] uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#A85D4C]" />
              Repository Questions ({questions.length})
            </CardTitle>
            <span className="text-[11px] font-mono text-[#7A756E]">
              Only approved questions enter the active assessment pool
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-[#7A756E] font-semibold">Loading questions repository...</div>
          ) : questions.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#7A756E]">
              No questions found matching criteria. Adjust filters or search keywords.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EFEBE4] border-b border-[#E2DDD5] text-[#292B2B] uppercase tracking-wider font-semibold font-mono text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5 w-5/12">Question & Citation</th>
                    <th className="px-5 py-3.5">Competency & Topic</th>
                    <th className="px-5 py-3.5">Type & Difficulty</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DDD5] font-medium text-[#292B2B]">
                  {questions.map(q => {
                    const isApproved = q.status === 'approved';
                    const isRejected = q.status === 'rejected';
                    const isPending = q.status === 'pending_review';
                    const typeBadge = formatQuestionTypeBadge(q.question_type);

                    return (
                      <tr key={q.id} className="hover:bg-[#EFEBE4]/50 transition-colors">
                        
                        {/* Question Text & Bank ID */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2 mb-1">
                            {q.bank_question_id && (
                              <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-[#2D3030] text-[#FFFDF9] shadow-2xs">
                                {q.bank_question_id}
                              </span>
                            )}
                            <span className={cn("text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border", typeBadge.bg)}>
                              {typeBadge.label}
                            </span>
                            {(q.is_ai_generated || q.source === 'ai_generated') && (
                              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border bg-[#B38A3D]/15 text-[#B38A3D] border-[#B38A3D]/30 flex items-center gap-1">
                                🤖 AI
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-[#292B2B] line-clamp-2 leading-snug">
                            {q.question_text || q.text}
                          </p>
                          {q.source_material_title ? (
                            <span className="text-[10px] font-mono text-[#A85D4C] font-semibold block mt-1 truncate">
                              📄 Source Doc: {q.source_material_title} (Official Learning Material)
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-[#7A756E] block mt-1 truncate">
                              Source: {q.source_title || q.source_reference || 'Official Institutional Standards'}
                            </span>
                          )}
                        </td>

                        {/* Competency & Topic */}
                        <td className="px-5 py-3.5">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#A85D4C]/10 text-[#A85D4C] border border-[#A85D4C]/20 block w-fit">
                            {q.competency_name}
                          </span>
                          <span className="text-[10px] text-[#7A756E] font-medium block mt-1 truncate">
                            {q.topic_name || 'General Concept'}
                          </span>
                        </td>

                        {/* Type & Difficulty */}
                        <td className="px-5 py-3.5 font-mono">
                          <span className="text-xs font-bold text-[#292B2B] block">
                            {formatDifficultyLabel(q.difficulty)}
                          </span>
                          <span className="text-[10px] text-[#7A756E] block mt-0.5 font-mono">
                            {q.is_ai_generated || q.source === 'ai_generated' ? '🤖 AI Generated' : '🏛️ Seeded'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border uppercase inline-block",
                            isApproved 
                              ? "bg-[#2E8B57]/10 text-[#2E8B57] border-[#2E8B57]/30"
                              : isRejected
                              ? "bg-[#7D4036]/15 text-[#7D4036] border-[#7D4036]/35"
                              : "bg-[#B38A3D]/15 text-[#B38A3D] border-[#B38A3D]/30"
                          )}>
                            {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending Review'}
                          </span>
                        </td>

                        {/* Review Actions */}
                        <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                          
                          {/* Inspect Button */}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleOpenInspect(q)}
                            className="h-8 px-2.5 text-[#A85D4C] hover:bg-[#A85D4C]/10 text-[11px] font-bold cursor-pointer rounded-lg" 
                            title="Inspect Question Details"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> Inspect
                          </Button>
                          
                          {/* Approve Button */}
                          {!isApproved && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleApprove(q.id)}
                              className="h-8 px-2.5 text-[#2E8B57] hover:bg-[#2E8B57]/10 text-[11px] font-bold cursor-pointer rounded-lg" 
                              title="Approve Question"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" /> Approve
                            </Button>
                          )}

                          {/* Reject Button */}
                          {!isRejected && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setRejectingQ(q)}
                              className="h-8 px-2.5 text-[#7D4036] hover:bg-[#7D4036]/15 text-[11px] font-bold cursor-pointer rounded-lg" 
                              title="Reject Question"
                            >
                              <X className="w-3.5 h-3.5 mr-1" /> Reject
                            </Button>
                          )}

                          {/* Edit Button */}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setEditingQ(JSON.parse(JSON.stringify(q)))}
                            className="h-8 px-2 text-[#292B2B]/70 hover:text-[#2D3030] text-[11px] font-bold cursor-pointer rounded-lg" 
                            title="Edit Question"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>

                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* MODAL 1: INSPECT COMPLETE QUESTION DETAILS WITH AUDIT TRAIL   */}
      {/* ============================================================ */}
      {inspectingQ && (
        <div className="fixed inset-0 bg-[#2D3030]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#FFFDF9] max-w-2xl w-full rounded-2xl p-6 border border-[#E2DDD5] shadow-xl space-y-5 text-left max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#E2DDD5] pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {inspectingQ.bank_question_id && (
                    <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-[#2D3030] text-[#FFFDF9]">
                      {inspectingQ.bank_question_id}
                    </span>
                  )}
                  <span className="text-xs font-mono font-bold text-[#A85D4C]">
                    {inspectingQ.competency_name} {inspectingQ.topic_name ? `• ${inspectingQ.topic_name}` : ''}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#292B2B]">
                  Question Review & Governance Detail
                </h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setInspectingQ(null)} className="h-8 w-8 text-[#7A756E] hover:text-[#292B2B] rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Question Text */}
              <div>
                <span className="text-[10px] font-mono font-bold text-[#7A756E] uppercase block mb-1">Question Prompt</span>
                <p className="p-3.5 rounded-xl bg-[#EFEBE4] border border-[#E2DDD5] font-bold text-sm text-[#292B2B] leading-snug">
                  {inspectingQ.question_text || inspectingQ.text}
                </p>
              </div>

              {/* 4 Options */}
              <div>
                <span className="text-[10px] font-mono font-bold text-[#7A756E] uppercase block mb-1.5">Options</span>
                <div className="space-y-2">
                  {inspectingQ.options?.map((opt: any, idx: number) => {
                    const isCorrect = opt.is_correct || opt.option_text === inspectingQ.correct_answer || opt.text === inspectingQ.correct_answer;
                    const letter = String.fromCharCode(65 + idx);
                    return (
                      <div 
                        key={idx}
                        className={cn(
                          "p-3 rounded-xl border flex items-center justify-between",
                          isCorrect 
                            ? "bg-[#2E8B57]/10 border-[#2E8B57]/40 text-[#2E8B57] font-bold" 
                            : "bg-[#FFFDF9] border-[#E2DDD5] text-[#292B2B]"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md font-mono text-[10px] font-bold flex items-center justify-center bg-[#EFEBE4] text-[#292B2B]">
                            {letter}
                          </span>
                          <span>{opt.option_text || opt.text}</span>
                        </div>
                        {isCorrect && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#2E8B57] text-[#FFFDF9] rounded-md shadow-2xs">
                            Correct Answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explanation */}
              <div className="p-3.5 rounded-xl bg-[#EFEBE4] border border-[#E2DDD5] space-y-1">
                <span className="text-[10px] font-mono font-bold text-[#A85D4C] uppercase block">Explanation & Rationale</span>
                <p className="text-[#292B2B] leading-relaxed">{inspectingQ.explanation}</p>
              </div>

              {/* Source Grounding Box */}
              <div className="p-3.5 rounded-xl bg-[#F7F4EE] border border-[#E2DDD5] space-y-2 font-mono text-[11px]">
                <span className="text-[10px] font-bold uppercase text-[#7A756E] block">Source Grounding & Provenance Metadata</span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[#7A756E] text-[10px] block">Source Document:</span>
                    <span className="font-bold text-[#292B2B]">
                      {inspectingQ.source_material_title || inspectingQ.source_title || inspectingQ.source_reference || 'Official Document Reference'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#7A756E] text-[10px] block">Document Classification:</span>
                    <span className="font-bold text-[#A85D4C]">
                      {inspectingQ.material_scope === 'OFFICIAL_COMPETENCY' || inspectingQ.source_material_id
                        ? 'Official Learning Material'
                        : (inspectingQ.material_scope || 'Institutional Standard')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#7A756E] text-[10px] block">Generation Source:</span>
                    <span className="font-bold text-[#292B2B]">
                      {inspectingQ.is_ai_generated || inspectingQ.source === 'ai_generated'
                        ? '🤖 AI Generated (Grounded in Official Document)'
                        : '🏛️ Seeded Official Framework'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#7A756E] text-[10px] block">Organization:</span>
                    <span className="font-bold text-[#292B2B]">{inspectingQ.source_organization || 'Official MoSPI / iGOT Karmayogi'}</span>
                  </div>
                </div>
              </div>

              {/* Review History Audit Trail */}
              {inspectingQ.review_history && inspectingQ.review_history.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#E2DDD5]">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#7A756E] flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-[#A85D4C]" />
                    Review Audit History ({inspectingQ.review_history.length})
                  </span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {inspectingQ.review_history.map((h: any) => (
                      <div key={h.id} className="p-2.5 rounded-lg bg-[#EFEBE4] border border-[#E2DDD5] text-[11px] font-mono flex items-center justify-between">
                        <div>
                          <span className="font-bold text-[#292B2B]">{h.action}</span>
                          <span className="text-[#7A756E] mx-1.5">•</span>
                          <span className="text-[#7A756E]">{h.admin_name || 'Admin'}</span>
                          {h.comment && (
                            <p className="text-[10px] text-[#A85D4C] mt-0.5 italic">"{h.comment}"</p>
                          )}
                        </div>
                        <span className="text-[10px] text-[#7A756E] shrink-0">
                          {h.created_at ? new Date(h.created_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#E2DDD5]">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setEditingQ(JSON.parse(JSON.stringify(inspectingQ)));
                  setInspectingQ(null);
                }} 
                className="text-xs font-semibold rounded-xl h-8.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit Question
              </Button>

              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setRejectingQ(inspectingQ);
                    setInspectingQ(null);
                  }} 
                  className="text-[#7D4036] border-[#7D4036]/40 text-xs font-semibold rounded-xl h-8.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 mr-1" /> Reject
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleApprove(inspectingQ.id)}
                  className="bg-[#2E8B57] hover:bg-[#2E8B57]/90 text-[#FFFDF9] text-xs font-semibold rounded-xl h-8.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 mr-1" /> Approve & Add to Pool
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: REJECT QUESTION WITH OPTIONAL REASON                 */}
      {/* ============================================================ */}
      {rejectingQ && (
        <div className="fixed inset-0 bg-[#2D3030]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#FFFDF9] max-w-md w-full rounded-2xl p-6 border border-[#E2DDD5] shadow-xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7D4036]">
                  ADMINISTRATIVE QUALITY ACTION
                </span>
                <h3 className="text-base font-bold text-[#292B2B]">
                  Reject Question #{rejectingQ.bank_question_id || rejectingQ.id}
                </h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setRejectingQ(null)} className="h-8 w-8 text-[#7A756E] hover:text-[#292B2B] rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#7A756E]">
                Rejected questions are archived and will NOT be selected by the active assessment pool.
              </p>

              <div>
                <label className="font-bold text-[#292B2B] block mb-1">Select Reason (Optional)</label>
                <Select value={rejectReason} onValueChange={setRejectReason}>
                  <SelectTrigger className="border-[#E2DDD5] bg-[#FFFDF9] text-xs h-9 rounded-xl">
                    <SelectValue placeholder="Choose a standard rejection reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ambiguous wording">Ambiguous wording</SelectItem>
                    <SelectItem value="Poor distractors">Poor distractors</SelectItem>
                    <SelectItem value="Incorrect competency mapping">Incorrect competency mapping</SelectItem>
                    <SelectItem value="Incorrect topic">Incorrect topic</SelectItem>
                    <SelectItem value="Incorrect difficulty">Incorrect difficulty</SelectItem>
                    <SelectItem value="Duplicate question">Duplicate question</SelectItem>
                    <SelectItem value="Incorrect answer">Incorrect answer</SelectItem>
                    <SelectItem value="Poor source grounding">Poor source grounding</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-bold text-[#292B2B] block mb-1">Custom Notes / Feedback</label>
                <textarea 
                  value={customRejectReason}
                  onChange={(e) => setCustomRejectReason(e.target.value)}
                  placeholder="Additional explanation for the review history log..."
                  className="w-full p-2.5 rounded-xl border border-[#E2DDD5] text-xs focus:border-[#A85D4C] focus:outline-none"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E2DDD5]">
              <Button variant="outline" size="sm" onClick={() => setRejectingQ(null)} className="text-xs font-semibold rounded-xl h-8.5 cursor-pointer">
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleConfirmReject}
                className="bg-[#7D4036] hover:bg-[#5C2E27] text-[#FFFDF9] text-xs font-semibold rounded-xl h-8.5 cursor-pointer"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: EDIT QUESTION FORM                                   */}
      {/* ============================================================ */}
      {editingQ && (
        <div className="fixed inset-0 bg-[#2D3030]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#FFFDF9] max-w-2xl w-full rounded-2xl p-6 border border-[#E2DDD5] shadow-xl space-y-4 text-left max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A85D4C]">
                  ADMINISTRATIVE CALIBRATION
                </span>
                <h3 className="text-base font-bold text-[#292B2B]">
                  Edit Question #{editingQ.bank_question_id || editingQ.id}
                </h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEditingQ(null)} className="h-8 w-8 text-[#7A756E] hover:text-[#292B2B] rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3.5 text-xs">
              
              {/* Question Text */}
              <div>
                <label className="font-bold text-[#292B2B] block mb-1">Question Prompt</label>
                <textarea 
                  value={editingQ.question_text || editingQ.text}
                  onChange={(e) => setEditingQ({ ...editingQ, text: e.target.value, question_text: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E2DDD5] text-xs font-medium focus:border-[#A85D4C] focus:outline-none"
                  rows={3}
                />
              </div>

              {/* Assigned Competency */}
              <div>
                <label className="font-bold text-[#292B2B] block mb-1">Assigned Competency</label>
                <Select 
                  value={String(editingQ.competency_id || '')} 
                  onValueChange={(val) => setEditingQ({ ...editingQ, competency_id: Number(val) })}
                >
                  <SelectTrigger className="border-[#E2DDD5] bg-[#FFFDF9] text-xs h-9 rounded-xl">
                    <SelectValue placeholder="Select Competency" />
                  </SelectTrigger>
                  <SelectContent>
                    {competencies.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type & Difficulty Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#292B2B] block mb-1">Question Type</label>
                  <Select 
                    value={editingQ.question_type || 'SHORT_MCQ'} 
                    onValueChange={(val) => setEditingQ({ ...editingQ, question_type: val })}
                  >
                    <SelectTrigger className="border-[#E2DDD5] bg-[#FFFDF9] text-xs h-9 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SHORT_MCQ">Short MCQ</SelectItem>
                      <SelectItem value="WORD_PROBLEM">Word Problem</SelectItem>
                      <SelectItem value="CASE_STUDY">Case Study</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="font-bold text-[#292B2B] block mb-1">Difficulty</label>
                  <Select 
                    value={String(editingQ.difficulty || '2')} 
                    onValueChange={(val) => setEditingQ({ ...editingQ, difficulty: val })}
                  >
                    <SelectTrigger className="border-[#E2DDD5] bg-[#FFFDF9] text-xs h-9 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Foundational (Easy)</SelectItem>
                      <SelectItem value="2">2 - Intermediate (Medium)</SelectItem>
                      <SelectItem value="3">3 - Advanced (Hard)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 4 Options with Single Correct Answer Selector */}
              <div>
                <label className="font-bold text-[#292B2B] block mb-1.5">Options (Select the single correct answer)</label>
                <div className="space-y-2">
                  {editingQ.options?.map((opt: any, idx: number) => {
                    const letter = String.fromCharCode(65 + idx);
                    return (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-[#EFEBE4] border border-[#E2DDD5]">
                        <input 
                          type="radio" 
                          name="correct_option"
                          checked={opt.is_correct}
                          onChange={() => {
                            const updated = editingQ.options.map((o: any, i: number) => ({
                              ...o,
                              is_correct: i === idx
                            }));
                            setEditingQ({ ...editingQ, options: updated });
                          }}
                          className="accent-[#2E8B57] w-4 h-4 cursor-pointer"
                        />
                        <span className="w-5 font-mono font-bold text-xs text-[#292B2B]">{letter}.</span>
                        <Input 
                          value={opt.option_text || opt.text || ''}
                          onChange={(e) => {
                            const updated = [...editingQ.options];
                            updated[idx] = { ...updated[idx], text: e.target.value, option_text: e.target.value };
                            setEditingQ({ ...editingQ, options: updated });
                          }}
                          className="h-8 text-xs bg-[#FFFDF9] border-[#E2DDD5] rounded-lg"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="font-bold text-[#292B2B] block mb-1">Explanation & Rationale</label>
                <textarea 
                  value={editingQ.explanation || ''}
                  onChange={(e) => setEditingQ({ ...editingQ, explanation: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E2DDD5] text-xs font-medium focus:border-[#A85D4C] focus:outline-none"
                  rows={2}
                />
              </div>

              {/* Source Reference */}
              <div>
                <label className="font-bold text-[#292B2B] block mb-1">Source Reference / Citation</label>
                <Input 
                  value={editingQ.source_reference || ''}
                  onChange={(e) => setEditingQ({ ...editingQ, source_reference: e.target.value })}
                  className="h-9 text-xs border-[#E2DDD5] rounded-xl"
                  placeholder="e.g. MoSPI Official Survey Methodology Manual"
                />
              </div>

            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E2DDD5]">
              <Button variant="outline" size="sm" onClick={() => setEditingQ(null)} className="text-xs font-semibold rounded-xl h-8.5 cursor-pointer">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveEdit} className="bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9] text-xs font-semibold rounded-xl h-8.5 cursor-pointer">
                Save Changes (Keep Pending)
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: ON-DEMAND AI QUESTION SYNTHESIS                      */}
      {/* ============================================================ */}
      {showGenModal && (
        <div className="fixed inset-0 bg-[#2D3030]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#FFFDF9] max-w-lg w-full rounded-2xl p-6 border border-[#E2DDD5] shadow-xl space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A85D4C]">
                  ON-DEMAND AI SYNTHESIS
                </span>
                <h3 className="text-base font-bold text-[#292B2B]">Generate Question Set</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowGenModal(false)} className="h-8 w-8 text-[#7A756E] hover:text-[#292B2B] rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-[#292B2B] block mb-1">Competency Area</label>
                <Select value={genCompId} onValueChange={setGenCompId}>
                  <SelectTrigger className="border-[#E2DDD5] bg-[#FFFDF9] text-xs h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {competencies.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#292B2B] block mb-1">Subtopic Focus</label>
                <Input 
                  value={genTopicName}
                  onChange={(e) => setGenTopicName(e.target.value)}
                  placeholder="e.g. Neyman Optimal Allocation, Variance Estimation"
                  className="border-[#E2DDD5] text-xs h-10 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#292B2B] block mb-1">Difficulty</label>
                  <Select value={genDiff} onValueChange={setGenDiff}>
                    <SelectTrigger className="border-[#E2DDD5] bg-[#FFFDF9] text-xs h-10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Foundational (Easy)</SelectItem>
                      <SelectItem value="2">2 - Intermediate (Medium)</SelectItem>
                      <SelectItem value="3">3 - Advanced (Hard)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#292B2B] block mb-1">Question Count</label>
                  <Select value={String(genCount)} onValueChange={(val) => setGenCount(parseInt(val))}>
                    <SelectTrigger className="border-[#E2DDD5] bg-[#FFFDF9] text-xs h-10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Questions</SelectItem>
                      <SelectItem value="5">5 Questions</SelectItem>
                      <SelectItem value="10">10 Questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="text-[11px] text-[#7A756E] leading-relaxed font-mono bg-[#EFEBE4] p-3 rounded-xl border border-[#E2DDD5]">
                Generated candidate questions will be saved with status <strong>Pending Review</strong> and must be approved by an administrator before entering the active assessment pool.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2DDD5]">
              <Button variant="outline" size="sm" onClick={() => setShowGenModal(false)} className="text-xs font-semibold rounded-xl h-8.5 cursor-pointer">
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleGenerateSet}
                disabled={generating}
                className="bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9] text-xs font-semibold rounded-xl h-8.5 cursor-pointer"
              >
                <Sparkles className={`w-3.5 h-3.5 mr-1.5 ${generating ? 'animate-spin' : ''}`} />
                <span>{generating ? 'Synthesizing with AI...' : 'Generate Questions'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
