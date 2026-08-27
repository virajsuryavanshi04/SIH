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
        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#1F7A8C] uppercase tracking-widest mb-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>OFFICER CREDENTIALS & CAPABILITY EVIDENCE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#0B2545] tracking-tight">
          Evidence & Profile Portfolio
        </h1>
        <p className="text-xs sm:text-sm text-[#2B2D42]/80 mt-1">
          Official competency credentials, verified assessments, and continuous capability telemetry for {user?.full_name || 'Arjun Patel'}.
        </p>
      </div>

      {/* Officer Summary Card */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#2B2D42]/10 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar className="w-20 h-20 border-2 border-[#1F7A8C]/30 shadow-xs shrink-0">
            <AvatarFallback className="text-2xl bg-[#0B2545] text-[#FFFFFF] font-black font-mono">
              {user?.full_name?.charAt(0) || 'A'}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-3 flex-1 text-center sm:text-left">
            <div>
              <h2 className="text-xl font-bold text-[#0B2545]">{user?.full_name || 'Arjun Patel'}</h2>
              <p className="text-xs font-mono text-[#2B2D42]/60 mt-0.5">{user?.email || 'arjun.patel@gov.in'}</p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center sm:justify-start text-xs font-mono">
              <span className="px-2.5 py-0.5 rounded-full bg-[#1F7A8C]/10 text-[#1F7A8C] font-bold border border-[#1F7A8C]/20">
                {activeRoleName}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#F4F6F9] text-[#2B2D42] border border-[#2B2D42]/10">
                Division: {user?.department_name || 'Statistical Services'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#F4F6F9] text-[#2B2D42] border border-[#2B2D42]/10">
                Experience: {user?.experience_years || 5} Years
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Role Management & Dynamic Competency Targets */}
      <Card className="bg-[#FFFFFF] border border-[#2B2D42]/10 shadow-xs">
        <CardHeader className="border-b border-[#2B2D42]/10 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-[#0B2545] flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#1F7A8C]" /> Official Designation & Benchmark Framework
            </CardTitle>
            <span className="text-xs font-mono text-[#1F7A8C] font-semibold bg-[#1F7A8C]/10 px-2.5 py-0.5 rounded">
              Active: {activeRoleName}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#0B2545] uppercase tracking-wider block">
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
                    className={`p-3 rounded-xl border text-left transition-all text-xs font-bold ${
                      isSelected
                        ? 'bg-[#0B2545] text-[#FFFFFF] border-[#0B2545] shadow-xs'
                        : 'bg-[#F4F6F9] text-[#2B2D42] border-[#2B2D42]/15 hover:border-[#1F7A8C]/40 hover:bg-[#FFFFFF]'
                    }`}
                  >
                    <div>{r.name}</div>
                    <div className={`text-[10px] font-normal mt-0.5 line-clamp-1 ${isSelected ? 'text-[#FFFFFF]/70' : 'text-[#2B2D42]/60'}`}>
                      {r.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {feedbackMsg && (
            <div className="p-3 rounded-lg bg-[#2E7D32]/10 border border-[#2E7D32]/20 text-xs font-medium text-[#2E7D32] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          {/* Current Benchmark Requirements */}
          <div className="pt-3 border-t border-[#2B2D42]/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#2B2D42]/70 uppercase tracking-wider">
              <span>Required Competencies for {activeRoleName}</span>
              <span>Target Benchmark</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {roleCompetencies.map(rc => (
                <div key={rc.competency_id} className="p-2.5 rounded-lg bg-[#F4F6F9] border border-[#2B2D42]/10 flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0B2545]">{rc.competency_name}</span>
                  <span className="font-mono font-bold text-[#1F7A8C] bg-[#FFFFFF] px-2 py-0.5 rounded border border-[#2B2D42]/10">
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
        <h3 className="text-sm font-mono font-bold text-[#0B2545] uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4 text-[#1F7A8C]" />
          Verified Competency Certifications
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {certifications.map((cert) => (
            <div key={cert.title} className="p-4 rounded-xl bg-[#FFFFFF] border border-[#2B2D42]/10 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-[#1F7A8C] uppercase">{cert.date}</span>
                  <span className="text-xs font-mono font-bold text-[#2E7D32] bg-[#2E7D32]/10 px-2 py-0.2 rounded">
                    {cert.score}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-[#0B2545] leading-snug">{cert.title}</h4>
                <p className="text-[11px] text-[#2B2D42]/70">{cert.issuer}</p>
              </div>

              <div className="pt-2 border-t border-[#2B2D42]/10 flex items-center text-[10px] text-[#2E7D32] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                <span>Verified in iGOT Registry</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assessment Telemetry Audit Log */}
      <div className="space-y-4">
        <h3 className="text-sm font-mono font-bold text-[#0B2545] uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#1F7A8C]" />
          Assessment Telemetry Audit Trail
        </h3>

        <div className="bg-[#FFFFFF] rounded-xl border border-[#2B2D42]/10 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F4F6F9] border-b border-[#2B2D42]/10 text-[#0B2545] uppercase font-mono font-bold text-[10px]">
              <tr>
                <th className="p-3.5">Assessment Focus</th>
                <th className="p-3.5">Competency Domain</th>
                <th className="p-3.5">Assessed Score</th>
                <th className="p-3.5">Audit Date</th>
                <th className="p-3.5">Evidence Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B2D42]/10 font-medium text-[#2B2D42]">
              {assessmentEvidence.map((row, i) => (
                <tr key={i} className="hover:bg-[#F4F6F9]/50 transition-colors">
                  <td className="p-3.5 font-bold text-[#0B2545]">{row.assessment}</td>
                  <td className="p-3.5 text-[#1F7A8C]">{row.domain}</td>
                  <td className="p-3.5 font-mono font-bold text-[#0B2545]">{row.score}</td>
                  <td className="p-3.5 font-mono text-[#2B2D42]/60">{row.date}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1F7A8C]/10 text-[#1F7A8C] border border-[#1F7A8C]/20">
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
  );
}
