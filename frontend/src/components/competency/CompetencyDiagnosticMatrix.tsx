import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Layers, 
  BookOpen, 
  ArrowRight, 
  Target, 
  Clock, 
  Brain,
  GitFork,
  Sparkles,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface DiagnosticCompetencyItem {
  id: number;
  name: string;
  domain: string;
  description?: string;
  current_score: number | null;
  target_score: number;
  gap: number;
  level: number;
  maxLevel: number;
  topicsTotal: number;
  topicsMastered: number;
  subtopics: Array<{
    id: number;
    name: string;
    score: number | null;
    status: 'strong' | 'on_track' | 'weak' | 'untested';
    questionsTotal: number;
    questionsCorrect: number;
  }>;
  status: 'STRONG' | 'DEVELOPING' | 'NEEDS_ATTENTION' | 'CRITICAL' | 'UNTESTED';
  prerequisites: string[];
  dependentCompetencies: string[];
  assessmentCount: number;
  lastAssessed?: string;
  recommendedCourse?: {
    title: string;
    duration: string;
    type: string;
  };
}

interface Props {
  competencies: DiagnosticCompetencyItem[];
  onSelectNode?: (nodeId: number) => void;
}

export default function CompetencyDiagnosticMatrix({ competencies, onSelectNode }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');

  const toggleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
    if (onSelectNode) {
      onSelectNode(id);
    }
  };

  // Domain list for filtering
  const domains = Array.from(new Set(competencies.map(c => c.domain))).filter(Boolean);

  // Filter competencies based on active filter pills
  const filtered = competencies.filter(c => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (selectedDomain !== 'ALL' && c.domain !== selectedDomain) return false;
    return true;
  });

  // Calculate summary counts
  const totalComps = competencies.length;
  const strongCount = competencies.filter(c => c.status === 'STRONG').length;
  const developingCount = competencies.filter(c => c.status === 'DEVELOPING').length;
  const attentionCount = competencies.filter(c => c.status === 'NEEDS_ATTENTION' || c.status === 'CRITICAL').length;
  const totalTopics = competencies.reduce((acc, c) => acc + c.topicsTotal, 0);
  const masteredTopics = competencies.reduce((acc, c) => acc + c.topicsMastered, 0);

  return (
    <div className="space-y-6 text-left">
      
      {/* 1. TOP CAPABILITY TELEMETRY SUMMARY BAR */}
      <div className="bg-[#FFFDF9] rounded-2xl p-5 border border-[#E2DDD5] shadow-[0_1px_4px_rgba(45, 48, 48, 0.04)] flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Summary Metrics */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm">
          <div>
            <span className="text-[10px] font-mono uppercase text-[#7A756E] font-semibold block">Framework Scale</span>
            <span className="text-base sm:text-lg font-bold text-[#292B2B] font-mono">
              {totalComps} <span className="text-xs font-normal text-[#7A756E] font-sans">Competencies</span>
            </span>
          </div>

          <div className="h-8 w-px bg-[#E2DDD5] hidden sm:block" />

          <div>
            <span className="text-[10px] font-mono uppercase text-[#7A756E] font-semibold block">Topic Coverage</span>
            <span className="text-base sm:text-lg font-bold text-[#A85D4C] font-mono">
              {masteredTopics} <span className="text-xs font-normal text-[#7A756E] font-sans">/ {totalTopics} Mastered</span>
            </span>
          </div>

          <div className="h-8 w-px bg-[#E2DDD5] hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#2E8B57]/10 text-[#2E8B57] border border-[#2E8B57]/20 font-mono">
              ● {strongCount} Strong
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#A85D4C]/10 text-[#A85D4C] border border-[#A85D4C]/20 font-mono">
              ◐ {developingCount} Developing
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#B38A3D]/15 text-[#292B2B] border border-[#B38A3D]/35 font-mono">
              ⚠ {attentionCount} Gaps
            </span>
          </div>
        </div>

        {/* Right: Filter Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-mono text-[#7A756E] font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {['ALL', 'STRONG', 'DEVELOPING', 'NEEDS_ATTENTION', 'CRITICAL'].map((fKey) => (
            <button
              key={fKey}
              onClick={() => setStatusFilter(fKey)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border",
                statusFilter === fKey
                  ? "bg-[#2D3030] text-[#FFFDF9] border-[#2D3030] shadow-xs"
                  : "bg-[#EFEBE4] text-[#292B2B] border-[#E2DDD5] hover:border-[#A85D4C]/40"
              )}
            >
              {fKey === 'ALL' && 'All'}
              {fKey === 'STRONG' && 'Strong'}
              {fKey === 'DEVELOPING' && 'Developing'}
              {fKey === 'NEEDS_ATTENTION' && 'Attention'}
              {fKey === 'CRITICAL' && 'Critical'}
            </button>
          ))}
        </div>

      </div>

      {/* 2. THE COMPETENCY DIAGNOSTIC MATRIX */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#E2DDD5] shadow-[0_1px_4px_rgba(45, 48, 48, 0.04)] overflow-hidden">
        
        {/* Matrix Header Row (Desktop) */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3.5 bg-[#EFEBE4] border-b border-[#E2DDD5] text-xs font-semibold text-[#292B2B] uppercase tracking-wider font-mono">
          <div className="col-span-4">Competency & Structure</div>
          <div className="col-span-2">Domain</div>
          <div className="col-span-2 text-center">Proficiency Level</div>
          <div className="col-span-2 text-center">Topic Coverage</div>
          <div className="col-span-2 text-right">Readiness & Action</div>
        </div>

        {/* Matrix Body Rows */}
        <div className="divide-y divide-[#E2DDD5]">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#7A756E]">
              No competencies match the selected filter criteria.
            </div>
          ) : (
            filtered.map((comp) => {
              const isExpanded = expandedId === comp.id;
              const isAssessed = comp.current_score !== null;
              const coveragePct = comp.topicsTotal > 0 ? (comp.topicsMastered / comp.topicsTotal) * 100 : 0;

              return (
                <div 
                  key={comp.id}
                  className={cn(
                    "transition-colors",
                    isExpanded ? "bg-[#A85D4C]/5" : "hover:bg-[#EFEBE4]/50"
                  )}
                >
                  {/* Primary Row Header */}
                  <div
                    onClick={() => toggleExpand(comp.id)}
                    className="p-4 sm:px-6 sm:py-4.5 cursor-pointer grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-center"
                  >
                    {/* Col 1: Competency & Prerequisites */}
                    <div className="lg:col-span-4 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm sm:text-base text-[#292B2B]">
                          {comp.name}
                        </span>
                        <ChevronDown className={cn("w-4 h-4 text-[#A85D4C] transition-transform duration-200", isExpanded && "rotate-180")} />
                      </div>
                      
                      {/* Prerequisite Indicator */}
                      {comp.prerequisites.length > 0 && (
                        <div className="flex items-center space-x-1.5 text-[11px] font-mono text-[#A85D4C]">
                          <GitFork className="w-3 h-3 shrink-0" />
                          <span className="truncate">↳ Req: {comp.prerequisites.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Col 2: Domain */}
                    <div className="lg:col-span-2">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#A85D4C]/10 text-[#A85D4C] text-xs font-semibold font-mono border border-[#A85D4C]/20">
                        {comp.domain}
                      </span>
                    </div>

                    {/* Col 3: Proficiency Level */}
                    <div className="lg:col-span-2 flex flex-col lg:items-center">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-[#292B2B] font-mono">
                          Level {comp.level} / {comp.maxLevel}
                        </span>
                      </div>
                      {/* Level Dot Meter */}
                      <div className="flex items-center space-x-1 mt-1">
                        {Array.from({ length: comp.maxLevel }).map((_, idx) => (
                          <span
                            key={idx}
                            className={cn(
                              "w-2 h-2 rounded-full",
                              idx < comp.level ? "bg-[#A85D4C]" : "bg-[#E2DDD5]"
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Col 4: Topic Coverage Micro-Bar */}
                    <div className="lg:col-span-2 flex flex-col lg:items-center space-y-1">
                      <span className="text-xs font-semibold text-[#292B2B] font-mono">
                        {comp.topicsMastered} / {comp.topicsTotal} topics
                      </span>
                      <div className="w-24 h-1.5 bg-[#E2DDD5] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#A85D4C] rounded-full transition-all duration-500"
                          style={{ width: `${coveragePct}%` }}
                        />
                      </div>
                    </div>

                    {/* Col 5: Readiness State & Action */}
                    <div className="lg:col-span-2 flex items-center justify-between lg:justify-end gap-2.5">
                      <span
                        className={cn(
                          "text-xs font-semibold px-2.5 py-0.5 rounded-full border font-mono flex items-center gap-1.5",
                          comp.status === 'STRONG'
                            ? "bg-[#2E8B57]/10 text-[#2E8B57] border-[#2E8B57]/30"
                            : comp.status === 'DEVELOPING'
                            ? "bg-[#A85D4C]/10 text-[#A85D4C] border-[#A85D4C]/20"
                            : comp.status === 'NEEDS_ATTENTION'
                            ? "bg-[#B38A3D]/15 text-[#292B2B] border-[#B38A3D]/35"
                            : comp.status === 'CRITICAL'
                            ? "bg-[#D9534F]/10 text-[#D9534F] border-[#D9534F]/30"
                            : "bg-[#EFEBE4] text-[#7A756E] border-[#E2DDD5]"
                        )}
                      >
                        {comp.status === 'STRONG' && <>● STRONG</>}
                        {comp.status === 'DEVELOPING' && <>◐ DEVELOPING</>}
                        {comp.status === 'NEEDS_ATTENTION' && <>⚠ ATTENTION</>}
                        {comp.status === 'CRITICAL' && <>⚠ CRITICAL</>}
                        {comp.status === 'UNTESTED' && <>○ UNTESTED</>}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(comp.id);
                        }}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#EFEBE4] hover:bg-[#A85D4C]/10 text-[#A85D4C] border border-[#E2DDD5] transition-all cursor-pointer"
                      >
                        {isExpanded ? 'Hide' : 'Inspect'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Diagnostic Details Drawer */}
                  {isExpanded && (
                    <div className="p-5 sm:p-6 bg-[#FFFDF9] border-t border-[#E2DDD5] space-y-5 animate-in fade-in duration-150">
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        {/* 1. Underlying Subtopics Coverage */}
                        <div className="md:col-span-2 space-y-2">
                          <span className="text-xs font-mono font-semibold text-[#292B2B] uppercase tracking-wider block">
                            Subtopic Mastery Breakdown ({comp.topicsMastered}/{comp.topicsTotal})
                          </span>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {comp.subtopics.map((sub) => {
                              const isStrong = sub.status === 'strong' || (sub.score && sub.score >= 75);
                              const isWeak = sub.status === 'weak' || (sub.score !== null && sub.score < 50);

                              return (
                                <div
                                  key={sub.id}
                                  className={cn(
                                    "p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2",
                                    isStrong
                                      ? "bg-[#2E8B57]/5 border-[#2E8B57]/20 text-[#2E8B57]"
                                      : isWeak
                                      ? "bg-[#B38A3D]/10 border-[#B38A3D]/30 text-[#292B2B]"
                                      : "bg-[#EFEBE4] border-[#E2DDD5] text-[#292B2B]"
                                  )}
                                >
                                  <div className="flex items-center space-x-2 truncate">
                                    {isStrong ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2E8B57] shrink-0" />
                                    ) : isWeak ? (
                                      <AlertTriangle className="w-3.5 h-3.5 text-[#B38A3D] shrink-0" />
                                    ) : (
                                      <span className="w-3.5 h-3.5 rounded-full border border-[#E2DDD5] shrink-0" />
                                    )}
                                    <span className="font-medium truncate">{sub.name}</span>
                                  </div>
                                  <span className="text-[11px] font-mono font-semibold shrink-0">
                                    {sub.score !== null ? `${Math.round(sub.score)}%` : 'Untested'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. Structural Dependencies & Prerequisite Context */}
                        <div className="space-y-2 bg-[#EFEBE4] p-4 rounded-xl border border-[#E2DDD5] text-xs">
                          <span className="text-xs font-mono font-semibold text-[#A85D4C] uppercase tracking-wider block">
                            Topology & Graph Vector
                          </span>
                          
                          <div className="space-y-1.5 text-[#292B2B]">
                            <p>
                              <strong className="text-[#292B2B]">Prerequisites:</strong>{' '}
                              {comp.prerequisites.length > 0 ? comp.prerequisites.join(', ') : 'None (Foundation Root)'}
                            </p>
                            <p>
                              <strong className="text-[#292B2B]">Dependent Competencies:</strong>{' '}
                              {comp.dependentCompetencies.length > 0 ? comp.dependentCompetencies.join(', ') : 'Terminal Node'}
                            </p>
                            <p className="text-[#7A756E]">
                              <strong className="text-[#292B2B]">Evaluated Telemetry:</strong>{' '}
                              {comp.assessmentCount > 0 ? `${comp.assessmentCount} verified assessments` : 'Pending initial baseline diagnostic'}
                            </p>
                          </div>

                          {/* Quick Action CTA */}
                          <div className="pt-2 border-t border-[#E2DDD5]">
                            <Link to="/assessment" className="block">
                              <Button
                                size="sm"
                                className="w-full bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9] font-semibold text-xs h-8 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all duration-200 ease-out"
                              >
                                <span>Practice / Audit Competency</span>
                                <ArrowRight className="w-3 h-3" />
                              </Button>
                            </Link>
                          </div>
                        </div>

                      </div>

                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}
