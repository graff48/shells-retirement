import { router } from './trpc';
import { userRouter } from './routers/user';
import { accountRouter } from './routers/account';
import { expenseRouter } from './routers/expense';
import { scenarioRouter } from './routers/scenario';
import { calculationRouter } from './routers/calculation';

export const appRouter = router({
  user: userRouter,
  account: accountRouter,
  expense: expenseRouter,
  scenario: scenarioRouter,
  calculation: calculationRouter,
});

export type AppRouter = typeof appRouter;
