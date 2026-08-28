import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  CheckCircle2, Circle, ArrowRight, Play, BookOpen, 
  Sparkles, RefreshCw, Award, Code, Check, ShieldCheck 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface Stage {
  id: number;
  label: string;
  sublabel: string;
  status: 'completed' | 'active' | 'upcoming';
  detail: string;
  metric?: string;
  actionText?: string;
  actionRoute?: string;
  igotModule?: string;
}

export default function ClosedLoopConduit() {
  const [activeStage, setActiveStage] = useState<number>(3);

  const stages: Stage[] = [
    {
      id: 1,
      label: 'ASSESS',
      sublabel: 'Baseline Diagnostic',
      status: 'completed',
      detail: 'Completed 15-question adaptive assessment across 8 official domains.',
      metric: 'Baseline score: 51% in Survey Ops',
    },
    {
      id: 2,
      label: 'DIAGNOSE',
      sublabel: 'AI Root Cause Analysis',
      status: 'completed',
      detail: 'AI isolated that Survey Methodology errors originated from Stratified Sampling calculation gaps.',
      metric: 'Bottleneck: Sampling Techniques (-22%)',
    },
    {
      id: 3,
      label: 'PERSONALIZE',
      sublabel: 'Adaptive Learning Path',
      status: 'active',
      detail: 'Curriculum customized: waived 4 foundational theory chapters, accelerated directly to practical variance formulas.',
      metric: 'Time saved: 14 training hours',
      actionText: 'Resume Module',
      actionRoute: '/courses',
      igotModule: 'iGOT Karmayogi: Advanced Sampling Methods (NSS 2026)',
    },
    {
      id: 4,
      label: 'PRACTICE',
      sublabel: 'Official Guideline Lab',
      status: 'upcoming',
      detail: 'Interactive micro-case study applying stratified weights to PLFS employment data.',
      actionText: 'Unlock on Course Completion',
    },
    {
      id: 5,
      label: 'REASSESS',
      sublabel: 'Targeted Validation',
      status: 'upcoming',
      detail: 'Adaptive 5-question targeted reassessment on newly acquired sampling competencies.',
      actionText: 'Take Reassessment',
      actionRoute: '/assessment',
    },
    {
      id: 6,
      label: 'IMPROVE',
      sublabel: 'Certified Capability',
      status: 'upcoming',
      detail: 'Updating national workforce heatmap to reflect certified mastery (48% → 82%).',
      metric: 'Role Readiness: Qualified for Statistical Officer III',
    }
  ];

  return (
    <div className="w-full space-y-6">
      {/* Closed Loop Continuous Pipeline Header */}
      <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#123047]/10 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#176B87] uppercase tracking-widest mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Closed-Loop Capability Stream</span>
            </div>
            <h3 className="text-xl font-bold text-[#123B5D]">The Closed-Loop Transformation Conduit</h3>
          </div>
          <div className="flex items-center space-x-2 bg-[#176B87]/10 px-3 py-1.5 rounded-full border border-[#176B87]/20 text-xs font-bold text-[#176B87]">
            <span className="w-2 h-2 rounded-full bg-[#176B87] animate-pulse" />
            <span>Active Closed Loop // Step 3 of 6</span>
          </div>
        </div>

        {/* Linear Stepper Conduit */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {stages.map((stage) => {
            const isSelected = activeStage === stage.id;
            return (
              <div
                key={stage.id}
                onClick={() => setActiveStage(stage.id)}
                className={cn(
                  "p-3 rounded-xl border transition-all cursor-pointer text-center relative",
                  isSelected
                    ? "bg-[#176B87] text-[#FFFFFF] border-[#176B87] shadow-xs font-bold"
                    : stage.status === 'completed'
                    ? "bg-[#2E8B57]/10 border-[#2E8B57]/30 text-[#2E8B57] hover:border-[#2E8B57]"
                    : stage.status === 'active'
                    ? "bg-[#176B87]/10 border-[#176B87] text-[#176B87] hover:bg-[#176B87]/15"
                    : "bg-[#FFFFFF] border-[#123047]/10 text-[#123047]/60 hover:bg-[#EAF3F7] hover:text-[#123B5D]"
                )}
              >
                <div className="flex justify-center mb-1.5">
                  {stage.status === 'completed' ? (
                    <CheckCircle2 className={cn("w-4 h-4", isSelected ? "text-[#FFFFFF]" : "text-[#2E8B57]")} />
                  ) : stage.status === 'active' ? (
                    <Circle className={cn("w-4 h-4", isSelected ? "text-[#FFFFFF]" : "text-[#176B87] animate-pulse")} />
                  ) : (
                    <Circle className="w-4 h-4 text-[#123047]/30" />
                  )}
                </div>
                <div className="text-[11px] font-bold tracking-wider">{stage.label}</div>
                <div className={cn("text-[9px] truncate mt-0.5", isSelected ? "text-[#FFFFFF]/90" : "text-[#123047]/60")}>
                  {stage.sublabel}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Step Detail Panel */}
      {activeStage && (
        <div className="p-6 bg-[#FFFFFF] rounded-2xl border border-[#123047]/10 shadow-xs space-y-4 animate-in fade-in duration-200">
          {(() => {
            const current = stages.find(s => s.id === activeStage)!;
            return (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#123047]/10 pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#176B87]">
                      PHASE 0{current.id} // {current.label}
                    </span>
                    <h4 className="text-lg font-bold text-[#123B5D]">{current.sublabel}</h4>
                  </div>
                  {current.metric && (
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-[#EAF3F7] border border-[#123047]/10 text-[#123B5D] shadow-xs">
                      {current.metric}
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#123047] leading-relaxed max-w-3xl">
                  {current.detail}
                </p>

                {current.igotModule && (
                  <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#123047]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-[#176B87]/10 flex items-center justify-center text-[#176B87] shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase text-[#176B87] font-mono">Integrated Course Module</div>
                        <h5 className="font-bold text-xs text-[#123B5D]">{current.igotModule}</h5>
                      </div>
                    </div>
                    {current.actionRoute && (
                      <Link to={current.actionRoute}>
                        <Button size="sm" className="font-bold bg-[#176B87] hover:bg-[#176B87]/90 text-[#FFFFFF] shadow-xs">
                          {current.actionText} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
