import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { generateLifestyleDescription, generateLifestyleFallback } from '@retirement-advisor/ai';

export const aiRouter = router({
  generateLifestyle: protectedProcedure
    .input(z.object({
      scenarioId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get scenario with results
      const scenario = await ctx.prisma.scenario.findUnique({
        where: { id: input.scenarioId },
        include: {
          results: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!scenario) {
        throw new Error('Scenario not found');
      }

      if (!scenario.results || scenario.results.length === 0) {
        throw new Error('Run calculation first before generating lifestyle description');
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId },
      });

      const annualBudget = Number(scenario.essentialSpending) + Number(scenario.discretionarySpending);
      const location = scenario.targetCity && scenario.targetState
        ? `${scenario.targetCity}, ${scenario.targetState}`
        : 'your current location';
      const housingStatus = 'homeowner'; // TODO: Get from user profile
      const healthcarePhase = scenario.retirementAge < 65 ? 'pre-medicare' : 'medicare';
      const maritalStatus = user?.maritalStatus || 'single';

      // Try AI generation
      const aiResult = await generateLifestyleDescription({
        annualBudget,
        location,
        housingStatus,
        healthcarePhase,
        maritalStatus,
      });

      let description: string;

      if (aiResult.success) {
        description = aiResult.content;
      } else {
        // Fallback to template
        description = generateLifestyleFallback({
          annualBudget,
          location,
          housingStatus,
          healthcarePhase,
          maritalStatus,
        });
      }

      // Save to scenario
      await ctx.prisma.scenario.update({
        where: { id: input.scenarioId },
        data: { lifestyleDescription: description },
      });

      return {
        description,
        source: aiResult.success ? 'ai' : 'fallback',
      };
    }),

  generateRecommendations: protectedProcedure
    .input(z.object({
      scenarioId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const scenario = await ctx.prisma.scenario.findUnique({
        where: { id: input.scenarioId },
        include: {
          results: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!scenario || !scenario.results?.[0]) {
        throw new Error('Scenario calculation required');
      }

      const result = scenario.results[0];
      const annualSpending = Number(scenario.essentialSpending) + Number(scenario.discretionarySpending);

      // Get accounts for total balance
      const accounts = await ctx.prisma.account.findMany({
        where: { userId: ctx.userId },
      });
      let totalBalance = 0;
      for (const acc of accounts) {
        totalBalance += Number(acc.currentBalance);
      }

      // Generate recommendations based on success rate
      const recommendations = [];

      if (result.successProbability < 70) {
        recommendations.push({
          title: 'Consider Delaying Retirement',
          description: 'Your current plan has less than 70% success probability. Working 2-3 more years could significantly improve your odds.',
          impact: 'high' as const,
          estimatedImprovement: 15,
          actionSteps: ['Delay retirement to age ' + (scenario.retirementAge + 2), 'Continue maximizing 401k contributions'],
        });
      }

      if (annualSpending > totalBalance * 0.05) {
        recommendations.push({
          title: 'Reduce Withdrawal Rate',
          description: 'Your planned spending exceeds 5% of your nest egg annually. Consider reducing discretionary expenses.',
          impact: 'high' as const,
          estimatedImprovement: 20,
          actionSteps: ['Review discretionary spending categories', 'Identify $500/month in potential cuts'],
        });
      }

      if (scenario.withdrawalStrategy !== 'tax_efficient') {
        recommendations.push({
          title: 'Optimize Withdrawal Sequence',
          description: 'Using a tax-efficient withdrawal strategy can extend your portfolio longevity by 1-2 years.',
          impact: 'medium' as const,
          estimatedImprovement: 8,
          actionSteps: ['Withdraw from taxable accounts first', 'Delay Roth withdrawals until later'],
        });
      }

      // Save recommendations
      await ctx.prisma.recommendation.deleteMany({
        where: { scenarioId: input.scenarioId },
      });

      await Promise.all(
        recommendations.map(rec =>
          ctx.prisma.recommendation.create({
            data: {
              scenarioId: input.scenarioId,
              title: rec.title,
              description: rec.description,
              impact: rec.impact,
              estimatedImprovement: rec.estimatedImprovement,
              actionSteps: rec.actionSteps,
              tradeOffs: [],
            },
          })
        )
      );

      return recommendations;
    }),

  streamLifestyle: protectedProcedure
    .input(z.object({
      annualBudget: z.number(),
      location: z.string(),
      housingStatus: z.string(),
      healthcarePhase: z.string(),
      maritalStatus: z.string(),
    }))
    .subscription(async function* ({ input }) {
      // This would use a streaming generator in a real implementation
      // For now, just yield the full response
      const result = await generateLifestyleDescription(input);
      yield result.success ? result.content : generateLifestyleFallback(input);
    }),
});
