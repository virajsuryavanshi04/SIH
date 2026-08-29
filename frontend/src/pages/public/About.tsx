import { Brain, Layers, ShieldCheck, Route, BarChart3, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function About() {
  return (
    <div className="py-16 px-4 max-w-5xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#176B87]/10 text-[#176B87] border border-[#176B87]/20 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#176B87]" />
          <span>SmartLearn Solution Architecture</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#123B5D] tracking-tight">
          About SmartLearn Intelligence Platform
        </h1>
        <p className="text-lg text-[#123047] max-w-3xl mx-auto leading-relaxed">
          An AI-powered competency intelligence layer built to strengthen capacity building across India's Official Statistical System.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="p-6 border-l-4 border-l-[#176B87] border-[#123047]/10 bg-[#FFFFFF] shadow-sm">
          <h3 className="text-xl font-bold text-[#123B5D] mb-3 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#176B87]" /> The Capacity Building Challenge
          </h3>
          <p className="text-[#123047] text-sm leading-relaxed">
            India's statistical apparatus spans complex, interdependent disciplines—from survey design and stratified sampling to demographic forecasting and national accounts. Traditional training often treats employees generically, without measuring underlying cognitive prerequisites or why specific errors occur.
          </p>
        </Card>

        <Card className="p-6 border-l-4 border-l-[#123B5D] border-[#123047]/10 bg-[#FFFFFF] shadow-sm">
          <h3 className="text-xl font-bold text-[#123B5D] mb-3 flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#176B87]" /> The Closed-Loop AI Solution
          </h3>
          <p className="text-[#123047] text-sm leading-relaxed">
            SmartLearn introduces a closed loop: <strong>Assess → Diagnose → Personalize → Learn → Practice → Reassess → Improve</strong>. It ingests official guidelines, generates calibrated assessments, maps root competency gaps, and dynamically adapts training journeys using an internal 30+ course statistical catalog.
          </p>
        </Card>
      </div>

      <div className="bg-[#FFFFFF] p-8 rounded-2xl border border-[#123047]/10 shadow-sm space-y-6">
        <h2 className="text-2xl font-bold text-[#123B5D]">Core Design & Engineering Tenets</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#176B87]/10 flex items-center justify-center text-[#176B87]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-[#123B5D]">Zero Black Box</h4>
            <p className="text-xs text-[#123047]">Every gap is explained with exact assessment telemetry and prerequisite dependency tracing.</p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#176B87]/10 flex items-center justify-center text-[#176B87]">
              <Route className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-[#123B5D]">Adaptive Pathways</h4>
            <p className="text-xs text-[#123047]">Skips mastered introductory material so officers focus 100% of their learning time on diagnosed weak spots.</p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#176B87]/10 flex items-center justify-center text-[#176B87]">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-[#123B5D]">Measurable ROI</h4>
            <p className="text-xs text-[#123047]">Departmental heatmaps prove before/after score improvements (e.g. 45% → 84%) over time.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
