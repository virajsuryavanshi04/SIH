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
    <div className="bg-[#FFFDF9] rounded-2xl border border-[#292B2B]/10 p-5 sm:p-6 shadow-xs space-y-5 text-left h-full flex flex-col justify-between">
      
      {/* 1. Header: Domain + Priority Badge + Title */}
      <div className="space-y-2.5 border-b border-[#292B2B]/10 pb-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#A85D4C]">
            {node.domain || 'STATISTICAL STANDARD'} // TELEMETRY
          </span>
          <span className={cn(
            "text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border",
            !isAssessed
              ? "bg-[#292B2B]/5 text-[#292B2B]/70 border-[#292B2B]/20"
              : isTargetMet 
              ? "bg-[#2E8B57]/10 text-[#2E8B57] border-[#2E8B57]/30"
              : isCritical
              ? "bg-[#B38A3D]/15 text-[#2D3030] border-[#B38A3D]/35"
              : "bg-[#A85D4C]/10 text-[#A85D4C] border-[#A85D4C]/20"
          )}>
            {!isAssessed ? 'PENDING BASELINE' : isTargetMet ? 'PROFICIENT' : `${node.priority} PRIORITY`}
          </span>
        </div>
        <h3 className="text-xl font-black text-[#2D3030] tracking-tight uppercase">
          {node.name}
        </h3>
      </div>

      {/* 2. Three Metric Blocks: Current Level | Target Level | Deficit Gap */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-3 bg-[#EFEBE4] rounded-xl border border-[#292B2B]/10">
          <span className="text-[9px] font-mono uppercase text-[#292B2B]/60 font-bold block">Current</span>
          <span className="text-xl font-black text-[#2D3030] font-mono mt-0.5 block">
            {isAssessed ? `${node.score}%` : 'N/A'}
          </span>
        </div>
        <div className="p-3 bg-[#A85D4C]/5 rounded-xl border border-[#A85D4C]/20">
          <span className="text-[9px] font-mono uppercase text-[#A85D4C] font-bold block">Target</span>
          <span className="text-xl font-black text-[#A85D4C] font-mono mt-0.5 block">{node.required}%</span>
        </div>
        <div className={cn(
          "p-3 rounded-xl border",
          !isAssessed
            ? "bg-[#EFEBE4] border-[#292B2B]/10"
            : gapVal > 0 
            ? "bg-[#B38A3D]/15 border-[#B38A3D]/30" 
            : "bg-[#2E8B57]/10 border-[#2E8B57]/30"
        )}>
          <span className="text-[9px] font-mono uppercase text-[#292B2B]/60 font-bold block">Gap</span>
          <span className={cn(
            "text-xl font-black font-mono mt-0.5 block",
            !isAssessed ? "text-[#292B2B]/60" : gapVal > 0 ? "text-[#2D3030]" : "text-[#2E8B57]"
          )}>
            {!isAssessed ? 'Pending' : gapVal > 0 ? `-${gapVal}%` : '0%'}
          </span>
        </div>
      </div>

      {/* 3. Granular Weak Subtopic Area */}
      {node.weakestSubtopic && (
        <div className="p-3 rounded-xl bg-[#B38A3D]/10 border border-[#B38A3D]/30 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono font-bold text-[#2D3030] uppercase block">
              Weakest Area
            </span>
            <span className="font-bold text-[#2D3030]">
              {node.weakestSubtopic}
            </span>
          </div>
          <AlertTriangle className="w-4 h-4 text-[#B38A3D] shrink-0" />
        </div>
      )}

      {/* 4. WHY THIS GAP? / Evidence Telemetry */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-mono font-bold text-[#2D3030] uppercase tracking-wider">
            WHY?
          </h4>
          <span className="text-[10px] font-mono text-[#A85D4C] font-bold">
            {isAssessed ? `AI Confidence: ${node.aiConfidence}%` : 'Evidence Required'}
          </span>
        </div>
        
        <ul className="space-y-1.5 p-3 rounded-xl bg-[#EFEBE4] border border-[#292B2B]/10 text-xs text-[#292B2B]">
          {isAssessed ? (
            node.reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="text-[#A85D4C] font-bold mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))
          ) : (
            <li className="flex items-start gap-2 leading-relaxed">
              <span className="text-[#A85D4C] font-bold mt-0.5">•</span>
              <span>
                Competency scores are strictly calculated from assessment evidence. Complete a diagnostic assessment to calibrate this competency.
              </span>
            </li>
          )}
        </ul>
      </div>

      {/* 5. RECOMMENDED ACTION / Direct CTA */}
      <div className="space-y-3 pt-2 border-t border-[#292B2B]/10">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#A85D4C] uppercase tracking-wider block">
            RECOMMENDED ACTION
          </span>
          <p className="text-xs font-bold text-[#2D3030] mt-0.5 truncate">
            {isAssessed ? node.recommendedCourse.title : `Complete Baseline Assessment for ${node.name}`}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-[#292B2B]/70 font-mono">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#A85D4C]" />
            {isAssessed ? node.recommendedCourse.duration : '15 min'}
          </span>
          <span className="bg-[#A85D4C]/10 text-[#A85D4C] px-2 py-0.5 rounded font-bold text-[10px]">
            {isAssessed ? node.recommendedCourse.type : 'MoSPI Standard Diagnostic'}
          </span>
        </div>

        <Link to={targetLink} className="block w-full">
          <Button className="w-full bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9] font-bold text-xs shadow-xs h-9 flex items-center justify-center gap-1.5 cursor-pointer">
            <span>{isAssessed ? 'Start Learning' : 'Take Baseline Assessment'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
