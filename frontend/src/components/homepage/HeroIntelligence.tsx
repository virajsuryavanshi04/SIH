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
    <section className="relative py-10 sm:py-14 lg:py-16 px-4 sm:px-6 lg:px-8 border-b border-[#E2DDD5] overflow-hidden bg-[#F7F4EE]">
      {/* Subtle background surface styling */}
      <div className="absolute inset-0 bg-[radial-gradient(#A85D4C08_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        {/* Left Editorial Narrative */}
        <div className="lg:col-span-6 space-y-4.5 text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#A85D4C]/8 border border-[#A85D4C]/20 text-[#A85D4C]">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold tracking-wider uppercase">
              SMARTLEARN • COMPETENCY INTELLIGENCE
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl lg:text-[50px] font-extrabold text-[#292B2B] tracking-tight leading-[1.14]">
              Know the Gap. <br />
              <span className="text-[#A85D4C]">Build the Capability.</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-[17px] text-[#7A756E] leading-[1.6] max-w-xl font-normal">
              An AI-powered learning intelligence platform that identifies workforce competency gaps, explains why they exist, recommends targeted learning through the iGOT ecosystem, and continuously measures capability growth.
            </p>
          </div>

          {/* Interactive CTAs */}
          <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link to="/login">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9] text-[15px] font-semibold px-7 h-11.5 rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Launch Portal Access</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={onHowItWorksClick}
              className="w-full sm:w-auto border-[#E2DDD5] text-[#292B2B] hover:bg-[#FFFDF9] hover:border-[#A85D4C] hover:text-[#7D4036] text-[15px] font-semibold px-6 h-11.5 rounded-xl bg-transparent cursor-pointer"
            >
              See How It Works
            </Button>
          </div>

          {/* Institutional Trust Badges */}
          <div className="pt-3 border-t border-[#E2DDD5] flex flex-wrap items-center gap-6 text-xs text-[#7A756E] font-medium">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#2E8B57]" />
              <span>India's Official Statistical System</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#A85D4C]" />
              <span>iGOT Karmayogi Connected</span>
            </div>
          </div>
        </div>

        {/* Right Live Spatial Competency Network Visualization */}
        <div className="lg:col-span-6">
          <div className="relative bg-[#FFFDF9] rounded-2xl border border-[#E2DDD5] p-4 sm:p-7 shadow-xs overflow-hidden min-h-[440px] sm:min-h-[450px] flex flex-col justify-between">
            {/* Top Bar Header */}
            <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-3 text-xs">
              <div className="flex items-center space-x-2 text-[#292B2B] font-semibold">
                <Brain className="w-4 h-4 text-[#A85D4C]" />
                <span className="text-xs sm:text-sm">Competency Assessment Overview</span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 rounded-full bg-[#B38A3D]/15 text-[#292B2B] border border-[#B38A3D]/30 font-mono shrink-0">
                1 Priority Bottleneck Detected
              </span>
            </div>

            {/* Interactive Network Graph Canvas */}
            <div className="relative w-full h-[300px] sm:h-[320px] my-2 select-none">
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
                        stroke={edge.active || isHighlighted ? '#B38A3D' : '#A85D4C'}
                        strokeOpacity={isHighlighted ? 0.9 : 0.3}
                        strokeWidth={isHighlighted ? 2 : 1.5}
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
                      "absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 z-10",
                      isSelected ? "scale-105 z-20" : "hover:scale-102"
                    )}
                  >
                    <div className={cn(
                      "p-2 sm:p-2.5 rounded-xl border flex items-center space-x-2 transition-all shadow-xs",
                      isGap 
                        ? "bg-[#FFFDF9] border-[#B38A3D] ring-1 ring-[#B38A3D]/25"
                        : node.status === 'proficient'
                        ? "bg-[#FFFDF9] border-[#2E8B57]/30 hover:border-[#2E8B57]"
                        : "bg-[#FFFDF9] border-[#E2DDD5] hover:border-[#A85D4C]"
                    )}>
                      {/* Radial Metric Pill */}
                      <div className={cn(
                        "w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-mono font-bold text-[11px] sm:text-xs shrink-0",
                        isGap 
                          ? "bg-[#B38A3D] text-[#292B2B]"
                          : node.status === 'proficient'
                          ? "bg-[#2E8B57]/10 text-[#2E8B57]"
                          : "bg-[#A85D4C]/10 text-[#A85D4C]"
                      )}>
                        {node.score}%
                      </div>

                      <div className="text-left">
                        <div className="text-[11px] sm:text-xs font-bold text-[#292B2B] leading-tight flex items-center gap-1">
                          <span>{node.label}</span>
                          {isGap && <AlertTriangle className="w-3 h-3 text-[#B38A3D] shrink-0" />}
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-[#7A756E] font-mono">
                          Target: {node.target}% {isGap ? '(-22% Gap)' : ''}
                        </div>
                      </div>
                    </div>

                    {isGap && (
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 sm:px-2 py-0.5 rounded-md bg-[#B38A3D] text-[#292B2B] text-[8px] sm:text-[9px] font-bold shadow-xs">
                        PRIORITY BOTTLENECK
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Dynamic Diagnostic Pill */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-[#EFEBE4] border border-[#E2DDD5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2 text-[#292B2B]">
                <Activity className="w-4 h-4 text-[#A85D4C] shrink-0" />
                <span className="font-medium text-[11px] sm:text-xs">
                  Prerequisite weakness in <strong>Sampling Formulas</strong> blocks Survey Clearance.
                </span>
              </div>
              <Link to="/login" className="shrink-0 text-[#A85D4C] font-semibold flex items-center hover:underline text-[11px] sm:text-xs">
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
