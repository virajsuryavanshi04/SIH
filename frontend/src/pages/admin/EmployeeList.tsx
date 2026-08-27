import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserCheck, ShieldCheck, ArrowRight, Eye, Sparkles, Users } from 'lucide-react';
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
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#1F7A8C] uppercase tracking-widest mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>INSTITUTIONAL PERSONNEL REGISTRY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#102A43] tracking-tight">
            Statistical Officer Registry
          </h1>
          <p className="text-xs sm:text-sm text-[#62748A] mt-1">
            Individual officer capability profiles, empirical readiness scores, and personalized learning trajectories.
          </p>
        </div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono text-[#62748A] bg-[#EEF5F7] border border-[#DCE5EA]">
          <span>Demonstration Cohort ({officers.length} Officers)</span>
        </div>
      </div>

      <div className="p-4 bg-[#FFFFFF] rounded-2xl shadow-[0_1px_3px_rgba(11,37,69,0.04)] border border-[#DCE5EA]">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#62748A]/60 w-4 h-4" />
          <Input 
            placeholder="Search officers by name, role, or division..." 
            className="pl-10 h-10 rounded-xl border-[#DCE5EA] focus:border-[#1F7A8C] focus:ring-[#1F7A8C]/20 bg-[#FFFFFF] text-sm text-[#102A43]" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
      </div>

      <Card className="bg-[#FFFFFF] shadow-[0_1px_3px_rgba(11,37,69,0.04)] border border-[#DCE5EA] rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EEF5F7] border-b border-[#DCE5EA] text-[#102A43] uppercase tracking-wider font-semibold font-mono text-[10px]">
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
              <tbody className="divide-y divide-[#DCE5EA] font-medium text-[#102A43]">
                {filtered.map(officer => (
                  <tr key={officer.id} className="hover:bg-[#EEF5F7]/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#1F7A8C]">{officer.name}</td>
                    <td className="px-6 py-4 text-[#102A43]">{officer.role}</td>
                    <td className="px-6 py-4 text-[#62748A]">{officer.dept}</td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-sm text-[#102A43] font-mono">{officer.score}%</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[#D4AF37] font-bold font-mono">{officer.gaps} bottlenecks</span>
                    </td>
                    <td className="px-6 py-4">
                      {officer.score >= 80 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#2E7D32]/10 text-[#2E7D32] border border-[#2E7D32]/30">
                          Target Met
                        </span>
                      ) : officer.score < 60 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#D4AF37]/15 text-[#102A43] border border-[#D4AF37]/35">
                          Priority Bottleneck
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#1F7A8C]/10 text-[#1F7A8C] border border-[#1F7A8C]/20">
                          Active Learning
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to="/dashboard">
                        <Button size="sm" variant="ghost" className="text-[#1F7A8C] hover:bg-[#1F7A8C]/10 font-semibold cursor-pointer h-8 rounded-lg">
                          <Eye className="w-3.5 h-3.5 mr-1" /> View Topology
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
