import { describe, it, expect } from 'vitest';
import { runMonteCarloSimulation, runDeterministicProjection, calculateSustainableWithdrawalRate, calculateWeightedReturns } from '../portfolio';

describe('Portfolio Calculations', () => {
  describe('runDeterministicProjection', () => {
    it('should calculate correct balance with 7% return', () => {
      const result = runDeterministicProjection(100000, 10000, 30, 0.07);
      
      // After 30 years at 7% with $10k annual contribution
      expect(result[0]).toBe(100000);
      expect(result[result.length - 1]).toBeGreaterThan(100000);
    });

    it('should handle zero contributions', () => {
      const result = runDeterministicProjection(100000, 0, 10, 0.07);
      
      // Pure compound growth
      expect(result[10]).toBeCloseTo(100000 * Math.pow(1.07, 10), -2);
    });
  });

  describe('runMonteCarloSimulation', () => {
    it('should return percentiles in correct order', () => {
      const result = runMonteCarloSimulation({
        startingBalance: 100000,
        annualContribution: 10000,
        years: 10,
        returnMean: 0.07,
        returnStd: 0.15,
        runs: 1000,
      });

      expect(result.percentile10[10]).toBeLessThan(result.percentile25[10]);
      expect(result.percentile25[10]).toBeLessThan(result.median[10]);
      expect(result.median[10]).toBeLessThan(result.percentile75[10]);
      expect(result.percentile75[10]).toBeLessThan(result.percentile90[10]);
    });

    it('should have success rate between 0 and 1', () => {
      const result = runMonteCarloSimulation({
        startingBalance: 100000,
        annualContribution: 10000,
        years: 10,
        returnMean: 0.07,
        returnStd: 0.15,
        runs: 100,
      });

      expect(result.successRate).toBeGreaterThanOrEqual(0);
      expect(result.successRate).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateSustainableWithdrawalRate', () => {
    it('should calculate 4% rule for $1M with $40k expenses', () => {
      const result = calculateSustainableWithdrawalRate(1000000, 40000, 30);

      expect(result.rate).toBe(0.04);
      expect(result.successProbability).toBeGreaterThan(0);
    });
  });

  describe('calculateWeightedReturns', () => {
    it('should return defaults for empty accounts', () => {
      const result = calculateWeightedReturns([]);
      expect(result.weightedMean).toBe(0.07);
      expect(result.weightedStd).toBe(0.15);
    });

    it('should return defaults for zero balance accounts', () => {
      const result = calculateWeightedReturns([
        { currentBalance: 0, stockAllocation: 60, bondAllocation: 30, cashAllocation: 10 },
      ]);
      expect(result.weightedMean).toBe(0.07);
      expect(result.weightedStd).toBe(0.15);
    });

    it('should calculate correctly for 100% stock portfolio', () => {
      const result = calculateWeightedReturns([
        { currentBalance: 100000, stockAllocation: 100, bondAllocation: 0, cashAllocation: 0 },
      ]);
      expect(result.weightedMean).toBeCloseTo(0.10, 4);
      expect(result.weightedStd).toBeCloseTo(0.18, 4);
    });

    it('should calculate correctly for 100% bond portfolio', () => {
      const result = calculateWeightedReturns([
        { currentBalance: 100000, stockAllocation: 0, bondAllocation: 100, cashAllocation: 0 },
      ]);
      expect(result.weightedMean).toBeCloseTo(0.04, 4);
      expect(result.weightedStd).toBeCloseTo(0.06, 4);
    });

    it('should calculate correctly for 100% cash portfolio', () => {
      const result = calculateWeightedReturns([
        { currentBalance: 100000, stockAllocation: 0, bondAllocation: 0, cashAllocation: 100 },
      ]);
      expect(result.weightedMean).toBeCloseTo(0.02, 4);
      expect(result.weightedStd).toBeCloseTo(0.01, 4);
    });

    it('should weight by account balance across multiple accounts', () => {
      // $300k in stocks, $100k in bonds
      const result = calculateWeightedReturns([
        { currentBalance: 300000, stockAllocation: 100, bondAllocation: 0, cashAllocation: 0 },
        { currentBalance: 100000, stockAllocation: 0, bondAllocation: 100, cashAllocation: 0 },
      ]);
      // Weighted: 75% stocks, 25% bonds
      const expectedMean = 0.75 * 0.10 + 0.25 * 0.04;
      const expectedStd = 0.75 * 0.18 + 0.25 * 0.06;
      expect(result.weightedMean).toBeCloseTo(expectedMean, 4);
      expect(result.weightedStd).toBeCloseTo(expectedStd, 4);
    });

    it('should calculate for a typical 60/30/10 allocation', () => {
      const result = calculateWeightedReturns([
        { currentBalance: 500000, stockAllocation: 60, bondAllocation: 30, cashAllocation: 10 },
      ]);
      const expectedMean = 0.60 * 0.10 + 0.30 * 0.04 + 0.10 * 0.02;
      const expectedStd = 0.60 * 0.18 + 0.30 * 0.06 + 0.10 * 0.01;
      expect(result.weightedMean).toBeCloseTo(expectedMean, 4);
      expect(result.weightedStd).toBeCloseTo(expectedStd, 4);
    });
  });
});
