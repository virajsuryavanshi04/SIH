import React from 'react';
import { TRAJECTORY_MILESTONES } from '@/data/homepageDemoData';
import { TrendingUp, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ImprovementTrajectory() {
  return (
    <section id="improvement-trajectory" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-[#E2DDD5] bg-[#FFFDF9] relative">
      <div className="max-w-[1440px] mx-auto space-y-8 sm:space-y-10">
        {/* Section Header */}
        <div className="space-y-2.5 max-w-3xl text-left">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-[#A85D4C] uppercase tracking-widest">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>MEASURABLE CAPABILITY TRAJECTORY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#292B2B] tracking-tight leading-tight">
            Proof of capability growth over time.
          </h2>
          <p className="text-base sm:text-[17px] text-[#7A756E] leading-[1.6] font-normal">
            SmartLearn does not measure course completion—it proves competency mastery. Reassessments validate whether the knowledge gap actually closed.
          </p>
        </div>

        {/* Trajectory Curve Visual Surface */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E2DDD5] p-5 sm:p-7 lg:p-8 shadow-xs space-y-6 sm:space-y-7 text-left">
          {/* Top Metric Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DDD5] pb-4 sm:pb-5">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#A85D4C] uppercase">Domain: Survey Methodology</span>
              <h3 className="text-xl font-bold text-[#292B2B]">Officer Competency Growth Curve</h3>
            </div>
            <div className="flex items-center gap-4 bg-[#EFEBE4] p-3 rounded-xl border border-[#E2DDD5]">
              <div className="text-left">
                <span className="text-[9px] font-mono uppercase text-[#7A756E] block font-bold">Total Measured Lift</span>
                <span className="text-2xl font-black text-[#2E8B57] font-mono">+33 pts</span>
              </div>
              <div className="h-8 w-px bg-[#E2DDD5]" />
              <div className="text-left">
                <span className="text-[9px] font-mono uppercase text-[#7A756E] block font-bold">Role Clearance</span>
                <span className="text-xs font-bold text-[#292B2B] font-mono block">Certified ✓</span>
              </div>
            </div>
          </div>

          {/* Interactive Trajectory Milestones Array */}
          <div className="relative pt-6 pb-2">
            {/* SVG Visual Curve Connecting Milestones */}
            <div className="hidden md:block relative h-28 w-full select-none mb-6">
              <svg className="w-full h-full" viewBox="0 0 800 100" preserveAspectRatio="none">
                {/* Horizontal Target Reference Line */}
                <line x1="0" y1="25" x2="800" y2="25" stroke="#292B2B" strokeDasharray="4 4" strokeOpacity="0.2" strokeWidth="1.5" />
                <text x="730" y="20" fill="#7A756E" fontSize="10" fontFamily="monospace">TARGET: 75%</text>

                {/* Main Trajectory Curve */}
                <path
                  d="M 50 85 Q 220 75, 400 45 T 750 20"
                  fill="none"
                  stroke="#A85D4C"
                  strokeWidth="3.5"
                  className="transition-all duration-1000"
                />
              </svg>
            </div>

            {/* Stepped Milestones Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {TRAJECTORY_MILESTONES.slice(0, 5).map((m, idx) => {
                const isFinal = idx === 4;

                return (
                  <div
                    key={m.phase}
                    className="p-4 rounded-xl border border-[#E2DDD5] bg-[#F7F4EE] hover:border-[#A85D4C] hover:bg-[#A85D4C]/5 hover:shadow-xs transition-all duration-200 space-y-2 relative cursor-default group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-[#7A756E] group-hover:text-[#7D4036] transition-colors">{m.phase}</span>
                      {isFinal && <CheckCircle2 className="w-3.5 h-3.5 text-[#2E8B57]" />}
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      <span className={cn(
                        "text-2xl font-black font-mono",
                        isFinal ? "text-[#2E8B57]" : "text-[#292B2B]"
                      )}>
                        {m.score}%
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-[#292B2B] group-hover:text-[#7D4036] transition-colors">{m.label}</h4>
                    <p className="text-[10px] text-[#7A756E] leading-relaxed font-mono pt-1 border-t border-[#E2DDD5]">
                      {m.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Trajectory Statement */}
          <div className="p-4 rounded-xl bg-[#2D3030] text-[#FFFDF9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#B38A3D]" />
              <span>
                Measured Competency Trajectory: <strong>Initial Baseline (45%) → Validated Reassessment (78%)</strong>
              </span>
            </div>
            <span className="font-mono text-[#B38A3D] font-bold">
              Gap reduced by 33 percentage points
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
