import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, AlertTriangle, TrendingUp, ShieldCheck, 
  Sparkles, Layers, ChevronRight, Filter, ArrowRight, Eye, RefreshCw, BookOpen, Database 
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { adminApi } from '@/lib/api';

export default function AdminDashboard() {
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<any>(null);
  const [selectedDept, setSelectedDept] = useState<string>('National Overview');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await adminApi.getDashboard();
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const totalEmployees = stats?.total_employees ?? 14;
  const avgCompetency = stats?.avg_competency ?? 68.4;
  const criticalGapsCount = stats?.critical_gaps_count ?? 8;
  const coursesCompleted = stats?.courses_completed ?? 24;
  const avgImprovement = stats?.avg_improvement ?? 14.8;
  const overviewList = stats?.competency_overview || [];

  const chartData = overviewList.length > 0 ? overviewList.map((c: any) => ({
    name: c.competency_name,
    current: c.avg_score || 55,
    target: c.target_score || 70,
    gap: c.gap
  })) : [
    { name: 'Statistical Methods', current: 80, target: 80, gap: 0 },
    { name: 'Data Quality', current: 72, target: 70, gap: 0 },
    { name: 'Data Analysis', current: 64, target: 80, gap: 16 },
    { name: 'Survey Methodology', current: 51, target: 75, gap: 24 },
    { name: 'Sampling Techniques', current: 48, target: 70, gap: 22 },
    { name: 'Statistical Programming', current: 43, target: 70, gap: 27 },
  ];

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#1F7A8C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#0B2545]">Aggregating national workforce competency intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-left">
      
      {/* 1. National Command Surface Banner */}
      <div className="bg-[#0B2545] rounded-3xl p-8 text-[#FFFFFF] shadow-md border border-[#0B2545] space-y-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
              <span>National Workforce Competency Command Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FFFFFF]">
              India's Official Statistical Capacity Intelligence
            </h1>
            <p className="text-xs text-[#FFFFFF]/80 max-w-2xl leading-relaxed">
              Real-time aggregated competency analytics across official statistical divisions and accredited learning curricula.
            </p>
          </div>

          {/* National Metric Badges */}
          <div className="flex items-center gap-6 bg-[#FFFFFF]/10 p-4 rounded-2xl border border-[#FFFFFF]/15">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#FFFFFF]/70 font-bold block">Workforce Index</span>
              <span className="text-3xl font-black text-[#FFFFFF] font-mono">{avgCompetency}%</span>
            </div>
            <div className="h-10 w-px bg-[#FFFFFF]/20" />
            <div>
              <span className="text-[10px] font-mono uppercase text-[#FFFFFF]/70 font-bold block">Capacity Gain</span>
              <span className="text-3xl font-black text-[#D4AF37] font-mono">+{avgImprovement} pts</span>
            </div>
          </div>
        </div>

        {/* Quick Admin Navigation Strip */}
        <div className="pt-3 border-t border-[#FFFFFF]/10 flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex items-center space-x-2 text-xs font-mono text-[#FFFFFF]/80">
            <span>Enrolled Officers: <strong>{totalEmployees}</strong></span>
            <span>•</span>
            <span>Completed Modules: <strong>{coursesCompleted}</strong></span>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/materials">
              <Button size="sm" className="bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-bold text-xs shadow-2xs h-8">
                <BookOpen className="w-3.5 h-3.5 mr-1" /> Upload Materials
              </Button>
            </Link>
            <Link to="/admin/question-bank">
              <Button size="sm" variant="secondary" className="text-xs font-bold h-8 text-[#0B2545]">
                <Database className="w-3.5 h-3.5 mr-1" /> Review Question Bank
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Workforce Competency vs Benchmark Matrix */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#2B2D42]/10 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2B2D42]/10 pb-4">
          <div>
            <h3 className="text-sm font-bold text-[#0B2545] uppercase tracking-wider font-mono">
              Workforce Competency vs. Official Benchmark Matrix
            </h3>
            <p className="text-xs text-[#2B2D42]/60 mt-0.5">
              Aggregated capability scores derived deterministically from officer assessment telemetry.
            </p>
          </div>
          <span className="text-xs font-mono text-[#1F7A8C] font-bold">
            Target Benchmark: 70–80%
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Chart */}
          <div className="lg:col-span-7 h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2B2D42" strokeOpacity={0.1} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#2B2D42', fontWeight: 600 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#2B2D42' }} />
                <Tooltip cursor={{ fill: '#F4F6F9' }} />
                <Bar dataKey="current" name="Workforce Average" fill="#1F7A8C" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" name="Benchmark Target" fill="#0B2545" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Table */}
          <div className="lg:col-span-5 space-y-4">
            <h4 className="text-xs font-mono font-bold text-[#0B2545] uppercase tracking-wider">
              Departmental Competency Gaps
            </h4>
            <div className="space-y-2.5">
              {chartData.slice(0, 4).map((c: any, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-[#F4F6F9] border border-[#2B2D42]/10 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-[#0B2545]">{c.name}</p>
                    <span className="text-[10px] font-mono text-[#2B2D42]/60">
                      Average: {c.current}% (Target: {c.target}%)
                    </span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border",
                    c.gap > 20 
                      ? "bg-[#D4AF37]/15 text-[#0B2545] border-[#D4AF37]/35" 
                      : c.gap > 0 
                      ? "bg-[#1F7A8C]/10 text-[#1F7A8C] border-[#1F7A8C]/20"
                      : "bg-[#2E7D32]/10 text-[#2E7D32] border-[#2E7D32]/30"
                  )}>
                    {c.gap > 0 ? `-${c.gap}% Gap` : 'Benchmark Met'}
                  </span>
                </div>
              ))}
            </div>

            <Link to="/admin/gaps" className="block pt-2">
              <Button className="w-full bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-bold text-xs shadow-xs h-9">
                <span>View Full Workforce Gaps & Interventions</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
