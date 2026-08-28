import React, { useState } from 'react';
import { LEARNING_JOURNEY_STEPS, IGOT_RECOMMENDATIONS } from '@/data/homepageDemoData';
import { Route, CheckCircle2, Clock, FastForward, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function LearningJourneyRoute() {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(2); // Default to active step (03)

  return (
    <section id="learning-journey" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[#123047]/10 bg-[#FFFFFF] relative">
      <div className="max-w-7xl mx-auto space-y-12 text-left">
        {/* Section Header */}
        <div className="space-y-2 max-w-3xl">
          <span className="text-xs font-mono font-bold text-[#176B87] uppercase tracking-widest block">
            ADAPTIVE LEARNING & iGOT PATHWAY
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#123B5D] tracking-tight">
            Targeted learning paths mapped to national curricula.
          </h2>
          <p className="text-sm sm:text-base text-[#123047]/80 leading-relaxed font-normal">
            No generic course catalogs. SmartLearn waives mastered prerequisites and pairs diagnosed gaps directly with accredited iGOT Karmayogi modules.
          </p>
        </div>

        {/* Stepper Route & iGOT Courses Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Adaptive Stepper Route */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between px-1 text-xs font-mono text-[#123047]/70 pb-1">
              <span className="font-bold text-[#123B5D]">Officer #26101 Sequence</span>
              <span>Estimated: <strong>1h 40m</strong> (1 Module Waived)</span>
            </div>

            <div className="space-y-3">
              {LEARNING_JOURNEY_STEPS.map((step, idx) => {
                const isSelected = activeStepIndex === idx;
                const isCompleted = step.status === 'completed';
                const isWaived = step.status === 'waived';
                const isCurrent = step.status === 'current';

                return (
                  <div
                    key={step.step}
                    onClick={() => setActiveStepIndex(idx)}
                    className={cn(
                      "p-3.5 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-3",
                      isSelected
                        ? "border-[#176B87] bg-[#176B87]/5 ring-1 ring-[#176B87]/30 shadow-2xs"
                        : "border-[#123047]/10 hover:border-[#176B87]/40 bg-[#FFFFFF]"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0",
                        isCompleted 
                          ? "bg-[#2E8B57]/10 text-[#2E8B57] border border-[#2E8B57]/30"
                          : isWaived
                          ? "bg-[#123047]/10 text-[#123047]/60"
                          : isCurrent
                          ? "bg-[#176B87] text-[#FFFFFF]"
                          : "bg-[#EAF3F7] text-[#123047]/60"
                      )}>
                        {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : isWaived ? <FastForward className="w-3.5 h-3.5" /> : step.step}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={cn("text-xs font-bold", isCurrent ? "text-[#176B87]" : "text-[#123B5D]")}>
                            {step.title}
                          </h4>
                          <span className={cn(
                            "text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border",
                            isWaived 
                              ? "bg-[#123047]/10 text-[#123047]/60 border-[#123047]/20"
                              : isCurrent
                              ? "bg-[#D49A2A]/15 text-[#123B5D] border-[#D49A2A]/30"
                              : "bg-[#EAF3F7] text-[#123047]/60 border-[#123047]/10"
                          )}>
                            {step.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#123047]/70 mt-0.5">{step.note}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono text-[11px] text-[#123047]/60">
                      {step.duration}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Curated iGOT Recommendations */}
          <div className="lg:col-span-5 bg-[#EAF3F7] rounded-2xl border border-[#123047]/10 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#123047]/10 pb-3">
              <span className="text-xs font-mono font-bold text-[#123B5D] uppercase">
                Matched iGOT Karmayogi Modules
              </span>
              <span className="text-[10px] font-mono text-[#176B87] font-bold">Official NSTI/MoSPI</span>
            </div>

            <div className="space-y-3">
              {IGOT_RECOMMENDATIONS.slice(0, 2).map((course, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#FFFFFF] border border-[#123047]/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#176B87]">
                      {course.competency}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#123B5D]">
                      {course.matchScore}% Match
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#123B5D] leading-snug">{course.title}</h4>
                  <p className="text-[11px] text-[#123047]/70 leading-relaxed">"{course.reason}"</p>
                </div>
              ))}
            </div>

            <Link to="/courses" className="block pt-1">
              <Button className="w-full bg-[#176B87] hover:bg-[#176B87]/90 text-[#FFFFFF] font-bold text-xs shadow-xs h-9">
                View Full Course Catalog <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
