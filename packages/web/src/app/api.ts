import type { AppRouter } from "@local/server/src/routers";
import { createWSClient } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";

export const trpc = createTRPCReact<AppRouter>();

export const wsClient = createWSClient({
  url: `ws://localhost:3001`,
});
