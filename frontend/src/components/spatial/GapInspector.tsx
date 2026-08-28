import React from 'react';
import { CapabilityNode } from './CapabilityLandscape';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, CheckCircle2, AlertTriangle, BookOpen, Clock, ShieldAlert, Target, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Props {
  node: CapabilityNode;
  onClose?: () => void;
}

export default function GapInspector({ node }: Props) {
  const isAssessed = node.score !== null && node.status !== 'not_assessed';
  const isTargetMet = isAssessed && (node.score ?? 0) >= node.required;
  const isCritical = node.priority === 'CRITICAL';
  const gapVal = node.gap ?? 0;

  const targetLink = !isAssessed ? '/assessment' : '/learning-path';

  return (
    <div className="bg-[#FFFFFF] rounded-2xl border border-[#123047]/10 p-5 sm:p-6 shadow-xs space-y-5 text-left h-full flex flex-col justify-between">
      
      {/* 1. Header: Domain + Priority Badge + Title */}
      <div className="space-y-2.5 border-b border-[#123047]/10 pb-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#176B87]">
            {node.domain || 'STATISTICAL STANDARD'} // TELEMETRY
          </span>
          <span className={cn(
            "text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border",
            !isAssessed
              ? "bg-[#123047]/5 text-[#123047]/70 border-[#123047]/20"
              : isTargetMet 
              ? "bg-[#2E8B57]/10 text-[#2E8B57] border-[#2E8B57]/30"
              : isCritical
              ? "bg-[#D49A2A]/15 text-[#123B5D] border-[#D49A2A]/35"
              : "bg-[#176B87]/10 text-[#176B87] border-[#176B87]/20"
          )}>
            {!isAssessed ? 'PENDING BASELINE' : isTargetMet ? 'PROFICIENT' : `${node.priority} PRIORITY`}
          </span>
        </div>
        <h3 className="text-xl font-black text-[#123B5D] tracking-tight uppercase">
          {node.name}
        </h3>
      </div>

      {/* 2. Three Metric Blocks: Current Level | Target Level | Deficit Gap */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-3 bg-[#EAF3F7] rounded-xl border border-[#123047]/10">
          <span className="text-[9px] font-mono uppercase text-[#123047]/60 font-bold block">Current</span>
          <span className="text-xl font-black text-[#123B5D] font-mono mt-0.5 block">
            {isAssessed ? `${node.score}%` : 'N/A'}
          </span>
        </div>
        <div className="p-3 bg-[#176B87]/5 rounded-xl border border-[#176B87]/20">
          <span className="text-[9px] font-mono uppercase text-[#176B87] font-bold block">Target</span>
          <span className="text-xl font-black text-[#176B87] font-mono mt-0.5 block">{node.required}%</span>
        </div>
        <div className={cn(
          "p-3 rounded-xl border",
          !isAssessed
            ? "bg-[#EAF3F7] border-[#123047]/10"
            : gapVal > 0 
            ? "bg-[#D49A2A]/15 border-[#D49A2A]/30" 
            : "bg-[#2E8B57]/10 border-[#2E8B57]/30"
        )}>
          <span className="text-[9px] font-mono uppercase text-[#123047]/60 font-bold block">Gap</span>
          <span className={cn(
            "text-xl font-black font-mono mt-0.5 block",
            !isAssessed ? "text-[#123047]/60" : gapVal > 0 ? "text-[#123B5D]" : "text-[#2E8B57]"
          )}>
            {!isAssessed ? 'Pending' : gapVal > 0 ? `-${gapVal}%` : '0%'}
          </span>
        </div>
      </div>

      {/* 3. Granular Weak Subtopic Area */}
      {node.weakestSubtopic && (
        <div className="p-3 rounded-xl bg-[#D49A2A]/10 border border-[#D49A2A]/30 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono font-bold text-[#123B5D] uppercase block">
              Weakest Area
            </span>
            <span className="font-bold text-[#123B5D]">
              {node.weakestSubtopic}
            </span>
          </div>
          <AlertTriangle className="w-4 h-4 text-[#D49A2A] shrink-0" />
        </div>
      )}

      {/* 4. WHY THIS GAP? / Evidence Telemetry */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-mono font-bold text-[#123B5D] uppercase tracking-wider">
            WHY?
          </h4>
          <span className="text-[10px] font-mono text-[#176B87] font-bold">
            {isAssessed ? `AI Confidence: ${node.aiConfidence}%` : 'Evidence Required'}
          </span>
        </div>
        
        <ul className="space-y-1.5 p-3 rounded-xl bg-[#EAF3F7] border border-[#123047]/10 text-xs text-[#123047]">
          {isAssessed ? (
            node.reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="text-[#176B87] font-bold mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))
          ) : (
            <li className="flex items-start gap-2 leading-relaxed">
              <span className="text-[#176B87] font-bold mt-0.5">•</span>
              <span>
                Competency scores are strictly calculated from assessment evidence. Complete a diagnostic assessment to calibrate this competency.
              </span>
            </li>
          )}
        </ul>
      </div>

      {/* 5. RECOMMENDED ACTION / Direct CTA */}
      <div className="space-y-3 pt-2 border-t border-[#123047]/10">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#176B87] uppercase tracking-wider block">
            RECOMMENDED ACTION
          </span>
          <p className="text-xs font-bold text-[#123B5D] mt-0.5 truncate">
            {isAssessed ? node.recommendedCourse.title : `Complete Baseline Assessment for ${node.name}`}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-[#123047]/70 font-mono">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#176B87]" />
            {isAssessed ? node.recommendedCourse.duration : '15 min'}
          </span>
          <span className="bg-[#176B87]/10 text-[#176B87] px-2 py-0.5 rounded font-bold text-[10px]">
            {isAssessed ? node.recommendedCourse.type : 'MoSPI Standard Diagnostic'}
          </span>
        </div>

        <Link to={targetLink} className="block w-full">
          <Button className="w-full bg-[#176B87] hover:bg-[#176B87]/90 text-[#FFFFFF] font-bold text-xs shadow-xs h-9 flex items-center justify-center gap-1.5 cursor-pointer">
            <span>{isAssessed ? 'Start Learning' : 'Take Baseline Assessment'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
