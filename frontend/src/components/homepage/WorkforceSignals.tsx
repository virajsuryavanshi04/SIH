import React, { useState } from 'react';
import { 
  BarChart2, ShieldCheck, Filter, AlertTriangle, CheckCircle2, 
  TrendingUp, Users, Sparkles, ChevronRight, ChevronDown, 
  Code2, HelpCircle, Eye, Flag, Brain, ArrowRight, User
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper component: Circular Progress Donut Ring
const CircularProgressRing = ({ score }: { score: number }) => {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let strokeColor = '#D9534F'; // < 65% Red
  let bgFill = 'rgba(217, 83, 79, 0.06)';
  if (score >= 80) {
    strokeColor = '#2E8B57'; // >= 80% Green
    bgFill = 'rgba(46, 139, 87, 0.06)';
  } else if (score >= 65) {
    strokeColor = '#B38A3D'; // 65% - 79% Gold
    bgFill = 'rgba(179, 138, 61, 0.06)';
  }

  return (
    <div className="relative inline-flex items-center justify-center w-11 h-11">
      <svg className="w-11 h-11 transform -rotate-90" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke="#EBE6DE"
          strokeWidth="3"
          fill={bgFill}
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke={strokeColor}
          strokeWidth="3"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span className="absolute text-[11px] font-mono font-bold text-[#292B2B]">
        {score}%
      </span>
    </div>
  );
};

// Helper component: Semi-circular Speedometer Gauge with Needle
const SemiCircleGauge = ({ value = 27 }: { value?: number }) => {
  // Speedometer needle angle: 0% is Right (Green, 0°), 100% is Left (Red, 180°)
  // For 27% risk on the Red/Orange side: angle = 180 - (value * 1.8) = 131.4°
  const needleAngle = 180 - (value * 1.8);

  return (
    <div className="w-full max-w-[220px] mx-auto flex flex-col items-center justify-center select-none py-1">
      <svg viewBox="0 0 220 155" className="w-full overflow-visible">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D9534F" />
            <stop offset="35%" stopColor="#A85D4C" />
            <stop offset="70%" stopColor="#B38A3D" />
            <stop offset="100%" stopColor="#2E8B57" />
          </linearGradient>
        </defs>

        {/* Background Track */}
        <path
          d="M 24 125 A 86 86 0 0 1 196 125"
          fill="none"
          stroke="#EFEBE4"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Value Arc */}
        <path
          d="M 24 125 A 86 86 0 0 1 196 125"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Speedometer Needle / Arrow pointing to current percentage */}
        <g transform={`rotate(${180 - needleAngle}, 110, 125)`}>
          <line
            x1="110"
            y1="125"
            x2="38"
            y2="125"
            stroke="#2D3030"
            strokeWidth="2.25"
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
          {/* Pointer Arrowhead */}
          <polygon
            points="32,125 42,121.5 42,128.5"
            fill="#2D3030"
          />
        </g>

        {/* Needle Center Pivot Cap */}
        <circle cx="110" cy="125" r="5" fill="#2D3030" />
        <circle cx="110" cy="125" r="2" fill="#FFFDF9" />

        {/* 1. 27% (Dominant Metric in Center Cavity) */}
        <text
          x="110"
          y="76"
          textAnchor="middle"
          fill="#292B2B"
          className="font-mono"
          style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.03em' }}
        >
          {value}%
        </text>

        {/* 2. High Badge */}
        <g transform="translate(86, 86)">
          <rect width="48" height="18" rx="9" fill="#D9534F" fillOpacity="0.12" stroke="#D9534F" strokeOpacity="0.25" strokeWidth="1" />
          <text x="24" y="12.5" textAnchor="middle" fill="#D9534F" className="font-mono" style={{ fontSize: '10px', fontWeight: 'bold' }}>
            High
          </text>
        </g>

        {/* 3. OVERALL WORKFORCE RISK (Cleanly positioned below baseline) */}
        <text
          x="110"
          y="148"
          textAnchor="middle"
          fill="#7A756E"
          className="font-mono"
          style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.08em' }}
        >
          OVERALL WORKFORCE RISK
        </text>
      </svg>
    </div>
  );
};

export default function WorkforceSignals() {
  const [filterByRiskOpen, setFilterByRiskOpen] = useState(false);

  // 7 Competency Risk Rows
  const riskRankings = [
    { rank: '01', name: 'Statistical Programming', icon: Code2, value: '27%', gap: 27, status: 'Critical', color: 'bg-[#D9534F]', pillColor: 'bg-[#D9534F]/10 text-[#D9534F] border-[#D9534F]/20', width: 72 },
    { rank: '02', name: 'Survey Methodology', icon: HelpCircle, value: '24%', gap: 24, status: 'High', color: 'bg-[#A85D4C]', pillColor: 'bg-[#A85D4C]/10 text-[#A85D4C] border-[#A85D4C]/20', width: 64 },
    { rank: '03', name: 'Sampling Techniques', icon: Filter, value: '22%', gap: 22, status: 'High', color: 'bg-[#A85D4C]', pillColor: 'bg-[#A85D4C]/10 text-[#A85D4C] border-[#A85D4C]/20', width: 58 },
    { rank: '04', name: 'Data Quality & Validation', icon: ShieldCheck, value: '18%', gap: 18, status: 'High', color: 'bg-[#A85D4C]', pillColor: 'bg-[#A85D4C]/10 text-[#A85D4C] border-[#A85D4C]/20', width: 48 },
    { rank: '05', name: 'Data Analysis & Modeling', icon: BarChart2, value: '16%', gap: 16, status: 'Moderate', color: 'bg-[#B38A3D]', pillColor: 'bg-[#B38A3D]/15 text-[#B38A3D] border-[#B38A3D]/30', width: 42 },
    { rank: '06', name: 'Data Visualization', icon: Eye, value: 'Target Met', gap: 0, status: 'Met', color: 'bg-[#2E8B57]', pillColor: 'bg-[#2E8B57]/10 text-[#2E8B57] border-[#2E8B57]/20', width: 100 },
    { rank: '07', name: 'Statistical Methods', icon: Sparkles, value: 'Target Met', gap: 0, status: 'Met', color: 'bg-[#2E8B57]', pillColor: 'bg-[#2E8B57]/10 text-[#2E8B57] border-[#2E8B57]/20', width: 100 },
  ];

  // 7 Domain Rows for Right Heatmap Table
  const heatmapRows = [
    { name: 'Statistical Methods', icon: Sparkles, scores: [86, 68, 88, 72] },
    { name: 'Sampling Techniques', icon: Filter, scores: [48, 64, 52, 48] },
    { name: 'Survey Methodology', icon: HelpCircle, scores: [51, 74, 58, 45] },
    { name: 'Data Quality & Validation', icon: ShieldCheck, scores: [62, 68, 78, 76] },
    { name: 'Data Analysis', icon: BarChart2, scores: [64, 62, 90, 60] },
    { name: 'Statistical Programming', icon: Code2, scores: [43, 38, 86, 42] },
    { name: 'Data Visualization', icon: Eye, scores: [81, 64, 88, 70] },
  ];

  return (
    <section id="workforce-signals" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-[#E2DDD5] bg-[#F7F4EE] relative select-none">
      <div className="max-w-[1440px] mx-auto space-y-8 sm:space-y-10">
        
        {/* 2-Column Institutional Stats Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start text-left">
          
          {/* ============================================================ */}
          {/* LEFT CARD: Workforce Competency Risk Overview                */}
          {/* ============================================================ */}
          <div className="lg:col-span-6 bg-[#FFFDF9] rounded-3xl border border-[#E2DDD5] p-6 sm:p-7 shadow-[0_2px_12px_rgba(45,48,48,0.04)] space-y-4">
            
            {/* 1. Header with Compact Spacing and Aligned By Risk Control */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#292B2B] tracking-tight leading-tight">
                  Workforce Competency Risk Overview
                </h3>
                <p className="text-xs sm:text-sm text-[#7A756E] mt-0.5">
                  Average deficiency measured across official roles
                </p>
              </div>

              <div className="relative shrink-0">
                <button
                  onClick={() => setFilterByRiskOpen(!filterByRiskOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E2DDD5] bg-[#FFFDF9] hover:bg-[#EFEBE4] text-xs font-semibold text-[#292B2B] transition-all cursor-pointer shadow-xs"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-[#B38A3D]" />
                  <span>By Risk</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#7A756E]" />
                </button>
              </div>
            </div>

            {/* 2. Top Analytical Area: Balanced 2-Column (Gauge + 4 Risk Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-1 pb-1">
              
              {/* LEFT: Gauge (Vertically centered) */}
              <div className="flex items-center justify-center h-full py-1">
                <SemiCircleGauge value={27} />
              </div>

              {/* RIGHT: 4 Risk Summary Cards with Equal Structure & Arrow Alignment */}
              <div className="flex flex-col justify-between space-y-2 h-full">
                {[
                  { dot: 'bg-[#D9534F]', count: '2', title: 'Critical Gaps', range: '(> 24%)' },
                  { dot: 'bg-[#A85D4C]', count: '3', title: 'High Gaps', range: '(16% - 24%)' },
                  { dot: 'bg-[#B38A3D]', count: '1', title: 'Moderate Gap', range: '(10% - 15%)' },
                  { dot: 'bg-[#2E8B57]', count: '2', title: 'Target Met', range: '(< 10%)' }
                ].map((c, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between h-10.5 px-3.5 rounded-xl border border-[#E2DDD5] bg-[#FFFDF9] hover:bg-[#EFEBE4]/50 transition-all duration-200 cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", c.dot)} />
                      <span className="text-sm font-extrabold font-mono text-[#292B2B] w-3 text-center shrink-0">{c.count}</span>
                      <div className="flex items-baseline gap-1.5 sm:flex-col sm:items-start text-left min-w-0">
                        <span className="text-xs font-bold text-[#292B2B] leading-tight truncate">{c.title}</span>
                        <span className="text-[10px] text-[#7A756E] font-mono leading-tight shrink-0">{c.range}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8C857B] shrink-0 ml-auto" />
                  </div>
                ))}
              </div>

            </div>

            {/* 3. Section Divider with Balanced Spacing */}
            <div className="pt-3 border-t border-[#E2DDD5] flex items-center gap-2">
              <BarChart2 className="w-3.5 h-3.5 text-[#D9534F]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#292B2B]">
                COMPETENCY RISK RANKING
              </span>
            </div>

            {/* 4. Competency Risk Ranking Grid */}
            <div className="space-y-2 pt-0.5">
              {riskRankings.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.rank} className="flex items-center gap-3 text-xs">
                    {/* Rank Column */}
                    <span className="text-[11px] font-mono font-bold text-[#7A756E] w-5 text-center shrink-0">
                      {item.rank}
                    </span>

                    {/* Icon Column */}
                    <div className="w-6.5 h-6.5 rounded-md bg-[#EFEBE4] border border-[#E2DDD5] flex items-center justify-center text-[#7A756E] shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    {/* Competency Name Column */}
                    <span className="w-40 sm:w-44 text-xs font-bold text-[#292B2B] truncate shrink-0 text-left">
                      {item.name}
                    </span>

                    {/* Progress / Deficit Bar */}
                    <div className="flex-1 min-w-[50px] h-2 bg-[#EFEBE4] rounded-full overflow-hidden shrink">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", item.color)}
                        style={{ width: `${item.width}%` }}
                      />
                    </div>

                    {/* Deficit Percentage Column */}
                    <span className={cn(
                      "w-14 sm:w-16 text-right font-mono font-bold text-xs shrink-0",
                      item.gap === 0 ? "text-[#2E8B57]" : "text-[#292B2B]"
                    )}>
                      {item.value}
                    </span>

                    {/* Status Badge Column */}
                    <div className="w-16 sm:w-18 flex justify-end shrink-0">
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border text-center w-full", item.pillColor)}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 5. Bottom Callout Banner */}
            <div className="p-3.5 bg-[#F7F4EE] rounded-2xl border border-[#E2DDD5] flex items-center justify-between gap-4 mt-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#7D4036] text-[#FFFDF9] flex items-center justify-center shrink-0 shadow-xs">
                  <Flag className="w-5 h-5" />
                </div>
                <div className="space-y-0.5 min-w-0 text-left">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A85D4C] block">
                    PRIMARY DIVISION RISK
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-[#292B2B] truncate">
                    Statistical Programming (-27% deficiency)
                  </h4>
                  <p className="text-[11px] text-[#7A756E] leading-tight line-clamp-1">
                    This competency has the highest average deficiency across all official roles.
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-[#7D4036] text-[#FFFDF9] flex items-center justify-center shrink-0 cursor-pointer hover:bg-[#2D3030] transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

          </div>


          {/* ============================================================ */}
          {/* RIGHT CARD: Role Proficiency Overview                        */}
          {/* ============================================================ */}
          <div className="lg:col-span-6 bg-[#FFFDF9] rounded-3xl border border-[#E2DDD5] p-6 sm:p-7 shadow-[0_2px_12px_rgba(45,48,48,0.04)] space-y-6">
            
            {/* Header with Legend */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#292B2B] tracking-tight">
                  Role Proficiency Overview
                </h2>
                <p className="text-xs sm:text-sm text-[#7A756E] mt-1">
                  Proficiency status by official designation
                </p>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-mono font-semibold text-[#7A756E]">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#2E8B57]" /> ≥ 80%</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#B38A3D]" /> 65% - 79%</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#D9534F]" /> &lt; 65%</span>
              </div>
            </div>

            {/* Top 4 KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              
              {/* KPI 1 */}
              <div className="p-3.5 rounded-2xl border border-[#E2DDD5] bg-[#FFFDF9] text-center space-y-1">
                <div className="w-7 h-7 rounded-lg bg-[#2E8B57]/10 text-[#2E8B57] flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-2xl font-extrabold font-mono text-[#292B2B]">2</div>
                <div className="text-[10px] font-bold text-[#292B2B] leading-tight">Strong Across Roles</div>
                <div className="text-[9px] text-[#7A756E] font-mono">(≥ 80%)</div>
              </div>

              {/* KPI 2 */}
              <div className="p-3.5 rounded-2xl border border-[#E2DDD5] bg-[#FFFDF9] text-center space-y-1">
                <div className="w-7 h-7 rounded-lg bg-[#B38A3D]/15 text-[#B38A3D] flex items-center justify-center mx-auto">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="text-2xl font-extrabold font-mono text-[#292B2B]">21</div>
                <div className="text-[10px] font-bold text-[#292B2B] leading-tight">Moderate Proficiency</div>
                <div className="text-[9px] text-[#7A756E] font-mono">(65% - 79%)</div>
              </div>

              {/* KPI 3 */}
              <div className="p-3.5 rounded-2xl border border-[#E2DDD5] bg-[#FFFDF9] text-center space-y-1">
                <div className="w-7 h-7 rounded-lg bg-[#D9534F]/10 text-[#D9534F] flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="text-2xl font-extrabold font-mono text-[#292B2B]">11</div>
                <div className="text-[10px] font-bold text-[#292B2B] leading-tight">Needs Attention</div>
                <div className="text-[9px] text-[#7A756E] font-mono">(&lt; 65%)</div>
              </div>

              {/* KPI 4 */}
              <div className="p-3.5 rounded-2xl border border-[#E2DDD5] bg-[#FFFDF9] text-center space-y-1">
                <div className="w-7 h-7 rounded-lg bg-[#EFEBE4] text-[#292B2B] flex items-center justify-center mx-auto border border-[#E2DDD5]">
                  <Users className="w-4 h-4 text-[#7A756E]" />
                </div>
                <div className="text-2xl font-extrabold font-mono text-[#292B2B]">34</div>
                <div className="text-[10px] font-bold text-[#292B2B] leading-tight">Total Role Assessments</div>
                <div className="text-[9px] text-[#7A756E] font-mono">Official Sample</div>
              </div>

            </div>

            {/* Table with Circular Donut Rings */}
            <div className="overflow-x-auto rounded-2xl border border-[#E2DDD5]">
              <table className="w-full min-w-[540px] text-xs text-center border-collapse">
                <thead>
                  <tr className="bg-[#EFEBE4] border-b border-[#E2DDD5]">
                    <th className="p-3 text-left font-bold text-[#292B2B] uppercase text-[11px] tracking-wider w-44">
                      DOMAIN
                    </th>
                    <th className="p-2.5 font-bold text-[#292B2B] text-[11px] border-l border-[#E2DDD5]">
                      <div className="flex items-center justify-center gap-1">
                        <User className="w-3.5 h-3.5 text-[#7A756E]" />
                        <span>Statistical Officer</span>
                      </div>
                    </th>
                    <th className="p-2.5 font-bold text-[#292B2B] text-[11px] border-l border-[#E2DDD5]">
                      <div className="flex items-center justify-center gap-1">
                        <User className="w-3.5 h-3.5 text-[#7A756E]" />
                        <span>Survey Officer</span>
                      </div>
                    </th>
                    <th className="p-2.5 font-bold text-[#292B2B] text-[11px] border-l border-[#E2DDD5]">
                      <div className="flex items-center justify-center gap-1">
                        <User className="w-3.5 h-3.5 text-[#7A756E]" />
                        <span>Data Analyst</span>
                      </div>
                    </th>
                    <th className="p-2.5 font-bold text-[#292B2B] text-[11px] border-l border-[#E2DDD5]">
                      <div className="flex items-center justify-center gap-1">
                        <User className="w-3.5 h-3.5 text-[#7A756E]" />
                        <span>Investigator</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DDD5] bg-[#FFFDF9]">
                  {heatmapRows.map((row) => {
                    const Icon = row.icon;
                    return (
                      <tr key={row.name} className="hover:bg-[#F7F4EE]/60 transition-colors">
                        <td className="p-2.5 text-left font-bold text-[#292B2B] text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-[#EFEBE4] flex items-center justify-center text-[#7A756E] shrink-0 border border-[#E2DDD5]/70">
                              <Icon className="w-3 h-3" />
                            </div>
                            <span className="truncate">{row.name}</span>
                          </div>
                        </td>
                        {row.scores.map((score, i) => (
                          <td key={i} className="p-2 border-l border-[#E2DDD5]">
                            <CircularProgressRing score={score} />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom AI Insight Strip */}
            <div className="p-4 bg-[#F7F4EE] rounded-2xl border border-[#E2DDD5] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#7D4036] text-[#FFFDF9] flex items-center justify-center shrink-0 shadow-xs">
                  <Brain className="w-5 h-5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A85D4C] block">
                    AI INSIGHT
                  </span>
                  <p className="text-xs font-bold text-[#292B2B] leading-snug">
                    Survey Methodology shows inconsistent proficiency across roles. Focused training for Investigators & Data Analysts is recommended.
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-[#7D4036] text-[#FFFDF9] flex items-center justify-center shrink-0 cursor-pointer hover:bg-[#2D3030] transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}


