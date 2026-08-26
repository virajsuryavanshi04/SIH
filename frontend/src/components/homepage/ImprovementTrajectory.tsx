import React, { useState } from 'react';
import { TRAJECTORY_MILESTONES } from '@/data/homepageDemoData';
import { TrendingUp, Award, CheckCircle2, ArrowRight, ShieldCheck, Sparkles, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ImprovementTrajectory() {
  const [selectedMilestone, setSelectedMilestone] = useState<number>(4); // Default to Reassess milestone (78%)

  return (
    <section id="improvement-trajectory" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[#2B2D42]/10 bg-[#F4F6F9] relative">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="space-y-3 max-w-3xl text-left">
          <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-[#1F7A8C] uppercase tracking-widest">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>MEASURABLE CAPABILITY TRAJECTORY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B2545] tracking-tight">
            Proof of capability growth over time.
          </h2>
          <p className="text-sm sm:text-base text-[#2B2D42]/80 leading-relaxed font-normal">
            SmartLearn does not measure course completion—it proves competency mastery. Reassessment telemetry validates whether the knowledge gap actually closed.
          </p>
        </div>

        {/* Trajectory Curve Visual Surface */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#2B2D42]/10 p-6 sm:p-10 shadow-sm space-y-8 text-left">
          {/* Top Metric Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2B2D42]/10 pb-6">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#1F7A8C] uppercase">Telemetry Domain: Survey Methodology</span>
              <h3 className="text-xl font-bold text-[#0B2545]">Officer Competency Growth Curve</h3>
            </div>
            <div className="flex items-center gap-4 bg-[#F4F6F9] p-3 rounded-xl border border-[#2B2D42]/10">
              <div className="text-left">
                <span className="text-[9px] font-mono uppercase text-[#2B2D42]/60 block font-bold">Total Measured Lift</span>
                <span className="text-2xl font-black text-[#2E7D32] font-mono">+33 pts</span>
              </div>
              <div className="h-8 w-px bg-[#2B2D42]/15" />
              <div className="text-left">
                <span className="text-[9px] font-mono uppercase text-[#2B2D42]/60 block font-bold">Role Clearance</span>
                <span className="text-xs font-bold text-[#0B2545] font-mono block">Certified ✓</span>
              </div>
            </div>
          </div>

          {/* Interactive Trajectory Milestones Array */}
          <div className="relative pt-6 pb-2">
            {/* SVG Visual Curve Connecting Milestones */}
            <div className="hidden md:block relative h-28 w-full select-none mb-6">
              <svg className="w-full h-full" viewBox="0 0 800 100" preserveAspectRatio="none">
                {/* Horizontal Target Reference Line */}
                <line x1="0" y1="25" x2="800" y2="25" stroke="#2B2D42" strokeDasharray="4 4" strokeOpacity="0.25" strokeWidth="1.5" />
                <text x="730" y="20" fill="#2B2D42" fillOpacity="0.6" fontSize="10" fontFamily="monospace">TARGET: 75%</text>

                {/* Main Trajectory Curve */}
                <path
                  d="M 50 85 Q 220 75, 400 45 T 750 20"
                  fill="none"
                  stroke="#1F7A8C"
                  strokeWidth="3.5"
                  className="transition-all duration-1000"
                />
              </svg>
            </div>

            {/* Stepped Milestones Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {TRAJECTORY_MILESTONES.slice(0, 5).map((m, idx) => {
                const isSelected = selectedMilestone === idx;
                const isFinal = idx === 4;

                return (
                  <div
                    key={m.phase}
                    onClick={() => setSelectedMilestone(idx)}
                    className={cn(
                      "p-4 rounded-xl border transition-all duration-200 cursor-pointer space-y-2 relative",
                      isSelected 
                        ? "border-[#1F7A8C] bg-[#1F7A8C]/5 ring-2 ring-[#1F7A8C]/20 shadow-xs" 
                        : "border-[#2B2D42]/10 hover:border-[#1F7A8C]/50 bg-[#F4F6F9]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-[#2B2D42]/60">{m.phase}</span>
                      {isFinal && <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />}
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      <span className={cn(
                        "text-2xl font-black font-mono",
                        isFinal ? "text-[#2E7D32]" : isSelected ? "text-[#1F7A8C]" : "text-[#0B2545]"
                      )}>
                        {m.score}%
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-[#0B2545]">{m.label}</h4>
                    <p className="text-[10px] text-[#2B2D42]/70 leading-relaxed font-mono pt-1 border-t border-[#2B2D42]/10">
                      {m.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Trajectory Statement */}
          <div className="p-4 rounded-xl bg-[#0B2545] text-[#FFFFFF] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>
                Selected Phase Telemetry: <strong>{TRAJECTORY_MILESTONES[selectedMilestone].label} ({TRAJECTORY_MILESTONES[selectedMilestone].score}%)</strong>
              </span>
            </div>
            <span className="font-mono text-[#D4AF37] font-bold">
              Gap reduced by 33 percentage points
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
