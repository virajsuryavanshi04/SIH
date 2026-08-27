import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface CompetencyScorecardItem {
  id: number;
  name: string;
  domain?: string;
  current_score: number | null;
  target_score: number;
  gap: number;
  weakest_subtopic?: string;
  status: 'STRONG' | 'GOOD' | 'NEEDS_WORK' | 'CRITICAL' | 'PENDING';
  gapText: string;
  recommendation?: {
    title: string;
    duration?: string;
    type?: string;
  };
}

interface CompetencyScorecardProps {
  competencies: CompetencyScorecardItem[];
  selectedId: number | null;
  onSelect: (comp: CompetencyScorecardItem) => void;
  roleName?: string;
}

export default function CompetencyScorecard({
  competencies,
  selectedId,
  onSelect,
  roleName = 'Statistical Officer'
}: CompetencyScorecardProps) {
  return (
    <div className="bg-[#FFFFFF] rounded-2xl p-5 sm:p-6 border border-[#2B2D42]/10 shadow-[0_1px_4px_rgba(11,37,69,0.04)] space-y-5 text-left h-full flex flex-col justify-between">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#2B2D42]/10 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#1F7A8C] uppercase tracking-wider mb-0.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CAPABILITY GAP MATRIX</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-[#0B2545] tracking-tight">
            Your Capability Landscape
          </h2>
          <p className="text-xs sm:text-sm text-[#2B2D42]/75 mt-0.5">
            {competencies.length} competencies • benchmarked against your {roleName} role
          </p>
        </div>

        <Link to="/competencies">
          <Button variant="ghost" size="sm" className="text-xs sm:text-sm font-semibold text-[#1F7A8C] hover:bg-[#1F7A8C]/10 h-8 px-2.5 flex items-center gap-1 cursor-pointer">
            <span>View Graph Topology</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* Scorecard Items List */}
      <div className="space-y-2.5 divide-y divide-transparent">
        {competencies.map((comp) => {
          const isSelected = selectedId === comp.id;
          const isAssessed = comp.current_score !== null;
          const score = comp.current_score ?? 0;
          const target = comp.target_score;
          const isTargetMet = isAssessed && score >= target;

          return (
            <div
              key={comp.id}
              onClick={() => onSelect(comp)}
              className={cn(
                "p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer text-left space-y-2.5",
                isSelected
                  ? "bg-[#1F7A8C]/5 border-[#1F7A8C] ring-2 ring-[#1F7A8C]/20 shadow-xs"
                  : "bg-[#FFFFFF] border-[#2B2D42]/10 hover:border-[#1F7A8C]/40 hover:bg-[#F4F6F9]/60"
              )}
            >
              {/* Row 1: Competency Name & Status Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="font-semibold text-sm sm:text-base text-[#0B2545] truncate">
                    {comp.name}
                  </span>
                  {comp.weakest_subtopic && (
                    <span className="hidden md:inline-block text-[10px] font-mono text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full border border-[#D4AF37]/20 truncate max-w-[140px]">
                      {comp.weakest_subtopic}
                    </span>
                  )}
                </div>

                {/* Status Badge */}
                <div className="shrink-0 flex items-center space-x-2">
                  <span
                    className={cn(
                      "text-xs font-semibold px-2.5 py-0.5 rounded-full border font-mono",
                      comp.status === 'STRONG'
                        ? "bg-[#2E7D32]/10 text-[#2E7D32] border-[#2E7D32]/30"
                        : comp.status === 'GOOD'
                        ? "bg-[#1F7A8C]/10 text-[#1F7A8C] border-[#1F7A8C]/20"
                        : comp.status === 'NEEDS_WORK'
                        ? "bg-[#D4AF37]/15 text-[#0B2545] border-[#D4AF37]/35"
                        : comp.status === 'CRITICAL'
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-[#2B2D42]/5 text-[#2B2D42]/60 border-[#2B2D42]/20"
                    )}
                  >
                    {comp.status === 'STRONG' && 'STRONG'}
                    {comp.status === 'GOOD' && 'ON TRACK'}
                    {comp.status === 'NEEDS_WORK' && 'NEEDS WORK'}
                    {comp.status === 'CRITICAL' && 'PRIORITY GAP'}
                    {comp.status === 'PENDING' && 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Row 2: Comparison Metrics Line */}
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-semibold text-base text-[#0B2545]">
                    {isAssessed ? `${score}%` : 'Unassessed'}
                  </span>
                  <span className="text-[#2B2D42]/60 font-medium">
                    Target: <span className="font-mono text-[#0B2545] font-semibold">{target}%</span>
                  </span>
                </div>

                <div className="text-right font-medium">
                  <span
                    className={cn(
                      "text-xs font-mono",
                      isTargetMet
                        ? "text-[#2E7D32] font-semibold"
                        : comp.gap > 20
                        ? "text-red-600 font-semibold"
                        : "text-[#D4AF37] font-semibold"
                    )}
                  >
                    {comp.gapText}
                  </span>
                </div>
              </div>

              {/* Row 3: Visual Progress Bar with Target Tick Marker */}
              <div className="relative pt-1">
                <div className="relative h-2 w-full bg-[#2B2D42]/10 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700 ease-out",
                      isTargetMet
                        ? "bg-[#2E7D32]"
                        : comp.gap > 20
                        ? "bg-[#D4AF37]"
                        : "bg-[#1F7A8C]"
                    )}
                    style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                  />
                </div>

                {/* Target Marker Pin */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-1 h-3.5 bg-[#0B2545] rounded-full ring-2 ring-[#FFFFFF] z-10 pointer-events-none"
                  style={{ left: `${Math.min(99, Math.max(1, target))}%` }}
                  title={`Target Benchmark: ${target}%`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Navigation Link to Full Capability Topology Map */}
      <div className="pt-3 border-t border-[#2B2D42]/10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="text-xs text-[#2B2D42]/60 font-mono">
          Click any row to inspect gap root cause and recommendations
        </span>
        <Link to="/competencies">
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto text-xs sm:text-sm font-semibold border-[#2B2D42]/20 hover:bg-[#1F7A8C] hover:text-[#FFFFFF] text-[#0B2545] transition-all cursor-pointer h-9 px-4 rounded-xl"
          >
            <span>View Detailed Capability Map</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </Link>
      </div>

    </div>
  );
}
