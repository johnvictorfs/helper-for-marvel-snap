import { initTRPC } from "@trpc/server";

export const createContext = async () => {};
export const t = initTRPC.context<typeof createContext>().create();
