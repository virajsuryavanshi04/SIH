import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { User, AlertTriangle, CheckCircle2, Sparkles, Compass } from 'lucide-react';

export interface CapabilityNode {
  id: number;
  name: string;
  domain: string;
  x: number; // percentage from left
  y: number; // percentage from top
  score: number | null; // null if not yet assessed
  required: number;
  gap: number | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'proficient' | 'on_track' | 'needs_attention' | 'not_assessed';
  prerequisites: number[];
  reasons: string[];
  weakestSubtopic?: string;
  actionUrl?: string;
  aiConfidence: number;
  recommendedCourse: {
    title: string;
    duration: string;
    type: string;
  };
}

interface Props {
  nodes: CapabilityNode[];
  selectedNode: CapabilityNode | null;
  onSelectNode: (node: CapabilityNode) => void;
  className?: string;
}

export default function CapabilityLandscape({ nodes, selectedNode, onSelectNode, className }: Props) {
  const [hoveredNode, setHoveredNode] = useState<CapabilityNode | null>(null);

  // Center coordinate for "YOU"
  const centerX = 50;
  const centerY = 50;

  // Inter-competency prerequisites
  const connections = nodes.flatMap(target => 
    target.prerequisites.map(sourceId => {
      const source = nodes.find(n => n.id === sourceId);
      return source ? { source, target } : null;
    })
  ).filter(Boolean) as { source: CapabilityNode; target: CapabilityNode }[];

  const getNodeColor = (node: CapabilityNode) => {
    if (node.score === null || node.status === 'not_assessed') {
      return { ring: '#123047', bg: 'bg-[#123047]/5', text: 'text-[#123047]/60', border: 'border-[#123047]/20' };
    }
    if (node.score >= 80) return { ring: '#2E8B57', bg: 'bg-[#2E8B57]/10', text: 'text-[#2E8B57]', border: 'border-[#2E8B57]/30' };
    if (node.score >= 65) return { ring: '#176B87', bg: 'bg-[#176B87]/10', text: 'text-[#176B87]', border: 'border-[#176B87]/30' };
    return { ring: '#D49A2A', bg: 'bg-[#D49A2A]/15', text: 'text-[#123B5D]', border: 'border-[#D49A2A]/40' };
  };

  return (
    <div className={cn("relative w-full h-[540px] sm:h-[580px] bg-[#FFFFFF] rounded-2xl border border-[#123047]/10 overflow-hidden select-none shadow-xs flex flex-col justify-between", className)}>
      {/* Topology Header */}
      <div className="flex items-center justify-between border-b border-[#123047]/10 bg-[#EAF3F7]/60 px-5 py-3 z-10">
        <div>
          <h3 className="text-xs font-mono font-bold text-[#123B5D] uppercase tracking-wider">
            YOUR CAPABILITY LANDSCAPE
          </h3>
          <p className="text-[11px] text-[#123047]/70">
            Click any competency to explore insights.
          </p>
        </div>
        <div className="flex items-center space-x-3 text-[11px] font-mono text-[#123047]/70 hidden sm:flex">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#2E8B57]" /> Verified (≥80%)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#176B87]" /> On Track</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#D49A2A]" /> Needs Attention</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#123047]/30" /> Not Assessed</span>
        </div>
      </div>

      {/* SVG & Interactive Node Arena */}
      <div className="relative flex-1 w-full h-full">
        {/* SVG Connectors */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Subtle concentric orbital rings centered on YOU */}
          <circle cx="50%" cy="50%" r="28%" fill="none" stroke="#123047" strokeOpacity="0.05" strokeDasharray="3 3" />
          <circle cx="50%" cy="50%" r="42%" fill="none" stroke="#123047" strokeOpacity="0.03" />

          {/* Lines connecting center "YOU" to each competency node */}
          {nodes.map(node => (
            <line
              key={`radial-${node.id}`}
              x1={`${centerX}%`}
              y1={`${centerY}%`}
              x2={`${node.x}%`}
              y2={`${node.y}%`}
              stroke="#123047"
              strokeOpacity="0.1"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          ))}

          {/* Prerequisite dependencies between nodes */}
          {connections.map(({ source, target }, idx) => {
            const isRelated = 
              selectedNode?.id === source.id || 
              selectedNode?.id === target.id ||
              hoveredNode?.id === source.id || 
              hoveredNode?.id === target.id;

            return (
              <g key={`edge-${idx}`}>
                <line
                  x1={`${source.x}%`}
                  y1={`${source.y}%`}
                  x2={`${target.x}%`}
                  y2={`${target.y}%`}
                  stroke={isRelated ? "#176B87" : "#123047"}
                  strokeOpacity={isRelated ? "0.6" : "0.15"}
                  strokeWidth={isRelated ? "2" : "1.2"}
                  strokeDasharray={isRelated ? "none" : "3 3"}
                  className="transition-all duration-300"
                />
              </g>
            );
          })}
        </svg>

        {/* Center Node: "YOU" */}
        <div
          style={{ left: `${centerX}%`, top: `${centerY}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
        >
          <div className="w-16 h-16 rounded-full bg-[#123B5D] border-2 border-[#176B87] text-[#FFFFFF] flex flex-col items-center justify-center shadow-md ring-4 ring-[#176B87]/20">
            <User className="w-5 h-5 text-[#D49A2A]" />
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase mt-0.5">YOU</span>
          </div>
        </div>

        {/* Orbiting Competency Nodes */}
        {nodes.map((node) => {
          const isSelected = selectedNode?.id === node.id;
          const isHovered = hoveredNode?.id === node.id;
          const styling = getNodeColor(node);
          const radius = 18; // SVG circle radius
          const circumference = 2 * Math.PI * radius;
          const scoreVal = node.score ?? 0;
          const strokeDashoffset = node.score !== null ? circumference - (scoreVal / 100) * circumference : circumference;

          return (
            <div
              key={node.id}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              onClick={() => onSelectNode(node)}
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 z-10 flex flex-col items-center",
                isSelected ? "z-30 scale-105" : isHovered ? "z-20 scale-102" : "hover:scale-101"
              )}
            >
              {/* Circular Ring Visual Node */}
              <div className={cn(
                "relative w-14 h-14 rounded-full bg-[#FFFFFF] flex items-center justify-center shadow-xs transition-all border",
                isSelected 
                  ? "border-[#176B87] ring-4 ring-[#176B87]/20 shadow-md" 
                  : isHovered 
                  ? "border-[#176B87] shadow-xs" 
                  : "border-[#123047]/15"
              )}>
                {/* SVG Progress Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r={radius}
                    fill="none"
                    stroke="#123047"
                    strokeOpacity="0.08"
                    strokeWidth="3.5"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r={radius}
                    fill="none"
                    stroke={styling.ring}
                    strokeWidth="3.5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                  />
                </svg>

                {/* Score Number in Center or Unassessed Badge */}
                <div className="z-10 text-center">
                  <span className={cn("text-xs font-black font-mono leading-none block", styling.text)}>
                    {node.score !== null ? `${node.score}%` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Competency Name & Domain Tag */}
              <div className={cn(
                "mt-1.5 px-2.5 py-0.5 rounded-full border text-center transition-all bg-[#FFFFFF] shadow-2xs",
                isSelected 
                  ? "border-[#176B87] bg-[#176B87]/5 shadow-xs" 
                  : "border-[#123047]/10"
              )}>
                <span className="text-[11px] font-bold text-[#123B5D] whitespace-nowrap block">
                  {node.name}
                </span>
                <span className="text-[9px] font-mono text-[#123047]/60 uppercase tracking-tighter block -mt-0.5">
                  {node.score !== null ? `Req: ${node.required}%` : 'Not Assessed'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="border-t border-[#123047]/10 bg-[#EAF3F7]/40 px-5 py-2.5 text-[11px] font-mono text-[#123047]/70 flex items-center justify-between z-10">
        <span>Framework: MoSPI Statistical Official Standards</span>
        <span className="text-[#176B87] font-semibold flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Live Evidence-Based Model
        </span>
      </div>
    </div>
  );
}
