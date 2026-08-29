import React, { useState } from 'react';
import { AI_DIAGNOSIS_SAMPLE } from '@/data/homepageDemoData';
import { Brain, Sparkles, AlertTriangle, ShieldCheck, ChevronRight, CheckCircle2, FileText, ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function AIDiagnosisFlow() {
  const [selectedEvidence, setSelectedEvidence] = useState<number>(0);

  const inputSignals = [
    { label: 'Assessment Results', value: '14 Items Answered', tag: 'Telemetry' },
    { label: 'Role Requirements', value: 'Statistical Officer (L2)', tag: 'Benchmark' },
    { label: 'Confidence Signals', value: 'Metacognitive Calibration', tag: 'Psychometrics' },
    { label: 'Prerequisite Graph', value: 'Variance Weighting Path', tag: 'Topology' }
  ];

  return (
    <section id="ai-diagnosis" className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[#292B2B]/10 bg-[#FFFDF9] relative">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="space-y-3 max-w-3xl text-left">
          <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-[#A85D4C] uppercase tracking-widest">
            <Brain className="w-3.5 h-3.5" />
            <span>EXPLAINABLE AI DIAGNOSTICS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2D3030] tracking-tight">
            AI doesn't just tell you what is weak. It explains why.
          </h2>
          <p className="text-sm sm:text-base text-[#292B2B]/80 leading-relaxed font-normal">
            No black boxes. SmartLearn correlates item-level error patterns, confidence calibration, and prerequisite hierarchies to isolate the exact mathematical root of each learning gap.
          </p>
        </div>

        {/* The Explainability Synthesis Engine Display */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Input Telemetry Stream */}
          <div className="lg:col-span-4 bg-[#EFEBE4] rounded-2xl border border-[#292B2B]/10 p-6 space-y-4 text-left flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase font-bold text-[#292B2B]/60 block">
                01 // Ingested Assessment Telemetry
              </span>
              <div className="p-3 bg-[#FFFDF9] rounded-xl border border-[#292B2B]/10 space-y-1">
                <span className="text-[10px] font-mono text-[#A85D4C] font-bold">Officer Profile</span>
                <h4 className="text-sm font-bold text-[#2D3030]">{AI_DIAGNOSIS_SAMPLE.officerRole}</h4>
                <p className="text-xs text-[#292B2B]/70 font-mono">Baseline Readiness: <strong>{AI_DIAGNOSIS_SAMPLE.baselineReadiness}</strong></p>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-mono font-bold text-[#2D3030] uppercase block">Signal Pipeline:</span>
                {inputSignals.map((sig, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-[#FFFDF9] border border-[#292B2B]/10 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#2D3030]">{sig.label}</p>
                      <p className="text-[10px] text-[#292B2B]/60 font-mono">{sig.value}</p>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#EFEBE4] text-[#A85D4C] font-bold border border-[#292B2B]/10">
                      {sig.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Downward Flow Indicator */}
            <div className="p-3 rounded-xl bg-[#2D3030] text-[#FFFDF9] text-xs font-mono flex items-center justify-between">
              <span>Feed to Inference Engine</span>
              <ArrowRight className="w-4 h-4 text-[#B38A3D]" />
            </div>
          </div>

          {/* Right: AI Synthesis & Root Cause Proof Container */}
          <div className="lg:col-span-8 bg-[#FFFDF9] rounded-2xl border border-[#292B2B]/15 p-6 sm:p-8 shadow-sm space-y-6 text-left flex flex-col justify-between">
            {/* Header with Diagnosed Root Gap */}
            <div className="border-b border-[#292B2B]/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#B38A3D] block">
                  02 // Algorithmic Root Cause Isolated
                </span>
                <h3 className="text-2xl font-bold text-[#2D3030]">
                  {AI_DIAGNOSIS_SAMPLE.rootGap}
                </h3>
              </div>
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#B38A3D]/15 border border-[#B38A3D]/30 text-xs font-mono font-bold text-[#2D3030]">
                <AlertTriangle className="w-4 h-4 text-[#B38A3D]" />
                <span>-{AI_DIAGNOSIS_SAMPLE.gapPoints} pts below role threshold</span>
              </div>
            </div>

            {/* Evidence Breakdown List */}
            <div className="space-y-3">
              <span className="text-xs font-mono font-bold text-[#2D3030] uppercase">
                Zero-Black-Box Evidence Trail:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AI_DIAGNOSIS_SAMPLE.evidencePoints.map((ev, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedEvidence(index)}
                    className={cn(
                      "p-3.5 rounded-xl border transition-all cursor-pointer space-y-1 text-xs",
                      selectedEvidence === index
                        ? "border-[#A85D4C] bg-[#A85D4C]/5 ring-1 ring-[#A85D4C]/20 shadow-xs"
                        : "border-[#292B2B]/10 hover:border-[#A85D4C]/40 bg-[#EFEBE4]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#2D3030] font-mono text-[11px]">{ev.title}</span>
                      <CheckCircle2 className={cn("w-3.5 h-3.5", selectedEvidence === index ? "text-[#A85D4C]" : "text-[#292B2B]/30")} />
                    </div>
                    <p className="text-[#292B2B]/80 leading-relaxed text-[11px] pt-1">
                      {ev.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actionable Intervention Box */}
            <div className="p-4 rounded-xl bg-[#EFEBE4] border border-[#A85D4C]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-[#A85D4C] uppercase block">
                  Prescribed Targeted Intervention //
                </span>
                <p className="font-bold text-xs text-[#2D3030]">
                  {AI_DIAGNOSIS_SAMPLE.recommendedIntervention.title}
                </p>
                <p className="text-[11px] font-mono text-[#292B2B]/60">
                  Code: {AI_DIAGNOSIS_SAMPLE.recommendedIntervention.code} • Duration: {AI_DIAGNOSIS_SAMPLE.recommendedIntervention.duration}
                </p>
              </div>

              <Link to="/login" className="shrink-0">
                <Button className="bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9] font-bold text-xs shadow-xs h-9">
                  Inspect Diagnostics <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
