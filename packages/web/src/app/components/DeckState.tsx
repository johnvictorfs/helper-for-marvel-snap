import type { GameState } from "@local/server/src/routers/index";
import { useState } from "react";
import { trpc } from "../api";
import { SnapCard } from "./SnapCard";

export const DeckState = () => {
  const [currentState, setCurrentState] = useState<GameState | null>();
  const [gamePath, setGamePath] = useState<string>(
    "$HOME/.steam/steam/steamapps/compatdata/1997040/pfx/drive_c/users/steamuser/AppData/LocalLow/Second Dinner/SNAP/Standalone/States/nvprod/"
  );

  const {
    data: initialGameState,
    refetch,
    isLoading,
  } = trpc.gameState.useQuery(
    { path: gamePath },
    {
      refetchInterval: 3000,
      refetchIntervalInBackground: true,
    }
  );

  trpc.onGameState.useSubscription(
    { path: gamePath },
    {
      onData(gameState) {
        if (gameState) {
          setCurrentState(gameState);
        } else {
          refetch();
        }
      },
    }
  );

  const state = initialGameState ?? currentState;

  if (!state && isLoading) {
    return (
      <div className="flex justify-center items-center text-2xl animate-pulse h-[100vh] font-bold">
        Loading...
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col p-2 pt-4">
        {state?.deck ? (
          <div className="flex flex-col">
            <div className="text-2xl font-bold text-center">
              {state.deck.name}
            </div>

            <div className="flex flex-wrap justify-center">
              {state.deck.cards?.map((card) => (
                <SnapCard
                  key={card.id}
                  card={card}
                  notDrawn={
                    !state.cardsDrawn.includes(card.defId) || !state?.status
                  }
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[100vh] text-center flex flex-col items-center justify-center gap-2">
            <div className="text-2xl font-bold text-center">No Deck Found</div>

            <button
              className="bg-blue-500 hover:bg-blue-700 text-white p-2 rounded"
              onClick={() => {
                const path = prompt("Enter path", gamePath);
                if (path) {
                  setGamePath(path);
                }
              }}
            >
              Set Config path
            </button>
          </div>
        )}
      </div>
    </>
  );
};
