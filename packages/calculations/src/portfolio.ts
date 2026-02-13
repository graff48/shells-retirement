import type { YearProjection } from '@retirement-advisor/types';

export interface PortfolioInputs {
  startingBalance: number;
  annualContribution: number;
  years: number;
  returnMean: number;
  returnStd: number;
  runs?: number;
}

export interface ProjectionResult {
  median: number[];
  percentile10: number[];
  percentile25: number[];
  percentile75: number[];
  percentile90: number[];
  successRate: number;
}

/**
 * Monte Carlo simulation for portfolio projection
 */
export function runMonteCarloSimulation(
  inputs: PortfolioInputs
): ProjectionResult {
  const { startingBalance, annualContribution, years, returnMean, returnStd, runs = 10000 } = inputs;
  
  const allRuns: number[][] = [];
  
  for (let run = 0; run < runs; run++) {
    let balance = startingBalance;
    const yearlyBalances: number[] = [balance];
    
    for (let year = 0; year < years; year++) {
      // Random return using Box-Muller transform
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const annualReturn = returnMean + returnStd * z0;
      
      // Apply return and contribution
      balance = balance * (1 + annualReturn) + annualContribution;
      yearlyBalances.push(Math.max(0, balance));
    }
    
    allRuns.push(yearlyBalances);
  }
  
  // Calculate percentiles for each year
  const median: number[] = [];
  const percentile10: number[] = [];
  const percentile25: number[] = [];
  const percentile75: number[] = [];
  const percentile90: number[] = [];
  
  for (let year = 0; year <= years; year++) {
    const yearBalances = allRuns.map(run => run[year]).sort((a, b) => a - b);
    
    median.push(getPercentile(yearBalances, 50));
    percentile10.push(getPercentile(yearBalances, 10));
    percentile25.push(getPercentile(yearBalances, 25));
    percentile75.push(getPercentile(yearBalances, 75));
    percentile90.push(getPercentile(yearBalances, 90));
  }
  
  // Calculate success rate (no depletion)
  const successRate = allRuns.filter(run => run[years] > 0).length / runs;
  
  return {
    median,
    percentile10,
    percentile25,
    percentile75,
    percentile90,
    successRate,
  };
}

function getPercentile(sortedArray: number[], percentile: number): number {
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
}

/**
 * Simple deterministic projection (for quick estimates)
 */
export function runDeterministicProjection(
  startingBalance: number,
  annualContribution: number,
  years: number,
  annualReturn: number
): number[] {
  const balances: number[] = [startingBalance];
  let balance = startingBalance;
  
  for (let year = 0; year < years; year++) {
    balance = balance * (1 + annualReturn) + annualContribution;
    balances.push(balance);
  }
  
  return balances;
}

/**
 * Asset class return assumptions
 */
const ASSET_CLASS_PARAMS = {
  stocks: { mean: 0.10, std: 0.18 },
  bonds: { mean: 0.04, std: 0.06 },
  cash: { mean: 0.02, std: 0.01 },
};

export interface AccountAllocation {
  currentBalance: number;
  stockAllocation: number;
  bondAllocation: number;
  cashAllocation: number;
}

/**
 * Calculate portfolio-weighted mean return and standard deviation
 * based on per-account asset allocations, weighted by account balance.
 */
export function calculateWeightedReturns(
  accounts: AccountAllocation[]
): { weightedMean: number; weightedStd: number } {
  const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

  if (totalBalance === 0) {
    // Default to a balanced portfolio if no balance
    return { weightedMean: 0.07, weightedStd: 0.15 };
  }

  let portfolioStockPct = 0;
  let portfolioBondPct = 0;
  let portfolioCashPct = 0;

  for (const account of accounts) {
    const weight = account.currentBalance / totalBalance;
    portfolioStockPct += (account.stockAllocation / 100) * weight;
    portfolioBondPct += (account.bondAllocation / 100) * weight;
    portfolioCashPct += (account.cashAllocation / 100) * weight;
  }

  const weightedMean =
    portfolioStockPct * ASSET_CLASS_PARAMS.stocks.mean +
    portfolioBondPct * ASSET_CLASS_PARAMS.bonds.mean +
    portfolioCashPct * ASSET_CLASS_PARAMS.cash.mean;

  // Simplified portfolio std: weighted sum of individual stds
  // (ignores correlation, which is a reasonable approximation)
  const weightedStd =
    portfolioStockPct * ASSET_CLASS_PARAMS.stocks.std +
    portfolioBondPct * ASSET_CLASS_PARAMS.bonds.std +
    portfolioCashPct * ASSET_CLASS_PARAMS.cash.std;

  return { weightedMean, weightedStd };
}

/**
 * Calculate sustainable withdrawal rate
 */
export function calculateSustainableWithdrawalRate(
  portfolio: number,
  annualExpenses: number,
  years: number,
  returnMean: number = 0.07,
  returnStd: number = 0.15
): { rate: number; successProbability: number } {
  const rate = annualExpenses / portfolio;
  
  const result = runMonteCarloSimulation({
    startingBalance: portfolio,
    annualContribution: -annualExpenses,
    years,
    returnMean,
    returnStd,
    runs: 5000,
  });
  
  return {
    rate,
    successProbability: result.successRate,
  };
}
