'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import type { Account } from '@retirement-advisor/types';

interface AssetAllocationChartProps {
  accounts: Account[];
  viewMode?: 'pie' | 'bar';
}

interface AllocationData {
  name: string;
  value: number;
  balance: number;
  color: string;
}

export function AssetAllocationChart({
  accounts,
  viewMode = 'pie',
}: AssetAllocationChartProps) {
  const allocationData: AllocationData[] = useMemo(() => {
    if (!accounts || accounts.length === 0) return [];

    let totalStocks = 0;
    let totalBonds = 0;
    let totalCash = 0;

    accounts.forEach((account) => {
      const balance = Number(account.currentBalance);
      totalStocks += balance * (account.stockAllocation / 100);
      totalBonds += balance * (account.bondAllocation / 100);
      totalCash += balance * (account.cashAllocation / 100);
    });

    const total = totalStocks + totalBonds + totalCash;

    return [
      {
        name: 'Stocks',
        value: total > 0 ? (totalStocks / total) * 100 : 0,
        balance: totalStocks,
        color: '#3B82F6', // blue-500
      },
      {
        name: 'Bonds',
        value: total > 0 ? (totalBonds / total) * 100 : 0,
        balance: totalBonds,
        color: '#8B5CF6', // violet-500
      },
      {
        name: 'Cash',
        value: total > 0 ? (totalCash / total) * 100 : 0,
        balance: totalCash,
        color: '#10B981', // green-500
      },
    ];
  }, [accounts]);

  const totalBalance = useMemo(() => {
    return accounts?.reduce((sum, acc) => sum + Number(acc.currentBalance), 0) || 0;
  }, [accounts]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{item.name}</p>
          <p className="text-gray-600">{formatPercent(item.value)}</p>
          <p className="text-gray-500 text-sm">{formatCurrency(item.balance)}</p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, name }: any) => {
    if (value < 5) return null; // Don't show label for small slices
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
        fontSize={11}
        fontWeight={600}
      >
        {formatPercent(value)}
      </text>
    );
  };

  if (!accounts || accounts.length === 0 || totalBalance === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
        No account data available
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Asset Allocation</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'pie' ? (
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomLabel}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            ) : (
              <BarChart data={allocationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {allocationData.map((item) => (
            <div key={item.name} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-gray-900">{item.name}</span>
                </div>
                <span className="font-bold text-gray-900">{formatPercent(item.value)}</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${item.value}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
              
              <p className="text-sm text-gray-600 mt-2">{formatCurrency(item.balance)}</p>
            </div>
          ))}

          <div className="border-t pt-4 mt-4">
            <p className="text-sm text-gray-600">Total Portfolio Value</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBalance)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
