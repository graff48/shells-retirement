import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@retirement-advisor/api';

export const trpc = createTRPCReact<AppRouter>();
