import { describe, it, expect } from 'vitest';
import { calculateHealthcareCosts, calculateACASubsidy } from '../healthcare';

describe('Healthcare Calculations', () => {
  describe('calculateHealthcareCosts', () => {
    it('should return known costs for age 55', () => {
      expect(calculateHealthcareCosts(55)).toBe(11000);
    });

    it('should return known costs for age 60', () => {
      expect(calculateHealthcareCosts(60)).toBe(12800);
    });

    it('should return known costs for age 64', () => {
      expect(calculateHealthcareCosts(64)).toBe(15500);
    });

    it('should return increasing costs for ages 55-64', () => {
      let previousCost = 0;
      for (let age = 55; age <= 64; age++) {
        const cost = calculateHealthcareCosts(age);
        expect(cost).toBeGreaterThan(previousCost);
        previousCost = cost;
      }
    });

    it('should return Medicare costs for age 65+', () => {
      const cost65 = calculateHealthcareCosts(65);
      const cost75 = calculateHealthcareCosts(75);
      // Medicare costs should be consistent
      expect(cost65).toBe(cost75);
      // Should include Part B, Part D, Medigap, and out-of-pocket
      expect(cost65).toBeGreaterThan(0);
    });

    it('should interpolate for ages not in lookup table', () => {
      // Age 50 is not in the lookup table (only 55-64 are)
      const cost = calculateHealthcareCosts(50);
      expect(cost).toBeGreaterThan(0);
    });

    it('should handle age 65 as the Medicare boundary', () => {
      const pre = calculateHealthcareCosts(64);
      const post = calculateHealthcareCosts(65);
      // Both should be positive but can be different
      expect(pre).toBeGreaterThan(0);
      expect(post).toBeGreaterThan(0);
    });
  });

  describe('calculateACASubsidy', () => {
    it('should return full subsidy below 150% FPL', () => {
      // FPL for 1 person = $15,060, 150% = $22,590
      const subsidy = calculateACASubsidy(20000, 1, 8000);
      // Expected contribution = 0% of income
      expect(subsidy).toBe(8000);
    });

    it('should return partial subsidy at 200% FPL', () => {
      // 200% FPL = $30,120
      const subsidy = calculateACASubsidy(30120, 1, 8000);
      expect(subsidy).toBeGreaterThan(0);
      expect(subsidy).toBeLessThan(8000);
    });

    it('should return partial subsidy at 300% FPL', () => {
      // 300% FPL = $45,180
      const subsidy = calculateACASubsidy(45180, 1, 8000);
      expect(subsidy).toBeGreaterThan(0);
      expect(subsidy).toBeLessThan(8000);
    });

    it('should return no subsidy above 400% FPL', () => {
      // 400% FPL = $60,240
      const subsidy = calculateACASubsidy(70000, 1, 8000);
      expect(subsidy).toBe(0);
    });

    it('should scale FPL with household size', () => {
      // FPL for 2 people = $15,060 + $5,380 = $20,440
      // Same income should get larger subsidy with larger household
      const subsidy1 = calculateACASubsidy(40000, 1, 8000);
      const subsidy2 = calculateACASubsidy(40000, 2, 8000);
      expect(subsidy2).toBeGreaterThan(subsidy1);
    });

    it('should decrease subsidy as income increases', () => {
      const subsidy25k = calculateACASubsidy(25000, 1, 8000);
      const subsidy35k = calculateACASubsidy(35000, 1, 8000);
      const subsidy50k = calculateACASubsidy(50000, 1, 8000);
      expect(subsidy25k).toBeGreaterThan(subsidy35k);
      expect(subsidy35k).toBeGreaterThan(subsidy50k);
    });

    it('should never return negative', () => {
      const subsidy = calculateACASubsidy(55000, 1, 8000);
      expect(subsidy).toBeGreaterThanOrEqual(0);
    });
  });
});
