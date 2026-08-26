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
            <stop offset="5%" stopColor="#1F7A8C" stopOpacity={0.25}/>
            <stop offset="95%" stopColor="#1F7A8C" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2B2D42" strokeOpacity={0.1} />
        <XAxis 
          dataKey="date" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 11, fill: '#2B2D42', fontWeight: 600 }} 
          dy={10}
        />
        <YAxis 
          domain={[0, 100]} 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 11, fill: '#2B2D42' }} 
        />
        <Tooltip 
          contentStyle={{ borderRadius: '8px', border: '1px solid rgba(43,45,66,0.15)', backgroundColor: '#FFFFFF', boxShadow: '0 4px 16px rgba(11,37,69,0.08)' }}
          labelStyle={{ fontWeight: 'bold', color: '#0B2545' }}
        />
        <ReferenceLine y={target} stroke="#2E7D32" strokeDasharray="3 3" label={{ position: 'top', value: 'Target', fill: '#2E7D32', fontSize: 11 }} />
        <Area 
          type="monotone" 
          dataKey="score" 
          stroke="#1F7A8C" 
          strokeWidth={2.5}
          fillOpacity={1} 
          fill="url(#colorScore)" 
          activeDot={{ r: 5, fill: "#1F7A8C", stroke: "#FFFFFF", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
