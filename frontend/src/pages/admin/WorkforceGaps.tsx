import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SkillHeatmap from '@/components/admin/SkillHeatmap';
import { BarChart3, AlertTriangle, Sparkles, Filter, Calculator, Layers, CheckCircle2 } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function WorkforceGaps() {
  const [loading, setLoading] = useState<boolean>(true);
  const [heatmapData, setHeatmapData] = useState<any>({ departments: [], competencies: [], cells: [] });
  const [priorities, setPriorities] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [heatRes, gapRes] = await Promise.allSettled([
          adminApi.getHeatmap(),
          adminApi.getGapPriorities()
        ]);

        if (heatRes.status === 'fulfilled' && heatRes.value.data) {
          const raw = heatRes.value.data;
          setHeatmapData({
            departments: raw.departments || ['National Accounts Division', 'Survey Operations Division'],
            competencies: raw.competencies || ['Statistical Methods', 'Sampling Techniques', 'Survey Methodology', 'Data Quality'],
            cells: (raw.cells || []).map((c: any) => ({
              comp: c.competency_name,
              dept: c.department_name,
              score: Math.round(c.avg_score)
            }))
          });
        }

        if (gapRes.status === 'fulfilled' && gapRes.value.data) {
          setPriorities(gapRes.value.data);
        }
      } catch (err) {
        console.error('Failed to load workforce gaps:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#1F7A8C] uppercase tracking-widest mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>ORGANIZATIONAL GAP TOPOLOGY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#102A43] tracking-tight">
            Workforce Skill Gap Heatmap
          </h1>
          <p className="text-xs sm:text-sm text-[#62748A] mt-1">
            Cross-departmental matrix identifying institutional capability bottlenecks across official statistical roles.
          </p>
        </div>
        <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#1F7A8C]/10 text-[#1F7A8C] border border-[#1F7A8C]/20 shadow-2xs self-start sm:self-auto">
          <Sparkles className="w-3.5 h-3.5 text-[#1F7A8C]" />
          <span>Real-Time Telemetry Aggregation</span>
        </div>
      </div>

      {/* Heatmap Card */}
      <Card className="bg-[#FFFFFF] shadow-[0_1px_3px_rgba(11,37,69,0.04)] border border-[#DCE5EA] rounded-2xl">
        <CardHeader className="border-b border-[#DCE5EA] p-5 pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-[#102A43] flex items-center gap-2 uppercase font-mono">
              <BarChart3 className="w-4 h-4 text-[#1F7A8C]" />
              Department × Competency Proficiency Matrix
            </CardTitle>
            <CardDescription className="text-xs text-[#62748A] mt-0.5">
              Green = target met (≥80%), Teal = on track (65–79%), Gold = gap identified (&lt;65%).
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-5 sm:p-6">
          {loading ? (
            <div className="p-8 text-center text-xs text-[#62748A] font-semibold">Computing capability matrix...</div>
          ) : (
            <SkillHeatmap data={heatmapData} />
          )}
        </CardContent>
      </Card>

      {/* Prioritization Table */}
      <Card className="bg-[#FFFFFF] shadow-[0_1px_3px_rgba(11,37,69,0.04)] border border-[#DCE5EA] rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-[#DCE5EA] p-5 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-sm font-bold text-[#102A43] flex items-center gap-2 uppercase font-mono">
              <AlertTriangle className="w-4 h-4 text-[#D4AF37]" />
              Prioritized Workforce Deficits
            </CardTitle>
            <div className="flex items-center space-x-1.5 text-xs text-[#102A43] bg-[#EEF5F7] px-3 py-1 rounded-lg border border-[#DCE5EA] font-mono text-[11px]">
              <Calculator className="w-3.5 h-3.5 text-[#1F7A8C]" />
              <span>Priority Ranking = Severity × Affected Percentage</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EEF5F7] border-b border-[#DCE5EA] text-[#102A43] uppercase tracking-wider font-semibold font-mono text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Rank</th>
                  <th className="px-5 py-3.5">Competency Domain</th>
                  <th className="px-5 py-3.5">Workforce Below Target</th>
                  <th className="px-5 py-3.5">Affected Headcount</th>
                  <th className="px-5 py-3.5">Severity</th>
                  <th className="px-5 py-3.5">Recommended Institutional Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5EA] font-medium text-[#102A43]">
                {priorities.map((row: any, idx: number) => {
                  const isHigh = row.severity === 'High';
                  return (
                    <tr key={idx} className="hover:bg-[#EEF5F7]/50 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-[#62748A]/60">#{idx + 1}</td>
                      <td className="px-5 py-3.5 font-bold text-[#102A43]">{row.competency_name}</td>
                      <td className="px-5 py-3.5 text-[#102A43] font-bold font-mono">{row.percent_below_target}%</td>
                      <td className="px-5 py-3.5 text-[#62748A]">{row.affected_count} officers</td>
                      <td className="px-5 py-3.5">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold border font-mono uppercase",
                          isHigh 
                            ? "bg-[#D4AF37]/15 text-[#102A43] border-[#D4AF37]/35" 
                            : "bg-[#1F7A8C]/10 text-[#1F7A8C] border-[#1F7A8C]/20"
                        )}>
                          {row.severity} Priority
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#1F7A8C] font-semibold">{row.recommended_intervention}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
