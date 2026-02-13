import { describe, it, expect } from 'vitest';
import { calculateFederalTax, getStandardDeduction, calculateTaxableIncome, calculateEffectiveTaxRate } from '../taxes';

describe('Tax Calculations', () => {
  describe('calculateFederalTax', () => {
    it('should calculate tax in the 10% bracket (single)', () => {
      const tax = calculateFederalTax(10000, 'single');
      expect(tax).toBe(10000 * 0.10);
    });

    it('should calculate tax spanning first two brackets (single)', () => {
      const tax = calculateFederalTax(20000, 'single');
      // 11600 * 0.10 + (20000 - 11600) * 0.12
      const expected = 11600 * 0.10 + 8400 * 0.12;
      expect(tax).toBeCloseTo(expected, 2);
    });

    it('should calculate tax at exactly the 10% bracket boundary', () => {
      const tax = calculateFederalTax(11600, 'single');
      expect(tax).toBe(11600 * 0.10);
    });

    it('should calculate tax for $100k income (single)', () => {
      const tax = calculateFederalTax(100000, 'single');
      // 11600 * 0.10 + (47150 - 11600) * 0.12 + (100000 - 47150) * 0.22
      const expected = 11600 * 0.10 + 35550 * 0.12 + 52850 * 0.22;
      expect(tax).toBeCloseTo(expected, 2);
    });

    it('should calculate tax for married filing jointly', () => {
      const tax = calculateFederalTax(50000, 'married_joint');
      // 23200 * 0.10 + (50000 - 23200) * 0.12
      const expected = 23200 * 0.10 + 26800 * 0.12;
      expect(tax).toBeCloseTo(expected, 2);
    });

    it('should return 0 for $0 income', () => {
      expect(calculateFederalTax(0, 'single')).toBe(0);
    });

    it('should handle very high income (hits 37% bracket)', () => {
      const tax = calculateFederalTax(1000000, 'single');
      expect(tax).toBeGreaterThan(0);
      // Effective rate should be somewhere between 32% and 37%
      const effectiveRate = tax / 1000000;
      expect(effectiveRate).toBeGreaterThan(0.30);
      expect(effectiveRate).toBeLessThan(0.37);
    });
  });

  describe('getStandardDeduction', () => {
    it('should return $14,600 for single filers', () => {
      expect(getStandardDeduction('single')).toBe(14600);
    });

    it('should return $29,200 for married filing jointly', () => {
      expect(getStandardDeduction('married_joint')).toBe(29200);
    });

    it('should return $14,600 for married filing separately', () => {
      expect(getStandardDeduction('married_separate')).toBe(14600);
    });

    it('should return $21,900 for head of household', () => {
      expect(getStandardDeduction('head_household')).toBe(21900);
    });
  });

  describe('calculateTaxableIncome', () => {
    it('should subtract standard deduction', () => {
      const taxable = calculateTaxableIncome(75000, 'single');
      expect(taxable).toBe(75000 - 14600);
    });

    it('should use custom deductions when provided', () => {
      const taxable = calculateTaxableIncome(75000, 'single', 20000);
      expect(taxable).toBe(75000 - 20000);
    });

    it('should not return negative taxable income', () => {
      const taxable = calculateTaxableIncome(5000, 'single');
      expect(taxable).toBe(0);
    });

    it('should return 0 for $0 income', () => {
      expect(calculateTaxableIncome(0, 'single')).toBe(0);
    });
  });

  describe('calculateEffectiveTaxRate', () => {
    it('should calculate effective rate for a moderate income', () => {
      const rate = calculateEffectiveTaxRate(75000, 'single');
      // After standard deduction: 75000 - 14600 = 60400
      // Tax on 60400: 11600 * 0.10 + (47150-11600)*0.12 + (60400-47150)*0.22
      expect(rate).toBeGreaterThan(0);
      expect(rate).toBeLessThan(0.22); // Must be less than marginal rate
    });

    it('should return 0 for $0 income', () => {
      expect(calculateEffectiveTaxRate(0, 'single')).toBe(0);
    });

    it('should return lower effective rate for married filers at same income', () => {
      const singleRate = calculateEffectiveTaxRate(100000, 'single');
      const marriedRate = calculateEffectiveTaxRate(100000, 'married_joint');
      expect(marriedRate).toBeLessThan(singleRate);
    });

    it('should increase with income', () => {
      const rate50k = calculateEffectiveTaxRate(50000, 'single');
      const rate100k = calculateEffectiveTaxRate(100000, 'single');
      const rate200k = calculateEffectiveTaxRate(200000, 'single');
      expect(rate100k).toBeGreaterThan(rate50k);
      expect(rate200k).toBeGreaterThan(rate100k);
    });
  });
});
