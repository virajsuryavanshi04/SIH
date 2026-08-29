import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ArrowRight, Brain, Sparkles } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-[#F4F8FB] border-t border-[#D8E5EC] relative overflow-hidden">
      <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#176B87]/8 border border-[#176B87]/20 text-[#176B87]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2E8B57]" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider">
            Competency Intelligence • Official Statistical Capacity
          </span>
        </div>

        <div className="space-y-2.5">
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#123047] tracking-tight leading-tight">
            Turn workforce data into workforce capability.
          </h2>
          <p className="text-base sm:text-lg text-[#5D7180] max-w-xl mx-auto font-normal leading-relaxed">
            Discover competency gaps. Personalize learning. Measure what changed.
          </p>
        </div>

        <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link to="/login">
            <Button size="lg" className="bg-[#176B87] hover:bg-[#176B87]/90 text-[#FFFFFF] text-[15px] font-semibold px-8 h-11.5 rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2">
              <span>Explore SmartLearn</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <Link to="/about">
            <Button variant="outline" size="lg" className="border-[#D8E5EC] text-[#123047] hover:bg-[#FFFFFF] hover:border-[#176B87] hover:text-[#176B87] text-[15px] font-semibold px-8 h-11.5 rounded-xl bg-transparent cursor-pointer">
              View the Intelligence Model
            </Button>
          </Link>
        </div>

        <div className="pt-4 text-xs text-[#5D7180] font-medium">
          Pre-seeded with 14 Government Statistical Officers • 30 Official Courses • 120+ Calibrated MCQs
        </div>
      </div>
    </section>
  );
}
