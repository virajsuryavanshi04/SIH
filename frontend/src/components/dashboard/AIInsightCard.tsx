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
    <Card className="bg-[#FFFFFF] border border-[#2B2D42]/10 shadow-sm relative overflow-hidden">
      <CardContent className="p-6 relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[#0B2545] font-bold text-sm uppercase tracking-wider">
            <div className="w-7 h-7 rounded-lg bg-[#1F7A8C] text-[#FFFFFF] flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>AI Intelligence Layer</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1F7A8C]/10 text-[#1F7A8C] border border-[#1F7A8C]/20 font-mono">
            {insight.potential_improvement} BOOST
          </span>
        </div>
        
        <div className="space-y-3 text-sm text-[#2B2D42]">
          <p className="leading-relaxed">
            Your strongest domain is <strong className="text-[#1F7A8C]">{insight.strongest}</strong>. Your primary bottleneck is <strong className="text-[#D4AF37]">{insight.weakest}</strong>.
          </p>
          <div className="bg-[#F4F6F9] p-3.5 rounded-xl border border-[#2B2D42]/10 text-xs text-[#2B2D42] space-y-1.5 shadow-2xs">
            <div className="font-bold text-[#1F7A8C] flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-[#1F7A8C]" /> Recommended Action
            </div>
            <p className="leading-relaxed">{insight.recommendation}</p>
          </div>
        </div>
        
        <div className="pt-2">
          <Link to="/learning-path">
            <Button className="w-full bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-bold shadow-xs">
              View Recommended Path <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
