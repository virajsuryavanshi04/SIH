import React from 'react';
import HeroIntelligence from '@/components/homepage/HeroIntelligence';
import CompetencyLandscape from '@/components/homepage/CompetencyLandscape';
import LearningJourneyRoute from '@/components/homepage/LearningJourneyRoute';
import WorkforceSignals from '@/components/homepage/WorkforceSignals';
import ImprovementTrajectory from '@/components/homepage/ImprovementTrajectory';
import FinalCTA from '@/components/homepage/FinalCTA';

export default function Landing() {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F7FA] text-[#102A43] selection:bg-[#1F7A8C]/20 selection:text-[#0B2545]">
      {/* 1. HERO: Problem Definition & Spatial Topology Preview */}
      <HeroIntelligence
        onExploreClick={() => scrollToSection('competency-landscape')}
        onHowItWorksClick={() => scrollToSection('learning-journey')}
      />

      {/* 2. THE WORKFORCE COMPETENCY LANDSCAPE & ROOT CAUSE INSPECTOR */}
      <CompetencyLandscape />

      {/* 3. ADAPTIVE LEARNING & iGOT PATHWAY */}
      <LearningJourneyRoute />

      {/* 4. MACRO WORKFORCE INTELLIGENCE SIGNALS */}
      <WorkforceSignals />

      {/* 5. MEASURABLE CAPABILITY TRAJECTORY (Proof of growth over time) */}
      <ImprovementTrajectory />

      {/* 6. FINAL EXECUTIVE CALL TO ACTION */}
      <FinalCTA />
    </div>
  );
}
