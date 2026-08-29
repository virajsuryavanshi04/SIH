import React from 'react';
import HeroIntelligence from '@/components/homepage/HeroIntelligence';
import CompetencyLandscape from '@/components/homepage/CompetencyLandscape';
import LearningJourneyRoute from '@/components/homepage/LearningJourneyRoute';
import WorkforceSignals from '@/components/homepage/WorkforceSignals';
import ImprovementTrajectory from '@/components/homepage/ImprovementTrajectory';
import FinalCTA from '@/components/homepage/FinalCTA';
import { Target, Search, BookOpen, TrendingUp } from 'lucide-react';

export default function Landing() {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F8FB] text-[#123047] selection:bg-[#176B87]/20 selection:text-[#123B5D]">
      {/* 1. HERO: Problem Definition & Spatial Topology Preview */}
      <HeroIntelligence
        onExploreClick={() => scrollToSection('how-it-works')}
        onHowItWorksClick={() => scrollToSection('how-it-works')}
      />

      {/* 2. THE 4-STEP VALUE PROPOSITION (Assess, Diagnose, Learn, Measure) */}
      <section id="how-it-works" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-[#FFFFFF] border-b border-[#D8E5EC]">
        <div className="max-w-[1440px] mx-auto space-y-8 sm:space-y-10 text-left">
          <div className="space-y-2.5 max-w-3xl">
            <span className="text-xs font-semibold text-[#176B87] uppercase tracking-widest block">
              THE SMARTLEARN METHODOLOGY
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#123047] tracking-tight leading-tight">
              A continuous, evidence-based capability pipeline.
            </h2>
            <p className="text-base sm:text-[17px] text-[#5D7180] leading-[1.6]">
              SmartLearn identifies competency gaps, diagnoses why they exist, recommends targeted learning through iGOT Karmayogi, and continuously measures capability growth.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1: Assess */}
            <div className="p-6 rounded-2xl border border-[#D8E5EC] bg-[#FFFFFF] hover:border-[#176B87]/40 transition-colors shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#123B5D]/10 text-[#123B5D] flex items-center justify-center font-mono font-bold text-sm shadow-xs">
                  <Target className="w-5 h-5 text-[#123B5D]" />
                </div>
                <h3 className="text-lg font-semibold text-[#123047]">1. Assess</h3>
                <p className="text-sm text-[#5D7180] leading-relaxed">
                  Calibrated diagnostic baseline sessions evaluate practical statistical mastery, distinguishing genuine competence from guessing.
                </p>
              </div>
              <div className="pt-2 text-xs font-mono text-[#176B87] font-semibold">
                → Role Benchmarks
              </div>
            </div>

            {/* Step 2: Diagnose */}
            <div className="p-6 rounded-2xl border border-[#D8E5EC] bg-[#FFFFFF] hover:border-[#176B87]/40 transition-colors shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#176B87]/10 text-[#176B87] flex items-center justify-center font-mono font-bold text-sm shadow-xs">
                  <Search className="w-5 h-5 text-[#176B87]" />
                </div>
                <h3 className="text-lg font-semibold text-[#123047]">2. Diagnose</h3>
                <p className="text-sm text-[#5D7180] leading-relaxed">
                  Empirical root-cause analysis identifies specific subtopic deficits and prerequisite blockers without subjective self-rating bias.
                </p>
              </div>
              <div className="pt-2 text-xs font-mono text-[#176B87] font-semibold">
                → Root-Cause Insights
              </div>
            </div>

            {/* Step 3: Learn */}
            <div className="p-6 rounded-2xl border border-[#D8E5EC] bg-[#FFFFFF] hover:border-[#176B87]/40 transition-colors shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#D49A2A]/15 text-[#D49A2A] border border-[#D49A2A]/30 flex items-center justify-center font-mono font-bold text-sm shadow-xs">
                  <BookOpen className="w-5 h-5 text-[#D49A2A]" />
                </div>
                <h3 className="text-lg font-semibold text-[#123047]">3. Learn</h3>
                <p className="text-sm text-[#5D7180] leading-relaxed">
                  Personalized adaptive learning pathways waive mastered modules and target priority gaps with accredited iGOT Karmayogi content.
                </p>
              </div>
              <div className="pt-2 text-xs font-mono text-[#176B87] font-semibold">
                → iGOT Curricula
              </div>
            </div>

            {/* Step 4: Measure */}
            <div className="p-6 rounded-2xl border border-[#D8E5EC] bg-[#FFFFFF] hover:border-[#176B87]/40 transition-colors shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#2E8B57]/10 text-[#2E8B57] border border-[#2E8B57]/20 flex items-center justify-center font-mono font-bold text-sm shadow-xs">
                  <TrendingUp className="w-5 h-5 text-[#2E8B57]" />
                </div>
                <h3 className="text-lg font-semibold text-[#123047]">4. Measure</h3>
                <p className="text-sm text-[#5D7180] leading-relaxed">
                  Adaptive reassessments verify capability gains over time, updating the officer's live capability portfolio and readiness profile.
                </p>
              </div>
              <div className="pt-2 text-xs font-mono text-[#2E8B57] font-semibold">
                → Verified Growth
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE WORKFORCE COMPETENCY LANDSCAPE & ROOT CAUSE INSPECTOR */}
      <CompetencyLandscape />

      {/* 4. ADAPTIVE LEARNING & iGOT PATHWAY */}
      <LearningJourneyRoute />

      {/* 5. MACRO WORKFORCE INTELLIGENCE SIGNALS */}
      <WorkforceSignals />

      {/* 6. MEASURABLE CAPABILITY TRAJECTORY (Proof of growth over time) */}
      <ImprovementTrajectory />

      {/* 7. FINAL EXECUTIVE CALL TO ACTION */}
      <FinalCTA />
    </div>
  );
}
