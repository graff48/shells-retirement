'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { YearProjection } from '@retirement-advisor/types';

interface PortfolioProjectionChartProps {
  projections: YearProjection[];
  retirementAge?: number;
  currentAge?: number;
}

interface ChartDataPoint {
  year: number;
  age: number;
  balance: number;
  lowerBound: number;
  upperBound: number;
  isRetirementYear: boolean;
}

export function PortfolioProjectionChart({
  projections,
  retirementAge = 65,
  currentAge = 45,
}: PortfolioProjectionChartProps) {
  const data: ChartDataPoint[] = useMemo(() => {
    if (!projections || projections.length === 0) return [];

    // Calculate confidence bands based on year variance (simplified Monte Carlo simulation)
    return projections.map((proj) => {
      const yearsFromNow = proj.age - currentAge;
      // Standard deviation increases with time (square root rule)
      const volatilityFactor = 0.12; // 12% annual volatility
      const stdDev = Math.sqrt(yearsFromNow) * volatilityFactor;
      
      return {
        year: proj.year,
        age: proj.age,
        balance: proj.endingBalance,
        lowerBound: proj.endingBalance * (1 - stdDev),
        upperBound: proj.endingBalance * (1 + stdDev),
        isRetirementYear: proj.age === retirementAge,
      };
    });
  }, [projections, retirementAge, currentAge]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">Age {data.age} ({data.year})</p>
          <p className="text-blue-600 font-medium">
            Projected: {formatCurrency(data.balance)}
          </p>
          <p className="text-gray-500 text-sm">
            Range: {formatCurrency(data.lowerBound)} - {formatCurrency(data.upperBound)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
        No projection data available
      </div>
    );
  }

  const retirementYear = data.find((d) => d.isRetirementYear)?.year;

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Portfolio Projection</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#93C5FD" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#93C5FD" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="age"
              tickFormatter={(value) => `Age ${value}`}
              stroke="#6B7280"
              fontSize={12}
            />
            <YAxis
              tickFormatter={formatCurrency}
              stroke="#6B7280"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Confidence band - upper bound */}
            <Area
              type="monotone"
              dataKey="upperBound"
              stroke="none"
              fill="url(#colorConfidence)"
            />
            
            {/* Confidence band - lower bound */}
            <Area
              type="monotone"
              dataKey="lowerBound"
              stroke="none"
              fill="#FFFFFF"
            />
            
            {/* Main projection line */}
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#colorBalance)"
            />
            
            {retirementYear && (
              <ReferenceLine
                x={retirementAge}
                stroke="#10B981"
                strokeDasharray="5 5"
                label={{
                  value: 'Retirement',
                  position: 'top',
                  fill: '#10B981',
                  fontSize: 12,
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Projected Balance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-200 rounded"></div>
          <span>Confidence Band</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-green-500 border-dashed border-t-2 border-green-500"></div>
          <span>Retirement</span>
        </div>
      </div>
    </div>
  );
}
