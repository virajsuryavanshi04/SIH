import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assessmentApi, competencyApi, userApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Sparkles, Clock, Target, History, Award, CheckCircle2, AlertCircle } from 'lucide-react';
import { User, Competency } from '@/types';

export default function Assessment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [pastAssessments, setPastAssessments] = useState<any[]>([]);
  
  // Configuration
  const [focusType, setFocusType] = useState<string>('baseline');
  const [selectedCompId, setSelectedCompId] = useState<string>('all');
  const [questionCount, setQuestionCount] = useState<string>('8');
  const [difficulty, setDifficulty] = useState<string>('adaptive');

  useEffect(() => {
    const loadAssessmentDashboard = async () => {
      try {
        const [meRes, compRes, histRes] = await Promise.all([
          userApi.getMe(),
          competencyApi.getAll(),
          assessmentApi.getHistory()
        ]);
        setUserProfile(meRes.data);
        setCompetencies(compRes.data);
        setPastAssessments(histRes.data || []);
      } catch (err) {
        console.error('Failed to load assessment config:', err);
      }
    };
    loadAssessmentDashboard();
  }, []);

  const handleStartAssessment = async () => {
    try {
      setLoading(true);
      const compIds = selectedCompId !== 'all' ? [parseInt(selectedCompId)] : undefined;
      const diffVal = difficulty !== 'adaptive' ? difficulty : undefined;

      const res = await assessmentApi.start({
        assessment_type: focusType,
        competency_ids: compIds,
        difficulty: diffVal,
        question_count: parseInt(questionCount) || 8
      });

      const assessmentId = res.data.assessment_id;
      const questions = res.data.questions;

      navigate(`/quiz/${assessmentId}`, {
        state: {
          assessmentId,
          questions,
          assessmentType: res.data.assessment_type,
          competenciesCovered: res.data.competencies_covered
        }
      });
    } catch (err) {
      console.error('Failed to start assessment:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 text-left">
      <div>
        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#1F7A8C] uppercase tracking-widest mb-1">
          <Target className="w-3.5 h-3.5" />
          <span>EVIDENCE-BASED CAPABILITY DIAGNOSTICS</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#0B2545] tracking-tight">
          Competency Assessments & Diagnostics
        </h1>
        <p className="text-xs sm:text-sm text-[#2B2D42]/80 mt-1">
          Calibrated diagnostic sessions that evaluate practical statistical mastery and separate genuine competence from guessing.
        </p>
      </div>

      {/* Role Context Notification */}
      <div className="p-4 rounded-xl bg-[#0B2545] text-[#FFFFFF] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-xs font-mono uppercase font-bold text-[#D4AF37]">Active Designation:</span>
            <span className="text-xs font-bold text-[#FFFFFF]">{userProfile?.role_name || userProfile?.designation || 'Statistical Officer'}</span>
          </div>
          <p className="text-[11px] text-[#FFFFFF]/80">
            Baseline diagnostics will sample questions across your role's required competencies to establish your verified readiness score.
          </p>
        </div>
        <div className="shrink-0">
          <span className="text-[11px] font-mono font-bold bg-[#1F7A8C] text-[#FFFFFF] px-3 py-1 rounded-md">
            8 Role Benchmarks
          </span>
        </div>
      </div>

      {/* Configuration Card */}
      <Card className="border-t-4 border-t-[#1F7A8C] bg-[#FFFFFF] shadow-xs border-[#2B2D42]/10">
        <CardHeader className="pb-4 border-b border-[#2B2D42]/10">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#1F7A8C] uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#1F7A8C]" />
            <span>Telemetry Question Engine</span>
          </div>
          <CardTitle className="text-lg font-bold text-[#0B2545]">Configure Assessment Session</CardTitle>
          <CardDescription className="text-xs text-[#2B2D42]/70">
            Assembles cognitive-level questions mapped directly to official MoSPI competency definitions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Assessment Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#0B2545]">Assessment Scope</label>
              <Select value={focusType} onValueChange={setFocusType}>
                <SelectTrigger className="border-[#2B2D42]/20 focus:ring-[#1F7A8C]/20 bg-[#FFFFFF] text-xs font-medium">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baseline">Baseline Capability Audit (All Role Competencies)</SelectItem>
                  <SelectItem value="adaptive_reassessment">Adaptive Gap Reassessment</SelectItem>
                  <SelectItem value="practice">Targeted Practice Mode</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Competency Filter (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#0B2545]">Competency Focus</label>
              <Select value={selectedCompId} onValueChange={setSelectedCompId}>
                <SelectTrigger className="border-[#2B2D42]/20 focus:ring-[#1F7A8C]/20 bg-[#FFFFFF] text-xs font-medium">
                  <SelectValue placeholder="Select competency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Full Role Framework (All 8)</SelectItem>
                  {competencies.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Question Count */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#0B2545]">Question Length</label>
              <Select value={questionCount} onValueChange={setQuestionCount}>
                <SelectTrigger className="border-[#2B2D42]/20 focus:ring-[#1F7A8C]/20 bg-[#FFFFFF] text-xs font-medium">
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">8 MCQs (1 per competency - Fast)</SelectItem>
                  <SelectItem value="16">16 MCQs (2 per competency - Comprehensive)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#2B2D42]/10">
            <div className="text-xs text-[#2B2D42]/70 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#1F7A8C]" />
              <span>Estimated duration: ~10-15 minutes • Confidence rating active</span>
            </div>

            <Button 
              size="lg" 
              className="w-full sm:w-auto font-bold bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] shadow-xs px-8 cursor-pointer" 
              onClick={handleStartAssessment} 
              disabled={loading}
            >
              {loading ? (
                <span>Assembling Questions...</span>
              ) : (
                <span className="flex items-center gap-2">
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Baseline Assessment</span>
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Past Assessment History */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-[#0B2545] flex items-center gap-2">
          <History className="w-4 h-4 text-[#1F7A8C]" />
          Historical Assessment Telemetry
        </h2>
        
        <div className="bg-[#FFFFFF] rounded-xl shadow-xs border border-[#2B2D42]/10 overflow-hidden">
          {pastAssessments.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <AlertCircle className="w-6 h-6 text-[#2B2D42]/40 mx-auto" />
              <p className="text-xs font-semibold text-[#0B2545]">No historical assessments recorded yet.</p>
              <p className="text-[11px] text-[#2B2D42]/60">Launch a baseline assessment session above to log your initial capability profile.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F6F9] border-b border-[#2B2D42]/10 text-[#0B2545] uppercase font-mono font-bold text-[10px]">
                <tr>
                  <th className="px-5 py-3">Session ID</th>
                  <th className="px-5 py-3">Diagnostic Type</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Overall Score</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B2D42]/10 font-medium text-[#2B2D42]">
                {pastAssessments.map(item => (
                  <tr key={item.id} className="hover:bg-[#F4F6F9]/50 transition-colors">
                    <td className="px-5 py-3 font-mono text-[#0B2545] font-bold">#{item.id}</td>
                    <td className="px-5 py-3 font-bold text-[#1F7A8C] uppercase text-[11px]">{item.assessment_type || item.type || 'Baseline'}</td>
                    <td className="px-5 py-3 text-[#2B2D42]/60 font-mono">
                      {item.started_at ? new Date(item.started_at).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-bold text-sm text-[#0B2545] font-mono">
                        {item.overall_score !== null ? `${item.overall_score}%` : 'In Progress'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#2E7D32]/10 text-[#2E7D32] border border-[#2E7D32]/30">
                        {item.status || 'Completed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
