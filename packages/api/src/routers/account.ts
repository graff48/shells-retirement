import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const accountRouter = router({
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.account.findMany({
        where: { userId: ctx.userId },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.account.findUnique({
        where: { id: input.id },
      });
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      type: z.enum(['_401k', '_403b', '_457', 'traditional_ira', 'roth_ira', 'sep_ira', 'simple_ira', 'hsa', 'taxable', 'annuity', 'pension', 'cash_savings']),
      currentBalance: z.number().min(0, 'Balance must be non-negative'),
      monthlyContribution: z.number().min(0, 'Contribution must be non-negative').default(0),
      employerMatchPercent: z.number().default(0),
      employerMatchMax: z.number().default(0),
      taxTreatment: z.enum(['pre_tax', 'post_tax', 'taxable']),
      stockAllocation: z.number().default(60),
      bondAllocation: z.number().default(30),
      cashAllocation: z.number().default(10),
      rmdStartAge: z.number().optional(),
    }).refine(
      (data) => data.stockAllocation + data.bondAllocation + data.cashAllocation === 100,
      { message: 'Asset allocations must sum to 100%' }
    ))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.account.create({
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
        currentBalance: z.number().min(0, 'Balance must be non-negative').optional(),
        monthlyContribution: z.number().min(0, 'Contribution must be non-negative').optional(),
        employerMatchPercent: z.number().optional(),
        employerMatchMax: z.number().optional(),
        stockAllocation: z.number().optional(),
        bondAllocation: z.number().optional(),
        cashAllocation: z.number().optional(),
      }).refine(
        (data) => {
          if (data.stockAllocation !== undefined && data.bondAllocation !== undefined && data.cashAllocation !== undefined) {
            return data.stockAllocation + data.bondAllocation + data.cashAllocation === 100;
          }
          return true;
        },
        { message: 'Asset allocations must sum to 100%' }
      ),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.account.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.account.delete({
        where: { id: input.id },
      });
    }),
});
