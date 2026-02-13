import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const scenarioRouter = router({
  list: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.scenario.findMany({
        where: { userId: input.userId },
        include: {
          results: true,
          recommendations: true,
        },
      });
    }),

  getById: publicProcedure
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

  create: publicProcedure
    .input(z.object({
      userId: z.string(),
      name: z.string(),
      description: z.string().optional(),
      retirementAge: z.number(),
      targetCity: z.string().optional(),
      targetState: z.string().optional(),
      essentialSpending: z.number(),
      discretionarySpending: z.number(),
      withdrawalStrategy: z.enum(['four_percent', 'guardrails', 'buckets', 'tax_efficient', 'variable_percentage']),
      socialSecurityStrategy: z.enum(['early', 'full', 'delayed']),
      expectedReturn: z.number().default(7.0),
      inflationRate: z.number().default(3.0),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.scenario.create({
        data: input,
      });
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        retirementAge: z.number().optional(),
        targetCity: z.string().optional(),
        targetState: z.string().optional(),
        essentialSpending: z.number().optional(),
        discretionarySpending: z.number().optional(),
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

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.scenario.delete({
        where: { id: input.id },
      });
    }),
});
