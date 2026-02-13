import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const expenseRouter = router({
  list: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.expense.findMany({
        where: { userId: input.userId },
      });
    }),

  create: publicProcedure
    .input(z.object({
      userId: z.string(),
      category: z.enum(['housing', 'healthcare', 'food', 'transportation', 'utilities', 'insurance', 'debt', 'dining_out', 'travel', 'entertainment', 'hobbies', 'shopping', 'gifts_charity', 'flex']),
      subcategory: z.string().optional(),
      amount: z.number(),
      type: z.enum(['essential', 'discretionary']),
      inflationRate: z.number().default(3.0),
      startAge: z.number().default(0),
      endAge: z.number().optional(),
      healthcarePhase: z.enum(['pre_medicare', 'medicare']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.expense.create({
        data: input,
      });
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        category: z.enum(['housing', 'healthcare', 'food', 'transportation', 'utilities', 'insurance', 'debt', 'dining_out', 'travel', 'entertainment', 'hobbies', 'shopping', 'gifts_charity', 'flex']).optional(),
        amount: z.number().optional(),
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

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.expense.delete({
        where: { id: input.id },
      });
    }),
});
