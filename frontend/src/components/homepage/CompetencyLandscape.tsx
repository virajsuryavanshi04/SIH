import React, { useState } from 'react';
import { WORKFORCE_COMPETENCIES, CompetencyNodeData } from '@/data/homepageDemoData';
import { Brain, Compass, ArrowRight, Activity, AlertTriangle, CheckCircle2, Sparkles, BookOpen, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function CompetencyLandscape() {
  const [selectedCompetency, setSelectedCompetency] = useState<CompetencyNodeData>(WORKFORCE_COMPETENCIES[1]); // Default: Sampling Techniques

  return (
    <section id="competency-landscape" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[#2B2D42]/10 bg-[#F4F6F9] relative">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="space-y-3 max-w-3xl text-left">
          <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-[#1F7A8C] uppercase tracking-widest">
            <Compass className="w-3.5 h-3.5" />
            <span>THE WORKFORCE COMPETENCY LANDSCAPE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B2545] tracking-tight">
            Training should begin with evidence—not assumptions.
          </h2>
          <p className="text-sm sm:text-base text-[#2B2D42]/80 leading-relaxed font-normal">
            Official statistics demands interconnected expertise. SmartLearn models competencies as an interdependent graph rather than disconnected courses, revealing exactly where knowledge bottlenecks form.
          </p>
        </div>

        {/* Centerpiece Interactive Topology & Contextual Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Interactive Radial & Network Topology Map */}
          <div className="lg:col-span-7 bg-[#FFFFFF] rounded-2xl border border-[#2B2D42]/10 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#2B2D42]/10 pb-3 text-xs font-mono">
              <span className="font-bold text-[#0B2545] uppercase">Interactive Competency Network</span>
              <span className="text-[#2B2D42]/60">Select node to inspect telemetry</span>
            </div>

            {/* Hub and Branch Visual Array */}
            <div className="space-y-4">
              {/* Central Framework Core Node */}
              <div className="bg-[#0B2545] text-[#FFFFFF] p-4 rounded-xl shadow-md border border-[#0B2545] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-[#1F7A8C] flex items-center justify-center text-[#FFFFFF]">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider block font-bold">Framework Root</span>
                    <h3 className="text-sm font-bold text-[#FFFFFF]">OFFICIAL STATISTICS ARCHITECTURE</h3>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#FFFFFF]/70 hidden sm:inline">7 Mapped Domains</span>
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
                        "p-4 rounded-xl border transition-all cursor-pointer text-left relative",
                        isSelected
                          ? "border-[#1F7A8C] bg-[#1F7A8C]/5 shadow-sm ring-2 ring-[#1F7A8C]/20"
                          : "border-[#2B2D42]/10 hover:border-[#1F7A8C]/60 bg-[#FFFFFF]"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold uppercase text-[#2B2D42]/60">
                          {comp.domain}
                        </span>
                        {isMet ? (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#2E7D32]/10 text-[#2E7D32] border border-[#2E7D32]/30 font-mono">
                            Target Met
                          </span>
                        ) : (
                          <span className={cn(
                            "text-[9px] font-bold px-2 py-0.5 rounded-full border font-mono",
                            isCritical 
                              ? "bg-[#D4AF37]/15 text-[#0B2545] border-[#D4AF37]/40" 
                              : "bg-[#1F7A8C]/10 text-[#1F7A8C] border-[#1F7A8C]/20"
                          )}>
                            -{comp.gap}% Gap
                          </span>
                        )}
                      </div>

                      <h4 className={cn("text-xs font-bold transition-colors leading-tight mb-2", isSelected ? "text-[#1F7A8C]" : "text-[#0B2545]")}>
                        {comp.name}
                      </h4>

                      {/* Score track */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-[#2B2D42]/70">
                          <span>Current: <strong className="text-[#0B2545]">{comp.current}%</strong></span>
                          <span>Target: {comp.target}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#2B2D42]/10 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full transition-all duration-700", isMet ? "bg-[#2E7D32]" : isCritical ? "bg-[#D4AF37]" : "bg-[#1F7A8C]")}
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
          <div className="lg:col-span-5 bg-[#FFFFFF] rounded-2xl border border-[#2B2D42]/10 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#2B2D42]/10 pb-3">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#1F7A8C] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Contextual Diagnosis Inspector</span>
              </div>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full font-mono",
                selectedCompetency.gap > 0 ? "bg-[#D4AF37]/15 text-[#0B2545] border border-[#D4AF37]/30" : "bg-[#2E7D32]/10 text-[#2E7D32] border border-[#2E7D32]/30"
              )}>
                {selectedCompetency.priority} PRIORITY
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono text-[#1F7A8C] font-semibold">{selectedCompetency.domain}</span>
              <h3 className="text-2xl font-bold text-[#0B2545]">{selectedCompetency.name}</h3>
              <p className="text-xs text-[#2B2D42]/80 leading-relaxed pt-1">
                {selectedCompetency.description}
              </p>
            </div>

            {/* Metrics Triad */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-[#F4F6F9] rounded-xl border border-[#2B2D42]/10">
                <span className="text-[9px] font-mono text-[#2B2D42]/60 uppercase font-bold block">Current Level</span>
                <span className="text-xl font-bold text-[#0B2545] font-mono mt-0.5 block">{selectedCompetency.current}%</span>
              </div>
              <div className="p-3 bg-[#1F7A8C]/10 rounded-xl border border-[#1F7A8C]/20">
                <span className="text-[9px] font-mono text-[#1F7A8C] uppercase font-bold block">Role Target</span>
                <span className="text-xl font-bold text-[#1F7A8C] font-mono mt-0.5 block">{selectedCompetency.target}%</span>
              </div>
              <div className={cn(
                "p-3 rounded-xl border",
                selectedCompetency.gap > 0 ? "bg-[#D4AF37]/15 border-[#D4AF37]/30" : "bg-[#2E7D32]/10 border-[#2E7D32]/30"
              )}>
                <span className="text-[9px] font-mono text-[#2B2D42]/60 uppercase font-bold block">Deficit</span>
                <span className={cn(
                  "text-xl font-bold font-mono mt-0.5 block",
                  selectedCompetency.gap > 0 ? "text-[#0B2545]" : "text-[#2E7D32]"
                )}>
                  {selectedCompetency.gap > 0 ? `-${selectedCompetency.gap}%` : '0%'}
                </span>
              </div>
            </div>

            {/* Root Dependency & Recommended Action Callout */}
            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-xl bg-[#F4F6F9] border border-[#2B2D42]/10 space-y-1 text-xs">
                <span className="font-mono font-bold text-[#0B2545] text-[10px] uppercase block">
                  Root Prerequisite Dependency //
                </span>
                <p className="text-[#2B2D42] font-medium leading-snug">
                  {selectedCompetency.rootDependency}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#1F7A8C]/5 border border-[#1F7A8C]/20 space-y-1 text-xs">
                <span className="font-mono font-bold text-[#1F7A8C] text-[10px] uppercase block">
                  Recommended Intervention //
                </span>
                <p className="text-[#0B2545] font-semibold leading-snug">
                  {selectedCompetency.recommendedAction}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link to="/login">
                <Button className="w-full bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-bold text-xs shadow-xs h-10">
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
