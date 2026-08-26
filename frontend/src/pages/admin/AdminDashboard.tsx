import { useState } from 'react';
import { 
  BarChart3, Users, AlertTriangle, TrendingUp, ShieldCheck, 
  Sparkles, Layers, ChevronRight, Filter, ArrowRight, Eye, RefreshCw 
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const [selectedDept, setSelectedDept] = useState<string>('Survey Operations');
  const [selectedRole, setSelectedRole] = useState<string>('Statistical Officer');

  const deptStats: Record<string, { avg: number; gaps: number; headcount: number; primaryDeficit: string; roles: string[] }> = {
    'Survey Operations': {
      avg: 58.4,
      gaps: 4,
      headcount: 4,
      primaryDeficit: 'Sampling Techniques (-22%) & Survey Methodology (-24%)',
      roles: ['Statistical Officer', 'Survey Officer', 'Statistical Investigator']
    },
    'Statistical Services': {
      avg: 74.2,
      gaps: 2,
      headcount: 4,
      primaryDeficit: 'Statistical Programming (-27%)',
      roles: ['Statistical Officer', 'Statistical Investigator']
    },
    'Data Analysis Div': {
      avg: 81.5,
      gaps: 1,
      headcount: 4,
      primaryDeficit: 'Sampling Techniques (-18%)',
      roles: ['Data Analyst', 'Statistical Officer']
    },
    'IT & Digital Stats': {
      avg: 76.8,
      gaps: 2,
      headcount: 2,
      primaryDeficit: 'Survey Methodology (-29%)',
      roles: ['Data Analyst', 'Statistical Officer']
    }
  };

  const competencyBreakdown = [
    { name: 'Statistical Methods', current: 86, target: 80, delta: '+6%' },
    { name: 'Data Interpretation', current: 75, target: 65, delta: '+10%' },
    { name: 'Data Quality', current: 72, target: 70, delta: '+2%' },
    { name: 'Data Visualization', current: 81, target: 75, delta: '+6%' },
    { name: 'Data Analysis', current: 64, target: 80, delta: '-16%' },
    { name: 'Survey Methodology', current: 51, target: 75, delta: '-24%' },
    { name: 'Sampling Techniques', current: 48, target: 70, delta: '-22%' },
    { name: 'Statistical Programming', current: 43, target: 70, delta: '-27%' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top National Command Surface Banner */}
      <div className="bg-[#0B2545] rounded-3xl p-8 text-[#FFFFFF] shadow-md border border-[#0B2545] space-y-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
              <span>National Workforce Competency Command Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FFFFFF]">
              India's Official Statistical Capacity Intelligence
            </h1>
            <p className="text-xs text-[#FFFFFF]/80 max-w-2xl leading-relaxed">
              Real-time competency aggregation across 14 officers, 4 core statistical divisions, and 30 integrated iGOT Karmayogi curricula.
            </p>
          </div>

          {/* High-level National Index Stream */}
          <div className="flex items-center gap-6 bg-[#FFFFFF]/10 p-4 rounded-2xl border border-[#FFFFFF]/15">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#FFFFFF]/70 font-bold block">National Index</span>
              <span className="text-3xl font-black text-[#FFFFFF] font-mono">68.4%</span>
            </div>
            <div className="h-10 w-px bg-[#FFFFFF]/20" />
            <div>
              <span className="text-[10px] font-mono uppercase text-[#FFFFFF]/70 font-bold block">Priority Bottlenecks</span>
              <span className="text-3xl font-black text-[#D4AF37] font-mono">8 Roles</span>
            </div>
          </div>
        </div>

        {/* Continuous Department Selection Strip */}
        <div className="pt-2 border-t border-[#FFFFFF]/10 flex flex-wrap items-center justify-between gap-3 relative z-10">
          <span className="text-xs font-mono font-bold text-[#FFFFFF]/70 uppercase">Select Division //</span>
          <div className="flex flex-wrap gap-2">
            {Object.keys(deptStats).map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-mono",
                  selectedDept === dept
                    ? "bg-[#1F7A8C] text-[#FFFFFF] shadow-xs font-bold border border-[#1F7A8C]"
                    : "bg-[#FFFFFF]/10 text-[#FFFFFF]/80 hover:bg-[#FFFFFF]/20 hover:text-[#FFFFFF]"
                )}
              >
                {dept} ({deptStats[dept].avg}%)
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Drilldown Operational Surface */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#2B2D42]/10 shadow-sm p-6 sm:p-8 space-y-8">
        {/* Drilldown Navigation Breadcrumb */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold text-[#2B2D42] border-b border-[#2B2D42]/10 pb-4">
          <span className="text-[#2B2D42]/60">National Statistical System</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#2B2D42]/30" />
          <span className="text-[#1F7A8C]">{selectedDept}</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#2B2D42]/30" />
          <span className="text-[#0B2545]">{selectedRole}</span>
          <span className="ml-auto text-[11px] px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 font-mono">
            Deficit: {deptStats[selectedDept].primaryDeficit}
          </span>
        </div>

        {/* Main Analytic Surface: Competency Delta Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Chart View */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0B2545] uppercase tracking-wider font-mono">
                Competency Deficit vs. Benchmark Matrix
              </h3>
              <span className="text-xs text-[#2B2D42]/60 font-mono">Benchmark: 70–80%</span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={competencyBreakdown} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2B2D42" strokeOpacity={0.1} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#2B2D42', fontWeight: 600 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#2B2D42' }} />
                  <Tooltip cursor={{ fill: '#F4F6F9' }} />
                  <Bar dataKey="current" name="Division Average" fill="#1F7A8C" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target" name="Required Benchmark" fill="#0B2545" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Actionable Intervention Stream */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-[#FFFFFF] border border-[#1F7A8C]/25 space-y-5 shadow-xs">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#1F7A8C] uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#1F7A8C]" />
              <span>Algorithmic Intervention Recommendation</span>
            </div>

            <div className="space-y-3 text-xs text-[#2B2D42]">
              <p className="font-bold text-[#0B2545] text-sm">
                Deploy 6-Hour iGOT Sampling Module across {deptStats[selectedDept].headcount} Officers
              </p>
              <p className="leading-relaxed">
                Mathematical gap scoring indicates that 4 out of 4 officers in <strong>{selectedDept}</strong> have critical deficiencies in Neyman stratification and non-response variance calculation.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F4F6F9] border border-[#2B2D42]/10 text-xs space-y-1 font-mono">
              <div className="flex justify-between text-[#2B2D42]">
                <span>Estimated Target Score:</span>
                <span className="font-bold text-[#2E7D32]">58% → 82%</span>
              </div>
              <div className="flex justify-between text-[#2B2D42]">
                <span>Training Efficiency Gain:</span>
                <span className="font-bold text-[#1F7A8C]">+14 hrs saved</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Link to="/admin/gaps" className="flex-1">
                <Button className="w-full bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-bold text-xs shadow-xs">
                  View Full Heatmap <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
              <Link to="/admin/employees">
                <Button variant="secondary" className="text-xs font-semibold">
                  Inspect Officers
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
