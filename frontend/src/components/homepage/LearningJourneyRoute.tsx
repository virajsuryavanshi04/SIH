import React, { useState } from 'react';
import { LEARNING_JOURNEY_STEPS, IGOT_RECOMMENDATIONS } from '@/data/homepageDemoData';
import { Route, CheckCircle2, Clock, FastForward, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function LearningJourneyRoute() {
  return (
    <section id="learning-journey" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-[#D8E5EC] bg-[#FFFFFF] relative">
      <div className="max-w-[1440px] mx-auto space-y-8 sm:space-y-10 text-left">
        {/* Section Header */}
        <div className="space-y-2.5 max-w-3xl">
          <span className="text-xs font-semibold text-[#176B87] uppercase tracking-widest block">
            ADAPTIVE LEARNING & iGOT PATHWAY
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#123047] tracking-tight leading-tight">
            Targeted learning paths mapped to national curricula.
          </h2>
          <p className="text-base sm:text-[17px] text-[#5D7180] leading-[1.6] font-normal">
            No generic course catalogs. SmartLearn waives mastered prerequisites and pairs diagnosed gaps directly with accredited iGOT Karmayogi modules.
          </p>
        </div>

        {/* Stepper Route & iGOT Courses Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Adaptive Stepper Route */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between px-1 text-xs font-mono text-[#5D7180] pb-1">
              <span className="font-bold text-[#123047]">Recommended Learning Sequence</span>
              <span>Estimated: <strong>1h 40m</strong> (1 Module Waived)</span>
            </div>

            <div className="space-y-3">
              {LEARNING_JOURNEY_STEPS.map((step) => {
                const isCompleted = step.status === 'completed';
                const isWaived = step.status === 'waived';
                const isCurrent = step.status === 'current';

                return (
                  <div
                    key={step.step}
                    className="p-3.5 rounded-xl border border-[#D8E5EC] bg-[#FFFFFF] hover:border-[#176B87] hover:bg-[#176B87]/5 hover:shadow-xs transition-all duration-150 cursor-default flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0",
                        isCompleted 
                          ? "bg-[#2E8B57]/10 text-[#2E8B57] border border-[#2E8B57]/30"
                          : isWaived
                          ? "bg-[#D8E5EC]/60 text-[#5D7180]"
                          : isCurrent
                          ? "bg-[#176B87] text-[#FFFFFF]"
                          : "bg-[#EAF3F7] text-[#5D7180]"
                      )}>
                        {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : isWaived ? <FastForward className="w-3.5 h-3.5" /> : step.step}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-[#123047] group-hover:text-[#176B87] transition-colors">
                            {step.title}
                          </h4>
                          <span className={cn(
                            "text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border",
                            isWaived 
                              ? "bg-[#D8E5EC]/50 text-[#5D7180] border-[#D8E5EC]"
                              : isCurrent
                              ? "bg-[#D49A2A]/15 text-[#123047] border-[#D49A2A]/30"
                              : "bg-[#EAF3F7] text-[#5D7180] border-[#D8E5EC]"
                          )}>
                            {step.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5D7180] mt-0.5">{step.note}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono text-[11px] text-[#5D7180]">
                      {step.duration}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Curated iGOT Recommendations */}
          <div className="lg:col-span-5 bg-[#F4F8FB] rounded-2xl border border-[#D8E5EC] p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#D8E5EC] pb-3">
              <span className="text-xs font-mono font-bold text-[#123047] uppercase">
                Matched iGOT Karmayogi Modules
              </span>
              <span className="text-[10px] font-mono text-[#176B87] font-bold">Official NSTI/MoSPI</span>
            </div>

            <div className="space-y-3">
              {IGOT_RECOMMENDATIONS.slice(0, 2).map((course, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#FFFFFF] border border-[#D8E5EC] space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#176B87]">
                      {course.competency}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#123047]">
                      {course.matchScore}% Match
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#123047] leading-snug">{course.title}</h4>
                  <p className="text-[11px] text-[#5D7180] leading-relaxed">"{course.reason}"</p>
                </div>
              ))}
            </div>

            <Link to="/courses" className="block pt-1">
              <Button className="w-full bg-[#176B87] hover:bg-[#176B87]/90 text-[#FFFFFF] text-[14px] font-semibold shadow-xs h-10 rounded-xl cursor-pointer">
                View Full Course Catalog <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
