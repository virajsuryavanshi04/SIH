import React, { useState } from 'react';
import { SpatialNode } from './CompetencyCanvas';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, X, ArrowRight, ShieldCheck, AlertTriangle, 
  BookOpen, CheckCircle2, ChevronRight, Activity, ExternalLink, RefreshCw 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Props {
  node: SpatialNode | null;
  onClose: () => void;
}

export default function DiagnosticInspector({ node, onClose }: Props) {
  const [disclosureStep, setDisclosureStep] = useState<1 | 2 | 3 | 4>(1);

  if (!node) return null;

  return (
    <div className="bg-[#FFFFFF] rounded-2xl border border-[#123047]/10 shadow-sm overflow-hidden flex flex-col transition-all duration-300">
      {/* Header Bar */}
      <div className="p-5 bg-[#FFFFFF] border-b border-[#123047]/10 flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-[#176B87]/10 text-[#176B87] border border-[#176B87]/20">
              Domain Inspector // {node.domain}
            </span>
            {node.gap > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full font-mono bg-[#D49A2A]/15 text-[#D49A2A] border border-[#D49A2A]/30">
                {node.priority === 'CRITICAL' ? 'CRITICAL GAP' : 'PRIORITY GAP'}
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-[#123B5D]">{node.name}</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#123047]/60 hover:text-[#123B5D] hover:bg-[#EAF3F7] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progressive Disclosure Interactive Stepper */}
      <div className="px-5 py-3 bg-[#EAF3F7] border-b border-[#123047]/10 flex items-center justify-between text-xs">
        <button 
          onClick={() => setDisclosureStep(1)}
          className={cn(
            "font-bold transition-colors pb-1 border-b-2 cursor-pointer",
            disclosureStep === 1 ? "border-[#176B87] text-[#176B87]" : "border-transparent text-[#123047]/60 hover:text-[#123B5D]"
          )}
        >
          1. Current Status
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-[#123047]/30" />
        <button 
          onClick={() => setDisclosureStep(2)}
          className={cn(
            "font-bold transition-colors pb-1 border-b-2 cursor-pointer",
            disclosureStep === 2 ? "border-[#176B87] text-[#176B87]" : "border-transparent text-[#123047]/60 hover:text-[#123B5D]"
          )}
        >
          2. Why It Matters
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-[#123047]/30" />
        <button 
          onClick={() => setDisclosureStep(3)}
          className={cn(
            "font-bold transition-colors pb-1 border-b-2 cursor-pointer",
            disclosureStep === 3 ? "border-[#176B87] text-[#176B87]" : "border-transparent text-[#123047]/60 hover:text-[#123B5D]"
          )}
        >
          3. Root Cause
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-[#123047]/30" />
        <button 
          onClick={() => setDisclosureStep(4)}
          className={cn(
            "font-bold transition-colors pb-1 border-b-2 cursor-pointer",
            disclosureStep === 4 ? "border-[#176B87] text-[#176B87]" : "border-transparent text-[#123047]/60 hover:text-[#123B5D]"
          )}
        >
          4. Action Path
        </button>
      </div>

      {/* Step Content Body */}
      <div className="p-6 space-y-6 flex-1 text-[#123047]">
        {/* STEP 1: WHAT MATTERS NOW */}
        {disclosureStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#123047]/10">
                <span className="text-[10px] font-mono uppercase text-[#123047]/60 font-bold block">Assessed</span>
                <span className="text-2xl font-black text-[#123B5D] mt-0.5 block font-mono">{node.score}%</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#176B87]/10 border border-[#176B87]/20">
                <span className="text-[10px] font-mono uppercase text-[#176B87] font-bold block">Target</span>
                <span className="text-2xl font-black text-[#176B87] mt-0.5 block font-mono">{node.required}%</span>
              </div>
              <div className={cn(
                "p-3.5 rounded-xl border",
                node.gap > 0 ? "bg-[#D49A2A]/15 border-[#D49A2A]/30" : "bg-[#2E8B57]/10 border-[#2E8B57]/20"
              )}>
                <span className="text-[10px] font-mono uppercase text-[#123047]/60 font-bold block">Deficit</span>
                <span className={cn(
                  "text-2xl font-black mt-0.5 block font-mono",
                  node.gap > 0 ? "text-[#D49A2A]" : "text-[#2E8B57]"
                )}>
                  {node.gap > 0 ? `-${node.gap}%` : "0%"}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#EAF3F7] border border-[#123047]/10 text-xs text-[#123047] leading-relaxed">
              <p>
                As a <strong>Statistical Officer</strong> in India's Official Statistical System, this competency is weighted heavily for national data publication clearances and field survey audits.
              </p>
            </div>

            <Button 
              onClick={() => setDisclosureStep(2)}
              className="w-full bg-[#176B87] hover:bg-[#176B87]/90 text-[#FFFFFF] font-bold shadow-xs cursor-pointer"
            >
              Investigate Evidence Behind Gap <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* STEP 2: WHY IT MATTERS (AI EVIDENCE) */}
        {disclosureStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#176B87] uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#176B87]" />
              <span>Assessment Telemetry Diagnostics</span>
            </div>

            <div className="p-4 rounded-xl bg-[#176B87]/10 border border-[#176B87]/20 text-xs text-[#123047] space-y-2.5">
              <p className="font-semibold text-[#123B5D]">Direct Evidence from Recent Question Responses:</p>
              <p className="leading-relaxed text-[#123047]">
                {node.diagnosisEvidence}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-[#123047]/10 space-y-2 text-xs">
              <div className="flex justify-between items-center text-[#123047]">
                <span>Cognitive Level Breakdown:</span>
                <span className="font-mono font-bold text-[#D49A2A]">Failed on 'Analyze' Level</span>
              </div>
              <div className="flex justify-between items-center text-[#123047]">
                <span>Confidence Calibration:</span>
                <span className="font-mono font-bold text-[#D49A2A]">Low confidence guessing detected</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDisclosureStep(1)} className="flex-1 border-[#123047]/20 text-[#123047]">
                Back
              </Button>
              <Button onClick={() => setDisclosureStep(3)} className="flex-1 bg-[#176B87] hover:bg-[#176B87]/90 text-[#FFFFFF] font-bold shadow-xs">
                Trace Root Cause <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: PREREQUISITE ROOT CAUSE */}
        {disclosureStep === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#176B87] uppercase tracking-wider">
              <Activity className="w-4 h-4 text-[#D49A2A]" />
              <span>Prerequisite Dependency Analysis</span>
            </div>

            <div className="p-4 rounded-xl bg-[#D49A2A]/15 border border-[#D49A2A]/30 text-xs text-[#123047] space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-[#123B5D]">
                <AlertTriangle className="w-4 h-4 text-[#D49A2A]" />
                Root Cause Origin:
              </p>
              <p className="leading-relaxed text-[#123047]">
                {node.prerequisiteWeakness || "This competency directly depends on foundational prerequisites. Strengthening upstream concepts resolves the application bottleneck."}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#EAF3F7] border border-[#123047]/10 text-xs space-y-1.5">
              <span className="font-bold text-[#123B5D]">Why linear courses fail here:</span>
              <p className="text-[#123047] leading-relaxed">
                Re-taking the entire advanced course without mastering the prerequisite sampling formula causes repeated assessment failures.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDisclosureStep(2)} className="flex-1 border-[#123047]/20 text-[#123047]">
                Back
              </Button>
              <Button onClick={() => setDisclosureStep(4)} className="flex-1 bg-[#176B87] hover:bg-[#176B87]/90 text-[#FFFFFF] font-bold shadow-xs">
                View Intervention <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: ACTION (iGOT KARMAYOGI INTERVENTION) */}
        {disclosureStep === 4 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#176B87]/30 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#176B87] text-[#FFFFFF]">
                  iGOT KARMAYOGI COURSE
                </span>
                <span className="text-xs text-[#123047]/60 font-mono">100% Free / Official</span>
              </div>
              <h4 className="font-bold text-sm text-[#123B5D]">{node.igotCourse}</h4>
              <p className="text-xs text-[#123047]">
                Targeted 6-hour interactive module built by the Indian Statistical Institute on the National Training Grid.
              </p>
            </div>

            <div className="space-y-2.5">
              <Link to="/learning-path">
                <Button className="w-full bg-[#176B87] hover:bg-[#176B87]/90 text-[#FFFFFF] font-bold shadow-xs">
                  <BookOpen className="w-4 h-4 mr-2" /> Open In My Learning Path
                </Button>
              </Link>

              <Link to="/assessment">
                <Button variant="secondary" className="w-full font-semibold">
                  <RefreshCw className="w-4 h-4 mr-2" /> Launch Targeted Reassessment
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
