import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ArrowRight, Brain, Sparkles } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-[#F7F4EE] border-t border-[#E2DDD5] relative overflow-hidden">
      <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#A85D4C]/8 border border-[#A85D4C]/20 text-[#A85D4C]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2E8B57]" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider">
            Competency Intelligence • Official Statistical Capacity
          </span>
        </div>

        <div className="space-y-2.5">
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#292B2B] tracking-tight leading-tight">
            Turn workforce data into workforce capability.
          </h2>
          <p className="text-base sm:text-lg text-[#7A756E] max-w-xl mx-auto font-normal leading-relaxed">
            Discover competency gaps. Personalize learning. Measure what changed.
          </p>
        </div>

        <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link to="/login">
            <Button size="lg" className="bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9] text-[15px] font-semibold px-8 h-11.5 rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2">
              <span>Explore SmartLearn</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <Link to="/about">
            <Button variant="outline" size="lg" className="border-[#E2DDD5] text-[#292B2B] hover:bg-[#FFFDF9] hover:border-[#A85D4C] hover:text-[#7D4036] text-[15px] font-semibold px-8 h-11.5 rounded-xl bg-transparent cursor-pointer">
              View the Intelligence Model
            </Button>
          </Link>
        </div>

        <div className="pt-4 text-xs text-[#7A756E] font-medium">
          Pre-seeded with 14 Government Statistical Officers • 30 Official Courses • 120+ Calibrated MCQs
        </div>
      </div>
    </section>
  );
}
