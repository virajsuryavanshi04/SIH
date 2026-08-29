import React, { useState } from 'react';
import { LEARNING_JOURNEY_STEPS, IGOT_RECOMMENDATIONS } from '@/data/homepageDemoData';
import { Route, CheckCircle2, Clock, FastForward, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function LearningJourneyRoute() {
  return (
    <section id="learning-journey" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-[#E2DDD5] bg-[#FFFDF9] relative">
      <div className="max-w-[1440px] mx-auto space-y-8 sm:space-y-10 text-left">
        {/* Section Header */}
        <div className="space-y-2.5 max-w-3xl">
          <span className="text-xs font-semibold text-[#A85D4C] uppercase tracking-widest block">
            ADAPTIVE LEARNING & iGOT PATHWAY
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#292B2B] tracking-tight leading-tight">
            Targeted learning paths mapped to national curricula.
          </h2>
          <p className="text-base sm:text-[17px] text-[#7A756E] leading-[1.6] font-normal">
            No generic course catalogs. SmartLearn waives mastered prerequisites and pairs diagnosed gaps directly with accredited iGOT Karmayogi modules.
          </p>
        </div>

        {/* Stepper Route & iGOT Courses Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Adaptive Stepper Route */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between px-1 text-xs font-mono text-[#7A756E] pb-1">
              <span className="font-bold text-[#292B2B]">Recommended Learning Sequence</span>
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
                    className="p-3.5 rounded-xl border border-[#E2DDD5] bg-[#FFFDF9] hover:border-[#A85D4C] hover:bg-[#A85D4C]/5 hover:shadow-xs transition-all duration-150 cursor-default flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0",
                        isCompleted 
                          ? "bg-[#2E8B57]/10 text-[#2E8B57] border border-[#2E8B57]/30"
                          : isWaived
                          ? "bg-[#E2DDD5]/60 text-[#7A756E]"
                          : isCurrent
                          ? "bg-[#A85D4C] text-[#FFFDF9]"
                          : "bg-[#EFEBE4] text-[#7A756E]"
                      )}>
                        {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : isWaived ? <FastForward className="w-3.5 h-3.5" /> : step.step}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-[#292B2B] group-hover:text-[#7D4036] transition-colors">
                            {step.title}
                          </h4>
                          <span className={cn(
                            "text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border",
                            isWaived 
                              ? "bg-[#E2DDD5]/50 text-[#7A756E] border-[#E2DDD5]"
                              : isCurrent
                              ? "bg-[#B38A3D]/15 text-[#292B2B] border-[#B38A3D]/30"
                              : "bg-[#EFEBE4] text-[#7A756E] border-[#E2DDD5]"
                          )}>
                            {step.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7A756E] mt-0.5">{step.note}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono text-[11px] text-[#7A756E]">
                      {step.duration}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Curated iGOT Recommendations */}
          <div className="lg:col-span-5 bg-[#F7F4EE] rounded-2xl border border-[#E2DDD5] p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-3">
              <span className="text-xs font-mono font-bold text-[#292B2B] uppercase">
                Matched iGOT Karmayogi Modules
              </span>
              <span className="text-[10px] font-mono text-[#A85D4C] font-bold">Official NSTI/MoSPI</span>
            </div>

            <div className="space-y-3">
              {IGOT_RECOMMENDATIONS.slice(0, 2).map((course, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#FFFDF9] border border-[#E2DDD5] space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#A85D4C]">
                      {course.competency}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#292B2B]">
                      {course.matchScore}% Match
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#292B2B] leading-snug">{course.title}</h4>
                  <p className="text-[11px] text-[#7A756E] leading-relaxed">"{course.reason}"</p>
                </div>
              ))}
            </div>

            <Link to="/courses" className="block pt-1">
              <Button className="w-full bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9] text-[14px] font-semibold shadow-xs h-10 rounded-xl cursor-pointer">
                View Full Course Catalog <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
