import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Route, Compass } from 'lucide-react';
import PathTimeline from '@/components/learning-path/PathTimeline';

export default function LearningPath() {
  const mockPath = [
    {
      id: 1,
      title: "Fundamentals of Statistical Inference",
      description: "Probability distributions, central limit theorem, and descriptive metrics.",
      item_type: "Course",
      status: "completed",
      estimated_duration: "2h",
      difficulty: "Beginner",
      competency_name: "Statistical Methods"
    },
    {
      id: 2,
      title: "Survey Sampling Fundamentals & Stratified Design",
      description: "Deep dive into stratified, cluster, and multi-stage sampling formulas for NSSO surveys.",
      item_type: "Module",
      status: "current",
      estimated_duration: "4h",
      difficulty: "Intermediate",
      competency_name: "Sampling Techniques"
    },
    {
      id: 3,
      title: "Python Scripting for Statistical Automation",
      description: "Hands-on data manipulation in pandas and automated validation scripts.",
      item_type: "Practice",
      status: "recommended",
      estimated_duration: "3h",
      difficulty: "Intermediate",
      competency_name: "Statistical Programming"
    },
    {
      id: 4,
      title: "Complex Survey Methodology & Variance Estimation",
      description: "Application of Taylor series linearization and jackknife variance estimation in official publications.",
      item_type: "Project",
      status: "locked",
      estimated_duration: "6h",
      difficulty: "Advanced",
      competency_name: "Survey Methodology"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-[#0B2545] tracking-tight">Your Personalized Learning Path</h1>
        <p className="text-[#2B2D42] mt-1">Adaptive curriculum dynamically assembled to close your verified skill gaps.</p>
      </div>

      {/* Adaptive Banner */}
      <div className="bg-[#FFFFFF] border border-[#1F7A8C]/25 text-[#2B2D42] p-4 rounded-xl flex gap-3.5 items-start shadow-xs">
        <div className="w-8 h-8 rounded-lg bg-[#1F7A8C] text-[#FFFFFF] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-[#0B2545]">AI Adaptive Pathway Optimized</h4>
          <p className="text-xs text-[#2B2D42] mt-0.5 leading-relaxed">
            Based on your 86% score in "Statistical Methods", the AI has waived foundational theory and accelerated your journey directly to <strong>Sampling Techniques & Practical Automation</strong>.
          </p>
        </div>
      </div>

      <Card className="bg-[#FFFFFF] shadow-sm border border-[#2B2D42]/10">
        <CardHeader className="border-b border-[#2B2D42]/10 pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-[#0B2545]">
            <Route className="w-5 h-5 text-[#1F7A8C]" />
            Closed-Loop Capability Trajectory
          </CardTitle>
          <span className="text-xs font-bold text-[#1F7A8C] bg-[#1F7A8C]/10 px-2.5 py-1 rounded-full border border-[#1F7A8C]/20">
            2 of 4 Milestones Active
          </span>
        </CardHeader>
        <CardContent className="pt-6">
          <PathTimeline items={mockPath} />
        </CardContent>
      </Card>
    </div>
  );
}
