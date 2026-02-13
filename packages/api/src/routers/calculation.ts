import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import {
  runMonteCarloSimulation,
  calculateSustainableWithdrawalRate,
  calculateSocialSecurityBenefit,
  calculateHealthcareCosts,
  getFullRetirementAge,
  calculateWeightedReturns,
} from '@retirement-advisor/calculations';

export const calculationRouter = router({
  runProjection: protectedProcedure
    .input(z.object({
      scenarioId: z.string(),
      startingBalance: z.number().min(0, 'Starting balance must be non-negative'),
      annualContribution: z.number().min(0, 'Annual contribution must be non-negative'),
      annualWithdrawal: z.number().min(0, 'Annual withdrawal must be non-negative'),
      years: z.number().min(1, 'Years must be at least 1'),
      returnMean: z.number().default(0.07),
      returnStd: z.number().default(0.15),
    }))
    .mutation(async ({ ctx, input }) => {
      const { startingBalance, annualContribution, annualWithdrawal, years, returnMean, returnStd } = input;

      // Get user to compute current age
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId },
      });

      if (!user?.birthDate) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Set your birth date in profile to run calculations',
        });
      }

      const now = new Date();
      const currentAge = now.getFullYear() - user.birthDate.getFullYear() -
        (now < new Date(now.getFullYear(), user.birthDate.getMonth(), user.birthDate.getDate()) ? 1 : 0);

      // Run Monte Carlo simulation
      const monteCarloResult = runMonteCarloSimulation({
        startingBalance,
        annualContribution: annualContribution - annualWithdrawal,
        years,
        returnMean,
        returnStd,
        runs: 10000,
      });

      // Calculate sustainable withdrawal rate
      const swrResult = calculateSustainableWithdrawalRate(
        startingBalance,
        annualWithdrawal,
        years,
        returnMean,
        returnStd
      );

      // Save results to database
      const result = await ctx.prisma.calculationResult.create({
        data: {
          scenarioId: input.scenarioId,
          successProbability: monteCarloResult.successRate * 100,
          medianEndingBalance: monteCarloResult.median[years],
          worstCaseBalance: monteCarloResult.percentile10[years],
          sustainableWithdrawalRate: swrResult.rate * 100,
        },
      });

      // Save yearly projections
      const projections = await Promise.all(
        monteCarloResult.median.map((balance, year) =>
          ctx.prisma.yearProjection.create({
            data: {
              scenarioId: input.scenarioId,
              year: new Date().getFullYear() + year,
              age: currentAge + year,
              startingBalance: year === 0 ? startingBalance : monteCarloResult.median[year - 1],
              contributions: annualContribution,
              withdrawals: annualWithdrawal,
              endingBalance: balance,
              expenses: annualWithdrawal,
              income: 0,
            },
          })
        )
      );

      return {
        result,
        projections: monteCarloResult,
      };
    }),

  calculateSocialSecurity: protectedProcedure
    .input(z.object({
      aime: z.number(),
      claimingAge: z.number(),
      birthYear: z.number(),
    }))
    .query(({ input }) => {
      const fra = getFullRetirementAge(input.birthYear);
      const monthlyBenefit = calculateSocialSecurityBenefit(input.aime, input.claimingAge, fra);

      return {
        monthlyBenefit,
        annualBenefit: monthlyBenefit * 12,
        fullRetirementAge: fra,
      };
    }),

  calculateHealthcare: protectedProcedure
    .input(z.object({
      currentAge: z.number(),
      retirementAge: z.number(),
    }))
    .query(({ input }) => {
      const years = [];
      for (let age = input.currentAge; age <= 100; age++) {
        years.push({
          age,
          cost: calculateHealthcareCosts(age),
        });
      }

      return years;
    }),

  runFullScenario: protectedProcedure
    .input(z.object({
      scenarioId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get user profile for birth date
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId },
      });

      if (!user?.birthDate) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Set your birth date in profile to run calculations',
        });
      }

      const now = new Date();
      const currentAge = now.getFullYear() - user.birthDate.getFullYear() -
        (now < new Date(now.getFullYear(), user.birthDate.getMonth(), user.birthDate.getDate()) ? 1 : 0);

      // Get user's accounts
      const accounts = await ctx.prisma.account.findMany({
        where: { userId: ctx.userId },
      });

      // Get scenario details
      const scenario = await ctx.prisma.scenario.findUnique({
        where: { id: input.scenarioId },
      });

      if (!scenario) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scenario not found' });
      }

      // Calculate totals
      let totalBalance = 0;
      let annualContribution = 0;
      for (const acc of accounts) {
        totalBalance += Number(acc.currentBalance);
        annualContribution += Number(acc.monthlyContribution) * 12;
      }
      const annualExpenses = Number(scenario.essentialSpending) + Number(scenario.discretionarySpending);

      // Calculate years until retirement
      const yearsUntilRetirement = scenario.retirementAge - currentAge;
      const retirementYears = 30; // Project 30 years into retirement

      // Determine return parameters: use allocation-weighted if user hasn't set an explicit return
      let returnMean: number;
      let returnStd: number;

      if (scenario.expectedReturn !== 7.0) {
        // User explicitly set a custom expected return — use it
        returnMean = scenario.expectedReturn / 100;
        returnStd = 0.15;
      } else if (accounts.length > 0) {
        // Use allocation-weighted returns from accounts
        const weighted = calculateWeightedReturns(
          accounts.map((a: typeof accounts[number]) => ({
            currentBalance: Number(a.currentBalance),
            stockAllocation: a.stockAllocation,
            bondAllocation: a.bondAllocation,
            cashAllocation: a.cashAllocation,
          }))
        );
        returnMean = weighted.weightedMean;
        returnStd = weighted.weightedStd;
      } else {
        returnMean = scenario.expectedReturn / 100;
        returnStd = 0.15;
      }

      // Run projection
      const projectionResult = runMonteCarloSimulation({
        startingBalance: totalBalance,
        annualContribution,
        years: yearsUntilRetirement + retirementYears,
        returnMean,
        returnStd,
        runs: 10000,
      });

      // Calculate success rate from retirement start
      const retirementStartIndex = yearsUntilRetirement;
      const endingBalances = projectionResult.median.slice(retirementStartIndex);
      const successRate = endingBalances.filter(b => b > 0).length / endingBalances.length;

      // Save results
      const result = await ctx.prisma.calculationResult.create({
        data: {
          scenarioId: input.scenarioId,
          successProbability: successRate * 100,
          medianEndingBalance: projectionResult.median[projectionResult.median.length - 1],
          worstCaseBalance: projectionResult.percentile10[projectionResult.median.length - 1],
          sustainableWithdrawalRate: (annualExpenses / totalBalance) * 100,
        },
      });

      // Save projections
      await ctx.prisma.yearProjection.deleteMany({
        where: { scenarioId: input.scenarioId },
      });

      const currentYear = new Date().getFullYear();
      await Promise.all(
        projectionResult.median.map((balance, index) =>
          ctx.prisma.yearProjection.create({
            data: {
              scenarioId: input.scenarioId,
              year: currentYear + index,
              age: currentAge + index,
              startingBalance: index === 0 ? totalBalance : projectionResult.median[index - 1],
              contributions: index < yearsUntilRetirement ? annualContribution : 0,
              withdrawals: index >= yearsUntilRetirement ? annualExpenses : 0,
              endingBalance: balance,
              expenses: index >= yearsUntilRetirement ? annualExpenses : 0,
              income: 0,
            },
          })
        )
      );

      return {
        result,
        projections: projectionResult,
        summary: {
          totalBalance,
          annualContribution,
          annualExpenses,
          yearsUntilRetirement,
          successRate: successRate * 100,
        },
      };
    }),
});
