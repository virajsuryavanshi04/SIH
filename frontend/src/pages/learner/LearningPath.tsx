import React, { useState, useEffect } from 'react';
import { learningPathApi, competencyApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Route, Compass, RotateCcw, CheckCircle2, AlertCircle, Award, Target, TrendingUp } from 'lucide-react';
import PathTimeline, { PathItem } from '@/components/learning-path/PathTimeline';
import { cn } from '@/lib/utils';

export default function LearningPath() {
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [pathData, setPathData] = useState<any>(null);
  const [roleCompetencies, setRoleCompetencies] = useState<any[]>([]);

  const fetchPathAndCompetencies = async () => {
    try {
      setLoading(true);
      const [pathRes, compRes] = await Promise.allSettled([
        learningPathApi.get(),
        competencyApi.getMyCompetencies()
      ]);

      if (pathRes.status === 'fulfilled') {
        setPathData(pathRes.value.data);
      }
      if (compRes.status === 'fulfilled') {
        setRoleCompetencies(compRes.value.data || []);
      }
    } catch (err) {
      console.error('Failed to load learning path telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPathAndCompetencies();
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

  const handleCompleteItem = async (itemId: number) => {
    try {
      await learningPathApi.completeItem(itemId);
      const res = await learningPathApi.get();
      setPathData(res.data);
    } catch (err) {
      console.error('Failed to update milestone status:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 border-3 border-[#A85D4C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#2D3030]">Assembling personalized competency sequence...</p>
        </div>
      </div>
    );
  }

  const items: PathItem[] = pathData?.items || [];
  const completedCount = items.filter((it: any) => it.status === 'completed').length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 text-left">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#A85D4C] uppercase tracking-widest mb-1">
            <Route className="w-3.5 h-3.5" />
            <span>ADAPTIVE LEARNING SEQUENCING</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#292B2B] tracking-tight leading-tight">
            Your Personalized Learning Pathway
          </h1>
          <p className="text-sm text-[#7A756E] mt-1.5 leading-relaxed">
            Ordered iGOT curriculum dynamically structured to systematically close your active role competency gaps.
          </p>
        </div>

        <Button 
          variant="outline" 
          onClick={handleRegenerate} 
          disabled={generating}
          className="self-start text-xs font-semibold border-[#E2DDD5] hover:border-[#A85D4C] text-[#292B2B] hover:bg-[#EFEBE4] shadow-2xs cursor-pointer"
        >
          <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${generating ? 'animate-spin' : ''}`} />
          <span>{generating ? 'Re-optimizing...' : 'Re-Optimize Pathway'}</span>
        </Button>
      </div>

      {/* 2. Adaptive AI Reasoning Banner */}
      <div className="bg-[#FFFDF9] border border-[#A85D4C]/25 text-[#292B2B] p-5 sm:p-6 rounded-2xl flex gap-4 items-start shadow-xs">
        <div className="w-9 h-9 rounded-xl bg-[#2D3030] text-[#FFFDF9] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
          <Sparkles className="w-5 h-5 text-[#B38A3D]" />
        </div>
        <div className="space-y-1">
          <h4 className="font-semibold text-sm sm:text-base text-[#292B2B]">
            Diagnostic Closed-Loop Optimization
          </h4>
          <p className="text-sm text-[#7A756E] leading-relaxed">
            {pathData?.ai_reasoning || 'Personalized iGOT curriculum sequenced to systematically close your highest priority competency gaps.'}
          </p>
        </div>
      </div>

      {/* 3. Target Role Competency Roadmap */}
      {roleCompetencies.length > 0 && (
        <Card className="bg-[#FFFDF9] shadow-xs border border-[#E2DDD5] rounded-2xl">
          <CardHeader className="border-b border-[#E2DDD5] p-5 sm:p-6 flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2 text-[#292B2B]">
                <Compass className="w-5 h-5 text-[#A85D4C]" />
                <span>Target Competency Roadmap</span>
              </CardTitle>
              <p className="text-xs text-[#7A756E]">
                Official role competency benchmarks calibrated for your designated statistical role.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-[#A85D4C] bg-[#A85D4C]/10 px-3 py-1 rounded-full border border-[#A85D4C]/20">
              {roleCompetencies.length} Core Competencies
            </span>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {roleCompetencies.map((comp: any) => {
                const isAssessed = comp.current_score !== null && comp.current_score !== undefined;
                const score = isAssessed ? Math.round(comp.current_score) : 0;
                const target = comp.target_score ?? 70;
                const gap = isAssessed ? Math.max(0, target - score) : target;
                const isTargetMet = isAssessed && score >= target;

                return (
                  <div
                    key={comp.competency_id || comp.id}
                    className="p-4 rounded-xl bg-[#EFEBE4]/60 border border-[#E2DDD5] space-y-2.5 text-left transition-all hover:bg-[#EFEBE4]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#292B2B] leading-tight">
                        {comp.competency_name || comp.name}
                      </span>
                      <span className={cn(
                        "text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase shrink-0",
                        isTargetMet
                          ? "bg-[#2E8B57]/10 text-[#2E8B57] border-[#2E8B57]/30"
                          : isAssessed && gap > 15
                          ? "bg-[#A85D4C]/10 text-[#A85D4C] border-[#A85D4C]/30"
                          : isAssessed
                          ? "bg-[#B38A3D]/15 text-[#292B2B] border-[#B38A3D]/30"
                          : "bg-[#FFFDF9] text-[#7A756E] border-[#E2DDD5]"
                      )}>
                        {isTargetMet ? 'Benchmark Met' : isAssessed ? `${gap}% Deficit` : 'Pending Assessment'}
                      </span>
                    </div>

                    {/* Score vs Target Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono text-[#7A756E]">
                        <span>Verified Score: <strong className="text-[#292B2B]">{isAssessed ? `${score}%` : '—'}</strong></span>
                        <span>Target: <strong className="text-[#292B2B]">{target}%</strong></span>
                      </div>
                      <div className="w-full bg-[#E2DDD5] h-2 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            isTargetMet ? "bg-[#2E8B57]" : score >= 50 ? "bg-[#B38A3D]" : "bg-[#A85D4C]"
                          )}
                          style={{ width: `${Math.min(100, Math.max(isAssessed ? 8 : 0, score))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Pathway Timeline Container */}
      <Card className="bg-[#FFFDF9] shadow-xs border border-[#E2DDD5] rounded-2xl">
        <CardHeader className="border-b border-[#E2DDD5] p-5 sm:p-6 flex flex-row items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2 text-[#292B2B]">
              <Target className="w-5 h-5 text-[#A85D4C]" />
              <span>Recommended iGOT Learning Pathway</span>
            </CardTitle>
            <p className="text-xs text-[#7A756E]">
              Sequenced courses matched to your highest-priority diagnostic deficits.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-[#A85D4C] bg-[#A85D4C]/10 px-3 py-1 rounded-full border border-[#A85D4C]/20">
            {completedCount} / {items.length} Modules Finished
          </span>
        </CardHeader>
        
        <CardContent className="p-6">
          {items.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <AlertCircle className="w-6 h-6 text-[#7A756E]/40 mx-auto" />
              <p className="text-sm font-semibold text-[#292B2B]">No learning path active yet.</p>
              <Button onClick={handleRegenerate} className="bg-[#A85D4C] text-[#FFFDF9] text-xs font-semibold cursor-pointer">
                Generate Pathway
              </Button>
            </div>
          ) : (
            <PathTimeline items={items} onCompleteItem={handleCompleteItem} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
