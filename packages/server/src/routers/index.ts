import { initTRPC } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { EventEmitter } from "events";
import { jsonrepair } from "jsonrepair";

import os from "os";
import { z } from "zod";

import { $ } from "bun";
import chokidar from "chokidar";
import cardData from "../data/cardData.json";

type PlayerState = {
  hand: CardData[];
  deck: CardData[];
  graveyard: CardData[];
};

export type GameState = {
  players: [PlayerState, PlayerState];
  deck: Deck | null;
  status: null | "Playing" | "Finished";
};

const ee = new EventEmitter();

const t = initTRPC.create();

const defaultFolder = `${os.homedir()}/.steam/steam/steamapps/compatdata/1997040/pfx/drive_c/users/steamuser/AppData/LocalLow/Second Dinner/SNAP/Standalone/States/nvprod/`;

export type CardData = (typeof cardData)[number] & { drawn?: boolean };

const mappedCardData = cardData.reduce((acc, card) => {
  acc[card.defId] = card;
  return acc;
}, {} as Record<string, CardData>);

type Deck = {
  name: string;
  cards: CardData[];
};

const getCurrentDeck = async (cardsDrawn?: string[]): Promise<Deck | null> => {
  const playState = await looseReadJson(defaultFolder + "PlayState.json");

  if (!playState || !playState.SelectedDeckId) {
    return null;
  }

  const deckId = playState?.SelectedDeckId?.Value;
  if (!deckId) {
    return null;
  }

  const collectionState = await looseReadJson(
    defaultFolder + "CollectionState.json"
  );

  if (!collectionState || !collectionState.ServerState) {
    return null;
  }

  const deck = collectionState.ServerState.Decks.find(
    (deck: any) => deck.Id === deckId
  );

  if (!deck) {
    return null;
  }

  return {
    name: deck.Name,
    cards: cardMapper(deck.Cards, cardsDrawn),
  };
};

const EVENT = {
  GAME_STATE_CHANGE: "game-state-change",
} as const;

const cardMapper = (cards: { CardDefId: string }[], drawn?: string[]) => {
  if (!cards) {
    return [];
  }

  return (
    cards
      .map((card: any) => {
        const cardWithData =
          mappedCardData[card.CardDefId?.replace(/ /g, "").replace(/-/g, "")];

        if (!cardWithData) {
          return;
        }

        if (drawn && drawn.includes(cardWithData.defId)) {
          return { ...cardWithData, drawn: true };
        }

        return cardWithData;
      })
      .filter(Boolean) as CardData[]
  ).sort((a, b) => a.cost - b.cost);
};
const looseReadJson = async (path: string) => {
  const buffer = await $`cat ${path}`.arrayBuffer();
  const rawText = new TextDecoder().decode(buffer);
  // const rawText = fs.readFileSync(path, "utf-8");

  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch (error) {
    try {
      let clean = jsonrepair(rawText.trim());

      try {
        return JSON.parse(clean);
      } catch (error) {
        return null;
      }
    } catch (error) {
      return null;
    }
  }
};

const parsedGameState = async (path?: string): Promise<GameState | null> => {
  if (!path) {
    path = defaultFolder;
  }

  path = path.replace("$HOME", os.homedir());

  const gameStatePath = path + "GameState.json";

  const game = await looseReadJson(gameStatePath);

  if (!game) {
    return null;
  }

  const playerState = game?.RemoteGame?.GameState?.Players;

  if (!playerState) {
    return null;
  }

  let gameStatus: GameState["status"] = null;
  if (game?.RemoteGame?.GameState?.Winner) {
    gameStatus = "Finished";
  }

  const cardsDrawn = game?.RemoteGame?.ClientPlayerInfo?.CardsDrawn || [];
  const deck = await getCurrentDeck(cardsDrawn);

  const gameState: GameState = {
    deck,
    status: gameStatus,
    players: [
      {
        hand: [],
        deck: [],
        graveyard: [],
      },
      {
        hand: [],
        deck: [],
        graveyard: [],
      },
    ],
  };

  for (let i = 0; i < 2; i++) {
    const player = playerState[i];

    if (!player) {
      return null;
    }

    const deck = cardMapper(player?.Deck?.Cards);
    const hand = cardMapper(player?.Hand?.Cards);
    const graveyard = cardMapper(player.Graveyard?.Cards);

    gameState.players[i] = {
      deck,
      hand,
      graveyard,
    };
  }

  return gameState;
};

export const appRouter = t.router({
  gameState: t.procedure
    .input(z.object({ path: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const state = await parsedGameState(input?.path);
      ee.emit(EVENT.GAME_STATE_CHANGE, state);
      return state;
    }),

  onGameState: t.procedure
    .input(z.object({ path: z.string().optional() }).optional())
    .subscription(({ input }) => {
      return observable<GameState>((emit) => {
        const onGameStateChange = (data: GameState) => {
          if (data) {
            emit.next(data);
          }
        };

        const gameStatePath = input?.path
          ? input.path.replace("$HOME", os.homedir()) + "GameState.json"
          : defaultFolder + "GameState.json";

        const watcher = chokidar.watch(gameStatePath, {
          ignorePermissionErrors: true,
          ignoreInitial: false,
          persistent: true,
          depth: 0,
          usePolling: true,
          interval: 3000,
          alwaysStat: true,
        });

        const sendGameState = async () => {
          try {
            const gameState = await parsedGameState(input?.path);
            if (!gameState) {
              return;
            }

            ee.emit(EVENT.GAME_STATE_CHANGE, gameState);
          } catch (error) {
            console.error(error);
          }
        };

        watcher.on("change", sendGameState);
        watcher.on("add", sendGameState);

        ee.on(EVENT.GAME_STATE_CHANGE, onGameStateChange);

        return () => {
          ee.off(EVENT.GAME_STATE_CHANGE, onGameStateChange);
          // fsWatcher.removeAllListeners();
          watcher.close();
        };
      });
    }),
});

export type AppRouter = typeof appRouter;
