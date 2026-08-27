import React, { useState, useEffect } from 'react';
import { materialApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import UploadZone from '@/components/materials/UploadZone';
import QuestionGenerator from '@/components/materials/QuestionGenerator';
import { FileText, Trash2, Sparkles, CheckCircle2, BookOpen, Layers, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminMaterials() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await materialApi.getAll();
      setMaterials(res.data || []);
    } catch (err) {
      console.error('Failed to load materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-left">
      <div>
        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#1F7A8C] uppercase tracking-widest mb-1">
          <BookOpen className="w-3.5 h-3.5" />
          <span>CONTENT INGESTION & SYNTHESIS</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#0B2545] tracking-tight">
          Official Material Repository
        </h1>
        <p className="text-xs sm:text-sm text-[#2B2D42]/80 mt-1">
          Upload official MoSPI manuals, PLFS guidelines, and census handbooks to generate source-grounded question banks.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-[#2E7D32]/10 border border-[#2E7D32]/30 text-xs font-bold font-mono text-[#2E7D32] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      <Card className="bg-[#FFFFFF] shadow-xs border border-[#2B2D42]/10">
        <CardContent className="p-6">
          <UploadZone onUploadSuccess={fetchMaterials} />
        </CardContent>
      </Card>

      {/* Interactive MCQ Generation & Curation Section for Selected Material */}
      {selectedMaterial && (
        <Card className="bg-[#FFFFFF] border-2 border-[#1F7A8C] shadow-md animate-in fade-in duration-200">
          <CardHeader className="bg-[#0B2545] text-[#FFFFFF] p-4 flex flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
              <CardTitle className="text-sm sm:text-base font-bold text-[#FFFFFF]">
                Generate & Curate Questions: {selectedMaterial.title}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedMaterial(null)}
              className="text-[#FFFFFF]/70 hover:text-[#FFFFFF] hover:bg-[#FFFFFF]/10 h-8 w-8 p-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <QuestionGenerator 
              materialId={selectedMaterial.id} 
              onGenerationComplete={() => fetchMaterials()}
            />
          </CardContent>
        </Card>
      )}

      <Card className="bg-[#FFFFFF] shadow-xs border border-[#2B2D42]/10 overflow-hidden">
        <CardHeader className="bg-[#F4F6F9] border-b border-[#2B2D42]/10 p-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base font-bold text-[#0B2545] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1F7A8C]" />
              Ingested Official Documents ({materials.length})
            </CardTitle>
            <span className="text-xs font-mono text-[#2B2D42]/60 font-semibold">
              Ground-Truth Question Source
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-xs text-[#2B2D42]/60">Loading materials...</div>
          ) : materials.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#2B2D42]/60">
              No documents uploaded yet. Drag & drop official manuals above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F6F9] border-b border-[#2B2D42]/10 text-[#0B2545] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-6 py-3.5">Document Title</th>
                    <th className="px-6 py-3.5">Topics & Mappings</th>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B2D42]/10 font-medium text-[#2B2D42]">
                  {materials.map(m => {
                    const topics = Array.isArray(m.detected_topics) ? m.detected_topics : [];
                    const dateStr = m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Recent';
                    const isSelected = selectedMaterial?.id === m.id;

                    return (
                      <tr key={m.id} className="hover:bg-[#F4F6F9] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#1F7A8C]/10 text-[#1F7A8C] rounded-xl">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-[#0B2545]">{m.title}</p>
                              <p className="text-[10px] text-[#2B2D42]/60 font-mono">
                                Size: {Math.round((m.file_size || 0) / 1024)} KB • Status: {m.processing_status}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {topics.slice(0, 3).map((t: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-[#F4F6F9] text-[#2B2D42] text-[10px] font-bold border border-[#2B2D42]/10">
                                {t}
                              </span>
                            ))}
                            {topics.length > 3 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] text-[#2B2D42]/50 font-mono">
                                +{topics.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#2B2D42]/60 font-mono">{dateStr}</td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            size="sm"
                            onClick={() => setSelectedMaterial(m)}
                            className={`font-bold text-xs shadow-2xs h-8 cursor-pointer ${
                              isSelected 
                                ? 'bg-[#0B2545] text-[#FFFFFF]' 
                                : 'bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF]'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5 mr-1" />
                            <span>{isSelected ? 'Configuring...' : 'Generate MCQs'}</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
