import { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Props {
  onUploadSuccess: () => void;
}

export default function UploadZone({ onUploadSuccess }: Props) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

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
      simulateUpload();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      simulateUpload();
    }
  };

  const simulateUpload = () => {
    setUploading(true);
    let p = 0;
    const interval = setInterval(() => {
      p += 15;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          onUploadSuccess();
        }, 400);
      }
    }, 150);
  };

  return (
    <div 
      className={cn(
        "border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center transition-all relative bg-[#FFFFFF]",
        dragActive 
          ? "border-[#1F7A8C] bg-[#1F7A8C]/5 ring-2 ring-[#1F7A8C]/20" 
          : "border-[#2B2D42]/20 hover:border-[#1F7A8C]",
        uploading && "pointer-events-none"
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
        onChange={handleChange}
        accept=".pdf,.docx,.pptx,.txt"
        disabled={uploading}
      />
      
      {!uploading ? (
        <div className="flex flex-col items-center pointer-events-none space-y-3">
          <div className="w-14 h-14 bg-[#1F7A8C]/10 rounded-2xl flex items-center justify-center border border-[#1F7A8C]/20 mb-1 shadow-2xs">
            <UploadCloud className="w-7 h-7 text-[#1F7A8C]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0B2545]">Drag and drop learning materials here</h3>
            <p className="text-xs text-[#2B2D42]/60 mt-1">or click to browse official statistical manuals & guidelines</p>
          </div>
          <div className="flex gap-2 pt-2">
            <span className="px-2.5 py-1 bg-[#FFFFFF] border border-[#2B2D42]/20 rounded-md text-[11px] font-bold text-[#1F7A8C] shadow-2xs">PDF</span>
            <span className="px-2.5 py-1 bg-[#FFFFFF] border border-[#2B2D42]/20 rounded-md text-[11px] font-bold text-[#1F7A8C] shadow-2xs">DOCX</span>
            <span className="px-2.5 py-1 bg-[#FFFFFF] border border-[#2B2D42]/20 rounded-md text-[11px] font-bold text-[#1F7A8C] shadow-2xs">PPTX</span>
            <span className="px-2.5 py-1 bg-[#FFFFFF] border border-[#2B2D42]/20 rounded-md text-[11px] font-bold text-[#1F7A8C] shadow-2xs">TXT</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 bg-[#1F7A8C]/10 rounded-2xl flex items-center justify-center text-[#1F7A8C] animate-pulse">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#0B2545]">Ingesting and Extracting Text...</h3>
            <p className="text-xs text-[#2B2D42]/60 mt-0.5 font-mono">{progress}% uploaded & queued for chunking</p>
          </div>
          <Progress value={progress} indicatorColor="bg-[#1F7A8C]" className="h-2 w-full" />
        </div>
      )}
    </div>
  );
}
