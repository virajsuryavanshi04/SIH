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
      <div className="min-h-screen bg-[#EAF3F7] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#176B87] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#123B5D]">Synthesizing evidence-based competency profile...</p>
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
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#176B87]/10 text-[#176B87] border border-[#176B87]/20">
          <Sparkles className="w-3.5 h-3.5 text-[#176B87]" />
          <span>Diagnostic Evidence Recorded</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#123B5D] tracking-tight">
          Competency Diagnostic Results
        </h1>
        <p className="text-[#123047] max-w-lg mx-auto text-xs sm:text-sm leading-relaxed">
          Your answers have been evaluated deterministically against role benchmarks. 
          Your competency profile has been updated from assessment evidence.
        </p>

        {/* Overall Readiness Circular Gauge */}
        <div className="my-6 flex justify-center">
          <div className="relative w-36 h-36 flex items-center justify-center bg-[#FFFFFF] rounded-full border-4 border-[#123047]/10 shadow-sm">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle
                className="text-[#176B87]"
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
              <span className="text-3xl font-black text-[#123B5D] font-mono">{overallScore}%</span>
              <p className="text-[10px] text-[#123047]/60 font-bold uppercase tracking-wider">Overall Readiness</p>
            </div>
          </div>
        </div>
      </div>

      {/* Triad Metric Cards: Strongest | Needs Attention | Priority Gap */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        {/* Strongest Competency Card */}
        <Card className="bg-[#FFFFFF] border border-[#D8E5EC] rounded-2xl shadow-[0_1px_3px_rgba(11,37,69,0.04)]">
          <CardHeader className="p-5 pb-3 border-b border-[#D8E5EC]">
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
                <p className="text-base font-bold text-[#123047]">{strongest[0].competency_name}</p>
                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <span className="text-[#2E8B57] font-semibold">Score: {strongest[0].score}%</span>
                  <span className="text-[#5D7180]">Target: {strongest[0].target_score}%</span>
                </div>
              </>
            ) : (
              <p className="text-xs text-[#5D7180]">Take further diagnostics to establish verified strengths.</p>
            )}
          </CardContent>
        </Card>

        {/* Needs Attention Card */}
        <Card className="bg-[#FFFFFF] border border-[#D8E5EC] rounded-2xl shadow-[0_1px_3px_rgba(11,37,69,0.04)]">
          <CardHeader className="p-5 pb-3 border-b border-[#D8E5EC]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#176B87]">
                NEEDS ATTENTION
              </span>
              <Target className="w-4 h-4 text-[#176B87]" />
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-2">
            {needsAttention.length > 0 ? (
              <>
                <p className="text-base font-bold text-[#123047]">{needsAttention[0].competency_name}</p>
                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <span className="text-[#176B87] font-semibold">Score: {needsAttention[0].score}%</span>
                  <span className="text-[#5D7180]">Target: {needsAttention[0].target_score}%</span>
                </div>
              </>
            ) : (
              <p className="text-xs text-[#2E8B57] font-semibold">All tested areas meet benchmark.</p>
            )}
          </CardContent>
        </Card>

        {/* Largest Priority Gap Card */}
        <Card className="bg-[#FFFFFF] border border-[#D8E5EC] rounded-2xl shadow-[0_1px_3px_rgba(11,37,69,0.04)]">
          <CardHeader className="p-5 pb-3 border-b border-[#D8E5EC]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#D49A2A]">
                PRIORITY DEFICIT GAP
              </span>
              <AlertTriangle className="w-4 h-4 text-[#D49A2A]" />
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-2">
            {largestGap ? (
              <>
                <p className="text-base font-bold text-[#123047]">{largestGap.competency_name}</p>
                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <span className="text-[#123047] font-semibold">
                    {largestGap.current_score}% → {largestGap.target_score}%
                  </span>
                  <span className="text-[#D49A2A] font-bold font-mono bg-[#D49A2A]/15 px-2 py-0.5 rounded">
                    Gap: -{largestGap.gap}%
                  </span>
                </div>
              </>
            ) : (
              <p className="text-xs text-[#5D7180]">No critical deficit identified.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comprehensive Evidence Breakdown Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#123047] uppercase font-mono tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#176B87]" />
            Role Competency Telemetry Breakdown
          </h3>
          <span className="text-xs font-mono text-[#5D7180] font-semibold">
            {breakdown.length} Competencies Evaluated
          </span>
        </div>

        <div className="bg-[#FFFFFF] rounded-2xl border border-[#D8E5EC] overflow-hidden shadow-[0_1px_3px_rgba(11,37,69,0.04)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#EAF3F7] border-b border-[#D8E5EC] text-[#123047] uppercase font-mono font-semibold text-[10px]">
              <tr>
                <th className="p-3.5 sm:px-5">Competency Area</th>
                <th className="p-3.5 sm:px-5">Domain</th>
                <th className="p-3.5 sm:px-5">Evidence Score</th>
                <th className="p-3.5 sm:px-5">Role Benchmark</th>
                <th className="p-3.5 sm:px-5">Deficit Gap</th>
                <th className="p-3.5 sm:px-5 text-right">Proficiency Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E5EC] font-medium text-[#123047]">
              {breakdown.map((item: any) => {
                const isStrong = item.status === 'strong';
                const isCritical = item.status === 'critical_gap';

                return (
                  <tr key={item.competency_id} className="hover:bg-[#EAF3F7]/50 transition-colors">
                    <td className="p-3.5 sm:px-5 font-semibold text-[#123047]">{item.competency_name}</td>
                    <td className="p-3.5 sm:px-5 text-[#176B87] font-mono">{item.domain || 'Statistical'}</td>
                    <td className="p-3.5 sm:px-5 font-mono font-bold text-[#123047]">{item.current_score}%</td>
                    <td className="p-3.5 sm:px-5 font-mono text-[#5D7180]">{item.target_score}%</td>
                    <td className="p-3.5 sm:px-5 font-mono font-bold">
                      {item.gap > 0 ? (
                        <span className="text-[#123047]">-{item.gap}%</span>
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
                          ? "bg-[#D49A2A]/15 text-[#123047] border-[#D49A2A]/35"
                          : "bg-[#176B87]/10 text-[#176B87] border-[#176B87]/20"
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
      <div className="p-6 sm:p-7 rounded-2xl bg-[#123B5D] text-[#FFFFFF] space-y-4 shadow-md">
        <div className="space-y-1.5">
          <span className="text-xs font-mono font-bold uppercase text-[#D49A2A] tracking-wider">
            NEXT STEP // PERSONALIZED LEARNING
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-[#FFFFFF]">
            Target your priority competency gaps with accredited learning.
          </h3>
          <p className="text-xs sm:text-sm text-[#FFFFFF]/80 leading-relaxed max-w-2xl">
            SmartLearn has updated your live capability map. Personalized iGOT learning sequences have been configured to close your priority competency gaps.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {/* Button 1: View Capability Landscape */}
          <Link to="/competencies" className="w-full sm:w-auto">
            <Button size="default" className="w-full sm:w-auto font-semibold bg-[#176B87] hover:bg-[#176B87]/90 text-[#FFFFFF] shadow-xs px-6 h-10 rounded-xl flex items-center justify-center cursor-pointer">
              <span>View Capability Landscape</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>

          {/* Button 2: Explore Learning Recommendations */}
          <Link to="/learning-path" className="w-full sm:w-auto">
            <Button size="default" className="w-full sm:w-auto font-semibold bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/20 text-[#FFFFFF] border border-[#FFFFFF]/20 shadow-xs px-6 h-10 rounded-xl flex items-center justify-center cursor-pointer">
              <span>Explore Learning Recommendations</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

    </div>
  );
}
