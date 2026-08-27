import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface RadialCompetencyNode {
  id: number;
  name: string;
  domain?: string;
  score: number | null;
  required: number;
  gap?: number;
  status: 'proficient' | 'on_track' | 'needs_attention' | 'critical' | 'not_assessed';
  weakestSubtopic?: string;
  aiConfidence?: number;
  recommendedCourse?: {
    title: string;
    duration: string;
    type: string;
  };
}

interface Props {
  nodes: RadialCompetencyNode[];
  selectedNode: RadialCompetencyNode | null;
  onSelectNode: (node: RadialCompetencyNode) => void;
  className?: string;
}

export default function RadialCapabilityOverview({
  nodes,
  selectedNode,
  onSelectNode,
  className
}: Props) {
  const [hoveredNode, setHoveredNode] = useState<RadialCompetencyNode | null>(null);

  // Center coordinate (percentage)
  const centerX = 50;
  const centerY = 50;

  // Aspect-aware orbital radii (percentage of container width / height)
  // Accommodates top header and bottom footer with generous whitespace
  const orbitRadiusX = 32;
  const orbitRadiusY = 27;

  // Status color mapping
  const getStatusColor = (node: RadialCompetencyNode) => {
    if (node.score === null || node.status === 'not_assessed') {
      return { ring: '#2B2D42', text: 'text-[#2B2D42]/60', bg: 'bg-[#2B2D42]/5', border: 'border-[#2B2D42]/20' };
    }
    if (node.score >= 80 || (node.score >= node.required)) {
      return { ring: '#2E7D32', text: 'text-[#2E7D32]', bg: 'bg-[#2E7D32]/10', border: 'border-[#2E7D32]/30' };
    }
    if (node.score >= 65 || (node.gap !== undefined && node.gap <= 10)) {
      return { ring: '#1F7A8C', text: 'text-[#1F7A8C]', bg: 'bg-[#1F7A8C]/10', border: 'border-[#1F7A8C]/30' };
    }
    if (node.gap !== undefined && node.gap <= 20) {
      return { ring: '#D4AF37', text: 'text-[#0B2545]', bg: 'bg-[#D4AF37]/15', border: 'border-[#D4AF37]/40' };
    }
    return { ring: '#DC2626', text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
  };

  // Split long competency names into max 2 readable lines
  const formatCompetencyName = (name: string) => {
    const words = name.split(' ');
    if (words.length <= 1) return { line1: name, line2: '' };
    if (words.length === 2) return { line1: words[0], line2: words[1] };
    const mid = Math.ceil(words.length / 2);
    return {
      line1: words.slice(0, mid).join(' '),
      line2: words.slice(mid).join(' ')
    };
  };

  // Consistent center-aligned label positioning for all 8 nodes
  // Top 3 nodes have labels above; Bottom 5 nodes have labels below
  const getLabelPositionClass = (idx: number) => {
    if (idx === 0 || idx === 1 || idx === 7) {
      // Top hemisphere: positioned directly above the node, centered
      return "-top-12 left-1/2 -translate-x-1/2";
    }
    // Bottom hemisphere: positioned directly below the node, centered
    return "top-13 left-1/2 -translate-x-1/2";
  };

  return (
    <div className={cn("relative w-full h-[540px] sm:h-[580px] bg-[#FFFFFF] rounded-2xl border border-[#DCE5EA] shadow-[0_1px_4px_rgba(11,37,69,0.04)] overflow-hidden select-none flex flex-col justify-between text-left", className)}>
      
      {/* Header & Status Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#DCE5EA] bg-[#EEF5F7]/70 px-5 py-3 gap-2 z-20">
        <div>
          <h3 className="text-xs font-mono font-bold text-[#102A43] uppercase tracking-wider">
            CAPABILITY OVERVIEW
          </h3>
          <p className="text-[11px] text-[#62748A]">
            Click any competency to explore your capability insights.
          </p>
        </div>

        {/* Compact Legend */}
        <div className="flex items-center space-x-2.5 text-[11px] font-mono text-[#62748A] flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32]" /> Strong</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#1F7A8C]" /> On Track</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" /> Attention</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" /> Critical</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#62748A]/30" /> Unassessed</span>
        </div>
      </div>

      {/* Interactive Radial Topology Canvas */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        
        {/* SVG Orbital Background & Connectors */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Aspect-aware Elliptical Orbit Track */}
          <ellipse
            cx="50%"
            cy="50%"
            rx={`${orbitRadiusX}%`}
            ry={`${orbitRadiusY}%`}
            fill="none"
            stroke="#102A43"
            strokeOpacity="0.08"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />

          {/* Connection Lines from Center "YOU" to each Competency */}
          {nodes.map((node, idx) => {
            const total = Math.max(1, nodes.length);
            const angle = (idx / total) * (2 * Math.PI) - Math.PI / 2;
            const x = centerX + orbitRadiusX * Math.cos(angle);
            const y = centerY + orbitRadiusY * Math.sin(angle);

            const isSelected = selectedNode?.id === node.id;
            const isHovered = hoveredNode?.id === node.id;

            return (
              <line
                key={`line-${node.id}`}
                x1={`${centerX}%`}
                y1={`${centerY}%`}
                x2={`${x}%`}
                y2={`${y}%`}
                stroke={isSelected || isHovered ? "#1F7A8C" : "#102A43"}
                strokeOpacity={isSelected || isHovered ? "0.6" : "0.15"}
                strokeWidth={isSelected || isHovered ? "2" : "1"}
                strokeDasharray={isSelected || isHovered ? "none" : "2 2"}
                className="transition-all duration-200"
              />
            );
          })}
        </svg>

        {/* Center Node: "YOU" */}
        <div
          style={{ left: `${centerX}%`, top: `${centerY}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
        >
          <div className="w-15 h-15 sm:w-16 sm:h-16 rounded-full bg-[#0B2545] border-2 border-[#1F7A8C] text-[#FFFFFF] flex flex-col items-center justify-center shadow-lg ring-4 ring-[#1F7A8C]/20">
            <User className="w-5 h-5 text-[#D4AF37]" />
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase mt-0.5 text-[#FFFFFF]">YOU</span>
          </div>
        </div>

        {/* Orbiting Competency Nodes */}
        {nodes.map((node, idx) => {
          const total = Math.max(1, nodes.length);
          const angle = (idx / total) * (2 * Math.PI) - Math.PI / 2;
          const nodeX = centerX + orbitRadiusX * Math.cos(angle);
          const nodeY = centerY + orbitRadiusY * Math.sin(angle);

          const isSelected = selectedNode?.id === node.id;
          const isHovered = hoveredNode?.id === node.id;
          const styling = getStatusColor(node);

          // SVG Ring Progress Calculations
          const radius = 19;
          const circumference = 2 * Math.PI * radius;
          const scoreVal = node.score !== null ? Math.min(100, Math.max(0, node.score)) : 0;
          const strokeDashoffset = node.score !== null 
            ? circumference - (scoreVal / 100) * circumference 
            : circumference;

          // Split name for 2-line display
          const { line1, line2 } = formatCompetencyName(node.name);
          const labelPosClass = getLabelPositionClass(idx);

          return (
            <div
              key={node.id}
              style={{ left: `${nodeX}%`, top: `${nodeY}%` }}
              onClick={() => onSelectNode(node)}
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 z-20",
                isSelected ? "scale-105 z-40" : isHovered ? "scale-102 z-30" : "hover:scale-101"
              )}
            >
              {/* Circular Score Ring Element */}
              <div className={cn(
                "relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#FFFFFF] flex items-center justify-center transition-all border shadow-xs",
                isSelected
                  ? "border-[#1F7A8C] ring-4 ring-[#1F7A8C]/25 shadow-md"
                  : isHovered
                  ? "border-[#1F7A8C] shadow-xs"
                  : "border-[#DCE5EA]"
              )}>
                {/* SVG Progress Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  {/* Track */}
                  <circle
                    cx="50%"
                    cy="50%"
                    r={radius}
                    fill="none"
                    stroke="#102A43"
                    strokeOpacity="0.08"
                    strokeWidth="3"
                  />
                  {/* Progress Fill */}
                  <circle
                    cx="50%"
                    cy="50%"
                    r={radius}
                    fill="none"
                    stroke={styling.ring}
                    strokeWidth="3"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                  />
                </svg>

                {/* Centered Percentage Score */}
                <div className="z-10 text-center">
                  <span className={cn("text-[11px] sm:text-xs font-bold font-mono leading-none block", styling.text)}>
                    {node.score !== null ? `${Math.round(node.score)}%` : '0%'}
                  </span>
                </div>
              </div>

              {/* Dynamic External Label (Consistently Center-Aligned) */}
              <div
                className={cn(
                  "absolute flex flex-col items-center justify-center text-center pointer-events-none w-32 sm:w-36 transition-all",
                  labelPosClass
                )}
              >
                <div className={cn(
                  "px-2 py-0.5 rounded-md transition-all flex flex-col items-center justify-center text-center",
                  isSelected ? "bg-[#1F7A8C]/10 font-bold" : "bg-[#FFFFFF]/95 shadow-2xs border border-[#DCE5EA]/60"
                )}>
                  <span className="text-[11px] sm:text-xs font-semibold text-[#102A43] leading-tight block text-center truncate max-w-[130px]">
                    {line1}
                  </span>
                  {line2 && (
                    <span className="text-[11px] sm:text-xs font-semibold text-[#102A43] leading-tight block text-center truncate max-w-[130px] -mt-0.5">
                      {line2}
                    </span>
                  )}
                  <span className="text-[9px] font-mono text-[#62748A] uppercase tracking-tighter block mt-0.5 text-center">
                    REQ: {node.required}%
                  </span>
                </div>
              </div>

            </div>
          );
        })}

      </div>

      {/* Footer Context / Capability Matrix CTA */}
      <div className="border-t border-[#DCE5EA] bg-[#EEF5F7]/50 px-5 py-2.5 text-xs font-mono text-[#62748A] flex items-center justify-between z-20">
        <span>8 Competencies • Official MoSPI Benchmark Calibration</span>
        <Link to="/competencies">
          <Button variant="ghost" size="sm" className="text-xs font-semibold text-[#1F7A8C] hover:bg-[#1F7A8C]/10 h-7 px-2 flex items-center gap-1 cursor-pointer">
            <span>View Full Diagnostic Matrix</span>
            <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>

    </div>
  );
}
