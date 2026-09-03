import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { roleApi, userApi } from '@/lib/api';
import { Role, RoleCompetencyItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ShieldCheck, 
  Award, 
  CheckCircle2, 
  FileText, 
  Clock, 
  Briefcase, 
  RefreshCw, 
  ArrowRight,
  Info,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [activeRoleName, setActiveRoleName] = useState<string>(user?.role_name || user?.designation || 'Statistical Officer');
  const [roleCompetencies, setRoleCompetencies] = useState<RoleCompetencyItem[]>([]);
  const [updatingRole, setUpdatingRole] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const rolesRes = await roleApi.getAll();
        setRoles(rolesRes.data);
        
        // Match user's current role
        const match = rolesRes.data.find((r: Role) => r.name === (user?.role_name || user?.designation) || r.id === user?.role_id) || rolesRes.data[0];
        if (match) {
          setSelectedRoleId(match.id);
          setActiveRoleName(match.name);
          const compRes = await roleApi.getCompetencies(match.id);
          setRoleCompetencies(compRes.data);
        }
      } catch (err) {
        console.error('Failed to load roles in profile:', err);
      }
    };
    fetchProfileData();
  }, [user]);

  const handleRoleChange = async (newRoleId: number) => {
    try {
      setUpdatingRole(true);
      setFeedbackMsg(null);
      const res = await userApi.updateRole(newRoleId);
      await refreshUser();
      const matchedRole = roles.find(r => r.id === newRoleId);
      if (matchedRole) {
        setActiveRoleName(matchedRole.name);
        setSelectedRoleId(matchedRole.id);
        const compRes = await roleApi.getCompetencies(matchedRole.id);
        setRoleCompetencies(compRes.data);
      }
      setFeedbackMsg(`Designation updated to "${res.data.role_name || matchedRole?.name}". Gaps recalculated against new benchmark.`);
    } catch (err) {
      console.error('Failed to update role:', err);
      setFeedbackMsg('Failed to update role. Please try again.');
    } finally {
      setUpdatingRole(false);
    }
  };

  const certifications = [
    { title: 'Foundations of Statistical Inference', issuer: 'Indian Statistical Institute', date: 'Aug 2026', verified: true, score: '86%' },
    { title: 'Official Statistical Indicators & Interpretation', issuer: 'MoSPI Training Division', date: 'Jul 2026', verified: true, score: '75%' },
    { title: 'Data Quality Audits & Anomaly Detection', issuer: 'National Statistical Systems', date: 'Jun 2026', verified: true, score: '72%' },
  ];

  const assessmentEvidence = [
    { assessment: 'Adaptive Diagnostic #26101', domain: 'Sampling & Survey Methodology', score: '72%', date: '2026-08-20', status: 'Active Evidence' },
    { assessment: 'Baseline Capability Audit', domain: 'Statistical Programming & Python', score: '43%', date: '2026-08-10', status: 'Gap Identified' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 text-left">
      <div>
        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#A85D4C] uppercase tracking-widest mb-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>OFFICER CREDENTIALS & CAPABILITY EVIDENCE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#292B2B] tracking-tight leading-tight">
          Profile
        </h1>
        <p className="text-sm text-[#7A756E] mt-1.5 leading-relaxed">
          Official competency credentials, verified assessments, and continuous capability telemetry for {user?.full_name || 'Arjun Patel'}.
        </p>
      </div>

      {/* Officer Summary Card */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#E2DDD5] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar className="w-20 h-20 border-2 border-[#A85D4C]/30 shadow-xs shrink-0 ring-4 ring-[#A85D4C]/15">
            <AvatarFallback className="text-2xl bg-[#2D3030] text-[#FFFDF9] font-bold font-mono">
              {user?.full_name?.charAt(0) || 'A'}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-3 flex-1 text-center sm:text-left">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#292B2B]">{user?.full_name || 'Arjun Patel'}</h2>
              <p className="text-sm font-mono text-[#7A756E] mt-0.5">{user?.email || 'arjun.patel@gov.in'}</p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center sm:justify-start text-xs font-mono">
              <span className="px-3 py-1 rounded-full bg-[#A85D4C]/10 text-[#A85D4C] font-semibold border border-[#A85D4C]/20">
                {activeRoleName}
              </span>
              <span className="px-3 py-1 rounded-full bg-[#EFEBE4] text-[#292B2B] border border-[#E2DDD5]">
                Division: {user?.department_name || 'Statistical Services'}
              </span>
              <span className="px-3 py-1 rounded-full bg-[#EFEBE4] text-[#292B2B] border border-[#E2DDD5]">
                Experience: {user?.experience_years || 5} Years
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Role Management & Dynamic Competency Targets */}
      <Card className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-2xl shadow-[0_1px_3px_rgba(45, 48, 48, 0.04)]">
        <CardHeader className="border-b border-[#E2DDD5] p-5 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-[#292B2B] flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#A85D4C]" /> Official Designation & Benchmark Framework
            </CardTitle>
            <span className="text-xs font-mono text-[#A85D4C] font-semibold bg-[#A85D4C]/10 px-2.5 py-0.5 rounded-full border border-[#A85D4C]/20">
              Active: {activeRoleName}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 space-y-4">
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#292B2B] uppercase tracking-wider block">
              Change Official Role (Recalculates Benchmark Targets)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {roles.map(r => {
                const isSelected = selectedRoleId === r.id;
                return (
                  <button
                    key={r.id}
                    disabled={updatingRole}
                    onClick={() => handleRoleChange(r.id)}
                    className={`p-3 rounded-xl border text-left transition-all text-xs font-bold cursor-pointer ${
                      isSelected
                        ? 'bg-[#2D3030] text-[#FFFDF9] border-[#2D3030] shadow-xs'
                        : 'bg-[#EFEBE4] text-[#292B2B] border-[#E2DDD5] hover:border-[#A85D4C]/40 hover:bg-[#FFFDF9]'
                    }`}
                  >
                    <div>{r.name}</div>
                    <div className={`text-[10px] font-normal mt-0.5 line-clamp-1 ${isSelected ? 'text-[#FFFDF9]/70' : 'text-[#7A756E]'}`}>
                      {r.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {feedbackMsg && (
            <div className="p-3 rounded-xl bg-[#2E8B57]/10 border border-[#2E8B57]/20 text-xs font-medium text-[#2E8B57] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          {/* Current Benchmark Requirements */}
          <div className="pt-3 border-t border-[#E2DDD5] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#7A756E] uppercase tracking-wider">
              <span>Required Competencies for {activeRoleName}</span>
              <span>Target Benchmark</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {roleCompetencies.map(rc => (
                <div key={rc.competency_id} className="p-2.5 rounded-xl bg-[#EFEBE4] border border-[#E2DDD5] flex items-center justify-between text-xs">
                  <span className="font-bold text-[#292B2B]">{rc.competency_name}</span>
                  <span className="font-mono font-bold text-[#A85D4C] bg-[#FFFDF9] px-2 py-0.5 rounded-md border border-[#E2DDD5]">
                    Target: {rc.target_score}%
                  </span>
                </div>
              ))}
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Verified iGOT & Institutional Certifications */}
      <div className="space-y-4">
        <h3 className="text-sm font-mono font-bold text-[#292B2B] uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4 text-[#A85D4C]" />
          Verified Competency Certifications
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {certifications.map((cert) => (
            <div key={cert.title} className="p-5 rounded-2xl bg-[#FFFDF9] border border-[#E2DDD5] shadow-[0_1px_3px_rgba(45, 48, 48, 0.04)] space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-[#A85D4C] uppercase">{cert.date}</span>
                  <span className="text-xs font-mono font-bold text-[#2E8B57] bg-[#2E8B57]/10 px-2 py-0.5 rounded border border-[#2E8B57]/30">
                    {cert.score}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-[#292B2B] leading-snug">{cert.title}</h4>
                <p className="text-xs text-[#7A756E]">{cert.issuer}</p>
              </div>

              <div className="pt-2 border-t border-[#E2DDD5] flex items-center text-xs text-[#2E8B57] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                <span>Verified in iGOT Registry</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assessment Telemetry Audit Log */}
      <div className="space-y-4">
        <h3 className="text-sm font-mono font-bold text-[#292B2B] uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#A85D4C]" />
          Assessment Telemetry Audit Trail
        </h3>

        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E2DDD5] overflow-hidden shadow-[0_1px_3px_rgba(45, 48, 48, 0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#EFEBE4] border-b border-[#E2DDD5] text-[#292B2B] uppercase font-mono font-semibold text-[10px]">
                <tr>
                  <th className="p-3.5 px-5">Assessment Focus</th>
                  <th className="p-3.5">Competency Domain</th>
                  <th className="p-3.5">Assessed Score</th>
                  <th className="p-3.5">Audit Date</th>
                  <th className="p-3.5 px-5">Evidence Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD5] font-medium text-[#292B2B]">
                {assessmentEvidence.map((row, i) => (
                  <tr key={i} className="hover:bg-[#EFEBE4]/50 transition-colors">
                    <td className="p-3.5 px-5 font-bold text-[#292B2B]">{row.assessment}</td>
                    <td className="p-3.5 text-[#A85D4C]">{row.domain}</td>
                    <td className="p-3.5 font-mono font-bold text-[#292B2B]">{row.score}</td>
                    <td className="p-3.5 font-mono text-[#7A756E]">{row.date}</td>
                    <td className="p-3.5 px-5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#A85D4C]/10 text-[#A85D4C] border border-[#A85D4C]/20">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
