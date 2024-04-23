import { useState } from "react";

import { wsLink } from "@trpc/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "./styles.css";
import { trpc, wsClient } from "./api";
import { DeckState } from "./components/DeckState";

export function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        wsLink({
          client: wsClient
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <DeckState />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
