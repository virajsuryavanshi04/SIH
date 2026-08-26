import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserCheck, ShieldCheck, ArrowRight, Eye, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmployeeList() {
  const [search, setSearch] = useState('');

  const officers = [
    { id: 1, name: "Arjun Patel", role: "Statistical Officer", dept: "Statistical Services", score: 72, gaps: 2, status: "Active Learning" },
    { id: 2, name: "Priya Sharma", role: "Survey Officer", dept: "Survey Operations", score: 58, gaps: 4, status: "Priority Bottleneck" },
    { id: 3, name: "Rajesh Kumar", role: "Data Analyst", dept: "Data Analysis Div", score: 84, gaps: 1, status: "Target Met" },
    { id: 4, name: "Sneha Gupta", role: "Statistical Investigator", dept: "Survey Operations", score: 62, gaps: 3, status: "Active Learning" },
    { id: 5, name: "Vikram Malhotra", role: "Senior Analyst", dept: "IT & Digital Stats", score: 76, gaps: 2, status: "Active Learning" },
  ];

  const filtered = officers.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) || 
    o.role.toLowerCase().includes(search.toLowerCase()) ||
    o.dept.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B2545] tracking-tight">Statistical Officer Registry</h1>
          <p className="text-[#2B2D42] mt-1">Individual officer capability profiles and personalized learning trajectories.</p>
        </div>
      </div>

      <div className="p-4 bg-[#FFFFFF] rounded-xl shadow-xs border border-[#2B2D42]/10">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2B2D42]/40 w-4 h-4" />
          <Input 
            placeholder="Search officers by name, role, or division..." 
            className="pl-10 border-[#2B2D42]/20 focus:border-[#1F7A8C] focus:ring-[#1F7A8C]/20 bg-[#FFFFFF]" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
      </div>

      <Card className="bg-[#FFFFFF] shadow-sm border border-[#2B2D42]/10 overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F6F9] border-b border-[#2B2D42]/10 text-[#0B2545] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-3.5">Officer Name</th>
                <th className="px-6 py-3.5">Designation</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Overall Score</th>
                <th className="px-6 py-3.5">Identified Gaps</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B2D42]/10 font-medium text-[#2B2D42]">
              {filtered.map(officer => (
                <tr key={officer.id} className="hover:bg-[#F4F6F9] transition-colors">
                  <td className="px-6 py-4 font-bold text-[#1F7A8C]">{officer.name}</td>
                  <td className="px-6 py-4 text-[#2B2D42]">{officer.role}</td>
                  <td className="px-6 py-4 text-[#2B2D42]/60">{officer.dept}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-sm text-[#0B2545] font-mono">{officer.score}%</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[#D4AF37] font-bold font-mono">{officer.gaps} bottlenecks</span>
                  </td>
                  <td className="px-6 py-4">
                    {officer.score >= 80 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#2E7D32]/10 text-[#2E7D32] border border-[#2E7D32]/30 font-mono">
                        Target Met
                      </span>
                    ) : officer.score < 60 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 font-mono">
                        Priority Bottleneck
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#1F7A8C]/10 text-[#1F7A8C] border border-[#1F7A8C]/20 font-mono">
                        Active Learning
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to="/dashboard">
                      <Button size="sm" variant="ghost" className="text-[#1F7A8C] hover:bg-[#F4F6F9] font-semibold cursor-pointer">
                        <Eye className="w-3.5 h-3.5 mr-1" /> View Topology
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
