import React from 'react';
import { IGOT_RECOMMENDATIONS } from '@/data/homepageDemoData';
import { Sparkles, ArrowRight, BookOpen, ShieldCheck, CheckCircle2, Award, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function IGOTBridge() {
  return (
    <section id="igot-bridge" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[#2B2D42]/10 bg-[#FFFFFF] relative">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 text-left">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-[#1F7A8C] uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>iGOT KARMAYOGI INTEGRATION</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B2545] tracking-tight">
              From diagnosis to the right learning.
            </h2>
            <p className="text-sm text-[#2B2D42]/80 leading-relaxed font-normal">
              SmartLearn bridges AI diagnostic findings directly into India's national capacity building infrastructure, pairing diagnosed deficits with accredited learning units.
            </p>
          </div>

          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#F4F6F9] border border-[#2B2D42]/15 text-xs font-mono text-[#2B2D42]/70 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#1F7A8C]" />
            <span>Illustrative iGOT recommendations</span>
          </div>
        </div>

        {/* Integration Conduit Pipeline Banner */}
        <div className="p-4 rounded-xl bg-[#0B2545] text-[#FFFFFF] border border-[#0B2545] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#D4AF37] font-bold">SMARTLEARN AI</span>
            <span className="text-[#FFFFFF]/40">→</span>
            <span className="text-[#FFFFFF]">COMPETENCY GAP</span>
            <span className="text-[#FFFFFF]/40">→</span>
            <span className="text-[#1F7A8C] font-bold">COURSE MATCHING</span>
            <span className="text-[#FFFFFF]/40">→</span>
            <span className="text-[#D4AF37] font-bold">iGOT KARMAYOGI</span>
            <span className="text-[#FFFFFF]/40">→</span>
            <span className="text-[#2E7D32] font-bold">TARGETED LEARNING</span>
          </div>
          <span className="text-[10px] text-[#FFFFFF]/70">Automated Pipeline</span>
        </div>

        {/* The 3 Curated Matched Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {IGOT_RECOMMENDATIONS.map((course, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#2B2D42]/10 shadow-xs hover:border-[#1F7A8C]/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Match Score & Competency Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#1F7A8C]/10 text-[#1F7A8C] border border-[#1F7A8C]/20">
                    {course.competency}
                  </span>
                  <div className="flex items-center space-x-1 text-xs font-mono font-bold text-[#0B2545]">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>{course.matchScore}% Match</span>
                  </div>
                </div>

                {/* Course Title */}
                <div>
                  <h3 className="text-base font-bold text-[#0B2545] leading-snug">
                    {course.title}
                  </h3>
                  <p className="text-[11px] font-mono text-[#2B2D42]/60 mt-1">
                    Provider: {course.provider}
                  </p>
                </div>

                {/* AI Match Rationale */}
                <div className="p-3 rounded-xl bg-[#F4F6F9] border border-[#2B2D42]/10 text-xs text-[#2B2D42] space-y-1">
                  <span className="font-mono font-bold text-[#1F7A8C] text-[10px] uppercase block">
                    AI Match Rationale //
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    "{course.reason}"
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-2 border-t border-[#2B2D42]/10 flex items-center justify-between text-xs font-mono">
                <span className="text-[#2B2D42]/70">{course.duration}</span>
                <Link to="/courses" className="text-[#1F7A8C] hover:underline font-bold flex items-center">
                  <span>Explore Course</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
