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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[#FFFDF9] rounded-2xl border border-[#292B2B]/10 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#A85D4C] flex items-center justify-center text-[#FFFDF9] font-bold shadow-xs">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-[#A85D4C] uppercase tracking-wider block">Interactive Simulation</span>
            <span className="text-sm font-bold text-[#2D3030]">The Competency Transformation Engine</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTransformationState('before')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              transformationState === 'before' 
                ? "bg-[#B38A3D]/15 text-[#B38A3D] border border-[#B38A3D]/30" 
                : "text-[#292B2B]/60 hover:bg-[#EFEBE4] hover:text-[#292B2B]"
            )}
          >
            1. Uncalibrated State
          </button>
          <ArrowRight className="w-3.5 h-3.5 text-[#292B2B]/40" />
          <button
            onClick={() => setTransformationState('diagnosing')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              transformationState === 'diagnosing' 
                ? "bg-[#A85D4C]/15 text-[#A85D4C] border border-[#A85D4C]/30 animate-pulse" 
                : "text-[#292B2B]/60 hover:bg-[#EFEBE4] hover:text-[#292B2B]"
            )}
          >
            2. AI Diagnosis & Path
          </button>
          <ArrowRight className="w-3.5 h-3.5 text-[#292B2B]/40" />
          <button
            onClick={() => setTransformationState('after')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              transformationState === 'after' 
                ? "bg-[#2E8B57]/15 text-[#2E8B57] border border-[#2E8B57]/30" 
                : "text-[#292B2B]/60 hover:bg-[#EFEBE4] hover:text-[#292B2B]"
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
              className="bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9] font-bold shadow-xs text-xs px-4"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Run AI Closed-Loop
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="outline"
              onClick={resetSimulation}
              className="border-[#292B2B]/20 text-[#292B2B] hover:bg-[#EFEBE4] text-xs px-3"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reset View
            </Button>
          )}
        </div>
      </div>

      {/* Main Transformation Canvas Simulation */}
      <div className="relative bg-[#FFFDF9] rounded-3xl border border-[#292B2B]/10 p-6 sm:p-10 shadow-sm overflow-hidden min-h-[460px] flex flex-col justify-between">
        {/* State 1: BEFORE */}
        {transformationState === 'before' && (
          <div className="space-y-8 animate-in fade-in duration-300 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#292B2B]/10 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#B38A3D] uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#B38A3D]/15 border border-[#B38A3D]/30">
                  DIAGNOSTIC STATE: UNCALIBRATED & VULNERABLE
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-[#2D3030] mt-2">
                  Hidden Prerequisite Deficits in Survey Operations
                </h3>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-[#2D3030] font-mono">51.2%</span>
                <span className="text-xs text-[#292B2B]/60 block font-mono">Baseline Readiness</span>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#EFEBE4] border border-[#292B2B]/10 shadow-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-[#2D3030]">Sampling Techniques</span>
                  <span className="text-[11px] font-bold text-[#B38A3D] font-mono bg-[#B38A3D]/15 px-2 py-0.5 rounded border border-[#B38A3D]/30">
                    48% (-22% Priority Gap)
                  </span>
                </div>
                <div className="h-2 w-full bg-[#292B2B]/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#A85D4C] rounded-full w-[48%]" />
                </div>
                <p className="text-[11px] text-[#292B2B]/70">Repeated failures on Neyman allocation and stratified cluster weights.</p>
              </div>

              <div className="p-4 rounded-xl bg-[#EFEBE4] border border-[#292B2B]/10 shadow-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-[#2D3030]">Survey Methodology</span>
                  <span className="text-[11px] font-bold text-[#B38A3D] font-mono bg-[#B38A3D]/15 px-2 py-0.5 rounded border border-[#B38A3D]/30">
                    51% (-24% Needs Attention)
                  </span>
                </div>
                <div className="h-2 w-full bg-[#292B2B]/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#A85D4C] rounded-full w-[51%]" />
                </div>
                <p className="text-[11px] text-[#292B2B]/70">Struggling with non-response imputation methods during field audits.</p>
              </div>

              <div className="p-4 rounded-xl bg-[#EFEBE4] border border-[#292B2B]/10 shadow-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-[#2D3030]">Statistical Methods</span>
                  <span className="text-[11px] font-bold text-[#2E8B57] font-mono bg-[#2E8B57]/10 px-2 py-0.5 rounded border border-[#2E8B57]/30">
                    86% (Strong)
                  </span>
                </div>
                <div className="h-2 w-full bg-[#292B2B]/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#A85D4C] rounded-full w-[86%]" />
                </div>
                <p className="text-[11px] text-[#292B2B]/70">Solid descriptive statistics baseline, but untranslated to applied surveys.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#EFEBE4] border border-[#292B2B]/10 flex items-center justify-between text-xs text-[#292B2B]">
              <span className="flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-[#B38A3D] shrink-0" />
                Generic training assigns 40 hours of broad courses without addressing the actual sampling calculation bottleneck.
              </span>
              <Button size="sm" onClick={triggerSimulation} className="bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9] font-bold text-xs shrink-0 ml-3 shadow-xs">
                Apply SmartLearn AI Loop <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* State 2: DIAGNOSING (ACTIVE STREAM) */}
        {transformationState === 'diagnosing' && (
          <div className="space-y-8 animate-in fade-in duration-300 relative z-10 flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-3xl bg-[#2D3030] flex items-center justify-center text-[#FFFDF9] shadow-md animate-spin">
              <Brain className="w-8 h-8" />
            </div>
            
            <div className="space-y-2 max-w-md">
              <h3 className="text-2xl font-bold text-[#2D3030]">Synthesizing Closed-Loop Solution...</h3>
              <p className="text-xs text-[#292B2B]/70 leading-relaxed">
                1. Parsing assessment telemetry → 2. Tracing prerequisite graph → 3. Formulating iGOT tailored module sequence.
              </p>
            </div>

            <div className="flex gap-2 font-mono text-[11px] font-bold text-[#A85D4C]">
              <span className="animate-pulse">Optimizing Curriculum...</span>
            </div>
          </div>
        )}

        {/* State 3: AFTER */}
        {transformationState === 'after' && (
          <div className="space-y-8 animate-in fade-in duration-300 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#292B2B]/10 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#2E8B57] uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#2E8B57]/10 border border-[#2E8B57]/30">
                  TRANSFORMED STATE: CERTIFIED OFFICIAL READINESS
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-[#2D3030] mt-2">
                  Closed Gaps via Targeted iGOT Learning & Reassessment
                </h3>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-[#2E8B57] font-mono">84.8%</span>
                <span className="text-xs text-[#2E8B57] font-bold block font-mono">+33.6% Verified Growth</span>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#EFEBE4] border border-[#292B2B]/10 shadow-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-[#2D3030]">Sampling Techniques</span>
                  <span className="text-[11px] font-bold text-[#2E8B57] font-mono bg-[#2E8B57]/10 px-2 py-0.5 rounded border border-[#2E8B57]/20">
                    82% (Strong)
                  </span>
                </div>
                <div className="h-2 w-full bg-[#292B2B]/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#A85D4C] rounded-full w-[82%]" />
                </div>
                <p className="text-[11px] text-[#292B2B]/70">Mastered after 6-hour targeted iGOT module & verified via 5 adaptive MCQs.</p>
              </div>

              <div className="p-4 rounded-xl bg-[#EFEBE4] border border-[#292B2B]/10 shadow-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-[#2D3030]">Survey Methodology</span>
                  <span className="text-[11px] font-bold text-[#2E8B57] font-mono bg-[#2E8B57]/10 px-2 py-0.5 rounded border border-[#2E8B57]/20">
                    86% (Strong)
                  </span>
                </div>
                <div className="h-2 w-full bg-[#292B2B]/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#A85D4C] rounded-full w-[86%]" />
                </div>
                <p className="text-[11px] text-[#292B2B]/70">Prerequisite unblocked; field imputation accuracy validated at standard.</p>
              </div>

              <div className="p-4 rounded-xl bg-[#EFEBE4] border border-[#292B2B]/10 shadow-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-[#2D3030]">Statistical Methods</span>
                  <span className="text-[11px] font-bold text-[#2E8B57] font-mono bg-[#2E8B57]/10 px-2 py-0.5 rounded border border-[#2E8B57]/20">
                    88% (Strong)
                  </span>
                </div>
                <div className="h-2 w-full bg-[#292B2B]/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#A85D4C] rounded-full w-[88%]" />
                </div>
                <p className="text-[11px] text-[#292B2B]/70">Maintained high mastery with zero redundant re-teaching required.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#EFEBE4] border border-[#292B2B]/10 flex items-center justify-between text-xs text-[#292B2B]">
              <span className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#2E8B57] shrink-0" />
                Proven closed-loop transformation: Saved 26 training hours per officer while guaranteeing role benchmark fulfillment.
              </span>
              <Link to="/login">
                <Button size="sm" className="bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9] font-bold text-xs shrink-0 ml-3 shadow-xs">
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
