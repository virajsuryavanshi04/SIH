import React from 'react';
import { CapabilityNode } from './CapabilityLandscape';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, CheckCircle2, AlertTriangle, BookOpen, Clock, ShieldAlert, Target } from 'lucide-react';
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

  return (
    <div className="bg-[#FFFFFF] rounded-2xl border border-[#2B2D42]/10 p-5 sm:p-6 shadow-xs space-y-5 text-left h-full flex flex-col justify-between">
      {/* Header */}
      <div className="space-y-3 border-b border-[#2B2D42]/10 pb-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#1F7A8C]">
            {node.domain} // TELEMETRY
          </span>
          <span className={cn(
            "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border",
            !isAssessed
              ? "bg-[#2B2D42]/5 text-[#2B2D42]/70 border-[#2B2D42]/20"
              : isTargetMet 
              ? "bg-[#2E7D32]/10 text-[#2E7D32] border-[#2E7D32]/30"
              : isCritical
              ? "bg-[#D4AF37]/15 text-[#0B2545] border-[#D4AF37]/35"
              : "bg-[#1F7A8C]/10 text-[#1F7A8C] border-[#1F7A8C]/20"
          )}>
            {!isAssessed ? 'PENDING BASELINE' : `${node.priority} PRIORITY`}
          </span>
        </div>
        <h3 className="text-xl font-black text-[#0B2545] tracking-tight">
          {node.name}
        </h3>
      </div>

      {/* 3 Metric Blocks: Current Level | Target Level | Deficit */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-3 bg-[#F4F6F9] rounded-xl border border-[#2B2D42]/10">
          <span className="text-[9px] font-mono uppercase text-[#2B2D42]/60 font-bold block">Current Level</span>
          <span className="text-xl font-black text-[#0B2545] font-mono mt-0.5 block">
            {isAssessed ? `${node.score}%` : 'Not Assessed'}
          </span>
        </div>
        <div className="p-3 bg-[#1F7A8C]/5 rounded-xl border border-[#1F7A8C]/20">
          <span className="text-[9px] font-mono uppercase text-[#1F7A8C] font-bold block">Target Level</span>
          <span className="text-xl font-black text-[#1F7A8C] font-mono mt-0.5 block">{node.required}%</span>
        </div>
        <div className={cn(
          "p-3 rounded-xl border",
          !isAssessed
            ? "bg-[#F4F6F9] border-[#2B2D42]/10"
            : (node.gap ?? 0) > 0 
            ? "bg-[#D4AF37]/15 border-[#D4AF37]/30" 
            : "bg-[#2E7D32]/10 border-[#2E7D32]/30"
        )}>
          <span className="text-[9px] font-mono uppercase text-[#2B2D42]/60 font-bold block">Deficit</span>
          <span className={cn(
            "text-xl font-black font-mono mt-0.5 block",
            !isAssessed ? "text-[#2B2D42]/60" : (node.gap ?? 0) > 0 ? "text-[#0B2545]" : "text-[#2E7D32]"
          )}>
            {!isAssessed ? 'Pending' : (node.gap ?? 0) > 0 ? `-${node.gap}%` : '0%'}
          </span>
        </div>
      </div>

      {/* Section: WHY THIS GAP? / UNASSESSED EXPLANATION */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-mono font-bold text-[#0B2545] uppercase tracking-wider">
            {isAssessed ? 'WHY THIS GAP?' : 'DIAGNOSTIC STATUS'}
          </h4>
          <span className="text-[10px] font-mono text-[#1F7A8C] font-bold">
            {isAssessed ? `AI Confidence: ${node.aiConfidence}%` : 'Evidence Required'}
          </span>
        </div>
        
        <ul className="space-y-1.5 p-3 rounded-xl bg-[#F4F6F9] border border-[#2B2D42]/10 text-xs text-[#2B2D42]">
          {isAssessed ? (
            node.reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="text-[#1F7A8C] font-bold mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))
          ) : (
            <li className="flex items-start gap-2 leading-relaxed">
              <span className="text-[#1F7A8C] font-bold mt-0.5">•</span>
              <span>
                Competency scores are strictly calculated from assessment responses. Take a baseline assessment to establish evidence for this competency.
              </span>
            </li>
          )}
        </ul>
      </div>

      {/* Section: RECOMMENDED INTERVENTION */}
      <div className="space-y-3 pt-2 border-t border-[#2B2D42]/10">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#1F7A8C] uppercase tracking-wider block">
            {isAssessed ? 'RECOMMENDED INTERVENTION' : 'NEXT STEP'}
          </span>
          <p className="text-xs font-bold text-[#0B2545] mt-0.5">
            {isAssessed ? node.recommendedCourse.title : `Complete Baseline Assessment for ${node.name}`}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-[#2B2D42]/70 font-mono">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {isAssessed ? node.recommendedCourse.duration : '15-20 min'}
          </span>
          <span className="bg-[#1F7A8C]/10 text-[#1F7A8C] px-2 py-0.5 rounded font-bold">
            {isAssessed ? node.recommendedCourse.type : 'MoSPI Standard Diagnostic'}
          </span>
        </div>

        <Link to="/assessment" className="block w-full">
          <Button className="w-full bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-bold text-xs shadow-xs">
            {isAssessed ? 'Launch Recommended Module' : 'Take Baseline Assessment'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
