import React, { useState, useEffect } from 'react';
import { materialApi, competencyApi } from '@/lib/api';
import { UploadCloud, FileText, CheckCircle2, Sparkles, AlertCircle, Plus, BookOpen, Layers } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Props {
  onUploadSuccess: () => void;
}

export default function UploadZone({ onUploadSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>('');
  const [competencyId, setCompetencyId] = useState<string>('1');
  const [topicName, setTopicName] = useState<string>('');
  const [competencies, setCompetencies] = useState<any[]>([]);

  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompetencies = async () => {
      try {
        const res = await competencyApi.getAll();
        setCompetencies(res.data || []);
      } catch (err) {
        console.error('Failed to load competencies:', err);
      }
    };
    fetchCompetencies();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile);
    if (!title) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
      setTitle(cleanName);
    }
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF or document file to upload.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setProgress(20);
      setStatusMessage('Uploading document to server...');

      const formData = new FormData();
      formData.append('file', file);
      if (title.trim()) {
        formData.append('title', title.trim());
      }
      if (competencyId) {
        formData.append('competency_id', competencyId);
      }

      setProgress(50);
      setStatusMessage('Extracting document text & analyzing structure...');

      const res = await materialApi.upload(formData);

      setProgress(85);
      setStatusMessage('Identifying statistical curriculum mappings & topics...');

      setTimeout(() => {
        setProgress(100);
        setStatusMessage('Document successfully processed & indexed!');
        setTimeout(() => {
          setUploading(false);
          setProgress(0);
          setFile(null);
          setTitle('');
          setTopicName('');
          onUploadSuccess();
        }, 600);
      }, 500);

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err?.response?.data?.detail || 'Failed to upload and process material.');
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-5 text-left">
      
      {error && (
        <div className="p-3.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-xs font-bold text-[#0B2545] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#D4AF37] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Structured Upload Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#0B2545] uppercase tracking-wider">
            Document Title
          </label>
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="e.g., National Survey Sampling Handbook (NSS 2026)" 
            className="text-xs border-[#2B2D42]/20 bg-[#FFFFFF]"
            disabled={uploading}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#0B2545] uppercase tracking-wider">
            Primary Competency Domain
          </label>
          <Select value={competencyId} onValueChange={setCompetencyId} disabled={uploading}>
            <SelectTrigger className="border-[#2B2D42]/20 bg-[#FFFFFF] text-xs">
              <SelectValue placeholder="Select competency" />
            </SelectTrigger>
            <SelectContent>
              {competencies.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Drag & Drop File Zone */}
      <div 
        className={cn(
          "border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all relative bg-[#FFFFFF]",
          dragActive 
            ? "border-[#1F7A8C] bg-[#1F7A8C]/5 ring-2 ring-[#1F7A8C]/20" 
            : "border-[#2B2D42]/20 hover:border-[#1F7A8C]",
          uploading && "pointer-events-none opacity-80"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          onChange={handleFileInput}
          accept=".pdf,.docx,.pptx,.txt"
          disabled={uploading}
        />
        
        {!uploading ? (
          <div className="flex flex-col items-center pointer-events-none space-y-2">
            <div className="w-10 h-10 bg-[#1F7A8C]/10 rounded-xl flex items-center justify-center border border-[#1F7A8C]/20 text-[#1F7A8C] shadow-2xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#0B2545]">
                {file ? file.name : "Drag & drop official training PDF / document here"}
              </p>
              <p className="text-[11px] text-[#2B2D42]/60 mt-0.5">
                {file ? `${(file.size / 1024).toFixed(1)} KB • Click or drop new file to replace` : "or click to select file from your system"}
              </p>
            </div>
            <div className="flex gap-1.5 pt-1">
              <span className="px-2 py-0.5 bg-[#FFFFFF] border border-[#2B2D42]/20 rounded text-[10px] font-bold text-[#1F7A8C]">PDF</span>
              <span className="px-2 py-0.5 bg-[#FFFFFF] border border-[#2B2D42]/20 rounded text-[10px] font-bold text-[#1F7A8C]">DOCX</span>
              <span className="px-2 py-0.5 bg-[#FFFFFF] border border-[#2B2D42]/20 rounded text-[10px] font-bold text-[#1F7A8C]">TXT</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center max-w-md mx-auto space-y-3">
            <div className="w-10 h-10 bg-[#1F7A8C]/10 rounded-xl flex items-center justify-center text-[#1F7A8C] animate-pulse">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-[#0B2545]">{statusMessage}</h3>
              <p className="text-[10px] text-[#2B2D42]/60 mt-0.5 font-mono">{progress}% parsed & indexed</p>
            </div>
            <Progress value={progress} indicatorColor="bg-[#1F7A8C]" className="h-1.5 w-full" />
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleUpload}
          disabled={!file || uploading}
          className="bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-bold text-xs shadow-xs cursor-pointer px-5"
        >
          {uploading ? (
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-[#FFFFFF] border-t-transparent rounded-full animate-spin" />
              <span>Processing Ingestion Pipeline...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Upload & Process Document</span>
            </div>
          )}
        </Button>
      </div>

    </div>
  );
}
