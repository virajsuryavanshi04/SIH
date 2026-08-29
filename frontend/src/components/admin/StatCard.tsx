import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

export default function StatCard({ title, value, icon: Icon, trend, trendUp = true }: Props) {
  return (
    <Card className="border border-[#E2DDD5] bg-[#FFFDF9] shadow-sm rounded-2xl">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="w-11 h-11 bg-[#A85D4C]/10 border border-[#A85D4C]/20 rounded-xl flex items-center justify-center text-[#A85D4C] shadow-2xs">
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-[#292B2B] tracking-tight font-mono">{value}</h3>
          <p className="text-xs font-semibold text-[#7A756E] mt-0.5">{title}</p>
        </div>
        {trend && (
          <div className="mt-3 pt-2.5 border-t border-[#E2DDD5] flex items-center">
            <span className={cn(
              "text-[11px] font-bold font-mono",
              trendUp ? "text-[#2E8B57]" : "text-[#B38A3D]"
            )}>
              {trend}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

