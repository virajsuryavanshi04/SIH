import React, { useState, useEffect } from 'react';
import { learningPathApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Route, Compass, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import PathTimeline from '@/components/learning-path/PathTimeline';

export default function LearningPath() {
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [pathData, setPathData] = useState<any>(null);

  const fetchPath = async () => {
    try {
      setLoading(true);
      const res = await learningPathApi.get();
      setPathData(res.data);
    } catch (err) {
      console.error('Failed to load learning path:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPath();
  }, []);

  const handleRegenerate = async () => {
    try {
      setGenerating(true);
      const res = await learningPathApi.generate();
      setPathData(res.data);
    } catch (err) {
      console.error('Failed to generate learning path:', err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 border-3 border-[#1F7A8C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#0B2545]">Assembling personalized competency sequence...</p>
        </div>
      </div>
    );
  }

  const items = pathData?.items || [];
  const completedCount = items.filter((it: any) => it.status === 'completed').length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#1F7A8C] uppercase tracking-widest mb-1">
            <Route className="w-3.5 h-3.5" />
            <span>ADAPTIVE LEARNING SEQUENCING</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0B2545] tracking-tight">
            Your Personalized Learning Pathway
          </h1>
          <p className="text-xs sm:text-sm text-[#2B2D42]/80 mt-1">
            Ordered curriculum dynamically structured to systematically close your active role competency gaps.
          </p>
        </div>

        <Button 
          variant="outline" 
          onClick={handleRegenerate} 
          disabled={generating}
          className="self-start text-xs font-bold border-[#2B2D42]/20 hover:border-[#1F7A8C] text-[#0B2545] shadow-2xs"
        >
          <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${generating ? 'animate-spin' : ''}`} />
          <span>{generating ? 'Re-optimizing...' : 'Re-Optimize Pathway'}</span>
        </Button>
      </div>

      {/* Adaptive AI Reasoning Banner */}
      <div className="bg-[#FFFFFF] border border-[#1F7A8C]/25 text-[#2B2D42] p-5 rounded-2xl flex gap-4 items-start shadow-xs">
        <div className="w-9 h-9 rounded-xl bg-[#0B2545] text-[#FFFFFF] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
          <Sparkles className="w-5 h-5 text-[#D4AF37]" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-[#0B2545]">
            Diagnostic Closed-Loop Optimization
          </h4>
          <p className="text-xs text-[#2B2D42]/90 leading-relaxed">
            {pathData?.ai_reasoning || 'Personalized iGOT curriculum sequenced to systematically close your highest priority competency gaps.'}
          </p>
        </div>
      </div>

      {/* Pathway Timeline Container */}
      <Card className="bg-[#FFFFFF] shadow-xs border border-[#2B2D42]/10">
        <CardHeader className="border-b border-[#2B2D42]/10 p-5 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-[#0B2545]">
            <Route className="w-4 h-4 text-[#1F7A8C]" />
            Sequential Learning Trajectory
          </CardTitle>
          <span className="text-xs font-mono font-bold text-[#1F7A8C] bg-[#1F7A8C]/10 px-3 py-1 rounded-full border border-[#1F7A8C]/20">
            {completedCount} of {items.length} Milestones Completed
          </span>
        </CardHeader>
        
        <CardContent className="p-6">
          {items.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <AlertCircle className="w-6 h-6 text-[#2B2D42]/40 mx-auto" />
              <p className="text-xs font-semibold text-[#0B2545]">No learning path active yet.</p>
              <Button onClick={handleRegenerate} className="bg-[#1F7A8C] text-[#FFFFFF] text-xs font-bold">
                Generate Pathway
              </Button>
            </div>
          ) : (
            <PathTimeline items={items} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
