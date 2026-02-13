import { router } from './trpc';
import { userRouter } from './routers/user';
import { accountRouter } from './routers/account';
import { expenseRouter } from './routers/expense';
import { scenarioRouter } from './routers/scenario';
import { calculationRouter } from './routers/calculation';
import { aiRouter } from './routers/ai';

export { createContext } from './trpc';

export const appRouter = router({
  user: userRouter,
  account: accountRouter,
  expense: expenseRouter,
  scenario: scenarioRouter,
  calculation: calculationRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
