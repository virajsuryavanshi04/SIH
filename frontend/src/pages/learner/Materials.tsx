import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, FileText, UploadCloud, CheckCircle2, ArrowRight } from 'lucide-react';
import UploadZone from '@/components/materials/UploadZone';
import ProcessingStatus from '@/components/materials/ProcessingStatus';
import QuestionGenerator from '@/components/materials/QuestionGenerator';

export default function Materials() {
  const [uploaded, setUploaded] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  const materials = [
    { id: 1, title: 'National Survey Sampling Guidelines & Standards (NSS 2026)', status: 'Analyzed', topics: ['Stratified Sampling', 'Cluster Allocation', 'Survey Design'], upload_date: '2026-08-22' },
    { id: 2, title: 'Periodic Labour Force Survey (PLFS) Field Manual', status: 'Analyzed', topics: ['Field Validation', 'Response Imputation', 'Data Quality'], upload_date: '2026-08-18' },
    { id: 3, title: 'Index of Industrial Production (IIP) Methodology Handbook', status: 'Analyzed', topics: ['Index Numbers', 'Weighting Schemes'], upload_date: '2026-08-14' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B2545] tracking-tight">AI Learning Material Ingestion</h1>
          <p className="text-[#2B2D42] mt-1">Upload official government documents to extract topics and automatically synthesize validated MCQs.</p>
        </div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1F7A8C]/10 text-[#1F7A8C] border border-[#1F7A8C]/20 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#1F7A8C]" />
          <span>Upload → Extract → Chunk → Analyze → Generate</span>
        </div>
      </div>

      {!uploaded ? (
        <Card className="bg-[#FFFFFF] shadow-sm border border-[#2B2D42]/10">
          <CardContent className="p-8">
            <UploadZone onUploadSuccess={() => setUploaded(true)} />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[#1F7A8C] shadow-xs bg-[#FFFFFF]">
          <CardHeader className="border-b border-[#2B2D42]/10 pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-[#0B2545]">
              <Sparkles className="w-5 h-5 text-[#1F7A8C]" />
              Processing Pipeline Telemetry
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ProcessingStatus onComplete={() => setShowGenerator(true)} />
          </CardContent>
        </Card>
      )}

      {showGenerator && (
        <Card className="border-[#1F7A8C]/30 shadow-xs bg-[#FFFFFF]">
          <CardHeader className="border-b border-[#2B2D42]/10 pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-[#0B2545]">
              <Sparkles className="w-5 h-5 text-[#1F7A8C]" />
              Configure AI MCQ Synthesis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <QuestionGenerator />
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-xl font-bold text-[#0B2545] mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#1F7A8C]" />
          Uploaded Material Knowledge Base
        </h2>
        <div className="bg-[#FFFFFF] rounded-xl shadow-xs border border-[#2B2D42]/10 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F6F9] border-b border-[#2B2D42]/10 text-[#0B2545] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-3.5">Document Title</th>
                <th className="px-6 py-3.5">Detected Topics</th>
                <th className="px-6 py-3.5">Upload Date</th>
                <th className="px-6 py-3.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B2D42]/10 font-medium text-[#2B2D42]">
              {materials.map(m => (
                <tr key={m.id} className="hover:bg-[#F4F6F9] transition-colors">
                  <td className="px-6 py-4 font-bold text-[#1F7A8C]">{m.title}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {m.topics.map(t => (
                        <span key={t} className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#1F7A8C]/10 text-[#1F7A8C] border border-[#1F7A8C]/20">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#2B2D42]/60 font-mono">{m.upload_date}</td>
                  <td className="px-6 py-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-[#2B2D42]/20 text-[#1F7A8C] hover:bg-[#1F7A8C] hover:text-[#FFFFFF] font-bold transition-all text-xs shadow-xs cursor-pointer"
                      onClick={() => setShowGenerator(true)}
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1" /> Generate MCQs
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
