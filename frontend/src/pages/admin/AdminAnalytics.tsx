import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { BarChart3, TrendingUp, Users, CheckCircle2, Clock } from 'lucide-react';

export default function AdminAnalytics() {
  const trendData = [
    { month: 'Apr', baseline: 52, postTraining: 68 },
    { month: 'May', baseline: 55, postTraining: 72 },
    { month: 'Jun', baseline: 58, postTraining: 75 },
    { month: 'Jul', baseline: 61, postTraining: 79 },
    { month: 'Aug', baseline: 64, postTraining: 83 },
  ];

  const deptComparison = [
    { dept: 'Statistical Services', avgScore: 78, completionRate: 92 },
    { dept: 'Survey Operations', avgScore: 68, completionRate: 84 },
    { dept: 'Data Analysis Div', avgScore: 84, completionRate: 96 },
    { dept: 'IT & Digital Stats', avgScore: 74, completionRate: 88 },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-[#0B2545] tracking-tight">Institutional Learning Analytics</h1>
        <p className="text-[#2B2D42] mt-1">Measurable return on training investment (ROTI) and workforce transformation telemetry.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#FFFFFF] border border-[#2B2D42]/10 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#2B2D42]/60 uppercase font-mono">Total Assessments</span>
              <CheckCircle2 className="w-5 h-5 text-[#2E7D32]" />
            </div>
            <div className="text-3xl font-black text-[#0B2545] font-mono">148</div>
            <p className="text-xs text-[#2E7D32] mt-1 font-semibold font-mono">↑ 24% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-[#FFFFFF] border border-[#2B2D42]/10 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#2B2D42]/60 uppercase font-mono">Avg Competency Lift</span>
              <TrendingUp className="w-5 h-5 text-[#1F7A8C]" />
            </div>
            <div className="text-3xl font-black text-[#1F7A8C] font-mono">+19.2%</div>
            <p className="text-xs text-[#2B2D42] mt-1">Across 8 statistical domains</p>
          </CardContent>
        </Card>

        <Card className="bg-[#FFFFFF] border border-[#2B2D42]/10 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#2B2D42]/60 uppercase font-mono">Hours Saved per Officer</span>
              <Clock className="w-5 h-5 text-[#2B2D42]/60" />
            </div>
            <div className="text-3xl font-black text-[#0B2545] font-mono">14.5 hrs</div>
            <p className="text-xs text-[#2E7D32] mt-1 font-semibold">Via AI adaptive curriculum waivers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="bg-[#FFFFFF] border border-[#2B2D42]/10 shadow-sm">
          <CardHeader className="border-b border-[#2B2D42]/10 pb-3">
            <CardTitle className="text-base font-bold text-[#0B2545]">Before vs. After Training Capability Trajectory</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2B2D42" strokeOpacity={0.1} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#2B2D42' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#2B2D42' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="postTraining" name="Post-Intervention" stroke="#1F7A8C" fill="#1F7A8C" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="baseline" name="Baseline Score" stroke="#0B2545" fill="#0B2545" fillOpacity={0.08} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#FFFFFF] border border-[#2B2D42]/10 shadow-sm">
          <CardHeader className="border-b border-[#2B2D42]/10 pb-3">
            <CardTitle className="text-base font-bold text-[#0B2545]">Departmental Performance vs. Completion</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2B2D42" strokeOpacity={0.1} />
                  <XAxis dataKey="dept" tick={{ fontSize: 10, fill: '#2B2D42' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#2B2D42' }} />
                  <Tooltip />
                  <Bar dataKey="avgScore" name="Average Score" fill="#1F7A8C" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completionRate" name="Curriculum Completion %" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
