import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Area, AreaChart } from 'recharts';

interface Props {
  data: { date: string; score: number }[];
  target: number;
}

export default function ImprovementChart({ data, target }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
        <defs>
          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#A85D4C" stopOpacity={0.25}/>
            <stop offset="95%" stopColor="#A85D4C" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2DDD5" strokeOpacity={0.8} />
        <XAxis 
          dataKey="date" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 11, fill: '#7A756E', fontWeight: 600 }} 
          dy={10}
        />
        <YAxis 
          domain={[0, 100]} 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 11, fill: '#7A756E' }} 
        />
        <Tooltip 
          contentStyle={{ borderRadius: '8px', border: '1px solid #E2DDD5', backgroundColor: '#FFFDF9', boxShadow: '0 4px 16px rgba(45, 48, 48, 0.08)' }}
          labelStyle={{ fontWeight: 'bold', color: '#292B2B' }}
        />
        <ReferenceLine y={target} stroke="#2E8B57" strokeDasharray="3 3" label={{ position: 'top', value: 'Target', fill: '#2E8B57', fontSize: 11 }} />
        <Area 
          type="monotone" 
          dataKey="score" 
          stroke="#A85D4C" 
          strokeWidth={2.5}
          fillOpacity={1} 
          fill="url(#colorScore)" 
          activeDot={{ r: 5, fill: "#A85D4C", stroke: "#FFFDF9", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

