import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Plus, Sparkles, Layers } from 'lucide-react';

export default function AdminCompetencies() {
  const competencies = [
    { name: 'Statistical Methods', domain: 'Core Theory', roles: 14, avgScore: 86, status: 'Healthy', color: 'border-t-[#2E8B57]' },
    { name: 'Data Analysis', domain: 'Analytics', roles: 14, avgScore: 74, status: 'Healthy', color: 'border-t-[#2E8B57]' },
    { name: 'Sampling Techniques', domain: 'Operations', roles: 12, avgScore: 52, status: 'Priority Gap', color: 'border-t-[#D49A2A]' },
    { name: 'Survey Methodology', domain: 'Operations', roles: 12, avgScore: 58, status: 'Needs Attention', color: 'border-t-[#D49A2A]' },
    { name: 'Data Quality Assurance', domain: 'Governance', roles: 10, avgScore: 72, status: 'Healthy', color: 'border-t-[#2E8B57]' },
    { name: 'Statistical Programming', domain: 'Technology', roles: 10, avgScore: 46, status: 'Priority Gap', color: 'border-t-[#D49A2A]' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#176B87] uppercase tracking-widest mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>FRAMEWORK GOVERNANCE & TAXONOMY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#123047] tracking-tight">
            Competency Framework Governance
          </h1>
          <p className="text-xs sm:text-sm text-[#5D7180] mt-1">
            Manage the official statistical domains, prerequisite graphs, and role benchmark requirements.
          </p>
        </div>
        <Button className="bg-[#176B87] hover:bg-[#176B87]/90 text-[#FFFFFF] font-semibold text-xs sm:text-sm shadow-xs h-10 px-5 rounded-xl cursor-pointer">
          <Plus className="w-4 h-4 mr-1.5" /> Define New Competency
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {competencies.map(comp => (
          <Card key={comp.name} className={`border-t-4 ${comp.color} bg-[#FFFFFF] shadow-[0_1px_3px_rgba(11,37,69,0.04)] border border-[#D8E5EC] rounded-2xl transition-all`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#176B87]/10 flex items-center justify-center text-[#176B87]">
                  <Brain className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#EAF3F7] text-[#176B87] border border-[#D8E5EC]">
                  {comp.domain}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#123047] mb-1">{comp.name}</h3>
              <p className="text-xs text-[#5D7180] mb-4">Required by {comp.roles} official roles</p>
              
              <div className="bg-[#EAF3F7] rounded-xl p-3.5 flex justify-between items-center border border-[#D8E5EC]">
                <span className="text-xs font-semibold text-[#123047]">Workforce Benchmark Avg</span>
                <span className="font-bold text-base text-[#176B87] font-mono">{comp.avgScore}%</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
