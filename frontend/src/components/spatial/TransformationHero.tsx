import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Layers, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function TransformationHero() {
  const [transformationState, setTransformationState] = useState<'before' | 'diagnosing' | 'after'>('before');

  const triggerSimulation = () => {
    setTransformationState('diagnosing');
    setTimeout(() => {
      setTransformationState('after');
    }, 1800);
  };

  const resetSimulation = () => {
    setTransformationState('before');
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Transformation Control Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[#FFFFFF] rounded-2xl border border-[#2B2D42]/10 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#1F7A8C] flex items-center justify-center text-[#FFFFFF] font-bold shadow-xs">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-[#1F7A8C] uppercase tracking-wider block">Interactive Simulation</span>
            <span className="text-sm font-bold text-[#0B2545]">The Competency Transformation Engine</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTransformationState('before')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              transformationState === 'before' 
                ? "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30" 
                : "text-[#2B2D42]/60 hover:bg-[#F4F6F9] hover:text-[#2B2D42]"
            )}
          >
            1. Uncalibrated State
          </button>
          <ArrowRight className="w-3.5 h-3.5 text-[#2B2D42]/40" />
          <button
            onClick={() => setTransformationState('diagnosing')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              transformationState === 'diagnosing' 
                ? "bg-[#1F7A8C]/15 text-[#1F7A8C] border border-[#1F7A8C]/30 animate-pulse" 
                : "text-[#2B2D42]/60 hover:bg-[#F4F6F9] hover:text-[#2B2D42]"
            )}
          >
            2. AI Diagnosis & Path
          </button>
          <ArrowRight className="w-3.5 h-3.5 text-[#2B2D42]/40" />
          <button
            onClick={() => setTransformationState('after')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              transformationState === 'after' 
                ? "bg-[#2E7D32]/15 text-[#2E7D32] border border-[#2E7D32]/30" 
                : "text-[#2B2D42]/60 hover:bg-[#F4F6F9] hover:text-[#2B2D42]"
            )}
          >
            3. Verified Capability
          </button>
        </div>

        <div>
          {transformationState === 'before' ? (
            <Button 
              size="sm" 
              onClick={triggerSimulation}
              className="bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-bold shadow-xs text-xs px-4"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Run AI Closed-Loop
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="outline"
              onClick={resetSimulation}
              className="border-[#2B2D42]/20 text-[#2B2D42] hover:bg-[#F4F6F9] text-xs px-3"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reset View
            </Button>
          )}
        </div>
      </div>

      {/* Main Transformation Canvas Simulation */}
      <div className="relative bg-[#FFFFFF] rounded-3xl border border-[#2B2D42]/10 p-6 sm:p-10 shadow-sm overflow-hidden min-h-[460px] flex flex-col justify-between">
        {/* State 1: BEFORE */}
        {transformationState === 'before' && (
          <div className="space-y-8 animate-in fade-in duration-300 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2B2D42]/10 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30">
                  DIAGNOSTIC STATE: UNCALIBRATED & VULNERABLE
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-[#0B2545] mt-2">
                  Hidden Prerequisite Deficits in Survey Operations
                </h3>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-[#0B2545] font-mono">51.2%</span>
                <span className="text-xs text-[#2B2D42]/60 block font-mono">Baseline Readiness</span>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#F4F6F9] border border-[#2B2D42]/10 shadow-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-[#0B2545]">Sampling Techniques</span>
                  <span className="text-[11px] font-bold text-[#D4AF37] font-mono bg-[#D4AF37]/15 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                    48% (-22% Priority Gap)
                  </span>
                </div>
                <div className="h-2 w-full bg-[#2B2D42]/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1F7A8C] rounded-full w-[48%]" />
                </div>
                <p className="text-[11px] text-[#2B2D42]/70">Repeated failures on Neyman allocation and stratified cluster weights.</p>
              </div>

              <div className="p-4 rounded-xl bg-[#F4F6F9] border border-[#2B2D42]/10 shadow-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-[#0B2545]">Survey Methodology</span>
                  <span className="text-[11px] font-bold text-[#D4AF37] font-mono bg-[#D4AF37]/15 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                    51% (-24% Needs Attention)
                  </span>
                </div>
                <div className="h-2 w-full bg-[#2B2D42]/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1F7A8C] rounded-full w-[51%]" />
                </div>
                <p className="text-[11px] text-[#2B2D42]/70">Struggling with non-response imputation methods during field audits.</p>
              </div>

              <div className="p-4 rounded-xl bg-[#F4F6F9] border border-[#2B2D42]/10 shadow-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-[#0B2545]">Statistical Methods</span>
                  <span className="text-[11px] font-bold text-[#2E7D32] font-mono bg-[#2E7D32]/10 px-2 py-0.5 rounded border border-[#2E7D32]/30">
                    86% (Strong)
                  </span>
                </div>
                <div className="h-2 w-full bg-[#2B2D42]/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1F7A8C] rounded-full w-[86%]" />
                </div>
                <p className="text-[11px] text-[#2B2D42]/70">Solid descriptive statistics baseline, but untranslated to applied surveys.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F4F6F9] border border-[#2B2D42]/10 flex items-center justify-between text-xs text-[#2B2D42]">
              <span className="flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-[#D4AF37] shrink-0" />
                Generic training assigns 40 hours of broad courses without addressing the actual sampling calculation bottleneck.
              </span>
              <Button size="sm" onClick={triggerSimulation} className="bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-bold text-xs shrink-0 ml-3 shadow-xs">
                Apply SmartLearn AI Loop <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* State 2: DIAGNOSING (ACTIVE STREAM) */}
        {transformationState === 'diagnosing' && (
          <div className="space-y-8 animate-in fade-in duration-300 relative z-10 flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-3xl bg-[#0B2545] flex items-center justify-center text-[#FFFFFF] shadow-md animate-spin">
              <Brain className="w-8 h-8" />
            </div>
            
            <div className="space-y-2 max-w-md">
              <h3 className="text-2xl font-bold text-[#0B2545]">Synthesizing Closed-Loop Solution...</h3>
              <p className="text-xs text-[#2B2D42]/70 leading-relaxed">
                1. Parsing assessment telemetry → 2. Tracing prerequisite graph → 3. Formulating iGOT tailored module sequence.
              </p>
            </div>

            <div className="flex gap-2 font-mono text-[11px] font-bold text-[#1F7A8C]">
              <span className="animate-pulse">Optimizing Curriculum...</span>
            </div>
          </div>
        )}

        {/* State 3: AFTER */}
        {transformationState === 'after' && (
          <div className="space-y-8 animate-in fade-in duration-300 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2B2D42]/10 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#2E7D32] uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#2E7D32]/10 border border-[#2E7D32]/30">
                  TRANSFORMED STATE: CERTIFIED OFFICIAL READINESS
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-[#0B2545] mt-2">
                  Closed Gaps via Targeted iGOT Learning & Reassessment
                </h3>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-[#2E7D32] font-mono">84.8%</span>
                <span className="text-xs text-[#2E7D32] font-bold block font-mono">+33.6% Verified Growth</span>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#F4F6F9] border border-[#2B2D42]/10 shadow-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-[#0B2545]">Sampling Techniques</span>
                  <span className="text-[11px] font-bold text-[#2E7D32] font-mono bg-[#2E7D32]/10 px-2 py-0.5 rounded border border-[#2E7D32]/20">
                    82% (Strong)
                  </span>
                </div>
                <div className="h-2 w-full bg-[#2B2D42]/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1F7A8C] rounded-full w-[82%]" />
                </div>
                <p className="text-[11px] text-[#2B2D42]/70">Mastered after 6-hour targeted iGOT module & verified via 5 adaptive MCQs.</p>
              </div>

              <div className="p-4 rounded-xl bg-[#F4F6F9] border border-[#2B2D42]/10 shadow-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-[#0B2545]">Survey Methodology</span>
                  <span className="text-[11px] font-bold text-[#2E7D32] font-mono bg-[#2E7D32]/10 px-2 py-0.5 rounded border border-[#2E7D32]/20">
                    86% (Strong)
                  </span>
                </div>
                <div className="h-2 w-full bg-[#2B2D42]/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1F7A8C] rounded-full w-[86%]" />
                </div>
                <p className="text-[11px] text-[#2B2D42]/70">Prerequisite unblocked; field imputation accuracy validated at standard.</p>
              </div>

              <div className="p-4 rounded-xl bg-[#F4F6F9] border border-[#2B2D42]/10 shadow-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-[#0B2545]">Statistical Methods</span>
                  <span className="text-[11px] font-bold text-[#2E7D32] font-mono bg-[#2E7D32]/10 px-2 py-0.5 rounded border border-[#2E7D32]/20">
                    88% (Strong)
                  </span>
                </div>
                <div className="h-2 w-full bg-[#2B2D42]/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1F7A8C] rounded-full w-[88%]" />
                </div>
                <p className="text-[11px] text-[#2B2D42]/70">Maintained high mastery with zero redundant re-teaching required.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F4F6F9] border border-[#2B2D42]/10 flex items-center justify-between text-xs text-[#2B2D42]">
              <span className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
                Proven closed-loop transformation: Saved 26 training hours per officer while guaranteeing role benchmark fulfillment.
              </span>
              <Link to="/login">
                <Button size="sm" className="bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-bold text-xs shrink-0 ml-3 shadow-xs">
                  Experience Platform <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
