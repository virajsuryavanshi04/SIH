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
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#176B87] uppercase tracking-widest mb-1">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>TRAINING IMPACT & CAPABILITY TELEMETRY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#123047] tracking-tight">
            Institutional Learning Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#5D7180] mt-1">
            Measurable return on training investment (ROTI) and workforce capability growth trajectories.
          </p>
        </div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono text-[#5D7180] bg-[#EAF3F7] border border-[#D8E5EC]">
          <span>Institutional Model Metrics</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#FFFFFF] border border-[#D8E5EC] rounded-2xl shadow-[0_1px_3px_rgba(11,37,69,0.04)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#5D7180] uppercase font-mono">Total Assessments</span>
              <CheckCircle2 className="w-5 h-5 text-[#2E8B57]" />
            </div>
            <div className="text-3xl font-extrabold text-[#123047] font-mono">148</div>
            <p className="text-xs text-[#2E8B57] mt-1 font-semibold font-mono">↑ 24% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-[#FFFFFF] border border-[#D8E5EC] rounded-2xl shadow-[0_1px_3px_rgba(11,37,69,0.04)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#5D7180] uppercase font-mono">Avg Competency Lift</span>
              <TrendingUp className="w-5 h-5 text-[#176B87]" />
            </div>
            <div className="text-3xl font-extrabold text-[#176B87] font-mono">+19.2%</div>
            <p className="text-xs text-[#5D7180] mt-1">Across 8 statistical domains</p>
          </CardContent>
        </Card>

        <Card className="bg-[#FFFFFF] border border-[#D8E5EC] rounded-2xl shadow-[0_1px_3px_rgba(11,37,69,0.04)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#5D7180] uppercase font-mono">Hours Saved per Officer</span>
              <Clock className="w-5 h-5 text-[#5D7180]" />
            </div>
            <div className="text-3xl font-extrabold text-[#123047] font-mono">14.5 hrs</div>
            <p className="text-xs text-[#2E8B57] mt-1 font-semibold">Via AI adaptive curriculum waivers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="bg-[#FFFFFF] border border-[#D8E5EC] rounded-2xl shadow-[0_1px_3px_rgba(11,37,69,0.04)] overflow-hidden">
          <CardHeader className="bg-[#EAF3F7] border-b border-[#D8E5EC] p-5 pb-3">
            <CardTitle className="text-sm sm:text-base font-bold text-[#123047]">Before vs. After Training Capability Trajectory</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D8E5EC" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#123047' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#5D7180' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="postTraining" name="Post-Intervention" stroke="#176B87" fill="#176B87" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="baseline" name="Baseline Score" stroke="#123B5D" fill="#123B5D" fillOpacity={0.08} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#FFFFFF] border border-[#D8E5EC] rounded-2xl shadow-[0_1px_3px_rgba(11,37,69,0.04)] overflow-hidden">
          <CardHeader className="bg-[#EAF3F7] border-b border-[#D8E5EC] p-5 pb-3">
            <CardTitle className="text-sm sm:text-base font-bold text-[#123047]">Departmental Performance vs. Completion</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D8E5EC" />
                  <XAxis dataKey="dept" tick={{ fontSize: 10, fill: '#123047' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#5D7180' }} />
                  <Tooltip />
                  <Bar dataKey="avgScore" name="Average Score" fill="#176B87" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completionRate" name="Curriculum Completion %" fill="#2E8B57" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
