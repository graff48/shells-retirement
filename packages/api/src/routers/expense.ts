import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const expenseRouter = router({
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.expense.findMany({
        where: { userId: ctx.userId },
      });
    }),

  create: protectedProcedure
    .input(z.object({
      category: z.enum(['housing', 'healthcare', 'food', 'transportation', 'utilities', 'insurance', 'debt', 'dining_out', 'travel', 'entertainment', 'hobbies', 'shopping', 'gifts_charity', 'flex']),
      subcategory: z.string().optional(),
      amount: z.number().min(0, 'Amount must be non-negative'),
      type: z.enum(['essential', 'discretionary']),
      inflationRate: z.number().default(3.0),
      startAge: z.number().default(0),
      endAge: z.number().optional(),
      healthcarePhase: z.enum(['pre_medicare', 'medicare']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.expense.create({
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
        category: z.enum(['housing', 'healthcare', 'food', 'transportation', 'utilities', 'insurance', 'debt', 'dining_out', 'travel', 'entertainment', 'hobbies', 'shopping', 'gifts_charity', 'flex']).optional(),
        amount: z.number().min(0, 'Amount must be non-negative').optional(),
        type: z.enum(['essential', 'discretionary']).optional(),
        inflationRate: z.number().optional(),
        startAge: z.number().optional(),
        endAge: z.number().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.expense.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.expense.delete({
        where: { id: input.id },
      });
    }),
});
