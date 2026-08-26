import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2, TrendingUp, Clock, BookOpen, Route, Award, Play } from 'lucide-react';
import CapabilityLandscape, { CapabilityNode } from '@/components/spatial/CapabilityLandscape';
import GapInspector from '@/components/spatial/GapInspector';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const initialNodes: CapabilityNode[] = [
    {
      id: 1,
      name: 'Statistical Methods',
      domain: 'Core Theory',
      x: 24,
      y: 22,
      score: 86,
      required: 80,
      gap: 0,
      priority: 'LOW',
      status: 'proficient',
      prerequisites: [],
      reasons: [
        '14 of 15 questions answered correctly on probability distributions and hypothesis testing',
        'Demonstrates mastery over central limit theorem and statistical inferences',
        'Strong mathematical foundation verified across 3 assessments'
      ],
      aiConfidence: 94,
      recommendedCourse: {
        title: 'Foundations of Statistical Inference (ISI-101)',
        duration: '2h',
        type: 'Refresher'
      }
    },
    {
      id: 2,
      name: 'Data Quality',
      domain: 'Governance',
      x: 76,
      y: 22,
      score: 72,
      required: 70,
      gap: 0,
      priority: 'LOW',
      status: 'proficient',
      prerequisites: [1],
      reasons: [
        'Consistently applies administrative registry validation checks',
        'Anomaly scoring accuracy meets official MoSPI threshold',
        'Passed validation framework diagnostic'
      ],
      aiConfidence: 89,
      recommendedCourse: {
        title: 'Data Quality Validation & Audit Frameworks',
        duration: '8h',
        type: 'MoSPI Certified'
      }
    },
    {
      id: 3,
      name: 'Data Analysis',
      domain: 'Analytics',
      x: 84,
      y: 50,
      score: 64,
      required: 80,
      gap: 16,
      priority: 'MEDIUM',
      status: 'on_track',
      prerequisites: [1],
      reasons: [
        'Solid grasp of univariate and bivariate descriptive metrics',
        'Below required benchmark on multivariate regression synthesis',
        'Role requires advanced regression analysis for policy reports'
      ],
      aiConfidence: 85,
      recommendedCourse: {
        title: 'Applied Regression Analysis & Modeling',
        duration: '14h',
        type: 'iGOT Course'
      }
    },
    {
      id: 4,
      name: 'Survey Methodology',
      domain: 'Operations',
      x: 74,
      y: 78,
      score: 51,
      required: 75,
      gap: 24,
      priority: 'HIGH',
      status: 'needs_attention',
      prerequisites: [5],
      reasons: [
        'Struggled with questionnaire logic and non-response adjustment factors',
        'Directly impaired by underlying gap in Sampling Techniques',
        'Role benchmark requires 75% for official survey publishing'
      ],
      aiConfidence: 91,
      recommendedCourse: {
        title: 'Survey Design & Field Operations',
        duration: '12h',
        type: 'iGOT Core'
      }
    },
    {
      id: 5,
      name: 'Sampling Techniques',
      domain: 'Operations',
      x: 26,
      y: 78,
      score: 48,
      required: 70,
      gap: 22,
      priority: 'CRITICAL',
      status: 'needs_attention',
      prerequisites: [1],
      reasons: [
        '4 of 7 assessment questions answered incorrectly',
        'Low confidence in Stratified Sampling allocation calculations',
        'Prerequisite weakness in Variance Estimation formulas',
        'Role requires intermediate proficiency in multi-stage sampling'
      ],
      aiConfidence: 87,
      recommendedCourse: {
        title: 'Sampling Fundamentals',
        duration: '15 min',
        type: 'iGOT Course'
      }
    },
    {
      id: 6,
      name: 'Statistical Programming',
      domain: 'Technology',
      x: 16,
      y: 50,
      score: 43,
      required: 70,
      gap: 27,
      priority: 'CRITICAL',
      status: 'needs_attention',
      prerequisites: [1],
      reasons: [
        'Unable to write automated data validation scripts in Python/R',
        'High error rate in pandas data cleaning syntax',
        'Automation is essential for quarterly tabulation workflows'
      ],
      aiConfidence: 92,
      recommendedCourse: {
        title: 'Python for Statistical Automation',
        duration: '10h',
        type: 'iGOT Course'
      }
    }
  ];

  const [nodes] = useState<CapabilityNode[]>(initialNodes);
  const [selectedNode, setSelectedNode] = useState<CapabilityNode>(initialNodes[4]); // Default to Sampling Techniques (Biggest Gap)

  // Learning Journey Sequence
  const journeySteps = [
    { label: 'Sampling Fundamentals', status: 'completed', number: '✓' },
    { label: 'Stratified Sampling', status: 'current', number: '2' },
    { label: 'Survey Design', status: 'upcoming', number: '3' },
    { label: 'Field Validation', status: 'upcoming', number: '4' },
    { label: 'Competency Check', status: 'upcoming', number: '◎' }
  ];

  // iGOT Recommendations
  const igotRecs = [
    { title: 'NSS Stratification Lab', match: 94, duration: '25 min', competency: 'Sampling Techniques' },
    { title: 'Survey Sampling Methods', match: 87, duration: '18 min', competency: 'Survey Methodology' },
    { title: 'Variance Estimation Basics', match: 76, duration: '20 min', competency: 'Statistical Methods' },
  ];

  // Improvement Trajectory Phases
  const trajectoryPhases = [
    { label: 'Assessed', score: 51, phase: 'Initial' },
    { label: 'After Diagnosis', score: 58, phase: 'Step 1' },
    { label: 'After Learning', score: 67, phase: 'Step 2' },
    { label: 'Reassessment', score: 78, phase: 'Step 3' },
    { label: 'Role Target', score: 80, phase: 'Benchmark', isTarget: true }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 text-left">
      {/* ============================================================ */}
      {/* 1. TOP HIGH-PRIORITY TRIAD (Readiness, Gap, Next Step)       */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* A. YOUR READINESS */}
        <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#2B2D42]/10 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2B2D42]/60 block">
              YOUR READINESS
            </span>
            <div className="flex items-baseline gap-2.5 mt-2">
              <span className="text-4xl font-black text-[#0B2545] font-mono">72%</span>
              <span className="text-xs font-bold text-[#2E7D32] font-mono">↑ 12%</span>
            </div>
            <p className="text-xs text-[#2B2D42]/70 mt-1">
              since last assessment • 5 of 8 benchmarks achieved
            </p>
          </div>

          {/* Mini Sparkline Visualization */}
          <div className="pt-2">
            <div className="flex items-end gap-1.5 h-8 w-full bg-[#F4F6F9] p-2 rounded-lg border border-[#2B2D42]/10">
              <div className="bg-[#1F7A8C]/30 w-1/5 h-[40%] rounded-xs" />
              <div className="bg-[#1F7A8C]/40 w-1/5 h-[55%] rounded-xs" />
              <div className="bg-[#1F7A8C]/60 w-1/5 h-[65%] rounded-xs" />
              <div className="bg-[#1F7A8C]/80 w-1/5 h-[72%] rounded-xs" />
              <div className="bg-[#1F7A8C] w-1/5 h-[85%] rounded-xs" />
            </div>
          </div>
        </div>

        {/* B. BIGGEST GAP */}
        <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#2B2D42]/10 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#D4AF37]">
                BIGGEST GAP
              </span>
              <span className="text-xs font-mono font-bold text-[#0B2545]">48% → 70%</span>
            </div>
            <h3 className="text-base font-bold text-[#0B2545] mt-2">Sampling Techniques</h3>
            <p className="text-xs text-[#2B2D42]/70 mt-1">
              Variance estimation & Neyman stratification deficit
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedNode(initialNodes[4])}
            className="w-full border-[#D4AF37]/50 text-[#0B2545] hover:bg-[#D4AF37]/10 font-bold text-xs h-9 cursor-pointer"
          >
            Fix This Gap
          </Button>
        </div>

        {/* C. NEXT STEP */}
        <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#2B2D42]/10 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#1F7A8C] block">
              NEXT STEP
            </span>
            <h3 className="text-base font-bold text-[#0B2545] mt-2">NSS Stratification Lab</h3>
            <p className="text-xs text-[#2B2D42]/70 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#1F7A8C]" />
              <span>25 min · iGOT Micro-Learning</span>
            </p>
          </div>

          <Link to="/learning-path" className="block w-full">
            <Button
              size="sm"
              className="w-full bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-bold text-xs shadow-xs h-9 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Start Learning</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. SIGNATURE CAPABILITY LANDSCAPE & CONTEXTUAL GAP INSPECTOR  */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Capability Landscape Visualization */}
        <div className="lg:col-span-7">
          <CapabilityLandscape
            nodes={nodes}
            selectedNode={selectedNode}
            onSelectNode={(node) => setSelectedNode(node)}
          />
        </div>

        {/* Right: Contextual Gap Inspector */}
        <div className="lg:col-span-5">
          <GapInspector node={selectedNode} />
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. LEARNING JOURNEY (Horizontal Sequence)                     */}
      {/* ============================================================ */}
      <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#2B2D42]/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#2B2D42]/10 pb-3">
          <div className="flex items-center space-x-2">
            <Route className="w-4 h-4 text-[#1F7A8C]" />
            <h3 className="text-xs font-mono font-bold text-[#0B2545] uppercase tracking-wider">
              YOUR LEARNING JOURNEY
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#2B2D42]/70">
            Step 2 of 5 Active
          </span>
        </div>

        {/* Horizontal Journey Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {journeySteps.map((step, idx) => {
            const isCompleted = step.status === 'completed';
            const isCurrent = step.status === 'current';

            return (
              <div
                key={step.label}
                className={cn(
                  "p-3 rounded-xl border flex flex-col justify-between space-y-2 transition-all",
                  isCompleted 
                    ? "bg-[#2E7D32]/5 border-[#2E7D32]/30 text-[#2E7D32]"
                    : isCurrent
                    ? "bg-[#1F7A8C]/5 border-[#1F7A8C] ring-2 ring-[#1F7A8C]/20 text-[#0B2545]"
                    : "bg-[#F4F6F9] border-[#2B2D42]/10 text-[#2B2D42]/60"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px]",
                    isCompleted ? "bg-[#2E7D32] text-[#FFFFFF]" : isCurrent ? "bg-[#1F7A8C] text-[#FFFFFF]" : "bg-[#2B2D42]/20 text-[#2B2D42]"
                  )}>
                    {step.number}
                  </span>
                  <span className="text-[9px] font-mono uppercase font-bold">
                    {isCompleted ? 'Done' : isCurrent ? 'Active' : `0${idx + 1}`}
                  </span>
                </div>
                <h4 className="text-xs font-bold leading-tight">
                  {step.label}
                </h4>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. iGOT RECOMMENDATIONS & IMPROVEMENT TRAJECTORY GRID         */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: iGOT Recommendations (Compact Data List) */}
        <div className="lg:col-span-5 bg-[#FFFFFF] rounded-2xl p-6 border border-[#2B2D42]/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#2B2D42]/10 pb-3">
            <h3 className="text-xs font-mono font-bold text-[#0B2545] uppercase tracking-wider">
              iGOT RECOMMENDATIONS
            </h3>
            <span className="text-[10px] font-mono text-[#1F7A8C] font-semibold">Curated for your role</span>
          </div>

          <div className="space-y-3">
            {igotRecs.map((course) => (
              <div key={course.title} className="p-3 rounded-xl bg-[#F4F6F9] border border-[#2B2D42]/10 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-[#0B2545]">{course.title}</h4>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#2B2D42]/70 mt-0.5">
                    <span>{course.competency}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-[#1F7A8C]" /> {course.duration}</span>
                  </div>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#1F7A8C]/10 text-[#1F7A8C] border border-[#1F7A8C]/20 text-[10px] font-mono font-bold">
                  {course.match}% Match
                </span>
              </div>
            ))}
          </div>

          <Link to="/courses" className="block pt-1">
            <Button variant="outline" className="w-full text-xs font-bold border-[#2B2D42]/20 text-[#0B2545] hover:bg-[#F4F6F9] h-8.5">
              Explore All Courses <ArrowRight className="w-3 h-3 ml-1.5" />
            </Button>
          </Link>
        </div>

        {/* Right: Improvement Trajectory Curve */}
        <div className="lg:col-span-7 bg-[#FFFFFF] rounded-2xl p-6 border border-[#2B2D42]/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#2B2D42]/10 pb-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono font-bold uppercase text-[#1F7A8C]">
                MEASURED OUTCOME PROOF
              </span>
              <h3 className="text-sm font-bold text-[#0B2545]">
                Survey Methodology Trajectory
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-[#2E7D32] bg-[#2E7D32]/10 px-2.5 py-1 rounded-full border border-[#2E7D32]/20">
              ✓ Gap reduced by 27 percentage points
            </span>
          </div>

          {/* Stepped Trajectory Progression */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
            {trajectoryPhases.map((phase) => (
              <div
                key={phase.label}
                className={cn(
                  "p-3 rounded-xl border space-y-1 text-center",
                  phase.isTarget
                    ? "bg-[#1F7A8C]/5 border-[#1F7A8C]/30"
                    : phase.score >= 75
                    ? "bg-[#2E7D32]/5 border-[#2E7D32]/30"
                    : "bg-[#F4F6F9] border-[#2B2D42]/10"
                )}
              >
                <span className="text-[9px] font-mono uppercase text-[#2B2D42]/60 block">{phase.phase}</span>
                <span className={cn(
                  "text-lg font-black font-mono block",
                  phase.isTarget ? "text-[#1F7A8C]" : phase.score >= 75 ? "text-[#2E7D32]" : "text-[#0B2545]"
                )}>
                  {phase.score}%
                </span>
                <span className="text-[10px] font-bold text-[#0B2545] truncate block leading-tight">{phase.label}</span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-[#2B2D42]/70 leading-relaxed font-mono pt-1">
            Continuous reassessment validates that knowledge gaps are effectively closed rather than simply recording course completion.
          </p>
        </div>
      </div>
    </div>
  );
}
