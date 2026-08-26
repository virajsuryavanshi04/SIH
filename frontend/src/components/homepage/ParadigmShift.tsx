import React from 'react';
import { Layers, ArrowRight, CheckCircle2, XCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ParadigmShift() {
  const oldModelPoints = [
    { label: 'Broadcast Training', desc: 'All officers receive identical multi-week courses regardless of prior knowledge.' },
    { label: 'Zero Prerequisite Tracing', desc: 'Treats downstream symptoms rather than isolating foundational gaps.' },
    { label: 'Completion As Proxy', desc: 'Measures hours watched or attendance rather than verified mastery.' },
    { label: 'Uncertain Readiness', desc: 'No mathematical proof that statistical release accuracy will improve.' }
  ];

  const smartLearnPoints = [
    { label: 'Adaptive Diagnosis', desc: 'Evaluates cognitive proficiency from official manuals and confidence telemetry.' },
    { label: 'Root-Cause Isolation', desc: 'Isolates upstream mathematical prerequisites (e.g. variance weighting).' },
    { label: 'Targeted Curriculum (iGOT)', desc: 'Waives mastered units to focus 100% of study time on diagnosed bottlenecks.' },
    { label: 'Verified Capability Growth', desc: 'Measures post-training delta (e.g. +33pts) to certify role readiness.' }
  ];

  return (
    <section id="paradigm-shift" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[#2B2D42]/10 bg-[#FFFFFF] relative">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-[#1F7A8C] uppercase tracking-widest">
            <Layers className="w-3.5 h-3.5" />
            <span>THE PARADIGM SHIFT</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B2545] tracking-tight">
            From generalized training to evidence-driven capability building.
          </h2>
          <p className="text-sm sm:text-base text-[#2B2D42]/80 leading-relaxed font-normal">
            Why traditional corporate LMS architectures fail official statistical systems, and how SmartLearn closes the loop.
          </p>
        </div>

        {/* Visual Split Flow Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {/* Old Model Column */}
          <div className="p-8 rounded-2xl bg-[#F4F6F9] border border-[#2B2D42]/15 space-y-6">
            <div className="flex items-center justify-between border-b border-[#2B2D42]/10 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#2B2D42]/60 uppercase block">Conventional Model</span>
                <h3 className="text-xl font-bold text-[#0B2545]">Standard Broadcast LMS</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#2B2D42]/10 text-[#2B2D42] text-[10px] font-mono font-bold">
                Hours-Based
              </span>
            </div>

            <div className="space-y-4">
              {oldModelPoints.map((pt, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-lg bg-[#2B2D42]/10 text-[#2B2D42]/60 flex items-center justify-center shrink-0 mt-0.5">
                    <XCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0B2545]">{pt.label}</h4>
                    <p className="text-xs text-[#2B2D42]/70 leading-relaxed mt-0.5">{pt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SmartLearn Model Column */}
          <div className="p-8 rounded-2xl bg-[#0B2545] text-[#FFFFFF] border border-[#0B2545] space-y-6 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#FFFFFF]/10 pb-4 relative z-10">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase block">SmartLearn Closed Loop</span>
                <h3 className="text-xl font-bold text-[#FFFFFF]">Competency Intelligence Layer</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#1F7A8C] text-[#FFFFFF] text-[10px] font-mono font-bold">
                Capability-Proven
              </span>
            </div>

            <div className="space-y-4 relative z-10">
              {smartLearnPoints.map((pt, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-lg bg-[#2E7D32]/20 text-[#2E7D32] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#FFFFFF]">{pt.label}</h4>
                    <p className="text-xs text-[#FFFFFF]/80 leading-relaxed mt-0.5">{pt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
