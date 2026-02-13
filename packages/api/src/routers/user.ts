import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const userRouter = router({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.user.findUnique({
        where: { id: input.id },
        include: {
          accounts: true,
          expenses: true,
          scenarios: true,
        },
      });
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
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
        where: { id: input.id },
        data: input.data,
      });
    }),
});
