import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, ArrowRight, ShieldCheck, AlertTriangle, CheckCircle2, User, Info } from 'lucide-react';

export interface SpatialNode {
  id: number;
  name: string;
  domain: string;
  x: number;
  y: number;
  score: number;
  required: number;
  gap: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'proficient' | 'warning' | 'critical';
  prerequisites: number[];
  igotCourse: string;
  igotLink?: string;
  diagnosisEvidence: string;
  prerequisiteWeakness?: string;
}

interface Props {
  nodes: SpatialNode[];
  selectedNode: SpatialNode | null;
  onSelectNode: (node: SpatialNode) => void;
  className?: string;
}

export default function CompetencyCanvas({ nodes, selectedNode, onSelectNode, className }: Props) {
  const [hoveredNode, setHoveredNode] = useState<SpatialNode | null>(null);

  const connections = nodes.flatMap(target => 
    target.prerequisites.map(sourceId => {
      const source = nodes.find(n => n.id === sourceId);
      return source ? { source, target } : null;
    })
  ).filter(Boolean) as { source: SpatialNode; target: SpatialNode }[];

  return (
    <div className={cn("relative w-full h-[620px] bg-[#FFFFFF] rounded-2xl border border-[#2B2D42]/10 overflow-hidden select-none shadow-sm flex flex-col justify-between", className)}>
      {/* 1. Clean Structured Zone Column Headers (No Overlap) */}
      <div className="grid grid-cols-3 border-b border-[#2B2D42]/10 bg-[#F4F6F9]/60 px-4 py-2.5 z-10">
        <div className="text-left text-[11px] font-mono font-bold text-[#0B2545] uppercase tracking-wider">
          Zone 1 // Theory & Inference
        </div>
        <div className="text-center text-[11px] font-mono font-bold text-[#0B2545] uppercase tracking-wider border-x border-[#2B2D42]/10 px-2">
          Zone 2 // Field & Sampling
        </div>
        <div className="text-right text-[11px] font-mono font-bold text-[#0B2545] uppercase tracking-wider">
          Zone 3 // Analytics & Tech
        </div>
      </div>

      {/* 2. Interactive SVG Canvas for Topology Vectors */}
      <div className="relative flex-1 w-full h-full">
        {/* Faint Background Column Dividers */}
        <div className="absolute inset-0 grid grid-cols-3 pointer-events-none">
          <div className="border-r border-dashed border-[#2B2D42]/5" />
          <div className="border-r border-dashed border-[#2B2D42]/5" />
          <div />
        </div>

        {/* SVG Vector Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {connections.map(({ source, target }, idx) => {
            const isHighlighted = (hoveredNode && (hoveredNode.id === source.id || hoveredNode.id === target.id)) ||
                                  (selectedNode && (selectedNode.id === source.id || selectedNode.id === target.id));
            const hasGapFlow = target.gap > 0 || source.gap > 0;

            return (
              <g key={idx}>
                {isHighlighted && (
                  <line
                    x1={`${source.x}%`}
                    y1={`${source.y}%`}
                    x2={`${target.x}%`}
                    y2={`${target.y}%`}
                    stroke="#1F7A8C"
                    strokeWidth="4"
                    strokeOpacity="0.2"
                  />
                )}
                <line
                  x1={`${source.x}%`}
                  y1={`${source.y}%`}
                  x2={`${target.x}%`}
                  y2={`${target.y}%`}
                  stroke={isHighlighted ? (hasGapFlow ? "#D4AF37" : "#1F7A8C") : "#2B2D42"}
                  strokeOpacity={isHighlighted ? "1" : "0.2"}
                  strokeWidth={isHighlighted ? "2" : "1.25"}
                  strokeDasharray={hasGapFlow ? "5 5" : "none"}
                  className={hasGapFlow ? "animate-flow-line" : ""}
                />
              </g>
            );
          })}
        </svg>

        {/* Competency Node Cards */}
        {nodes.map((node) => {
          const isSelected = selectedNode?.id === node.id;
          const isHovered = hoveredNode?.id === node.id;
          const isTargetMet = node.score >= node.required;
          const isCritical = node.priority === 'CRITICAL';

          return (
            <div
              key={node.id}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 z-10",
                isSelected ? "z-30 scale-105" : isHovered ? "z-20 scale-102" : "hover:scale-101"
              )}
              onClick={() => onSelectNode(node)}
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* "You Are Here" Active Indicator Pill */}
              {node.id === 3 && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#0B2545] text-[#FFFFFF] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full shadow-sm flex items-center space-x-1 whitespace-nowrap border border-[#0B2545] z-30">
                  <User className="w-3 h-3 text-[#D4AF37]" />
                  <span>You Are Here</span>
                </div>
              )}

              {/* Node Card Surface */}
              <div className={cn(
                "w-44 sm:w-48 px-3.5 py-2.5 rounded-xl border flex items-center space-x-3 bg-[#FFFFFF] transition-all shadow-xs text-left",
                isSelected 
                  ? "border-[#1F7A8C] ring-2 ring-[#1F7A8C]/20 shadow-md" 
                  : isHovered 
                  ? "border-[#1F7A8C]/60 shadow-xs" 
                  : isCritical 
                  ? "border-[#D4AF37]/50" 
                  : "border-[#2B2D42]/15"
              )}>
                {/* Score Dial Badge */}
                <div className="relative flex items-center justify-center shrink-0">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono border",
                    isTargetMet 
                      ? "bg-[#2E7D32]/10 text-[#2E7D32] border-[#2E7D32]/30"
                      : isCritical
                      ? "bg-[#D4AF37]/15 text-[#0B2545] border-[#D4AF37]/40"
                      : "bg-[#1F7A8C]/10 text-[#1F7A8C] border-[#1F7A8C]/20"
                  )}>
                    {node.score}%
                  </div>
                </div>

                {/* Node Title & Target Meta */}
                <div className="flex-1 min-w-0">
                  <h4 className={cn(
                    "text-xs font-bold truncate leading-tight",
                    isSelected ? "text-[#1F7A8C]" : "text-[#0B2545]"
                  )}>
                    {node.name}
                  </h4>
                  <div className="flex items-center space-x-1.5 mt-0.5 text-[10px] font-mono">
                    <span className="text-[#2B2D42]/60">Req: {node.required}%</span>
                    {node.gap > 0 ? (
                      <span className="font-bold px-1.5 py-0.2 rounded bg-[#D4AF37]/15 text-[#0B2545] border border-[#D4AF37]/30">
                        -{node.gap}%
                      </span>
                    ) : (
                      <span className="font-bold px-1.5 py-0.2 rounded bg-[#2E7D32]/10 text-[#2E7D32]">
                        Met
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Clean Full-Width Footer Bar (Zero Overlap) */}
      <div className="border-t border-[#2B2D42]/10 bg-[#F4F6F9] px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-[#2B2D42] z-10">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32]" />
            <span className="text-[11px] font-semibold">Mastery (≥80%)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1F7A8C]" />
            <span className="text-[11px] font-semibold">On Track</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
            <span className="text-[11px] font-semibold">Priority Gap</span>
          </div>
        </div>

        <div className="text-[11px] text-[#1F7A8C] font-bold">
          Click any competency node to inspect telemetry
        </div>
      </div>
    </div>
  );
}
