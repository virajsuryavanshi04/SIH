import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ArrowRight, Brain, Sparkles } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#EAF3F7] relative overflow-hidden">
      <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#176B87]/10 border border-[#176B87]/20 text-[#176B87]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2E8B57]" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider">
            Smart India Hackathon 2026 // SIH26101
          </span>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#123B5D] tracking-tight">
            Turn workforce data into workforce capability.
          </h2>
          <p className="text-base sm:text-lg text-[#123047]/80 max-w-xl mx-auto font-normal leading-relaxed">
            Discover competency gaps. Personalize learning. Measure what changed.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/login">
            <Button size="lg" className="bg-[#176B87] hover:bg-[#176B87]/90 text-[#FFFFFF] font-bold px-8 h-12 shadow-sm text-sm cursor-pointer">
              <span>Explore SmartLearn</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to="/about">
            <Button variant="outline" size="lg" className="border-[#123047]/20 text-[#123B5D] hover:bg-[#FFFFFF] hover:border-[#176B87] hover:text-[#176B87] font-semibold px-8 h-12 text-sm bg-transparent cursor-pointer">
              View the Intelligence Model
            </Button>
          </Link>
        </div>

        <div className="pt-8 text-xs font-mono text-[#123047]/50">
          Pre-seeded with 14 Government Statistical Officers • 30 Official Courses • 120+ Calibrated MCQs
        </div>
      </div>
    </section>
  );
}
