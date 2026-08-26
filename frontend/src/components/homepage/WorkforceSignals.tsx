import React, { useState } from 'react';
import { 
  WORKFORCE_GAP_DISTRIBUTION, 
  WORKFORCE_HEATMAP_DATA 
} from '@/data/homepageDemoData';
import { BarChart3, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WorkforceSignals() {
  const getHeatmapColor = (score: number) => {
    if (score >= 80) return "bg-[#2E7D32]/10 text-[#2E7D32] border-[#2E7D32]/25 font-bold";
    if (score >= 65) return "bg-[#1F7A8C]/10 text-[#1F7A8C] border-[#1F7A8C]/20 font-bold";
    return "bg-[#D4AF37]/15 text-[#0B2545] border-[#D4AF37]/35 font-bold";
  };

  return (
    <section id="workforce-signals" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[#2B2D42]/10 bg-[#F4F6F9] relative">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 text-left">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-mono font-bold text-[#1F7A8C] uppercase tracking-widest block">
              WORKFORCE INTELLIGENCE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B2545] tracking-tight">
              Macro capability signals across statistical divisions.
            </h2>
            <p className="text-sm text-[#2B2D42]/80 leading-relaxed">
              Aggregated assessment telemetry identifies structural skill gaps before they affect national data operations.
            </p>
          </div>

          <div className="text-xs font-mono text-[#2B2D42]/60 px-3 py-1 bg-[#FFFFFF] rounded-md border border-[#2B2D42]/10 shadow-2xs self-start md:self-auto">
            Sample workforce dataset
          </div>
        </div>

        {/* 2-Column Scannable Layout: Ranked Gap Deficit + Cross-Role Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
          {/* Left: Ranked Gap Deficit */}
          <div className="lg:col-span-5 bg-[#FFFFFF] rounded-2xl border border-[#2B2D42]/10 p-6 sm:p-7 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#0B2545]">Workforce Competency Deficit Ranking</h3>
              <p className="text-xs text-[#2B2D42]/60 mt-0.5">Average deficiency measured across official roles</p>
            </div>

            <div className="space-y-3 pt-1">
              {WORKFORCE_GAP_DISTRIBUTION.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="font-semibold text-[#0B2545] text-[11px]">{item.name}</span>
                    <span className={cn("font-bold text-[11px]", item.gap > 0 ? "text-[#0B2545]" : "text-[#2E7D32]")}>
                      {item.gap > 0 ? `-${item.gap}%` : 'Target Met'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#F4F6F9] rounded-full overflow-hidden border border-[#2B2D42]/10">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        item.gap === 0 ? "bg-[#2E7D32]" : item.highlight ? "bg-[#D4AF37]" : "bg-[#1F7A8C]"
                      )}
                      style={{ width: `${Math.max(item.gap * 3, item.gap === 0 ? 100 : 15)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#F4F6F9] rounded-xl border border-[#2B2D42]/10 text-xs font-mono text-[#2B2D42] flex justify-between">
              <span>Primary Division Risk:</span>
              <strong className="text-[#0B2545]">Statistical Programming (-27%)</strong>
            </div>
          </div>

          {/* Right: Role Heatmap Grid */}
          <div className="lg:col-span-7 bg-[#FFFFFF] rounded-2xl border border-[#2B2D42]/10 p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-[#0B2545]">Role Proficiency Heatmap</h3>
                <p className="text-xs text-[#2B2D42]/60 mt-0.5">Proficiency status by official designation</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono text-[#2B2D42]/70">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#2E7D32]" /> ≥80%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#1F7A8C]" /> 65–79%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#D4AF37]" /> &lt;65%</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr className="bg-[#F4F6F9] border-b border-[#2B2D42]/10">
                    <th className="p-2.5 text-left font-bold text-[#0B2545] uppercase text-[11px] tracking-wider w-48">
                      Domain
                    </th>
                    {WORKFORCE_HEATMAP_DATA.roles.map(r => (
                      <th key={r} className="p-2.5 font-bold text-[#0B2545] border-l border-[#2B2D42]/10 text-[11px]">
                        {r}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B2D42]/10">
                  {WORKFORCE_HEATMAP_DATA.rows.map((row) => (
                    <tr key={row.competency} className="hover:bg-[#F4F6F9]/50 transition-colors">
                      <td className="p-2 text-left font-semibold text-[#0B2545] text-xs">
                        {row.competency}
                      </td>
                      {row.scores.map((score, i) => (
                        <td key={i} className="p-1.5 border-l border-[#2B2D42]/10">
                          <div className={cn("py-1.5 rounded-md border font-mono text-xs shadow-2xs", getHeatmapColor(score))}>
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
