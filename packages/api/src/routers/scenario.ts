import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const scenarioRouter = router({
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.scenario.findMany({
        where: { userId: ctx.userId },
        include: {
          results: true,
          recommendations: true,
        },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.scenario.findUnique({
        where: { id: input.id },
        include: {
          results: true,
          recommendations: true,
          projections: true,
        },
      });
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      retirementAge: z.number().min(45, 'Retirement age must be at least 45').max(80, 'Retirement age must be at most 80'),
      targetCity: z.string().optional(),
      targetState: z.string().optional(),
      essentialSpending: z.number().min(0, 'Essential spending must be non-negative'),
      discretionarySpending: z.number().min(0, 'Discretionary spending must be non-negative'),
      withdrawalStrategy: z.enum(['four_percent', 'guardrails', 'buckets', 'tax_efficient', 'variable_percentage']),
      socialSecurityStrategy: z.enum(['early', 'full', 'delayed']),
      expectedReturn: z.number().default(7.0),
      inflationRate: z.number().default(3.0),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.scenario.create({
        data: {
          ...input,
          userId: ctx.userId,
        },
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        retirementAge: z.number().min(45).max(80).optional(),
        targetCity: z.string().optional(),
        targetState: z.string().optional(),
        essentialSpending: z.number().min(0).optional(),
        discretionarySpending: z.number().min(0).optional(),
        withdrawalStrategy: z.enum(['four_percent', 'guardrails', 'buckets', 'tax_efficient', 'variable_percentage']).optional(),
        socialSecurityStrategy: z.enum(['early', 'full', 'delayed']).optional(),
        expectedReturn: z.number().optional(),
        inflationRate: z.number().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.scenario.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.scenario.delete({
        where: { id: input.id },
      });
    }),
});
