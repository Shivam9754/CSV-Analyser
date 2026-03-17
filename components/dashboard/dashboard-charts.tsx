'use client'

import {
  Line,
  LineChart,
  Bar,
  BarChart,
  Pie,
  PieChart,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'

// Vibrant color palette optimized for both light and dark modes
const COLORS = [
  '#4f46e5', // Indigo/Primary
  '#22c55e', // Green
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
]

const GRADIENT_COLORS = [
  { start: '#6366f1', end: '#4f46e5' },
  { start: '#4ade80', end: '#22c55e' },
  { start: '#fb7185', end: '#f43f5e' },
  { start: '#fbbf24', end: '#f59e0b' },
  { start: '#22d3ee', end: '#06b6d4' },
]

interface ChartData {
  [key: string]: string | number
}

interface LineChartComponentProps {
  data: ChartData[]
  xKey: string
  yKeys: string[]
  colors?: string[]
}

export function LineChartComponent({
  data,
  xKey,
  yKeys,
  colors = COLORS,
}: LineChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <defs>
          {GRADIENT_COLORS.map((gradient, index) => (
            <linearGradient key={index} id={`lineGradient${index}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={gradient.start} />
              <stop offset="100%" stopColor={gradient.end} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          stroke="hsl(var(--border))"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          stroke="hsl(var(--border))"
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '12px',
            fontSize: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
          cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '4 4' }}
        />
        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
        {yKeys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={`url(#lineGradient${index % GRADIENT_COLORS.length})`}
            strokeWidth={3}
            dot={{ r: 0 }}
            activeDot={{ 
              r: 6, 
              fill: colors[index % colors.length],
              stroke: 'white',
              strokeWidth: 2,
              className: 'drop-shadow-lg'
            }}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

interface BarChartComponentProps {
  data: ChartData[]
  xKey: string
  yKeys: string[]
  colors?: string[]
  stacked?: boolean
}

export function BarChartComponent({
  data,
  xKey,
  yKeys,
  colors = COLORS,
  stacked = false,
}: BarChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <defs>
          {GRADIENT_COLORS.map((gradient, index) => (
            <linearGradient key={index} id={`barGradient${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradient.start} stopOpacity={1} />
              <stop offset="100%" stopColor={gradient.end} stopOpacity={0.8} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          stroke="hsl(var(--border))"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          stroke="hsl(var(--border))"
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '12px',
            fontSize: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
        />
        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
        {yKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={`url(#barGradient${index % GRADIENT_COLORS.length})`}
            radius={[6, 6, 0, 0]}
            stackId={stacked ? 'stack' : undefined}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

interface PieChartComponentProps {
  data: { name: string; value: number }[]
  colors?: string[]
}

export function PieChartComponent({
  data,
  colors = COLORS,
}: PieChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <defs>
          {GRADIENT_COLORS.map((gradient, index) => (
            <linearGradient key={index} id={`pieGradient${index}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={gradient.start} />
              <stop offset="100%" stopColor={gradient.end} />
            </linearGradient>
          ))}
        </defs>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
          animationDuration={1500}
          animationEasing="ease-out"
        >
          {data.map((_, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={`url(#pieGradient${index % GRADIENT_COLORS.length})`}
              stroke="hsl(var(--background))"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '12px',
            fontSize: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        />
        <Legend 
          wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

interface AreaChartComponentProps {
  data: ChartData[]
  xKey: string
  yKeys: string[]
  colors?: string[]
}

export function AreaChartComponent({
  data,
  xKey,
  yKeys,
  colors = COLORS,
}: AreaChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <defs>
          {GRADIENT_COLORS.map((gradient, index) => (
            <linearGradient key={index} id={`areaGradient${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradient.start} stopOpacity={0.4} />
              <stop offset="95%" stopColor={gradient.end} stopOpacity={0.05} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          stroke="hsl(var(--border))"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          stroke="hsl(var(--border))"
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '12px',
            fontSize: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
          cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '4 4' }}
        />
        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
        {yKeys.map((key, index) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[index % colors.length]}
            fill={`url(#areaGradient${index % GRADIENT_COLORS.length})`}
            strokeWidth={2.5}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
