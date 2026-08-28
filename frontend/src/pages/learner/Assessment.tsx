import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { assessmentApi, competencyApi, userApi, roleApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Sparkles, Clock, Target, History, Award, CheckCircle2, AlertCircle } from 'lucide-react';
import { User, Competency } from '@/types';

export default function Assessment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<User | null>(user);
  const [competencies, setCompetencies] = useState<{ id: number; name: string }[]>([]);
  const [pastAssessments, setPastAssessments] = useState<any[]>([]);
  
  // Configuration
  const [focusType, setFocusType] = useState<string>('baseline');
  const [selectedCompId, setSelectedCompId] = useState<string>('all');
  const [questionCount, setQuestionCount] = useState<string>('8');
  const [difficulty, setDifficulty] = useState<string>('adaptive');

  useEffect(() => {
    const loadAssessmentDashboard = async () => {
      try {
        const [meRes, histRes] = await Promise.all([
          userApi.getMe(),
          assessmentApi.getHistory()
        ]);
        const profile = meRes.data;
        setUserProfile(profile);
        setPastAssessments(histRes.data || []);

        // Load role-specific competencies
        if (profile.role_id) {
          const compRes = await roleApi.getCompetencies(profile.role_id);
          const mapped = compRes.data.map((rc: any) => ({
            id: rc.competency_id,
            name: rc.competency_name
          }));
          setCompetencies(mapped);
          setQuestionCount(String(mapped.length || 8));
        } else {
          const myCompRes = await competencyApi.getMyCompetencies();
          if (myCompRes.data && myCompRes.data.length > 0) {
            const mapped = myCompRes.data.map((mc: any) => ({
              id: mc.competency_id,
              name: mc.competency_name
            }));
            setCompetencies(mapped);
            setQuestionCount(String(mapped.length || 8));
          } else {
            const allRes = await competencyApi.getAll();
            setCompetencies(allRes.data);
            setQuestionCount(String(allRes.data.length || 8));
          }
        }
      } catch (err) {
        console.error('Failed to load assessment config:', err);
      }
    };
    loadAssessmentDashboard();
  }, [user]);

  const activeRoleName = userProfile?.role_name || userProfile?.designation || user?.role_name || user?.designation || 'Statistical Officer';

  const handleStartAssessment = async () => {
    try {
      setLoading(true);
      const compIds = selectedCompId !== 'all' ? [parseInt(selectedCompId)] : undefined;
      const diffVal = difficulty !== 'adaptive' ? difficulty : undefined;

      const res = await assessmentApi.start({
        assessment_type: focusType,
        competency_ids: compIds,
        difficulty: diffVal,
        question_count: parseInt(questionCount) || competencies.length || 8
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
        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#176B87] uppercase tracking-widest mb-1">
          <Target className="w-3.5 h-3.5" />
          <span>EVIDENCE-BASED CAPABILITY DIAGNOSTICS</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#123B5D] tracking-tight">
          Competency Assessments & Diagnostics
        </h1>
        <p className="text-xs sm:text-sm text-[#123047]/80 mt-1">
          Calibrated diagnostic sessions that evaluate practical statistical mastery and separate genuine competence from guessing.
        </p>
      </div>

      {/* Role Context Notification */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#123B5D] text-[#FFFFFF] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#D49A2A]" />
            <span className="text-xs font-mono uppercase font-bold text-[#D49A2A]">Active Designation:</span>
            <span className="text-xs font-bold text-[#FFFFFF]">{activeRoleName}</span>
          </div>
          <p className="text-xs text-[#FFFFFF]/80">
            Baseline diagnostics will sample questions across {activeRoleName}'s required competencies to establish your verified readiness score.
          </p>
        </div>
        <div className="shrink-0">
          <span className="text-xs font-mono font-semibold bg-[#176B87] text-[#FFFFFF] px-3 py-1 rounded-lg">
            {competencies.length || 8} Role Benchmarks
          </span>
        </div>
      </div>

      {/* Configuration Card */}
      <Card className="border-t-4 border-t-[#176B87] bg-[#FFFFFF] shadow-xs border-[#D8E5EC] rounded-2xl">
        <CardHeader className="pb-4 border-b border-[#D8E5EC]">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#176B87] uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#176B87]" />
            <span>Telemetry Question Engine</span>
          </div>
          <CardTitle className="text-lg sm:text-xl font-semibold text-[#123047]">Configure Assessment Session</CardTitle>
          <CardDescription className="text-sm text-[#5D7180]">
            Assembles cognitive-level questions mapped directly to official MoSPI competency definitions for {activeRoleName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Assessment Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#123047]">Assessment Scope</label>
              <Select value={focusType} onValueChange={setFocusType}>
                <SelectTrigger className="border-[#D8E5EC] focus:ring-[#176B87]/20 bg-[#FFFFFF] text-sm font-medium text-[#123047] h-10 rounded-xl">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baseline">Baseline Capability Audit — {activeRoleName}</SelectItem>
                  <SelectItem value="adaptive_reassessment">Adaptive Gap Reassessment</SelectItem>
                  <SelectItem value="practice">Targeted Practice Mode</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Competency Filter (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#123047]">Competency Focus</label>
              <Select value={selectedCompId} onValueChange={setSelectedCompId}>
                <SelectTrigger className="border-[#D8E5EC] focus:ring-[#176B87]/20 bg-[#FFFFFF] text-sm font-medium text-[#123047] h-10 rounded-xl">
                  <SelectValue placeholder="Select competency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{activeRoleName} Framework ({competencies.length || 8} Competencies)</SelectItem>
                  {competencies.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Question Count */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#123047]">Question Length</label>
              <Select value={questionCount} onValueChange={setQuestionCount}>
                <SelectTrigger className="border-[#D8E5EC] focus:ring-[#176B87]/20 bg-[#FFFFFF] text-sm font-medium text-[#123047] h-10 rounded-xl">
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(competencies.length || 8)}>{competencies.length || 8} MCQs (1 per competency - Fast)</SelectItem>
                  <SelectItem value={String((competencies.length || 8) * 2)}>{(competencies.length || 8) * 2} MCQs (2 per competency - Comprehensive)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#D8E5EC]">
            <div className="text-xs text-[#5D7180] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#176B87]" />
              <span>Estimated duration: ~10-15 minutes • Confidence rating active</span>
            </div>

            <Button 
              size="default" 
              className="w-full sm:w-auto font-semibold text-sm bg-[#176B87] hover:bg-[#176B87]/90 text-[#FFFFFF] shadow-xs px-6 h-10 rounded-xl cursor-pointer" 
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
      <Card className="bg-[#FFFFFF] shadow-xs border border-[#D8E5EC] rounded-2xl">
        <CardHeader className="border-b border-[#D8E5EC] p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg font-semibold text-[#123047] flex items-center gap-2">
              <History className="w-4.5 h-4.5 text-[#176B87]" />
              <span>Recorded Diagnostic Telemetry</span>
            </CardTitle>
            <span className="text-xs font-mono text-[#5D7180]">
              {pastAssessments.length} sessions logged
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {pastAssessments.length === 0 ? (
            <div className="text-center p-8 space-y-2">
              <AlertCircle className="w-8 h-8 text-[#5D7180]/30 mx-auto" />
              <p className="text-sm font-semibold text-[#123047]">No prior assessment sessions found.</p>
              <p className="text-xs text-[#5D7180]">Complete your first baseline audit above to populate your capability telemetry.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EAF3F7] border-b border-[#D8E5EC] text-[#123047] uppercase font-mono font-semibold text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Session ID</th>
                    <th className="px-5 py-3">Diagnostic Type</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Overall Score</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E5EC] font-medium text-[#123047]">
                  {pastAssessments.map(item => (
                    <tr key={item.id} className="hover:bg-[#EAF3F7]/50 transition-colors">
                      <td className="px-5 py-3 font-mono text-[#123047] font-bold">#{item.id}</td>
                      <td className="px-5 py-3 font-semibold text-[#176B87] uppercase text-xs">{item.assessment_type || item.type || 'Baseline'}</td>
                      <td className="px-5 py-3 text-[#5D7180] font-mono">
                        {item.started_at ? new Date(item.started_at).toLocaleDateString() : 'Recent'}
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-bold text-sm text-[#123047] font-mono">
                          {item.overall_score !== null ? `${item.overall_score}%` : 'In Progress'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#2E8B57]/10 text-[#2E8B57] border border-[#2E8B57]/30">
                          {item.status || 'Completed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
