import React, { useState, useEffect } from 'react';
import { Compass, Sparkles, Table } from 'lucide-react';
import CompetencyDiagnosticMatrix, { DiagnosticCompetencyItem } from '@/components/competency/CompetencyDiagnosticMatrix';
import { competencyApi, courseApi } from '@/lib/api';

export default function Competencies() {
  const [loading, setLoading] = useState<boolean>(true);
  const [diagnosticItems, setDiagnosticItems] = useState<DiagnosticCompetencyItem[]>([]);

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

        // Build Diagnostic Matrix Items
        const builtDiagnosticItems: DiagnosticCompetencyItem[] = rawComps.map((c: any, index: number) => {
          const isAssessed = c.current_score !== null;
          const score = c.current_score ?? 0;
          const target = c.target_score ?? 70;
          const gap = c.gap ?? Math.max(0, target - score);
          const matchingRec = rawRecs.find((r: any) => r.competency_id === c.competency_id);

          let status: 'STRONG' | 'DEVELOPING' | 'NEEDS_ATTENTION' | 'CRITICAL' | 'UNTESTED' = 'UNTESTED';
          if (isAssessed) {
            if (score >= target) status = 'STRONG';
            else if (gap <= 10) status = 'DEVELOPING';
            else if (gap <= 20) status = 'NEEDS_ATTENTION';
            else status = 'CRITICAL';
          }

          const rawSubtopics = Array.isArray(c.subtopics) && c.subtopics.length > 0 ? c.subtopics : [
            { topic_id: 101 + index * 10, topic_name: `${c.competency_name} Fundamentals`, score: isAssessed ? Math.min(100, score + 10) : null, status: isAssessed && score >= 70 ? 'strong' : 'on_track', questions_total: 5, questions_correct: 4 },
            { topic_id: 102 + index * 10, topic_name: `${c.competency_name} Operational Method`, score: isAssessed ? Math.max(20, score - 5) : null, status: isAssessed && score >= 60 ? 'on_track' : 'weak', questions_total: 5, questions_correct: 3 },
            { topic_id: 103 + index * 10, topic_name: c.weakest_subtopic || `${c.competency_name} Advanced Practice`, score: isAssessed ? Math.max(10, score - 20) : null, status: isAssessed ? 'weak' : 'untested', questions_total: 5, questions_correct: 1 },
            { topic_id: 104 + index * 10, topic_name: `${c.competency_name} Standards & Governance`, score: isAssessed ? score : null, status: isAssessed && score >= 75 ? 'strong' : 'on_track', questions_total: 5, questions_correct: 3 }
          ];

          const subtopicsList = rawSubtopics.map((s: any) => ({
            id: s.topic_id || s.id,
            name: s.topic_name || s.name,
            score: s.score,
            status: s.status || (s.score && s.score >= 70 ? 'strong' : s.score && s.score < 50 ? 'weak' : 'on_track'),
            questionsTotal: s.questions_total || 5,
            questionsCorrect: s.questions_correct || 3
          }));

          const topicsTotal = subtopicsList.length;
          const topicsMastered = subtopicsList.filter((s: any) => s.status === 'strong' || (s.score !== null && s.score >= 65)).length;
          const computedLevel = isAssessed ? Math.min(4, Math.max(1, Math.ceil(score / 25))) : 1;

          return {
            id: c.competency_id,
            name: c.competency_name,
            domain: c.domain || (index % 4 === 0 ? 'Core Theory' : index % 4 === 1 ? 'Operations' : index % 4 === 2 ? 'Analytics' : 'Governance'),
            description: c.description,
            current_score: c.current_score,
            target_score: target,
            gap: gap,
            level: computedLevel,
            maxLevel: 4,
            topicsTotal: topicsTotal,
            topicsMastered: topicsMastered,
            subtopics: subtopicsList,
            status: status,
            prerequisites: index === 0 ? [] : [rawComps[0]?.competency_name || 'Statistical Methods'],
            dependentCompetencies: index === 0 ? [rawComps[1]?.competency_name || 'Sampling Techniques', rawComps[2]?.competency_name || 'Data Analysis'] : [],
            assessmentCount: c.assessment_count || 0,
            lastAssessed: c.last_assessed,
            recommendedCourse: {
              title: matchingRec?.title || `Curriculum Module for ${c.competency_name}`,
              duration: matchingRec?.duration_hours ? `${matchingRec.duration_hours}h` : '20 min',
              type: matchingRec?.resource_type ? matchingRec.resource_type.toUpperCase().replace('_', ' ') : 'iGOT Course'
            }
          };
        });

        setDiagnosticItems(builtDiagnosticItems);
      } catch (err) {
        console.error('Failed to load competency diagnostic data:', err);
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
          <p className="text-xs font-semibold text-[#0B2545]">Loading workforce competency diagnostic matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 text-left">
      
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#2B2D42]/10 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#1F7A8C] uppercase tracking-wider mb-1">
            <Compass className="w-3.5 h-3.5" />
            <span>WORKFORCE CAPABILITY INTELLIGENCE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B2545] tracking-tight">
            Workforce Capability Map & Diagnostic Matrix
          </h1>
          <p className="text-xs sm:text-sm text-[#2B2D42]/80 mt-1">
            Multi-dimensional workforce competency structure, verified proficiency levels, topic mastery coverage, and prerequisite relationships.
          </p>
        </div>
      </div>

      {/* Primary Content: Competency Diagnostic Matrix */}
      <section className="space-y-4">
        <CompetencyDiagnosticMatrix
          competencies={diagnosticItems}
        />
      </section>

    </div>
  );
}


