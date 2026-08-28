import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, AlertTriangle, Brain, Sparkles, Compass, ShieldCheck, Activity, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GapEngineFlow() {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    {
      id: 1,
      tag: 'STAGE 01',
      title: 'Current State',
      metric: '51%',
      subtitle: 'Uncalibrated baseline deficit',
      description: 'Assessment telemetry identifies non-response variance miscalculations in field officers.',
      accent: 'border-[#D49A2A]',
      pill: 'bg-[#D49A2A]/15 text-[#123B5D] border-[#D49A2A]/30'
    },
    {
      id: 2,
      tag: 'STAGE 02',
      title: 'AI Diagnosis',
      metric: 'Root Cause',
      subtitle: '"Sampling Techniques" isolated',
      description: 'Explainable AI proves error is caused by upstream variance stratification deficits, not field execution.',
      accent: 'border-[#176B87]',
      pill: 'bg-[#176B87]/10 text-[#176B87] border-[#176B87]/20'
    },
    {
      id: 3,
      tag: 'STAGE 03',
      title: 'Personalized Path',
      metric: 'Curriculum',
      subtitle: 'Sampling → Survey → Validation',
      description: 'System automatically waives mastered general statistics, constructing a targeted 6-hour sequence.',
      accent: 'border-[#176B87]',
      pill: 'bg-[#176B87]/10 text-[#176B87] border-[#176B87]/20'
    },
    {
      id: 4,
      tag: 'STAGE 04',
      title: 'iGOT Karmayogi',
      metric: 'Integration',
      subtitle: 'Official national content',
      description: 'Links directly to MoSPI & NSTI accredited digital courseware with interactive tabulation labs.',
      accent: 'border-[#176B87]',
      pill: 'bg-[#176B87]/10 text-[#176B87] border-[#176B87]/20'
    },
    {
      id: 5,
      tag: 'STAGE 05',
      title: 'Reassessment',
      metric: '78% ✓',
      subtitle: 'Verified capability certified',
      description: 'Post-intervention quiz verifies +27% growth, automatically certifying the officer for survey clearance.',
      accent: 'border-[#2E8B57]',
      pill: 'bg-[#2E8B57]/10 text-[#2E8B57] border-[#2E8B57]/30'
    }
  ];

  return (
    <section id="gap-engine" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[#123047]/10 bg-[#FFFFFF] relative overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-[#176B87] uppercase tracking-widest">
            <Activity className="w-3.5 h-3.5" />
            <span>THE CLOSED-LOOP GAP ENGINE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#123B5D] tracking-tight">
            From competency gap to verified capability.
          </h2>
          <p className="text-sm sm:text-base text-[#123047]/80 leading-relaxed font-normal">
            A single continuous feedback pipeline that transforms raw diagnostic assessments into verified institutional capability.
          </p>
        </div>

        {/* Continuous Flowing Horizontal Pipeline Visual */}
        <div className="relative">
          {/* Background Continuous Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-8 right-8 h-1 bg-[#123047]/10 -translate-y-6 z-0" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
            {steps.map((s, index) => {
              const isSelected = activeStep === s.id;
              const isLast = index === steps.length - 1;

              return (
                <div
                  key={s.id}
                  onClick={() => setActiveStep(s.id)}
                  className={cn(
                    "p-5 rounded-2xl border transition-all duration-300 cursor-pointer text-left flex flex-col justify-between space-y-4 bg-[#FFFFFF]",
                    isSelected 
                      ? "ring-2 ring-[#176B87] border-[#176B87] shadow-md -translate-y-1" 
                      : "border-[#123047]/10 hover:border-[#176B87]/50 shadow-xs"
                  )}
                >
                  <div className="space-y-3">
                    {/* Header Pill & Step Number */}
                    <div className="flex items-center justify-between">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full font-mono border", s.pill)}>
                        {s.tag}
                      </span>
                      {isLast ? (
                        <CheckCircle2 className="w-4 h-4 text-[#2E8B57]" />
                      ) : (
                        <span className="text-xs font-mono font-bold text-[#123047]/40">#{s.id}</span>
                      )}
                    </div>

                    {/* Metric Headline */}
                    <div>
                      <span className={cn(
                        "text-2xl font-black font-mono tracking-tight block",
                        s.id === 1 ? "text-[#123B5D]" : s.id === 5 ? "text-[#2E8B57]" : "text-[#176B87]"
                      )}>
                        {s.metric}
                      </span>
                      <h4 className="text-xs font-bold text-[#123B5D] mt-0.5">{s.title}</h4>
                      <p className="text-[11px] font-mono text-[#123047]/60 mt-0.5">{s.subtitle}</p>
                    </div>
                  </div>

                  {/* Body description */}
                  <p className="text-xs text-[#123047]/80 leading-relaxed border-t border-[#123047]/10 pt-3">
                    {s.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Detail Banner Below Stream */}
        <div className="p-6 rounded-2xl bg-[#EAF3F7] border border-[#123047]/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-[#123B5D] text-[#FFFFFF] flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5 text-[#176B87]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#123B5D]">Adaptive Learning Loop in Action</h4>
              <p className="text-xs text-[#123047]/70">
                Step <strong>#{activeStep}: {steps[activeStep - 1].title}</strong> is active in this interactive preview.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-[#123B5D]">
            <span className="px-3 py-1 rounded-lg bg-[#FFFFFF] border border-[#123047]/10 font-bold">
              Efficiency: +14h Saved
            </span>
            <span className="px-3 py-1 rounded-lg bg-[#2E8B57]/10 text-[#2E8B57] border border-[#2E8B57]/20 font-bold">
              Outcome: +27% Lift
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
