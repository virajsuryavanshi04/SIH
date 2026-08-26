import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Check, X, RefreshCw, Sparkles, Database, Plus } from 'lucide-react';

export default function QuestionBank() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const questions = [
    { id: 1, text: "Which sampling method ensures that every unit in the population has a known, non-zero chance of selection?", comp: "Sampling Techniques", diff: "Intermediate", source: "AI Synthesized", status: "Pending Review", date: "2026-08-24" },
    { id: 2, text: "In hypothesis testing, what does a p-value less than the alpha significance level mandate?", comp: "Statistical Methods", diff: "Advanced", source: "Curated Bank", status: "Approved", date: "2026-08-20" },
    { id: 3, text: "When conducting stratified random sampling, how is Neyman allocation determined?", comp: "Sampling Techniques", diff: "Advanced", source: "AI Synthesized", status: "Approved", date: "2026-08-18" },
    { id: 4, text: "What is the primary vulnerability of quota sampling in official surveys?", comp: "Survey Methodology", diff: "Foundational", source: "AI Synthesized", status: "Rejected", date: "2026-08-15" },
    { id: 5, text: "Which pandas method is used to impute missing survey records with group medians?", comp: "Statistical Programming", diff: "Intermediate", source: "AI Synthesized", status: "Approved", date: "2026-08-12" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B2545] tracking-tight">Official Question Bank</h1>
          <p className="text-[#2B2D42] mt-1">Review, approve, and calibrate AI-generated MCQs from ingested government guidelines.</p>
        </div>
        <Button className="bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-bold shadow-xs cursor-pointer">
          <Plus className="w-4 h-4 mr-2" /> Add Manual Question
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-[#FFFFFF] rounded-xl shadow-xs border border-[#2B2D42]/10">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2B2D42]/40 w-4 h-4" />
          <Input 
            placeholder="Search questions by keyword or topic..." 
            className="pl-10 border-[#2B2D42]/20 focus:border-[#1F7A8C] focus:ring-[#1F7A8C]/20 bg-[#FFFFFF]" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] border-[#2B2D42]/20 bg-[#FFFFFF]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending Review">Pending Review</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-[#FFFFFF] shadow-sm border border-[#2B2D42]/10 overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F6F9] border-b border-[#2B2D42]/10 text-[#0B2545] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-3.5 w-1/3">Question Preview</th>
                <th className="px-6 py-3.5">Competency Domain</th>
                <th className="px-6 py-3.5">Difficulty</th>
                <th className="px-6 py-3.5">Review Status</th>
                <th className="px-6 py-3.5 text-right">Review Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B2D42]/10 font-medium text-[#2B2D42]">
              {questions.map(q => (
                <tr key={q.id} className="hover:bg-[#F4F6F9] transition-colors">
                  <td className="px-6 py-4 font-bold text-[#1F7A8C] max-w-[320px]">
                    <span className="line-clamp-1">{q.text}</span>
                    <span className="text-[10px] font-mono text-[#2B2D42]/60 font-normal">{q.source} • {q.date}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#1F7A8C]/10 text-[#1F7A8C] border border-[#1F7A8C]/20">
                      {q.comp}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#2B2D42]">{q.diff}</td>
                  <td className="px-6 py-4">
                    {q.status === 'Approved' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#2E7D32]/10 text-[#2E7D32] border border-[#2E7D32]/30 font-mono">
                        Approved
                      </span>
                    ) : q.status === 'Rejected' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 font-mono">
                        Rejected
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#1F7A8C]/10 text-[#1F7A8C] border border-[#1F7A8C]/20 font-mono">
                        Pending Review
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-1.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#1F7A8C] hover:bg-[#F4F6F9] cursor-pointer" title="Inspect">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#2E7D32] hover:bg-[#2E7D32]/10 cursor-pointer" title="Approve">
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#D4AF37] hover:bg-[#D4AF37]/10 cursor-pointer" title="Reject">
                      <X className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#2B2D42]/60 hover:text-[#1F7A8C] cursor-pointer" title="AI Regenerate">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
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
