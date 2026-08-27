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
    <section className="relative pt-12 pb-20 lg:pt-16 lg:pb-28 px-4 sm:px-6 lg:px-8 border-b border-[#DCE5EA] overflow-hidden bg-[#F4F7FA]">
      {/* Subtle cartographic grid & structural data coordinates */}
      <div className="absolute inset-0 bg-[radial-gradient(#1F7A8C0a_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
      <div className="absolute top-12 right-8 text-[10px] font-mono text-[#62748A]/40 uppercase tracking-widest pointer-events-none hidden lg:block">
        GRID-REF // 28.6139° N, 77.2090° E // MoSPI-CAPACITY-TELEMETRY
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
        {/* Left Editorial Narrative */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#1F7A8C]/10 border border-[#1F7A8C]/20 text-[#1F7A8C]">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-mono font-semibold tracking-wider uppercase">
              SMARTLEARN • COMPETENCY INTELLIGENCE
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#102A43] tracking-tight leading-[1.1]">
              Know the Gap. <br />
              <span className="text-[#1F7A8C]">Build the Capability.</span>
            </h1>
            <p className="text-base sm:text-lg text-[#62748A] leading-relaxed max-w-xl font-normal">
              An AI-powered learning intelligence platform that identifies workforce competency gaps, explains why they exist, recommends targeted learning through the iGOT ecosystem, and continuously measures capability growth.
            </p>
          </div>

          {/* Interactive CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
            <Link to="/login">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-semibold px-7 h-11.5 rounded-xl shadow-xs text-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Launch Portal Access</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={onHowItWorksClick}
              className="w-full sm:w-auto border-[#DCE5EA] text-[#102A43] hover:bg-[#FFFFFF] hover:border-[#1F7A8C] hover:text-[#1F7A8C] font-semibold px-6 h-11.5 rounded-xl text-sm bg-transparent cursor-pointer"
            >
              See How It Works
            </Button>
          </div>

          {/* Institutional Trust Badges */}
          <div className="pt-4 border-t border-[#DCE5EA] flex flex-wrap items-center gap-6 text-xs text-[#62748A] font-mono">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
              <span className="font-medium">India's Official Statistical System</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1F7A8C] animate-pulse" />
              <span className="font-medium">iGOT Karmayogi Connected</span>
            </div>
          </div>
        </div>

        {/* Right Live Spatial Competency Network Visualization */}
        <div className="lg:col-span-6">
          <div className="relative bg-[#FFFFFF] rounded-2xl border border-[#DCE5EA] p-6 sm:p-8 shadow-[0_1px_3px_rgba(11,37,69,0.04)] overflow-hidden min-h-[460px] flex flex-col justify-between">
            {/* Top Bar telemetry */}
            <div className="flex items-center justify-between border-b border-[#DCE5EA] pb-3 text-xs font-mono">
              <div className="flex items-center space-x-2 text-[#102A43] font-semibold">
                <Brain className="w-4 h-4 text-[#1F7A8C]" />
                <span>LIVE TOPOLOGY // OFFICER #26101</span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#102A43] border border-[#D4AF37]/30">
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
                        stroke={edge.active || isHighlighted ? '#D4AF37' : '#1F7A8C'}
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
                        ? "bg-[#FFFFFF] border-[#D4AF37] ring-2 ring-[#D4AF37]/20 shadow-md"
                        : node.status === 'proficient'
                        ? "bg-[#FFFFFF] border-[#2E7D32]/30 hover:border-[#2E7D32]"
                        : "bg-[#FFFFFF] border-[#1F7A8C]/30 hover:border-[#1F7A8C]"
                    )}>
                      {/* Radial Metric Pill */}
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs",
                        isGap 
                          ? "bg-[#D4AF37] text-[#102A43]"
                          : node.status === 'proficient'
                          ? "bg-[#2E7D32]/10 text-[#2E7D32]"
                          : "bg-[#1F7A8C]/10 text-[#1F7A8C]"
                      )}>
                        {node.score}%
                      </div>

                      <div className="text-left">
                        <div className="text-xs font-bold text-[#102A43] leading-tight flex items-center gap-1">
                          <span>{node.label}</span>
                          {isGap && <AlertTriangle className="w-3 h-3 text-[#D4AF37]" />}
                        </div>
                        <div className="text-[10px] text-[#62748A] font-mono">
                          Target: {node.target}% {isGap ? '(-22% Gap)' : ''}
                        </div>
                      </div>
                    </div>

                    {isGap && (
                      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#102A43] text-[9px] font-bold shadow-xs">
                        PRIORITY BOTTLENECK
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Dynamic Diagnostic Pill */}
            <div className="p-3.5 rounded-xl bg-[#EEF5F7] border border-[#DCE5EA] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2 text-[#102A43]">
                <Activity className="w-4 h-4 text-[#1F7A8C] shrink-0" />
                <span className="font-medium">
                  Prerequisite weakness in <strong>Sampling Formulas</strong> blocks Survey Clearance.
                </span>
              </div>
              <Link to="/login" className="shrink-0 text-[#1F7A8C] font-semibold flex items-center hover:underline">
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
