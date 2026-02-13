import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const userRouter = router({
  getById: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.user.findUnique({
        where: { id: ctx.userId },
        include: {
          accounts: true,
          expenses: true,
          scenarios: true,
        },
      });
    }),

  update: protectedProcedure
    .input(z.object({
      data: z.object({
        birthDate: z.date().optional(),
        gender: z.enum(['male', 'female']).optional(),
        maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        lifeExpectancy: z.number().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: ctx.userId },
        data: input.data,
      });
    }),
});
