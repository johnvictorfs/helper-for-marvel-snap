import { createWSClient } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../server/routers";

export const trpc = createTRPCReact<AppRouter>();

export const wsClient = createWSClient({
  url: `ws://localhost:3001`,
});
