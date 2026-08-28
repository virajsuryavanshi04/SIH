import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, ShieldCheck, Activity, Compass, Brain, CheckCircle2, AlertTriangle, Play } from 'lucide-react';
import { HERO_NETWORK_NODES, HERO_NETWORK_EDGES } from '@/data/homepageDemoData';
import { cn } from '@/lib/utils';

interface Props {
  onExploreClick?: () => void;
  onHowItWorksClick?: () => void;
}

export default function HeroIntelligence({ onExploreClick, onHowItWorksClick }: Props) {
  const [hoveredNode, setHoveredNode] = useState<string | null>('sampling');

  return (
    <section className="relative pt-12 pb-20 lg:pt-16 lg:pb-28 px-4 sm:px-6 lg:px-8 border-b border-[#D8E5EC] overflow-hidden bg-[#F4F8FB]">
      {/* Subtle cartographic grid & structural data coordinates */}
      <div className="absolute inset-0 bg-[radial-gradient(#176B870a_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
      <div className="absolute top-12 right-8 text-[10px] font-mono text-[#5D7180]/40 uppercase tracking-widest pointer-events-none hidden lg:block">
        GRID-REF // 28.6139° N, 77.2090° E // MoSPI-CAPACITY-TELEMETRY
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
        {/* Left Editorial Narrative */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#176B87]/10 border border-[#176B87]/20 text-[#176B87]">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-mono font-semibold tracking-wider uppercase">
              SMARTLEARN • COMPETENCY INTELLIGENCE
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#123047] tracking-tight leading-[1.1]">
              Know the Gap. <br />
              <span className="text-[#176B87]">Build the Capability.</span>
            </h1>
            <p className="text-base sm:text-lg text-[#5D7180] leading-relaxed max-w-xl font-normal">
              An AI-powered learning intelligence platform that identifies workforce competency gaps, explains why they exist, recommends targeted learning through the iGOT ecosystem, and continuously measures capability growth.
            </p>
          </div>

          {/* Interactive CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
            <Link to="/login">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-[#176B87] hover:bg-[#176B87]/90 text-[#FFFFFF] font-semibold px-7 h-11.5 rounded-xl shadow-xs text-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Launch Portal Access</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={onHowItWorksClick}
              className="w-full sm:w-auto border-[#D8E5EC] text-[#123047] hover:bg-[#FFFFFF] hover:border-[#176B87] hover:text-[#176B87] font-semibold px-6 h-11.5 rounded-xl text-sm bg-transparent cursor-pointer"
            >
              See How It Works
            </Button>
          </div>

          {/* Institutional Trust Badges */}
          <div className="pt-4 border-t border-[#D8E5EC] flex flex-wrap items-center gap-6 text-xs text-[#5D7180] font-mono">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-[#2E8B57]" />
              <span className="font-medium">India's Official Statistical System</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#176B87] animate-pulse" />
              <span className="font-medium">iGOT Karmayogi Connected</span>
            </div>
          </div>
        </div>

        {/* Right Live Spatial Competency Network Visualization */}
        <div className="lg:col-span-6">
          <div className="relative bg-[#FFFFFF] rounded-2xl border border-[#D8E5EC] p-6 sm:p-8 shadow-[0_1px_3px_rgba(11,37,69,0.04)] overflow-hidden min-h-[460px] flex flex-col justify-between">
            {/* Top Bar telemetry */}
            <div className="flex items-center justify-between border-b border-[#D8E5EC] pb-3 text-xs font-mono">
              <div className="flex items-center space-x-2 text-[#123047] font-semibold">
                <Brain className="w-4 h-4 text-[#176B87]" />
                <span>LIVE TOPOLOGY // OFFICER #26101</span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#D49A2A]/15 text-[#123047] border border-[#D49A2A]/30">
                1 Priority Bottleneck Detected
              </span>
            </div>

            {/* Interactive Network Graph Canvas */}
            <div className="relative w-full h-[320px] my-2 select-none">
              {/* SVG Vector Connections */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {HERO_NETWORK_EDGES.map((edge, idx) => {
                  const fromNode = HERO_NETWORK_NODES.find(n => n.id === edge.from)!;
                  const toNode = HERO_NETWORK_NODES.find(n => n.id === edge.to)!;
                  const isHighlighted = hoveredNode === edge.from || hoveredNode === edge.to;

                  return (
                    <g key={idx}>
                      <line
                        x1={`${fromNode.x}%`}
                        y1={`${fromNode.y}%`}
                        x2={`${toNode.x}%`}
                        y2={`${toNode.y}%`}
                        stroke={edge.active || isHighlighted ? '#D49A2A' : '#176B87'}
                        strokeOpacity={isHighlighted ? 0.9 : 0.35}
                        strokeWidth={isHighlighted ? 2.5 : 1.5}
                        strokeDasharray={edge.active ? '5 5' : 'none'}
                        className={edge.active ? 'animate-flow-line' : ''}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Network Nodes */}
              {HERO_NETWORK_NODES.map((node) => {
                const isSelected = hoveredNode === node.id;
                const isGap = node.isGap;

                return (
                  <div
                    key={node.id}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    className={cn(
                      "absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-10",
                      isSelected ? "scale-105 z-20" : "hover:scale-102"
                    )}
                  >
                    <div className={cn(
                      "p-3 rounded-xl border flex items-center space-x-2.5 transition-all shadow-xs",
                      isGap 
                        ? "bg-[#FFFFFF] border-[#D49A2A] ring-2 ring-[#D49A2A]/20 shadow-md"
                        : node.status === 'proficient'
                        ? "bg-[#FFFFFF] border-[#2E8B57]/30 hover:border-[#2E8B57]"
                        : "bg-[#FFFFFF] border-[#176B87]/30 hover:border-[#176B87]"
                    )}>
                      {/* Radial Metric Pill */}
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs",
                        isGap 
                          ? "bg-[#D49A2A] text-[#123047]"
                          : node.status === 'proficient'
                          ? "bg-[#2E8B57]/10 text-[#2E8B57]"
                          : "bg-[#176B87]/10 text-[#176B87]"
                      )}>
                        {node.score}%
                      </div>

                      <div className="text-left">
                        <div className="text-xs font-bold text-[#123047] leading-tight flex items-center gap-1">
                          <span>{node.label}</span>
                          {isGap && <AlertTriangle className="w-3 h-3 text-[#D49A2A]" />}
                        </div>
                        <div className="text-[10px] text-[#5D7180] font-mono">
                          Target: {node.target}% {isGap ? '(-22% Gap)' : ''}
                        </div>
                      </div>
                    </div>

                    {isGap && (
                      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full bg-[#D49A2A] text-[#123047] text-[9px] font-bold shadow-xs">
                        PRIORITY BOTTLENECK
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Dynamic Diagnostic Pill */}
            <div className="p-3.5 rounded-xl bg-[#EAF3F7] border border-[#D8E5EC] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2 text-[#123047]">
                <Activity className="w-4 h-4 text-[#176B87] shrink-0" />
                <span className="font-medium">
                  Prerequisite weakness in <strong>Sampling Formulas</strong> blocks Survey Clearance.
                </span>
              </div>
              <Link to="/login" className="shrink-0 text-[#176B87] font-semibold flex items-center hover:underline">
                <span>View Full Graph</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
