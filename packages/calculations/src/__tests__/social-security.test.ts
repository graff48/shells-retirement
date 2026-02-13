import { describe, it, expect } from 'vitest';
import { calculateAIME, calculatePIA, calculateSocialSecurityBenefit, getFullRetirementAge } from '../social-security';

describe('Social Security Calculations', () => {
  describe('calculateAIME', () => {
    it('should calculate AIME from earnings history', () => {
      // 35 years of $60,000 earnings
      const earnings = Array(35).fill(60000);
      const aime = calculateAIME(earnings);
      // $60,000 * 35 / (35 * 12) = $5,000/month
      expect(aime).toBe(5000);
    });

    it('should use top 35 years when more than 35 provided', () => {
      const earnings = [
        ...Array(30).fill(50000),
        ...Array(10).fill(80000),
      ];
      const aime = calculateAIME(earnings);
      // Top 35: 10 * 80000 + 25 * 50000 = 2,050,000
      // AIME = 2,050,000 / (35 * 12) = 4880.95
      expect(aime).toBeCloseTo(4880.95, 0);
    });

    it('should handle fewer than 35 years', () => {
      const earnings = Array(20).fill(60000);
      const aime = calculateAIME(earnings);
      // 20 * 60000 / (35 * 12) = 2857.14
      expect(aime).toBeCloseTo(2857.14, 0);
    });

    it('should apply index factor', () => {
      const earnings = Array(35).fill(50000);
      const aime = calculateAIME(earnings, 1.2);
      // 50000 * 1.2 * 35 / (35 * 12) = 5000
      expect(aime).toBe(5000);
    });

    it('should return 0 for empty earnings', () => {
      expect(calculateAIME([])).toBe(0);
    });
  });

  describe('calculatePIA', () => {
    it('should calculate PIA below first bend point ($1,174)', () => {
      const pia = calculatePIA(1000);
      // 1000 * 0.90 = 900
      expect(pia).toBe(900);
    });

    it('should calculate PIA at first bend point exactly', () => {
      const pia = calculatePIA(1174);
      expect(pia).toBeCloseTo(1174 * 0.90, 2);
    });

    it('should calculate PIA between bend points', () => {
      const pia = calculatePIA(3000);
      // 1174 * 0.90 + (3000 - 1174) * 0.32
      const expected = 1174 * 0.90 + (3000 - 1174) * 0.32;
      expect(pia).toBeCloseTo(expected, 2);
    });

    it('should calculate PIA at second bend point ($7,078)', () => {
      const pia = calculatePIA(7078);
      const expected = 1174 * 0.90 + (7078 - 1174) * 0.32;
      expect(pia).toBeCloseTo(expected, 2);
    });

    it('should calculate PIA above second bend point', () => {
      const pia = calculatePIA(10000);
      const expected = 1174 * 0.90 + (7078 - 1174) * 0.32 + (10000 - 7078) * 0.15;
      expect(pia).toBeCloseTo(expected, 2);
    });

    it('should return 0 for 0 AIME', () => {
      expect(calculatePIA(0)).toBe(0);
    });
  });

  describe('calculateSocialSecurityBenefit', () => {
    const testAime = 5000; // ~$60k/yr earner

    it('should return PIA at full retirement age', () => {
      const benefit = calculateSocialSecurityBenefit(testAime, 67, 67);
      const pia = calculatePIA(testAime);
      expect(benefit).toBeCloseTo(pia, 2);
    });

    it('should reduce benefit for early claiming at 62', () => {
      const benefit = calculateSocialSecurityBenefit(testAime, 62, 67);
      const pia = calculatePIA(testAime);
      // 60 months early: 36 * 5/900 + 24 * 5/1200 = 0.20 + 0.10 = 0.30
      expect(benefit).toBeLessThan(pia);
      expect(benefit).toBeCloseTo(pia * 0.70, 0);
    });

    it('should increase benefit for delayed claiming at 70', () => {
      const benefit = calculateSocialSecurityBenefit(testAime, 70, 67);
      const pia = calculatePIA(testAime);
      // 36 months delayed: 36 * (2/3/100) = 0.24
      expect(benefit).toBeGreaterThan(pia);
      expect(benefit).toBeCloseTo(pia * 1.24, 0);
    });

    it('should handle claiming at 64 (3 years early)', () => {
      const benefit = calculateSocialSecurityBenefit(testAime, 64, 67);
      const pia = calculatePIA(testAime);
      // 36 months early: 36 * 5/900 = 0.20
      expect(benefit).toBeCloseTo(pia * 0.80, 0);
    });
  });

  describe('getFullRetirementAge', () => {
    it('should return 65 for birth year 1937 and earlier', () => {
      expect(getFullRetirementAge(1937)).toBe(65);
      expect(getFullRetirementAge(1930)).toBe(65);
    });

    it('should return 66 for birth year 1943-1954', () => {
      expect(getFullRetirementAge(1943)).toBe(66);
      expect(getFullRetirementAge(1954)).toBe(66);
    });

    it('should return gradual increase for 1955', () => {
      expect(getFullRetirementAge(1955)).toBeCloseTo(66 + 2 / 12, 4);
    });

    it('should return 67 for birth year 1960 and later', () => {
      expect(getFullRetirementAge(1960)).toBe(67);
      expect(getFullRetirementAge(1965)).toBe(67);
      expect(getFullRetirementAge(1990)).toBe(67);
    });
  });
});
