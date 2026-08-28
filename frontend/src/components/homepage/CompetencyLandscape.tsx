import React, { useState } from 'react';
import { WORKFORCE_COMPETENCIES, CompetencyNodeData } from '@/data/homepageDemoData';
import { Brain, Compass, ArrowRight, Activity, AlertTriangle, CheckCircle2, Sparkles, BookOpen, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function CompetencyLandscape() {
  const [selectedCompetency, setSelectedCompetency] = useState<CompetencyNodeData>(WORKFORCE_COMPETENCIES[1]); // Default: Sampling Techniques

  return (
    <section id="competency-landscape" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[#123047]/10 bg-[#EAF3F7] relative">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="space-y-3 max-w-3xl text-left">
          <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-[#176B87] uppercase tracking-widest">
            <Compass className="w-3.5 h-3.5" />
            <span>THE WORKFORCE COMPETENCY LANDSCAPE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#123B5D] tracking-tight">
            Training should begin with evidence—not assumptions.
          </h2>
          <p className="text-sm sm:text-base text-[#123047]/80 leading-relaxed font-normal">
            Official statistics demands interconnected expertise. SmartLearn models competencies as an interdependent graph rather than disconnected courses, revealing exactly where knowledge bottlenecks form.
          </p>
        </div>

        {/* Centerpiece Interactive Topology & Contextual Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Interactive Radial & Network Topology Map */}
          <div className="lg:col-span-7 bg-[#FFFFFF] rounded-2xl border border-[#123047]/10 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#123047]/10 pb-3 text-xs font-mono">
              <span className="font-bold text-[#123B5D] uppercase">Interactive Competency Network</span>
              <span className="text-[#123047]/60">Select node to inspect telemetry</span>
            </div>

            {/* Hub and Branch Visual Array */}
            <div className="space-y-4">
              {/* Central Framework Core Node */}
              <div className="bg-[#123B5D] text-[#FFFFFF] p-4 rounded-xl shadow-md border border-[#123B5D] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-[#176B87] flex items-center justify-center text-[#FFFFFF]">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#D49A2A] uppercase tracking-wider block font-bold">Framework Root</span>
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
                          ? "border-[#176B87] bg-[#176B87]/5 shadow-sm ring-2 ring-[#176B87]/20"
                          : "border-[#123047]/10 hover:border-[#176B87]/60 bg-[#FFFFFF]"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold uppercase text-[#123047]/60">
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
                              ? "bg-[#D49A2A]/15 text-[#123B5D] border-[#D49A2A]/40" 
                              : "bg-[#176B87]/10 text-[#176B87] border-[#176B87]/20"
                          )}>
                            -{comp.gap}% Gap
                          </span>
                        )}
                      </div>

                      <h4 className={cn("text-xs font-bold transition-colors leading-tight mb-2", isSelected ? "text-[#176B87]" : "text-[#123B5D]")}>
                        {comp.name}
                      </h4>

                      {/* Score track */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-[#123047]/70">
                          <span>Current: <strong className="text-[#123B5D]">{comp.current}%</strong></span>
                          <span>Target: {comp.target}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#123047]/10 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full transition-all duration-700", isMet ? "bg-[#2E8B57]" : isCritical ? "bg-[#D49A2A]" : "bg-[#176B87]")}
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
          <div className="lg:col-span-5 bg-[#FFFFFF] rounded-2xl border border-[#123047]/10 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#123047]/10 pb-3">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#176B87] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Contextual Diagnosis Inspector</span>
              </div>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full font-mono",
                selectedCompetency.gap > 0 ? "bg-[#D49A2A]/15 text-[#123B5D] border border-[#D49A2A]/30" : "bg-[#2E8B57]/10 text-[#2E8B57] border border-[#2E8B57]/30"
              )}>
                {selectedCompetency.priority} PRIORITY
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono text-[#176B87] font-semibold">{selectedCompetency.domain}</span>
              <h3 className="text-2xl font-bold text-[#123B5D]">{selectedCompetency.name}</h3>
              <p className="text-xs text-[#123047]/80 leading-relaxed pt-1">
                {selectedCompetency.description}
              </p>
            </div>

            {/* Metrics Triad */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-[#EAF3F7] rounded-xl border border-[#123047]/10">
                <span className="text-[9px] font-mono text-[#123047]/60 uppercase font-bold block">Current Level</span>
                <span className="text-xl font-bold text-[#123B5D] font-mono mt-0.5 block">{selectedCompetency.current}%</span>
              </div>
              <div className="p-3 bg-[#176B87]/10 rounded-xl border border-[#176B87]/20">
                <span className="text-[9px] font-mono text-[#176B87] uppercase font-bold block">Role Target</span>
                <span className="text-xl font-bold text-[#176B87] font-mono mt-0.5 block">{selectedCompetency.target}%</span>
              </div>
              <div className={cn(
                "p-3 rounded-xl border",
                selectedCompetency.gap > 0 ? "bg-[#D49A2A]/15 border-[#D49A2A]/30" : "bg-[#2E8B57]/10 border-[#2E8B57]/30"
              )}>
                <span className="text-[9px] font-mono text-[#123047]/60 uppercase font-bold block">Deficit</span>
                <span className={cn(
                  "text-xl font-bold font-mono mt-0.5 block",
                  selectedCompetency.gap > 0 ? "text-[#123B5D]" : "text-[#2E8B57]"
                )}>
                  {selectedCompetency.gap > 0 ? `-${selectedCompetency.gap}%` : '0%'}
                </span>
              </div>
            </div>

            {/* Root Dependency & Recommended Action Callout */}
            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-xl bg-[#EAF3F7] border border-[#123047]/10 space-y-1 text-xs">
                <span className="font-mono font-bold text-[#123B5D] text-[10px] uppercase block">
                  Root Prerequisite Dependency //
                </span>
                <p className="text-[#123047] font-medium leading-snug">
                  {selectedCompetency.rootDependency}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#176B87]/5 border border-[#176B87]/20 space-y-1 text-xs">
                <span className="font-mono font-bold text-[#176B87] text-[10px] uppercase block">
                  Recommended Intervention //
                </span>
                <p className="text-[#123B5D] font-semibold leading-snug">
                  {selectedCompetency.recommendedAction}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link to="/login">
                <Button className="w-full bg-[#176B87] hover:bg-[#176B87]/90 text-[#FFFFFF] font-bold text-xs shadow-xs h-10">
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
