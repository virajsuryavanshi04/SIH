import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SkillHeatmap from '@/components/admin/SkillHeatmap';
import { BarChart3, AlertTriangle, Sparkles, Filter, Calculator } from 'lucide-react';

export default function WorkforceGaps() {
  const heatmapData = {
    departments: ['Statistical Services', 'Survey Operations', 'Data Analysis Div', 'IT & Digital Stats'],
    competencies: [
      'Statistical Methods',
      'Data Analysis',
      'Sampling Techniques',
      'Survey Methodology',
      'Data Quality',
      'Statistical Programming',
      'Data Visualization',
      'Data Interpretation'
    ],
    cells: [
      { comp: 'Statistical Methods', dept: 'Statistical Services', score: 88 },
      { comp: 'Statistical Methods', dept: 'Survey Operations', score: 68 },
      { comp: 'Statistical Methods', dept: 'Data Analysis Div', score: 84 },
      { comp: 'Statistical Methods', dept: 'IT & Digital Stats', score: 72 },

      { comp: 'Sampling Techniques', dept: 'Statistical Services', score: 52 },
      { comp: 'Sampling Techniques', dept: 'Survey Operations', score: 64 },
      { comp: 'Sampling Techniques', dept: 'Data Analysis Div', score: 48 },
      { comp: 'Sampling Techniques', dept: 'IT & Digital Stats', score: 40 },

      { comp: 'Survey Methodology', dept: 'Statistical Services', score: 56 },
      { comp: 'Survey Methodology', dept: 'Survey Operations', score: 74 },
      { comp: 'Survey Methodology', dept: 'Data Analysis Div', score: 50 },
      { comp: 'Survey Methodology', dept: 'IT & Digital Stats', score: 45 },

      { comp: 'Data Analysis', dept: 'Statistical Services', score: 76 },
      { comp: 'Data Analysis', dept: 'Survey Operations', score: 62 },
      { comp: 'Data Analysis', dept: 'Data Analysis Div', score: 90 },
      { comp: 'Data Analysis', dept: 'IT & Digital Stats', score: 82 },

      { comp: 'Data Quality', dept: 'Statistical Services', score: 74 },
      { comp: 'Data Quality', dept: 'Survey Operations', score: 68 },
      { comp: 'Data Quality', dept: 'Data Analysis Div', score: 78 },
      { comp: 'Data Quality', dept: 'IT & Digital Stats', score: 70 },

      { comp: 'Statistical Programming', dept: 'Statistical Services', score: 44 },
      { comp: 'Statistical Programming', dept: 'Survey Operations', score: 38 },
      { comp: 'Statistical Programming', dept: 'Data Analysis Div', score: 82 },
      { comp: 'Statistical Programming', dept: 'IT & Digital Stats', score: 86 },

      { comp: 'Data Visualization', dept: 'Statistical Services', score: 82 },
      { comp: 'Data Visualization', dept: 'Survey Operations', score: 64 },
      { comp: 'Data Visualization', dept: 'Data Analysis Div', score: 88 },
      { comp: 'Data Visualization', dept: 'IT & Digital Stats', score: 79 },

      { comp: 'Data Interpretation', dept: 'Statistical Services', score: 85 },
      { comp: 'Data Interpretation', dept: 'Survey Operations', score: 72 },
      { comp: 'Data Interpretation', dept: 'Data Analysis Div', score: 80 },
      { comp: 'Data Interpretation', dept: 'IT & Digital Stats', score: 75 },
    ]
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B2545] tracking-tight">Workforce Skill Gap Heatmap</h1>
          <p className="text-[#2B2D42] mt-1">Cross-departmental matrix identifying structural bottlenecks across official roles.</p>
        </div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1F7A8C]/10 text-[#1F7A8C] border border-[#1F7A8C]/20 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#1F7A8C]" />
          <span>Real-time capability aggregation</span>
        </div>
      </div>

      <Card className="bg-[#FFFFFF] shadow-sm border border-[#2B2D42]/10">
        <CardHeader className="border-b border-[#2B2D42]/10 pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-[#0B2545] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#1F7A8C]" />
              Department × Competency Proficiency Matrix
            </CardTitle>
            <CardDescription className="text-xs text-[#2B2D42]/60">Green = target met (≥80%), Teal = on track (65–79%), Gold = gap identified (&lt;65%).</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto pt-6">
          <SkillHeatmap data={heatmapData} />
        </CardContent>
      </Card>

      {/* Prioritization Table with Formula */}
      <Card className="border-t-2 border-t-[#D4AF37] bg-[#FFFFFF] shadow-sm border-[#2B2D42]/10">
        <CardHeader className="border-b border-[#2B2D42]/10 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-base font-bold text-[#0B2545] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#D4AF37]" />
              Prioritized Critical Gaps (Mathematical Ranking)
            </CardTitle>
            <div className="flex items-center space-x-1 text-xs text-[#2B2D42] bg-[#F4F6F9] px-2.5 py-1 rounded-md border border-[#2B2D42]/10">
              <Calculator className="w-3.5 h-3.5 text-[#1F7A8C]" />
              <span>Priority Score = Severity × Role Importance × Affected Count</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="bg-[#FFFFFF] rounded-xl shadow-xs border border-[#2B2D42]/10 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F6F9] border-b border-[#2B2D42]/10 text-[#0B2545] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-3.5">Rank</th>
                  <th className="px-6 py-3.5">Competency Domain</th>
                  <th className="px-6 py-3.5">Workforce Deficit</th>
                  <th className="px-6 py-3.5">Affected Officers</th>
                  <th className="px-6 py-3.5">Severity Index</th>
                  <th className="px-6 py-3.5">Recommended Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B2D42]/10 font-medium text-[#2B2D42]">
                {[
                  { rank: 1, comp: 'Statistical Programming', below: 32, count: 9, sev: 'CRITICAL', action: 'Assign Python for Stats (10h)' },
                  { rank: 2, comp: 'Sampling Techniques', below: 26, count: 8, sev: 'HIGH', action: 'Deploy Stratification Workshop' },
                  { rank: 3, comp: 'Survey Methodology', below: 22, count: 6, sev: 'HIGH', action: 'Assign PLFS Survey Handbook' },
                  { rank: 4, comp: 'Data Quality Assurance', below: 14, count: 4, sev: 'MEDIUM', action: 'Audit Rules Training' },
                ].map(row => (
                  <tr key={row.rank} className="hover:bg-[#F4F6F9] transition-colors">
                    <td className="px-6 py-4 font-black text-[#2B2D42]/40 font-mono">#{row.rank}</td>
                    <td className="px-6 py-4 font-bold text-[#1F7A8C]">{row.comp}</td>
                    <td className="px-6 py-4 text-[#D4AF37] font-bold font-mono">-{row.below} pts</td>
                    <td className="px-6 py-4 text-[#2B2D42]">{row.count} officers</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 font-mono">
                        {row.sev === 'CRITICAL' ? 'Priority Gap' : 'Needs Attention'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-[#1F7A8C]">{row.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
