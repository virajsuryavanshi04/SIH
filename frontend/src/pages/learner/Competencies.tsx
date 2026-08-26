import { useState } from 'react';
import { Compass, Sparkles, ShieldCheck } from 'lucide-react';
import CapabilityLandscape, { CapabilityNode } from '@/components/spatial/CapabilityLandscape';
import GapInspector from '@/components/spatial/GapInspector';

export default function Competencies() {
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
  const [selectedNode, setSelectedNode] = useState<CapabilityNode>(initialNodes[4]); // Default to Sampling Techniques

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#1F7A8C] uppercase tracking-widest mb-1">
            <Compass className="w-3.5 h-3.5" />
            <span>Interactive Capability Graph</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0B2545] tracking-tight">
            Workforce Capability Map
          </h1>
          <p className="text-xs sm:text-sm text-[#2B2D42]/80 mt-1">
            Visual topology mapping interconnected statistical competencies, verified proficiencies, and active learning vectors.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          <CapabilityLandscape
            nodes={nodes}
            selectedNode={selectedNode}
            onSelectNode={(node) => setSelectedNode(node)}
          />
        </div>

        <div className="lg:col-span-5">
          <GapInspector node={selectedNode} />
        </div>
      </div>
    </div>
  );
}
