import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B2545] tracking-tight">Competency Framework Governance</h1>
          <p className="text-[#2B2D42] mt-1">Manage the 8 official statistical domains, dependencies, and role benchmark requirements.</p>
        </div>
        <Button className="bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-bold shadow-xs cursor-pointer">
          <Plus className="w-4 h-4 mr-2" /> Define New Competency
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {competencies.map(comp => (
          <Card key={comp.name} className={`border-t-2 ${comp.color} bg-[#FFFFFF] shadow-sm border-[#2B2D42]/10 transition-all`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#1F7A8C]/10 flex items-center justify-center text-[#1F7A8C]">
                  <Brain className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F4F6F9] text-[#1F7A8C] border border-[#2B2D42]/10">
                  {comp.domain}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#0B2545] mb-1">{comp.name}</h3>
              <p className="text-xs text-[#2B2D42]/60 mb-4">Required by {comp.roles} official roles</p>
              
              <div className="bg-[#F4F6F9] rounded-xl p-3.5 flex justify-between items-center border border-[#2B2D42]/10">
                <span className="text-xs font-bold text-[#0B2545]">Workforce Avg</span>
                <span className="font-bold text-base text-[#1F7A8C] font-mono">{comp.avgScore}%</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
