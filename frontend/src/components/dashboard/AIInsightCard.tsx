import { Sparkles, ArrowRight, Lightbulb } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface Props {
  insight: {
    strongest: string;
    weakest: string;
    recommendation: string;
    potential_improvement: string;
  };
}

export default function AIInsightCard({ insight }: Props) {
  return (
    <Card className="bg-[#FFFDF9] border border-[#E2DDD5] shadow-sm relative overflow-hidden rounded-2xl">
      <CardContent className="p-6 relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[#292B2B] font-bold text-sm uppercase tracking-wider">
            <div className="w-7 h-7 rounded-lg bg-[#A85D4C] text-[#FFFDF9] flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>AI Intelligence Layer</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#A85D4C]/10 text-[#A85D4C] border border-[#A85D4C]/20 font-mono">
            {insight.potential_improvement} BOOST
          </span>
        </div>
        
        <div className="space-y-3 text-sm text-[#292B2B]">
          <p className="leading-relaxed">
            Your strongest domain is <strong className="text-[#A85D4C]">{insight.strongest}</strong>. Your primary bottleneck is <strong className="text-[#B38A3D]">{insight.weakest}</strong>.
          </p>
          <div className="bg-[#EFEBE4] p-3.5 rounded-xl border border-[#E2DDD5] text-xs text-[#292B2B] space-y-1.5 shadow-2xs">
            <div className="font-bold text-[#A85D4C] flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-[#A85D4C]" /> Recommended Action
            </div>
            <p className="leading-relaxed text-[#7A756E]">{insight.recommendation}</p>
          </div>
        </div>
        
        <div className="pt-2">
          <Link to="/learning-path">
            <Button className="w-full bg-[#A85D4C] hover:bg-[#2D3030] text-[#FFFDF9] font-bold shadow-xs">
              View Recommended Path <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

