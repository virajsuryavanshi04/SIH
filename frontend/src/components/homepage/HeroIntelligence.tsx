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
          <div className="relative bg-[#FFFDF9]/85 backdrop-blur-md bg-[radial-gradient(ellipse_at_center,_#F7F4EE80_0%,_#FFFDF9_75%)] rounded-2xl border border-[#E2DDD5]/90 p-4 sm:p-6 shadow-[0_2px_8px_rgba(45,48,48,0.03)] overflow-hidden min-h-[460px] sm:min-h-[470px] flex flex-col justify-between">
            {/* Top Bar Header */}
            <div className="flex items-center justify-between border-b border-[#E2DDD5]/80 pb-3 text-xs">
              <div className="flex items-center space-x-2 text-left">
                <div className="w-6 h-6 rounded-lg bg-[#A85D4C]/10 flex items-center justify-center text-[#A85D4C] shrink-0">
                  <Brain className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-3 h-3 text-[#A85D4C]" />
                    <span className="text-xs font-bold text-[#292B2B] uppercase tracking-wider font-mono">
                      COMPETENCY INTELLIGENCE
                    </span>
                  </div>
                  <span className="text-[10px] text-[#7A756E] block font-medium">Live capability topology</span>
                </div>
              </div>
              <span className="inline-flex items-center space-x-1 text-[10px] sm:text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#B38A3D]/12 text-[#292B2B] border border-[#B38A3D]/30 font-mono shrink-0 shadow-xs">
                <span className="text-[#B38A3D] font-bold">★</span>
                <span>1 Priority Bottleneck</span>
              </span>
            </div>

            {/* Interactive Radial Competency Intelligence Graph Canvas */}
            <div className="relative w-full h-[320px] sm:h-[330px] my-2 select-none">
              {/* SVG Vector Orbital Guides & Spokes to YOU */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Concentric Capability Orbit Guides */}
                <circle cx="50%" cy="50%" r="20%" fill="none" stroke="#E2DDD5" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.4" />
                <circle cx="50%" cy="50%" r="37%" fill="none" stroke="#E2DDD5" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.35" />

                {/* Spokes from Central Anchor (YOU) to each Competency with Clear Visibility */}
                {HERO_NETWORK_NODES.map((node, index) => {
                  const total = HERO_NETWORK_NODES.length;
                  const angleDeg = -90 + index * (360 / total);
                  const angleRad = (angleDeg * Math.PI) / 180;
                  const targetX = 50 + 37 * Math.cos(angleRad);
                  const targetY = 50 + 36 * Math.sin(angleRad);

                  const isSpokeHighlighted = hoveredNode === node.id || hoveredNode === 'center-you';
                  const isGap = node.isGap;
                  const isProficient = node.status === 'proficient';
                  const isOnTrack = node.status === 'on_track';

                  // Clear, visible color mapping matching each competency status
                  const strokeColor = isGap
                    ? '#B38A3D'
                    : isProficient
                    ? '#2E8B57'
                    : isOnTrack
                    ? '#A85D4C'
                    : '#B38A3D';

                  // Width hierarchy
                  const strokeWidth = isSpokeHighlighted
                    ? 2.5
                    : isGap
                    ? 2
                    : 1.5;

                  // Opacity hierarchy - all 5 connections remain clearly visible
                  const strokeOpacity = isSpokeHighlighted
                    ? 0.95
                    : hoveredNode !== null
                    ? 0.2
                    : isGap
                    ? 0.85
                    : isProficient
                    ? 0.65
                    : 0.75;

                  // Dash pattern for gaps / developing
                  const strokeDasharray = isGap
                    ? '4 4'
                    : node.status === 'priority_gap'
                    ? '3 3'
                    : 'none';

                  return (
                    <line
                      key={`spoke-${node.id}`}
                      x1="50%"
                      y1="50%"
                      x2={`${targetX}%`}
                      y2={`${targetY}%`}
                      stroke={strokeColor}
                      strokeOpacity={strokeOpacity}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDasharray}
                      className={isGap ? 'animate-flow-line' : ''}
                    />
                  );
                })}
              </svg>

              {/* Central Anchor / "YOU" Node */}
              <div
                style={{ left: '50%', top: '50%' }}
                tabIndex={0}
                role="region"
                aria-label={`Overall Officer Readiness: ${Math.round(HERO_NETWORK_NODES.reduce((acc, n) => acc + n.score, 0) / HERO_NETWORK_NODES.length)}%`}
                onMouseEnter={() => setHoveredNode('center-you')}
                onMouseLeave={() => setHoveredNode(null)}
                onFocus={() => setHoveredNode('center-you')}
                onBlur={() => setHoveredNode(null)}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ease-out z-15 select-none rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D4C] focus-visible:ring-offset-2",
                  hoveredNode === 'center-you' ? "scale-[1.03] z-25 shadow-lg" : "hover:scale-[1.02]"
                )}
              >
                <div className="w-[76px] h-[76px] sm:w-[82px] sm:h-[82px] rounded-full bg-[#2D3030] border-2 border-[#E2DDD5] ring-2 ring-[#A85D4C]/30 text-[#FFFDF9] flex flex-col items-center justify-center p-1 shadow-[0_2px_6px_rgba(45,48,48,0.15)] text-center transition-all duration-200 ease-out">
                  <span className="text-[8px] sm:text-[9px] font-mono uppercase text-[#A85D4C] font-bold tracking-wider leading-none">
                    YOU
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono text-[#FFFDF9] leading-tight my-0.5">
                    {Math.round(HERO_NETWORK_NODES.reduce((acc, n) => acc + n.score, 0) / HERO_NETWORK_NODES.length)}%
                  </span>
                  <span className="text-[7px] sm:text-[8px] font-mono uppercase text-[#FFFDF9]/65 tracking-tight leading-none">
                    READINESS
                  </span>
                </div>
              </div>

              {/* Radially Arranged Competency Nodes */}
              {HERO_NETWORK_NODES.map((node, index) => {
                const total = HERO_NETWORK_NODES.length;
                const angleDeg = -90 + index * (360 / total);
                const angleRad = (angleDeg * Math.PI) / 180;
                const posX = 50 + 37 * Math.cos(angleRad);
                const posY = 50 + 36 * Math.sin(angleRad);

                const isSelected = hoveredNode === node.id;
                const isGap = node.isGap;

                return (
                  <div
                    key={node.id}
                    style={{ left: `${posX}%`, top: `${posY}%` }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${node.label}: ${node.score}% (Target: ${node.target}%)`}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onFocus={() => setHoveredNode(node.id)}
                    onBlur={() => setHoveredNode(null)}
                    className={cn(
                      "absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ease-out z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85D4C] focus-visible:ring-offset-2",
                      isSelected ? "scale-[1.02] z-20" : "hover:scale-[1.02]"
                    )}
                  >
                    <div className={cn(
                      "p-2 sm:p-2.5 rounded-xl border flex items-center space-x-2.5 transition-all duration-200 ease-out bg-[#FFFDF9]/90 backdrop-blur-sm",
                      isGap 
                        ? "border-[#B38A3D] ring-2 ring-[#B38A3D]/30 shadow-[0_2px_8px_rgba(179,138,61,0.12)] hover:shadow-md"
                        : node.status === 'proficient'
                        ? "border-[#2E8B57]/40 hover:border-[#2E8B57] shadow-[0_1px_3px_rgba(46,139,87,0.06)] hover:shadow-md"
                        : node.status === 'on_track'
                        ? "border-[#A85D4C]/35 hover:border-[#A85D4C] shadow-[0_1px_3px_rgba(168,93,76,0.06)] hover:shadow-md"
                        : "border-[#B38A3D]/40 hover:border-[#B38A3D] shadow-[0_1px_3px_rgba(179,138,61,0.06)] hover:shadow-md"
                    )}>
                      {/* Circular Score Progress Ring */}
                      <div className="relative w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <circle
                            cx="18"
                            cy="18"
                            r="14"
                            fill="none"
                            stroke="#E2DDD5"
                            strokeWidth="2.5"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="14"
                            fill="none"
                            stroke={
                              isGap
                                ? '#B38A3D'
                                : node.status === 'proficient'
                                ? '#2E8B57'
                                : node.status === 'on_track'
                                ? '#A85D4C'
                                : '#B38A3D'
                            }
                            strokeWidth="3"
                            strokeDasharray="88"
                            strokeDashoffset={88 - (88 * node.score) / 100}
                            strokeLinecap="round"
                            className="transition-all duration-500"
                          />
                        </svg>
                        <span className={cn(
                          "absolute font-mono font-bold text-[9px] sm:text-[10px]",
                          isGap 
                            ? "text-[#B38A3D]" 
                            : node.status === 'proficient' 
                            ? "text-[#2E8B57]" 
                            : node.status === 'on_track'
                            ? "text-[#A85D4C]"
                            : "text-[#B38A3D]"
                        )}>
                          {node.score}%
                        </span>
                      </div>

                      <div className="text-left min-w-0">
                        <div className="text-[11px] sm:text-xs font-bold text-[#292B2B] leading-tight flex items-center gap-1">
                          <span>{node.label}</span>
                          {isGap ? (
                            <AlertTriangle className="w-3 h-3 text-[#B38A3D] shrink-0" />
                          ) : node.status === 'proficient' ? (
                            <CheckCircle2 className="w-3 h-3 text-[#2E8B57] shrink-0" />
                          ) : null}
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-[#7A756E] font-mono mt-0.5 flex items-center gap-1.5">
                          <span>Target: {node.target}%</span>
                          {isGap ? (
                            <span className="text-[#B38A3D] font-bold">(-22% Gap)</span>
                          ) : node.status === 'proficient' ? (
                            <span className="text-[#2E8B57] font-semibold">✓ Strong</span>
                          ) : node.status === 'on_track' ? (
                            <span className="text-[#A85D4C] font-semibold">On Track</span>
                          ) : (
                            <span className="text-[#B38A3D] font-semibold">(-24% Gap)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isGap && (
                      <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.2 rounded-md bg-[#B38A3D] text-[#FFFDF9] text-[7px] sm:text-[8px] font-bold tracking-wider shadow-xs uppercase font-mono border border-[#7D4036]/20">
                        PRIMARY BOTTLENECK
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Dynamic Diagnostic Insight Strip */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-[#F7F4EE]/90 backdrop-blur-sm border border-[#E2DDD5]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-left shadow-[0_1px_2px_rgba(45,48,48,0.02)]">
              <div className="flex items-start sm:items-center space-x-2.5 text-[#292B2B]">
                <div className="w-7 h-7 rounded-lg bg-[#A85D4C]/10 flex items-center justify-center text-[#A85D4C] shrink-0 mt-0.5 sm:mt-0">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#A85D4C] block font-mono">
                    AI Diagnostic Insight
                  </span>
                  <p className="text-[11px] sm:text-xs text-[#292B2B] font-medium leading-tight">
                    Prerequisite weakness in <strong>Sampling Formulas</strong> blocks Survey Clearance.
                  </p>
                </div>
              </div>
              <Link 
                to="/login" 
                className="shrink-0 inline-flex items-center text-[#A85D4C] hover:text-[#7D4036] font-semibold text-xs transition-colors hover:underline"
              >
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
