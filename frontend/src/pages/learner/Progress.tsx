import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ImprovementChart from '@/components/progress/ImprovementChart';
import CompetencyDelta from '@/components/progress/CompetencyDelta';
import { TrendingUp, Sparkles, Award, CheckCircle2 } from 'lucide-react';

export default function Progress() {
  const competencies = [
    {
      name: 'Statistical Methods',
      current_score: 86,
      previous_score: 65,
      delta: 21,
      target: 80,
      history: [
        { date: 'Jan', score: 65 },
        { date: 'Mar', score: 72 },
        { date: 'May', score: 78 },
        { date: 'Aug', score: 86 }
      ]
    },
    {
      name: 'Data Quality & Validation',
      current_score: 72,
      previous_score: 45,
      delta: 27,
      target: 70,
      history: [
        { date: 'Jan', score: 45 },
        { date: 'Mar', score: 54 },
        { date: 'May', score: 64 },
        { date: 'Aug', score: 72 }
      ]
    },
    {
      name: 'Survey Methodology',
      current_score: 51,
      previous_score: 35,
      delta: 16,
      target: 75,
      history: [
        { date: 'Jan', score: 35 },
        { date: 'Mar', score: 42 },
        { date: 'May', score: 48 },
        { date: 'Aug', score: 51 }
      ]
    },
    {
      name: 'Statistical Programming',
      current_score: 43,
      previous_score: 28,
      delta: 15,
      target: 70,
      history: [
        { date: 'Jan', score: 28 },
        { date: 'Mar', score: 32 },
        { date: 'May', score: 38 },
        { date: 'Aug', score: 43 }
      ]
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-[#0B2545] tracking-tight">Competency Progression Over Time</h1>
        <p className="text-[#2B2D42] mt-1">Verified capability trajectory before & after personalized learning interventions.</p>
      </div>

      {/* Hero Achievement Banner */}
      <div className="bg-[#0B2545] rounded-2xl p-8 text-[#FFFFFF] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-md border border-[#0B2545] relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFFFFF]/10 text-[#FFFFFF] border border-[#FFFFFF]/20">
            <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Capacity Growth Verified</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#FFFFFF]">Overall Competency Up +18.5%</h2>
          <p className="text-sm text-[#FFFFFF]/80 max-w-xl">
            Continuous reassessments demonstrate closed gaps across 2 statistical domains with active learning paths underway.
          </p>
        </div>
        <div className="text-left sm:text-right bg-[#FFFFFF]/10 p-4 rounded-xl border border-[#FFFFFF]/20 z-10 shrink-0">
          <span className="text-xs font-bold text-[#FFFFFF]/70 uppercase tracking-wider block">Average Delta</span>
          <div className="text-4xl font-black text-[#FFFFFF] mt-0.5 font-mono">+19.7 pts</div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-[#0B2545] flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#1F7A8C]" />
          Skill Trajectory Curves by Competency
        </h2>
        
        <div className="grid lg:grid-cols-2 gap-6">
          {competencies.map((comp) => (
            <Card key={comp.name} className="overflow-hidden bg-[#FFFFFF] shadow-sm border border-[#2B2D42]/10">
              <CardHeader className="bg-[#F4F6F9] border-b border-[#2B2D42]/10 pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-bold text-[#0B2545]">{comp.name}</CardTitle>
                  {comp.current_score >= comp.target ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#2E7D32]/10 text-[#2E7D32] border border-[#2E7D32]/30 font-mono">
                      Target Level Met ✓
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 font-mono">
                      Target: {comp.target}%
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <CompetencyDelta 
                  start={comp.previous_score} 
                  current={comp.current_score} 
                  delta={comp.delta} 
                />
                
                <div className="h-[200px] w-full pt-2">
                  <ImprovementChart data={comp.history} target={comp.target} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
