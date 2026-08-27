import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Plus, Sparkles, Layers } from 'lucide-react';

export default function AdminCompetencies() {
  const competencies = [
    { name: 'Statistical Methods', domain: 'Core Theory', roles: 14, avgScore: 86, status: 'Healthy', color: 'border-t-[#2E7D32]' },
    { name: 'Data Analysis', domain: 'Analytics', roles: 14, avgScore: 74, status: 'Healthy', color: 'border-t-[#2E7D32]' },
    { name: 'Sampling Techniques', domain: 'Operations', roles: 12, avgScore: 52, status: 'Priority Gap', color: 'border-t-[#D4AF37]' },
    { name: 'Survey Methodology', domain: 'Operations', roles: 12, avgScore: 58, status: 'Needs Attention', color: 'border-t-[#D4AF37]' },
    { name: 'Data Quality Assurance', domain: 'Governance', roles: 10, avgScore: 72, status: 'Healthy', color: 'border-t-[#2E7D32]' },
    { name: 'Statistical Programming', domain: 'Technology', roles: 10, avgScore: 46, status: 'Priority Gap', color: 'border-t-[#D4AF37]' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#1F7A8C] uppercase tracking-widest mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>FRAMEWORK GOVERNANCE & TAXONOMY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#102A43] tracking-tight">
            Competency Framework Governance
          </h1>
          <p className="text-xs sm:text-sm text-[#62748A] mt-1">
            Manage the official statistical domains, prerequisite graphs, and role benchmark requirements.
          </p>
        </div>
        <Button className="bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-semibold text-xs sm:text-sm shadow-xs h-10 px-5 rounded-xl cursor-pointer">
          <Plus className="w-4 h-4 mr-1.5" /> Define New Competency
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {competencies.map(comp => (
          <Card key={comp.name} className={`border-t-4 ${comp.color} bg-[#FFFFFF] shadow-[0_1px_3px_rgba(11,37,69,0.04)] border border-[#DCE5EA] rounded-2xl transition-all`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#1F7A8C]/10 flex items-center justify-center text-[#1F7A8C]">
                  <Brain className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#EEF5F7] text-[#1F7A8C] border border-[#DCE5EA]">
                  {comp.domain}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#102A43] mb-1">{comp.name}</h3>
              <p className="text-xs text-[#62748A] mb-4">Required by {comp.roles} official roles</p>
              
              <div className="bg-[#EEF5F7] rounded-xl p-3.5 flex justify-between items-center border border-[#DCE5EA]">
                <span className="text-xs font-semibold text-[#102A43]">Workforce Benchmark Avg</span>
                <span className="font-bold text-base text-[#1F7A8C] font-mono">{comp.avgScore}%</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
