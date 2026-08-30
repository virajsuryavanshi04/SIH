import React, { useState, useEffect } from 'react';
import { materialApi, competencyApi } from '@/lib/api';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle, 
  BookOpen, 
  Layers, 
  Target, 
  Check, 
  Info,
  FileType
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Props {
  onUploadSuccess: () => void;
}

export default function UploadZone({ onUploadSuccess }: Props) {
  // Classification Scope: OFFICIAL_COMPETENCY vs OTHER_LEARNING
  const [materialScope, setMaterialScope] = useState<'OFFICIAL_COMPETENCY' | 'OTHER_LEARNING'>('OFFICIAL_COMPETENCY');
  
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>('');
  const [competencyId, setCompetencyId] = useState<string>('');
  const [topicId, setTopicId] = useState<string>('');
  
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
        const comps = res.data || [];
        setCompetencies(comps);
        if (comps.length > 0) {
          setCompetencyId(String(comps[0].id));
        }
      } catch (err) {
        console.error('Failed to load competencies:', err);
      }
    };
    fetchCompetencies();
  }, []);

  // Filter topics for the currently selected competency
  const selectedCompObj = competencies.find(c => String(c.id) === competencyId);
  const availableTopics = selectedCompObj?.topics || [];

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
      setError('Please select a PDF, Word, PowerPoint, or Text document to upload.');
      return;
    }

    if (materialScope === 'OFFICIAL_COMPETENCY' && !competencyId) {
      setError('Please select an official competency for this material.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setProgress(25);
      setStatusMessage('Uploading document securely to repository...');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('material_scope', materialScope);
      if (title.trim()) {
        formData.append('title', title.trim());
      }
      if (materialScope === 'OFFICIAL_COMPETENCY') {
        formData.append('competency_id', competencyId);
        if (topicId) {
          formData.append('topic_id', topicId);
        }
      }

      setProgress(60);
      setStatusMessage('Extracting document text & verifying structure...');

      const res = await materialApi.upload(formData);

      setProgress(100);
      setStatusMessage('Document verified and indexed for learning!');

      setTimeout(() => {
        setFile(null);
        setTitle('');
        setTopicId('');
        setUploading(false);
        setProgress(0);
        setStatusMessage('');
        onUploadSuccess();
      }, 800);

    } catch (err: any) {
      console.error('Material upload failed:', err);
      setUploading(false);
      setProgress(0);
      setError(err.response?.data?.detail || 'Failed to upload document. Please ensure it is a supported, readable format.');
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* 1. Purpose / Scope Selection Banner */}
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase font-bold tracking-wider text-[#292B2B] flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-[#A85D4C]" />
          <span>What is this material for?</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Card A: Official Competency */}
          <button
            type="button"
            onClick={() => { setMaterialScope('OFFICIAL_COMPETENCY'); setError(null); }}
            className={cn(
              "p-4 rounded-xl border text-left transition-all cursor-pointer relative",
              materialScope === 'OFFICIAL_COMPETENCY'
                ? "border-[#A85D4C] bg-[#A85D4C]/10 ring-1 ring-[#A85D4C]"
                : "border-[#E2DDD5] bg-[#FFFDF9] hover:bg-[#F7F4EE] hover:border-[#A85D4C]/40"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#A85D4C]" />
                <span className="font-bold text-sm text-[#292B2B]">Official Competency</span>
              </div>
              <div className={cn(
                "w-4 h-4 rounded-full border flex items-center justify-center",
                materialScope === 'OFFICIAL_COMPETENCY' ? "border-[#A85D4C] bg-[#A85D4C]" : "border-[#7A756E]"
              )}>
                {materialScope === 'OFFICIAL_COMPETENCY' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </div>
            <p className="text-[11px] text-[#7A756E] leading-relaxed mt-1.5">
              Use this material to learn and validate against official SmartLearn role competencies and curriculum.
            </p>
          </button>

          {/* Card B: Other Learning Material */}
          <button
            type="button"
            onClick={() => { setMaterialScope('OTHER_LEARNING'); setError(null); setTopicId(''); }}
            className={cn(
              "p-4 rounded-xl border text-left transition-all cursor-pointer relative",
              materialScope === 'OTHER_LEARNING'
                ? "border-[#2D3030] bg-[#2D3030]/10 ring-1 ring-[#2D3030]"
                : "border-[#E2DDD5] bg-[#FFFDF9] hover:bg-[#F7F4EE] hover:border-[#2D3030]/40"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileType className="w-4 h-4 text-[#2D3030]" />
                <span className="font-bold text-sm text-[#292B2B]">Other Learning Material</span>
              </div>
              <div className={cn(
                "w-4 h-4 rounded-full border flex items-center justify-center",
                materialScope === 'OTHER_LEARNING' ? "border-[#2D3030] bg-[#2D3030]" : "border-[#7A756E]"
              )}>
                {materialScope === 'OTHER_LEARNING' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </div>
            <p className="text-[11px] text-[#7A756E] leading-relaxed mt-1.5">
              Use this material for general study, reference books, college notes, or certification preparation.
            </p>
          </button>

        </div>
      </div>

      {/* 2. Official Competency & Topic Selectors (if OFFICIAL_COMPETENCY) */}
      {materialScope === 'OFFICIAL_COMPETENCY' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#EFEBE4] border border-[#E2DDD5] animate-in fade-in duration-150">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase font-bold text-[#292B2B] block">
              Official Competency *
            </label>
            <select
              value={competencyId}
              onChange={(e) => {
                setCompetencyId(e.target.value);
                setTopicId('');
              }}
              className="w-full h-10 px-3 rounded-lg border border-[#E2DDD5] bg-[#FFFDF9] text-xs font-semibold text-[#292B2B] focus:ring-1 focus:ring-[#A85D4C] focus:outline-none"
            >
              {competencies.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase font-bold text-[#292B2B] block">
              Specific Topic (Optional)
            </label>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#E2DDD5] bg-[#FFFDF9] text-xs font-medium text-[#292B2B] focus:ring-1 focus:ring-[#A85D4C] focus:outline-none"
            >
              <option value="">All Topics / General</option>
              {availableTopics.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 3. Document Title Input */}
      <div className="space-y-1.5">
        <label className="text-xs font-mono uppercase font-bold text-[#292B2B] flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-[#A85D4C]" />
          <span>Document Title (Optional)</span>
        </label>
        <Input
          type="text"
          placeholder="e.g. Statistical Sampling Methods & Standards"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-10 bg-[#FFFDF9] border-[#E2DDD5] text-xs font-medium text-[#292B2B]"
        />
      </div>

      {/* 4. Drag & Drop Upload Arena */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all bg-[#FFFDF9]",
          dragActive ? "border-[#A85D4C] bg-[#A85D4C]/10" : "border-[#E2DDD5] hover:border-[#A85D4C]/40",
          file ? "border-[#2E8B57] bg-[#2E8B57]/10" : ""
        )}
      >
        <input
          type="file"
          id="material-upload-input"
          accept=".pdf,.docx,.pptx,.txt"
          onChange={handleFileInput}
          className="hidden"
          disabled={uploading}
        />

        {file ? (
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[#2E8B57]/15 text-[#2E8B57] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-[#292B2B]">{file.name}</p>
              <p className="text-xs font-mono text-[#7A756E]">
                {(file.size / 1024).toFixed(1)} KB • Ready to Ingest
              </p>
            </div>
            <label
              htmlFor="material-upload-input"
              className="text-xs font-semibold text-[#A85D4C] hover:underline cursor-pointer inline-block pt-1"
            >
              Choose different file
            </label>
          </div>
        ) : (
          <label htmlFor="material-upload-input" className="cursor-pointer block space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#EFEBE4] text-[#A85D4C] flex items-center justify-center mx-auto">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#292B2B]">
                Drag and drop study document here, or <span className="text-[#A85D4C] underline">browse files</span>
              </p>
              <p className="text-xs text-[#7A756E] mt-1">
                Supported formats: PDF, Word (DOCX), PowerPoint (PPTX), Plain Text (TXT) • Max 25 MB
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1 font-mono text-[10px] text-[#7A756E]">
              <span className="px-2 py-0.5 rounded bg-[#EFEBE4] border border-[#E2DDD5]">.pdf</span>
              <span className="px-2 py-0.5 rounded bg-[#EFEBE4] border border-[#E2DDD5]">.docx</span>
              <span className="px-2 py-0.5 rounded bg-[#EFEBE4] border border-[#E2DDD5]">.pptx</span>
              <span className="px-2 py-0.5 rounded bg-[#EFEBE4] border border-[#E2DDD5]">.txt</span>
            </div>
          </label>
        )}
      </div>

      {/* 5. Error Alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-[#A85D4C]/10 border border-[#A85D4C]/30 text-xs font-semibold text-[#A85D4C] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 6. Uploading Progress */}
      {uploading && (
        <div className="space-y-2 p-4 rounded-xl bg-[#EFEBE4] border border-[#E2DDD5]">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-[#292B2B]">
            <span>{statusMessage}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* 7. Action Button */}
      <div className="pt-2 flex justify-end">
        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9] font-bold text-xs h-10 px-6 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
        >
          {uploading ? 'Processing Document...' : 'Ingest Study Material'}
        </Button>
      </div>

    </div>
  );
}
