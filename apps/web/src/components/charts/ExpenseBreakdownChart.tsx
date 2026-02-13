'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface ExpenseBreakdownChartProps {
  essentialSpending: number;
  discretionarySpending: number;
}

interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
}

export function ExpenseBreakdownChart({
  essentialSpending,
  discretionarySpending,
}: ExpenseBreakdownChartProps) {
  const data: ChartDataPoint[] = useMemo(() => {
    return [
      {
        name: 'Essential',
        value: essentialSpending,
        color: '#3B82F6', // blue-500
      },
      {
        name: 'Discretionary',
        value: discretionarySpending,
        color: '#10B981', // green-500
      },
    ];
  }, [essentialSpending, discretionarySpending]);

  const total = essentialSpending + discretionarySpending;

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  const formatPercent = (value: number) => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(0)}%`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{item.name}</p>
          <p className="text-gray-600">{formatCurrency(item.value)} / year</p>
          <p className="text-gray-500 text-sm">{formatPercent(item.value)} of total</p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, name }: any) => {
    if (total === 0) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {formatPercent(value)}
      </text>
    );
  };

  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
        No expense data available
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Annual Spending Breakdown</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col justify-center space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="font-medium text-gray-900">Essential Spending</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(essentialSpending)}</p>
            <p className="text-sm text-gray-600">{formatPercent(essentialSpending)} of total</p>
            <p className="text-xs text-gray-500 mt-1">Housing, healthcare, food, utilities</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium text-gray-900">Discretionary Spending</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(discretionarySpending)}</p>
            <p className="text-sm text-gray-600">{formatPercent(discretionarySpending)} of total</p>
            <p className="text-xs text-gray-500 mt-1">Travel, dining, hobbies, entertainment</p>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-600">Total Annual Spending</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(total)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
