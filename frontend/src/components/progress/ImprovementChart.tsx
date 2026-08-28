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
            <stop offset="5%" stopColor="#176B87" stopOpacity={0.25}/>
            <stop offset="95%" stopColor="#176B87" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D8E5EC" strokeOpacity={0.8} />
        <XAxis 
          dataKey="date" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 11, fill: '#5D7180', fontWeight: 600 }} 
          dy={10}
        />
        <YAxis 
          domain={[0, 100]} 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 11, fill: '#5D7180' }} 
        />
        <Tooltip 
          contentStyle={{ borderRadius: '8px', border: '1px solid #D8E5EC', backgroundColor: '#FFFFFF', boxShadow: '0 4px 16px rgba(18,59,93,0.08)' }}
          labelStyle={{ fontWeight: 'bold', color: '#123047' }}
        />
        <ReferenceLine y={target} stroke="#2E8B57" strokeDasharray="3 3" label={{ position: 'top', value: 'Target', fill: '#2E8B57', fontSize: 11 }} />
        <Area 
          type="monotone" 
          dataKey="score" 
          stroke="#176B87" 
          strokeWidth={2.5}
          fillOpacity={1} 
          fill="url(#colorScore)" 
          activeDot={{ r: 5, fill: "#176B87", stroke: "#FFFFFF", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

