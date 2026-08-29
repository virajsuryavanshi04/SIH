import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { assessmentApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RotateCcw, 
  Sparkles, 
  Target, 
  Layers, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle,
  Compass
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function QuizResult() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const [result, setResult] = useState<any>(location.state?.result || null);
  const [loading, setLoading] = useState<boolean>(!location.state?.result);

  useEffect(() => {
    const fetchResult = async () => {
      if (!result && id) {
        try {
          setLoading(true);
          const res = await assessmentApi.get(parseInt(id));
          setResult(res.data);
        } catch (err) {
          console.error('Failed to load assessment result:', err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchResult();
  }, [id, result]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EFEBE4] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#A85D4C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#2D3030]">Synthesizing evidence-based competency profile...</p>
        </div>
      </div>
    );
  }

  const overallScore = result?.overall_readiness ?? result?.overall_score ?? 68.0;
  const strongest = result?.strongest_competencies || [];
  const needsAttention = result?.needs_attention || [];
  const largestGap = result?.largest_gap || null;
  const breakdown = result?.competency_breakdown || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 px-4 pb-16 text-left">
      
      {/* Top Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#A85D4C]/10 text-[#A85D4C] border border-[#A85D4C]/20">
          <Sparkles className="w-3.5 h-3.5 text-[#A85D4C]" />
          <span>Diagnostic Evidence Recorded</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#2D3030] tracking-tight">
          Competency Diagnostic Results
        </h1>
        <p className="text-[#292B2B] max-w-lg mx-auto text-xs sm:text-sm leading-relaxed">
          Your answers have been evaluated deterministically against role benchmarks. 
          Your competency profile has been updated from assessment evidence.
        </p>

        {/* Overall Readiness Circular Gauge */}
        <div className="my-6 flex justify-center">
          <div className="relative w-36 h-36 flex items-center justify-center bg-[#FFFDF9] rounded-full border-4 border-[#292B2B]/10 shadow-sm">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle
                className="text-[#A85D4C]"
                strokeWidth="8"
                strokeDasharray={`${overallScore * 3.8} 380`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="60"
                cx="72"
                cy="72"
              />
            </svg>
            <div className="text-center z-10">
              <span className="text-3xl font-black text-[#2D3030] font-mono">{overallScore}%</span>
              <p className="text-[10px] text-[#292B2B]/60 font-bold uppercase tracking-wider">Overall Readiness</p>
            </div>
          </div>
        </div>
      </div>

      {/* Triad Metric Cards: Strongest | Needs Attention | Priority Gap */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        {/* Strongest Competency Card */}
        <Card className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-2xl shadow-[0_1px_3px_rgba(45, 48, 48, 0.04)]">
          <CardHeader className="p-5 pb-3 border-b border-[#E2DDD5]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#2E8B57]">
                STRONG CAPABILITY
              </span>
              <CheckCircle2 className="w-4 h-4 text-[#2E8B57]" />
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-2">
            {strongest.length > 0 ? (
              <>
                <p className="text-base font-bold text-[#292B2B]">{strongest[0].competency_name}</p>
                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <span className="text-[#2E8B57] font-semibold">Score: {strongest[0].score}%</span>
                  <span className="text-[#7A756E]">Target: {strongest[0].target_score}%</span>
                </div>
              </>
            ) : (
              <p className="text-xs text-[#7A756E]">Take further diagnostics to establish verified strengths.</p>
            )}
          </CardContent>
        </Card>

        {/* Needs Attention Card */}
        <Card className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-2xl shadow-[0_1px_3px_rgba(45, 48, 48, 0.04)]">
          <CardHeader className="p-5 pb-3 border-b border-[#E2DDD5]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#A85D4C]">
                NEEDS ATTENTION
              </span>
              <Target className="w-4 h-4 text-[#A85D4C]" />
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-2">
            {needsAttention.length > 0 ? (
              <>
                <p className="text-base font-bold text-[#292B2B]">{needsAttention[0].competency_name}</p>
                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <span className="text-[#A85D4C] font-semibold">Score: {needsAttention[0].score}%</span>
                  <span className="text-[#7A756E]">Target: {needsAttention[0].target_score}%</span>
                </div>
              </>
            ) : (
              <p className="text-xs text-[#2E8B57] font-semibold">All tested areas meet benchmark.</p>
            )}
          </CardContent>
        </Card>

        {/* Largest Priority Gap Card */}
        <Card className="bg-[#FFFDF9] border border-[#E2DDD5] rounded-2xl shadow-[0_1px_3px_rgba(45, 48, 48, 0.04)]">
          <CardHeader className="p-5 pb-3 border-b border-[#E2DDD5]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#B38A3D]">
                PRIORITY DEFICIT GAP
              </span>
              <AlertTriangle className="w-4 h-4 text-[#B38A3D]" />
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-2">
            {largestGap ? (
              <>
                <p className="text-base font-bold text-[#292B2B]">{largestGap.competency_name}</p>
                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <span className="text-[#292B2B] font-semibold">
                    {largestGap.current_score}% → {largestGap.target_score}%
                  </span>
                  <span className="text-[#B38A3D] font-bold font-mono bg-[#B38A3D]/15 px-2 py-0.5 rounded">
                    Gap: -{largestGap.gap}%
                  </span>
                </div>
              </>
            ) : (
              <p className="text-xs text-[#7A756E]">No critical deficit identified.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comprehensive Evidence Breakdown Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#292B2B] uppercase font-mono tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#A85D4C]" />
            Role Competency Telemetry Breakdown
          </h3>
          <span className="text-xs font-mono text-[#7A756E] font-semibold">
            {breakdown.length} Competencies Evaluated
          </span>
        </div>

        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E2DDD5] overflow-hidden shadow-[0_1px_3px_rgba(45, 48, 48, 0.04)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#EFEBE4] border-b border-[#E2DDD5] text-[#292B2B] uppercase font-mono font-semibold text-[10px]">
              <tr>
                <th className="p-3.5 sm:px-5">Competency Area</th>
                <th className="p-3.5 sm:px-5">Domain</th>
                <th className="p-3.5 sm:px-5">Evidence Score</th>
                <th className="p-3.5 sm:px-5">Role Benchmark</th>
                <th className="p-3.5 sm:px-5">Deficit Gap</th>
                <th className="p-3.5 sm:px-5 text-right">Proficiency Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DDD5] font-medium text-[#292B2B]">
              {breakdown.map((item: any) => {
                const isStrong = item.status === 'strong';
                const isCritical = item.status === 'critical_gap';

                return (
                  <tr key={item.competency_id} className="hover:bg-[#EFEBE4]/50 transition-colors">
                    <td className="p-3.5 sm:px-5 font-semibold text-[#292B2B]">{item.competency_name}</td>
                    <td className="p-3.5 sm:px-5 text-[#A85D4C] font-mono">{item.domain || 'Statistical'}</td>
                    <td className="p-3.5 sm:px-5 font-mono font-bold text-[#292B2B]">{item.current_score}%</td>
                    <td className="p-3.5 sm:px-5 font-mono text-[#7A756E]">{item.target_score}%</td>
                    <td className="p-3.5 sm:px-5 font-mono font-bold">
                      {item.gap > 0 ? (
                        <span className="text-[#292B2B]">-{item.gap}%</span>
                      ) : (
                        <span className="text-[#2E8B57]">0%</span>
                      )}
                    </td>
                    <td className="p-3.5 sm:px-5 text-right">
                      <span className={cn(
                        "inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border uppercase",
                        isStrong 
                          ? "bg-[#2E8B57]/10 text-[#2E8B57] border-[#2E8B57]/30"
                          : isCritical
                          ? "bg-[#B38A3D]/15 text-[#292B2B] border-[#B38A3D]/35"
                          : "bg-[#A85D4C]/10 text-[#A85D4C] border-[#A85D4C]/20"
                      )}>
                        {item.status?.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Next Steps Callout */}
      <div className="p-6 sm:p-7 rounded-2xl bg-[#2D3030] text-[#FFFDF9] space-y-4 shadow-md">
        <div className="space-y-1.5">
          <span className="text-xs font-mono font-bold uppercase text-[#B38A3D] tracking-wider">
            NEXT STEP // PERSONALIZED LEARNING
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-[#FFFDF9]">
            Target your priority competency gaps with accredited learning.
          </h3>
          <p className="text-xs sm:text-sm text-[#FFFDF9]/80 leading-relaxed max-w-2xl">
            SmartLearn has updated your live capability map. Personalized iGOT learning sequences have been configured to close your priority competency gaps.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {/* Button 1: View Capability Landscape */}
          <Link to="/competencies" className="w-full sm:w-auto">
            <Button size="default" className="w-full sm:w-auto font-semibold bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9] shadow-xs px-6 h-10 rounded-xl flex items-center justify-center cursor-pointer">
              <span>View Capability Landscape</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>

          {/* Button 2: Explore Learning Recommendations */}
          <Link to="/learning-path" className="w-full sm:w-auto">
            <Button size="default" className="w-full sm:w-auto font-semibold bg-[#FFFDF9]/10 hover:bg-[#FFFDF9]/20 text-[#FFFDF9] border border-[#FFFDF9]/20 shadow-xs px-6 h-10 rounded-xl flex items-center justify-center cursor-pointer">
              <span>Explore Learning Recommendations</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

    </div>
  );
}
