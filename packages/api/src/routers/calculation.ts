import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { 
  runMonteCarloSimulation, 
  calculateSustainableWithdrawalRate,
  calculateSocialSecurityBenefit,
  calculateHealthcareCosts,
  getFullRetirementAge
} from '@retirement-advisor/calculations';

export const calculationRouter = router({
  runProjection: publicProcedure
    .input(z.object({
      scenarioId: z.string(),
      startingBalance: z.number(),
      annualContribution: z.number(),
      annualWithdrawal: z.number(),
      years: z.number(),
      returnMean: z.number().default(0.07),
      returnStd: z.number().default(0.15),
    }))
    .mutation(async ({ ctx, input }) => {
      const { startingBalance, annualContribution, annualWithdrawal, years, returnMean, returnStd } = input;
      
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
              age: 0, // Will be calculated based on user's current age
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

  calculateSocialSecurity: publicProcedure
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

  calculateHealthcare: publicProcedure
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

  runFullScenario: publicProcedure
    .input(z.object({
      scenarioId: z.string(),
      userId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get user's accounts
      const accounts = await ctx.prisma.account.findMany({
        where: { userId: input.userId },
      });

      // Get scenario details
      const scenario = await ctx.prisma.scenario.findUnique({
        where: { id: input.scenarioId },
      });

      if (!scenario) {
        throw new Error('Scenario not found');
      }

      // Calculate totals
      const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.currentBalance), 0);
      const annualContribution = accounts.reduce((sum, acc) => sum + Number(acc.monthlyContribution) * 12, 0);
      const annualExpenses = Number(scenario.essentialSpending) + Number(scenario.discretionarySpending);

      // Calculate years until retirement
      const currentAge = 45; // TODO: Get from user profile
      const yearsUntilRetirement = scenario.retirementAge - currentAge;
      const retirementYears = 30; // Project 30 years into retirement

      // Run projection
      const projectionResult = runMonteCarloSimulation({
        startingBalance: totalBalance,
        annualContribution,
        years: yearsUntilRetirement + retirementYears,
        returnMean: scenario.expectedReturn / 100,
        returnStd: 0.15,
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
