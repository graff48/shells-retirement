import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const accountRouter = router({
  list: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.account.findMany({
        where: { userId: input.userId },
      });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.account.findUnique({
        where: { id: input.id },
      });
    }),

  create: publicProcedure
    .input(z.object({
      userId: z.string(),
      name: z.string(),
      type: z.enum(['_401k', '_403b', '_457', 'traditional_ira', 'roth_ira', 'sep_ira', 'simple_ira', 'hsa', 'taxable', 'annuity', 'pension', 'cash_savings']),
      currentBalance: z.number(),
      monthlyContribution: z.number().default(0),
      employerMatchPercent: z.number().default(0),
      employerMatchMax: z.number().default(0),
      taxTreatment: z.enum(['pre_tax', 'post_tax', 'taxable']),
      stockAllocation: z.number().default(60),
      bondAllocation: z.number().default(30),
      cashAllocation: z.number().default(10),
      rmdStartAge: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.account.create({
        data: {
          ...input,
          currentBalance: input.currentBalance,
          monthlyContribution: input.monthlyContribution,
          employerMatchPercent: input.employerMatchPercent,
          employerMatchMax: input.employerMatchMax,
        },
      });
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        name: z.string().optional(),
        currentBalance: z.number().optional(),
        monthlyContribution: z.number().optional(),
        employerMatchPercent: z.number().optional(),
        employerMatchMax: z.number().optional(),
        stockAllocation: z.number().optional(),
        bondAllocation: z.number().optional(),
        cashAllocation: z.number().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.account.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.account.delete({
        where: { id: input.id },
      });
    }),
});
