import React, { useState, useEffect } from 'react';
import { Compass, Sparkles, ShieldCheck, Layers, BookOpen } from 'lucide-react';
import CapabilityLandscape, { CapabilityNode } from '@/components/spatial/CapabilityLandscape';
import GapInspector from '@/components/spatial/GapInspector';
import { competencyApi, courseApi } from '@/lib/api';

const defaultCoordinates = [
  { x: 26, y: 22 },
  { x: 74, y: 22 },
  { x: 86, y: 50 },
  { x: 74, y: 78 },
  { x: 26, y: 78 },
  { x: 14, y: 50 },
  { x: 50, y: 18 },
  { x: 50, y: 82 },
];

export default function Competencies() {
  const [loading, setLoading] = useState<boolean>(true);
  const [nodes, setNodes] = useState<CapabilityNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<CapabilityNode | null>(null);

  useEffect(() => {
    const fetchCompetencyData = async () => {
      try {
        setLoading(true);
        const [compRes, recRes, diagRes] = await Promise.allSettled([
          competencyApi.getMyCompetencies(),
          courseApi.getRecommended(),
          competencyApi.getMyDiagnosis()
        ]);

        const rawComps = compRes.status === 'fulfilled' ? compRes.value.data || [] : [];
        const rawRecs = recRes.status === 'fulfilled' ? recRes.value.data || [] : [];
        const rawDiag = diagRes.status === 'fulfilled' ? diagRes.value.data || null : null;

        const builtNodes: CapabilityNode[] = rawComps.map((c: any, index: number) => {
          const coords = defaultCoordinates[index % defaultCoordinates.length];
          const isAssessed = c.current_score !== null;
          const matchingRec = rawRecs.find((r: any) => r.competency_id === c.competency_id);
          
          let nodeStatus: 'proficient' | 'on_track' | 'needs_attention' | 'not_assessed' = 'not_assessed';
          if (isAssessed) {
            if (c.current_score >= c.target_score) nodeStatus = 'proficient';
            else if (c.gap <= 10) nodeStatus = 'on_track';
            else nodeStatus = 'needs_attention';
          }

          const priorityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 
            c.gap > 20 ? 'CRITICAL' : c.gap > 10 ? 'HIGH' : c.gap > 0 ? 'MEDIUM' : 'LOW';

          const reasons: string[] = [];
          if (c.weakest_subtopic) {
            reasons.push(`Subtopic focus needed: ${c.weakest_subtopic}`);
          }
          if (c.change_points !== null && c.change_points !== undefined) {
            reasons.push(`Recent trajectory: ${c.change_points > 0 ? '+' : ''}${c.change_points} pts`);
          }
          if (c.assessment_count) {
            reasons.push(`Measured across ${c.assessment_count} assessments`);
          }
          if (reasons.length === 0) {
            reasons.push(isAssessed ? `Proficiency calibrated at ${c.current_score}% against ${c.target_score}% benchmark` : 'Pending initial baseline assessment');
          }

          return {
            id: c.competency_id,
            name: c.competency_name,
            domain: c.domain || 'Statistical Standard',
            x: coords.x,
            y: coords.y,
            score: c.current_score,
            required: c.target_score,
            gap: c.gap,
            priority: priorityLevel,
            status: nodeStatus,
            prerequisites: index === 0 ? [] : [rawComps[0]?.competency_id || 1],
            reasons: reasons,
            weakestSubtopic: c.weakest_subtopic,
            aiConfidence: Math.round(rawDiag?.confidence || 88),
            recommendedCourse: {
              title: matchingRec?.title || `Curriculum Module for ${c.competency_name}`,
              duration: matchingRec?.duration_hours ? `${matchingRec.duration_hours}h` : '20 min',
              type: matchingRec?.resource_type ? matchingRec.resource_type.toUpperCase().replace('_', ' ') : 'iGOT Course'
            }
          };
        });

        setNodes(builtNodes);

        if (builtNodes.length > 0) {
          const bottleneck = builtNodes.reduce((prev, curr) => ((curr.gap || 0) > (prev.gap || 0) ? curr : prev), builtNodes[0]);
          setSelectedNode(bottleneck);
        }
      } catch (err) {
        console.error('Failed to load capability map:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompetencyData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#1F7A8C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#0B2545]">Rendering capability landscape from live telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#1F7A8C] uppercase tracking-widest mb-1">
            <Compass className="w-3.5 h-3.5" />
            <span>Interactive Capability Graph</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0B2545] tracking-tight">
            Workforce Capability Map
          </h1>
          <p className="text-xs sm:text-sm text-[#2B2D42]/80 mt-1">
            Visual topology mapping interconnected statistical competencies, verified proficiencies, and active learning vectors.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          <CapabilityLandscape
            nodes={nodes}
            selectedNode={selectedNode}
            onSelectNode={(node) => setSelectedNode(node)}
          />
        </div>

        <div className="lg:col-span-5">
          {selectedNode ? (
            <GapInspector node={selectedNode} />
          ) : (
            <div className="bg-[#FFFFFF] p-8 rounded-2xl border border-[#2B2D42]/10 text-center text-xs text-[#2B2D42]/60">
              Select a competency node in the network to inspect detailed evidence.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
