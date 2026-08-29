import React, { useState } from 'react';
import { 
  WORKFORCE_GAP_DISTRIBUTION, 
  WORKFORCE_HEATMAP_DATA 
} from '@/data/homepageDemoData';
import { BarChart3, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WorkforceSignals() {
  const getHeatmapColor = (score: number) => {
    if (score >= 80) return "bg-[#2E8B57]/10 text-[#2E8B57] border-[#2E8B57]/25 font-bold";
    if (score >= 65) return "bg-[#A85D4C]/10 text-[#A85D4C] border-[#A85D4C]/20 font-bold";
    return "bg-[#B38A3D]/15 text-[#2D3030] border-[#B38A3D]/35 font-bold";
  };

  return (
    <section id="workforce-signals" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-[#E2DDD5] bg-[#F7F4EE] relative">
      <div className="max-w-[1440px] mx-auto space-y-8 sm:space-y-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 text-left">
          <div className="space-y-2.5 max-w-2xl">
            <span className="text-xs font-semibold text-[#A85D4C] uppercase tracking-widest block">
              WORKFORCE INTELLIGENCE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#292B2B] tracking-tight leading-tight">
              Macro capability signals across statistical divisions.
            </h2>
            <p className="text-base sm:text-[17px] text-[#7A756E] leading-[1.6]">
              Aggregated assessment data identifies structural skill gaps before they affect national data operations.
            </p>
          </div>

          <div className="text-xs font-mono text-[#7A756E] px-3 py-1 bg-[#FFFDF9] rounded-md border border-[#E2DDD5] shadow-xs self-start md:self-auto">
            Sample workforce dataset
          </div>
        </div>

        {/* 2-Column Scannable Layout: Ranked Gap Deficit + Cross-Role Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start text-left">
          {/* Left: Ranked Gap Deficit */}
          <div className="lg:col-span-5 bg-[#FFFDF9] rounded-2xl border border-[#E2DDD5] p-5 sm:p-6 shadow-xs space-y-4 sm:space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#292B2B]">Workforce Competency Deficit Ranking</h3>
              <p className="text-xs text-[#7A756E] mt-0.5">Average deficiency measured across official roles</p>
            </div>

            <div className="space-y-3 pt-1">
              {WORKFORCE_GAP_DISTRIBUTION.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="font-semibold text-[#292B2B] text-[11px]">{item.name}</span>
                    <span className={cn("font-bold text-[11px]", item.gap > 0 ? "text-[#292B2B]" : "text-[#2E8B57]")}>
                      {item.gap > 0 ? `-${item.gap}%` : 'Target Met'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#EFEBE4] rounded-full overflow-hidden border border-[#E2DDD5]">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        item.gap === 0 ? "bg-[#2E8B57]" : item.highlight ? "bg-[#B38A3D]" : "bg-[#A85D4C]"
                      )}
                      style={{ width: `${Math.max(item.gap * 3, item.gap === 0 ? 100 : 15)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#EFEBE4] rounded-xl border border-[#E2DDD5] text-xs font-mono text-[#292B2B] flex justify-between">
              <span>Primary Division Risk:</span>
              <strong className="text-[#292B2B]">Statistical Programming (-27%)</strong>
            </div>
          </div>

          {/* Right: Role Heatmap Grid */}
          <div className="lg:col-span-7 bg-[#FFFDF9] rounded-2xl border border-[#E2DDD5] p-5 sm:p-6 shadow-xs space-y-4 sm:space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-[#292B2B]">Role Proficiency Heatmap</h3>
                <p className="text-xs text-[#7A756E] mt-0.5">Proficiency status by official designation</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono text-[#7A756E]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#2E8B57]" /> ≥80%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#A85D4C]" /> 65–79%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#B38A3D]" /> &lt;65%</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-xs text-center border-collapse">
                <thead>
                  <tr className="bg-[#EFEBE4] border-b border-[#E2DDD5]">
                    <th className="p-2.5 text-left font-bold text-[#292B2B] uppercase text-[11px] tracking-wider w-48">
                      Domain
                    </th>
                    {WORKFORCE_HEATMAP_DATA.roles.map(r => (
                      <th key={r} className="p-2.5 font-bold text-[#292B2B] border-l border-[#E2DDD5] text-[11px]">
                        {r}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DDD5]">
                  {WORKFORCE_HEATMAP_DATA.rows.map((row) => (
                    <tr key={row.competency} className="hover:bg-[#EFEBE4]/50 transition-colors">
                      <td className="p-2 text-left font-semibold text-[#292B2B] text-xs">
                        {row.competency}
                      </td>
                      {row.scores.map((score, i) => (
                        <td key={i} className="p-1.5 border-l border-[#E2DDD5]">
                          <div className={cn("py-1.5 rounded-md border font-mono text-xs shadow-xs", getHeatmapColor(score))}>
                            {score}%
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
