import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import UploadZone from '@/components/materials/UploadZone';
import { FileText, Trash2, Eye, Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminMaterials() {
  const materials = [
    { id: 1, title: 'National Survey Sampling Guidelines & Standards (NSS 2026)', uploader: 'Admin (Priya Sharma)', topics: 4, qCount: 45, date: '2026-08-22' },
    { id: 2, title: 'Periodic Labour Force Survey (PLFS) Field Manual', uploader: 'Manager (Rajesh Kumar)', topics: 3, qCount: 30, date: '2026-08-18' },
    { id: 3, title: 'Index of Industrial Production (IIP) Methodology Handbook', uploader: 'System Automated', topics: 2, qCount: 20, date: '2026-08-14' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-[#0B2545] tracking-tight">Official Material Repository</h1>
        <p className="text-[#2B2D42] mt-1">Manage official government publications and AI-extracted question banks.</p>
      </div>

      <Card className="bg-[#FFFFFF] shadow-sm border border-[#2B2D42]/10">
        <CardContent className="p-8">
          <UploadZone onUploadSuccess={() => {}} />
        </CardContent>
      </Card>

      <Card className="bg-[#FFFFFF] shadow-sm border border-[#2B2D42]/10 overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F6F9] border-b border-[#2B2D42]/10 text-[#0B2545] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-3.5">Document Title</th>
                <th className="px-6 py-3.5">Extracted Stats</th>
                <th className="px-6 py-3.5">Ingestion Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B2D42]/10 font-medium text-[#2B2D42]">
              {materials.map(m => (
                <tr key={m.id} className="hover:bg-[#F4F6F9] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-[#1F7A8C]/10 text-[#1F7A8C] rounded-xl">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-[#1F7A8C]">{m.title}</p>
                        <p className="text-[11px] text-[#2B2D42]/60 font-normal">Uploaded by {m.uploader}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#F4F6F9] text-[#2B2D42] text-[10px] font-bold border border-[#2B2D42]/10">
                        {m.topics} Topics
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#1F7A8C]/10 text-[#1F7A8C] text-[10px] font-bold border border-[#1F7A8C]/20">
                        {m.qCount} MCQs Synthesized
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#2B2D42]/60 font-mono">{m.date}</td>
                  <td className="px-6 py-4 text-right space-x-1.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#1F7A8C] hover:bg-[#F4F6F9] cursor-pointer">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#D4AF37] hover:bg-[#D4AF37]/10 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
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
