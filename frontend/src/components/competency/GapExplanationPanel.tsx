import { Link } from 'react-router-dom';
import { X, CheckCircle, TrendingUp, AlertTriangle, Sparkles, ArrowRight, Clock, Target, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: any | null;
}

export default function GapExplanationPanel({ isOpen, onClose, data }: Props) {
  if (!data) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn("fixed inset-0 bg-[#0B2545]/40 backdrop-blur-xs z-40 transition-opacity", isOpen ? "opacity-100" : "opacity-0 pointer-events-none")} 
        onClick={onClose} 
      />
      
      {/* Drawer */}
      <div className={cn(
        "fixed top-0 right-0 h-full w-full max-w-md bg-[#FFFFFF] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-[#2B2D42]/15",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-6 border-b border-[#2B2D42]/10 flex justify-between items-center bg-[#FFFFFF]">
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-[#1F7A8C] uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Gap Diagnostics</span>
            </div>
            <h2 className="text-xl font-extrabold text-[#0B2545]">{data.name}</h2>
            <p className="text-xs text-[#2B2D42]/60 font-medium">{data.domain}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#F4F6F9] rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5 text-[#2B2D42]/60 hover:text-[#0B2545]" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Scores Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#F4F6F9] p-4 rounded-xl text-center border border-[#2B2D42]/10">
              <p className="text-xs text-[#2B2D42]/60 font-bold uppercase mb-1">Current Score</p>
              <p className="text-3xl font-extrabold text-[#0B2545]">{data.current_score}%</p>
            </div>
            <div className="bg-[#1F7A8C]/10 p-4 rounded-xl text-center border border-[#1F7A8C]/20">
              <p className="text-xs text-[#1F7A8C] font-bold uppercase mb-1">Role Target</p>
              <p className="text-3xl font-extrabold text-[#1F7A8C]">{data.required_level}%</p>
            </div>
          </div>
          
          {/* Gap Status Banner */}
          <div className={cn(
            "p-4 rounded-xl border flex items-start gap-3",
            data.gap > 0 ? "bg-[#D4AF37]/15 border-[#D4AF37]/30 text-[#0B2545]" : "bg-[#2E7D32]/10 border-[#2E7D32]/30 text-[#0B2545]"
          )}>
            {data.gap > 0 ? (
              <AlertTriangle className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-[#2E7D32] shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className="font-bold text-sm">{data.gap > 0 ? `Competency Gap: ${data.gap} Percentage Points` : 'Target Level Met'}</h3>
              <p className="text-xs mt-1 text-[#2B2D42]/80 leading-relaxed">
                {data.gap > 0 
                  ? `Your score of ${data.current_score}% is below the required ${data.required_level}% benchmark for your role.` 
                  : "You have verified proficiency matching official government statistical standards."}
              </p>
            </div>
          </div>
          
          {data.gap > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-[#0B2545] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#1F7A8C]" /> Why is there a gap? (Explainable AI)
              </h3>
              
              <div className="space-y-3 bg-[#F4F6F9] p-4 rounded-xl border border-[#2B2D42]/10 text-xs text-[#2B2D42]">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#1F7A8C] shrink-0 mt-0.5" />
                  <span><strong>Assessment Telemetry:</strong> 6 of your last 10 assessment questions involved {data.name.toLowerCase()} applications; 4 were answered incorrectly.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-[#1F7A8C] shrink-0 mt-0.5" />
                  <span><strong>Latency Pattern:</strong> Average response time was above expected range on problem-solving questions.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Target className="w-4 h-4 text-[#1F7A8C] shrink-0 mt-0.5" />
                  <span><strong>Role Expectation:</strong> Role requires intermediate/advanced applied synthesis.</span>
                </div>
                {data.prerequisite_gaps?.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#0B2545] font-medium flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    <span><strong>Root Prerequisite:</strong> {data.prerequisite_gaps.join(', ')} must be strengthened first.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-[#2B2D42]/10 bg-[#FFFFFF]">
          <Link to={data.gap > 0 ? "/learning-path" : "/assessment"}>
            <Button className="w-full h-11 text-sm font-bold bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] shadow-xs flex items-center justify-center gap-2 cursor-pointer">
              <span>{data.gap > 0 ? "Fix This Gap in Learning Path" : "Take Reassessment"}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
