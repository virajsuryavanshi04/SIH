import React, { useState } from 'react';
import { WORKFORCE_COMPETENCIES, CompetencyNodeData } from '@/data/homepageDemoData';
import { Brain, Compass, ArrowRight, Activity, AlertTriangle, CheckCircle2, Sparkles, BookOpen, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function CompetencyLandscape() {
  const [selectedCompetency, setSelectedCompetency] = useState<CompetencyNodeData>(WORKFORCE_COMPETENCIES[1]); // Default: Sampling Techniques

  return (
    <section id="competency-landscape" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-[#E2DDD5] bg-[#F7F4EE] relative">
      <div className="max-w-[1440px] mx-auto space-y-8 sm:space-y-10">
        {/* Section Header */}
        <div className="space-y-2.5 max-w-3xl text-left">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-[#A85D4C] uppercase tracking-widest">
            <Compass className="w-3.5 h-3.5" />
            <span>THE WORKFORCE COMPETENCY LANDSCAPE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#292B2B] tracking-tight leading-tight">
            Training should begin with evidence—not assumptions.
          </h2>
          <p className="text-base sm:text-[17px] text-[#7A756E] leading-[1.6] font-normal">
            Official statistics demands interconnected expertise. SmartLearn models competencies as an interdependent graph rather than disconnected courses, revealing exactly where knowledge bottlenecks form.
          </p>
        </div>

        {/* Centerpiece Interactive Topology & Contextual Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left: Interactive Radial & Network Topology Map */}
          <div className="lg:col-span-7 bg-[#FFFDF9] rounded-2xl border border-[#E2DDD5] p-5 sm:p-6 lg:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-3 text-xs">
              <span className="font-semibold text-[#292B2B] uppercase tracking-wider">Interactive Competency Network</span>
              <span className="text-[#7A756E]">Select a competency to inspect</span>
            </div>

            {/* Hub and Branch Visual Array */}
            <div className="space-y-4">
              {/* Central Framework Core Node */}
              <div className="bg-[#2D3030] text-[#FFFDF9] p-4 rounded-xl shadow-xs border border-[#2D3030] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-[#A85D4C] flex items-center justify-center text-[#FFFDF9]">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#B38A3D] uppercase tracking-wider block font-bold">Framework Root</span>
                    <h3 className="text-sm font-bold text-[#FFFDF9]">OFFICIAL STATISTICS ARCHITECTURE</h3>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#FFFDF9]/70 hidden sm:inline">7 Mapped Domains</span>
              </div>

              {/* Competency Node Grid Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {WORKFORCE_COMPETENCIES.map((comp) => {
                  const isSelected = selectedCompetency.id === comp.id;
                  const isMet = comp.gap === 0;
                  const isCritical = comp.priority === 'CRITICAL';

                  return (
                    <div
                      key={comp.id}
                      onClick={() => setSelectedCompetency(comp)}
                      className={cn(
                        "p-3.5 rounded-xl border transition-all cursor-pointer text-left relative",
                        isSelected
                          ? "border-[#A85D4C] bg-[#A85D4C]/5 shadow-xs ring-1 ring-[#A85D4C]/30"
                          : "border-[#E2DDD5] hover:border-[#A85D4C]/50 bg-[#FFFDF9]"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold uppercase text-[#7A756E]">
                          {comp.domain}
                        </span>
                        {isMet ? (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#2E8B57]/10 text-[#2E8B57] border border-[#2E8B57]/30 font-mono">
                            Target Met
                          </span>
                        ) : (
                          <span className={cn(
                            "text-[9px] font-bold px-2 py-0.5 rounded-full border font-mono",
                            isCritical 
                              ? "bg-[#B38A3D]/15 text-[#292B2B] border-[#B38A3D]/40" 
                              : "bg-[#A85D4C]/10 text-[#A85D4C] border-[#A85D4C]/20"
                          )}>
                            -{comp.gap}% Gap
                          </span>
                        )}
                      </div>

                      <h4 className={cn("text-xs font-bold transition-colors leading-tight mb-2", isSelected ? "text-[#A85D4C]" : "text-[#292B2B]")}>
                        {comp.name}
                      </h4>

                      {/* Score track */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-[#7A756E]">
                          <span>Current: <strong className="text-[#292B2B]">{comp.current}%</strong></span>
                          <span>Target: {comp.target}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#E2DDD5]/60 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full transition-all duration-700", isMet ? "bg-[#2E8B57]" : isCritical ? "bg-[#B38A3D]" : "bg-[#A85D4C]")}
                            style={{ width: `${comp.current}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Contextual Telemetry & Root Cause Inspector */}
          <div className="lg:col-span-5 bg-[#FFFDF9] rounded-2xl border border-[#E2DDD5] p-5 sm:p-6 lg:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-3">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#A85D4C] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Contextual Diagnosis Inspector</span>
              </div>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full font-mono",
                selectedCompetency.gap > 0 ? "bg-[#B38A3D]/15 text-[#292B2B] border border-[#B38A3D]/30" : "bg-[#2E8B57]/10 text-[#2E8B57] border border-[#2E8B57]/30"
              )}>
                {selectedCompetency.priority} PRIORITY
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono text-[#A85D4C] font-semibold">{selectedCompetency.domain}</span>
              <h3 className="text-2xl font-bold text-[#292B2B]">{selectedCompetency.name}</h3>
              <p className="text-xs text-[#7A756E] leading-relaxed pt-1">
                {selectedCompetency.description}
              </p>
            </div>

            {/* Metrics Triad */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 bg-[#EFEBE4] rounded-xl border border-[#E2DDD5]">
                <span className="text-[9px] font-mono text-[#7A756E] uppercase font-bold block">Current Level</span>
                <span className="text-xl font-bold text-[#292B2B] font-mono mt-0.5 block">{selectedCompetency.current}%</span>
              </div>
              <div className="p-3 bg-[#A85D4C]/8 rounded-xl border border-[#A85D4C]/20">
                <span className="text-[9px] font-mono text-[#A85D4C] uppercase font-bold block">Role Target</span>
                <span className="text-xl font-bold text-[#A85D4C] font-mono mt-0.5 block">{selectedCompetency.target}%</span>
              </div>
              <div className={cn(
                "p-3 rounded-xl border",
                selectedCompetency.gap > 0 ? "bg-[#B38A3D]/15 border-[#B38A3D]/30" : "bg-[#2E8B57]/10 border-[#2E8B57]/30"
              )}>
                <span className="text-[9px] font-mono text-[#7A756E] uppercase font-bold block">Deficit</span>
                <span className={cn(
                  "text-xl font-bold font-mono mt-0.5 block",
                  selectedCompetency.gap > 0 ? "text-[#292B2B]" : "text-[#2E8B57]"
                )}>
                  {selectedCompetency.gap > 0 ? `-${selectedCompetency.gap}%` : '0%'}
                </span>
              </div>
            </div>

            {/* Root Dependency & Recommended Action Callout */}
            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-xl bg-[#EFEBE4] border border-[#E2DDD5] space-y-1 text-xs">
                <span className="font-mono font-bold text-[#292B2B] text-[10px] uppercase block">
                  Root Prerequisite Dependency
                </span>
                <p className="text-[#292B2B] font-medium leading-snug">
                  {selectedCompetency.rootDependency}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#A85D4C]/5 border border-[#A85D4C]/20 space-y-1 text-xs">
                <span className="font-mono font-bold text-[#A85D4C] text-[10px] uppercase block">
                  Recommended Intervention
                </span>
                <p className="text-[#292B2B] font-semibold leading-snug">
                  {selectedCompetency.recommendedAction}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link to="/login">
                <Button className="w-full bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9] text-[15px] font-semibold shadow-xs h-11 rounded-xl cursor-pointer">
                  <BookOpen className="w-4 h-4 mr-2" /> Launch Module in Learning Path
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
