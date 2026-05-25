"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assignRoles, type Role } from "@/lib/game-logic";

const PALETTE = ["#FFD43B", "#FF4D6D", "#3A56F5", "#3DDC97", "#BFA6E6", "#FF8C42"];

export type StartGameInput = {
  playerNames: string[];
  numUndercover: number;
  numMrWhite: number;
};

export type StartedGame = {
  gameId: string;
  pair: { civilianWord: string; undercoverWord: string };
  roster: {
    playerId: string;
    name: string;
    color: string;
    role: Role;
    word: string | null;
  }[];
};

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  return session.user.id;
}

/**
 * Start a new game: pick a word pair, upsert the player profiles, assign
 * roles, persist Game + GameParticipant + UsedWordPair in a single transaction.
 * Returns everything the client needs to drive the reveal/play screens.
 */
export async function startGame(input: StartGameInput): Promise<StartedGame> {
  const userId = await requireUserId();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  // 1. Pick the word pair, filtered by usedPairs when noRepeat is on.
  const used = await prisma.usedWordPair.findMany({
    where: { userId },
    select: { wordPairId: true },
  });
  const usedIds = used.map((u) => u.wordPairId);

  let pair = null;
  if (user.noRepeat && usedIds.length > 0) {
    pair = await prisma.wordPair.findFirst({
      where: { id: { notIn: usedIds } },
      orderBy: { id: "asc" },
      // simple random pick via offset
      skip: Math.floor(
        Math.random() *
          Math.max(1, await prisma.wordPair.count({
            where: { id: { notIn: usedIds } },
          })),
      ),
    });
  }
  if (!pair) {
    // Either noRepeat is off, or all pairs exhausted → fall back to all.
    const total = await prisma.wordPair.count();
    if (total === 0) throw new Error("NO_WORD_PAIRS");
    pair = await prisma.wordPair.findFirst({
      orderBy: { id: "asc" },
      skip: Math.floor(Math.random() * total),
    });
  }
  if (!pair) throw new Error("NO_WORD_PAIRS");

  // 2. Assign roles server-side.
  const assigned = assignRoles(
    input.playerNames,
    pair.civilianWord,
    pair.undercoverWord,
    input.numUndercover,
    input.numMrWhite,
  );

  // 3. Upsert player profiles + create game + participants + record usage.
  const players = await Promise.all(
    input.playerNames.map((name, i) =>
      prisma.player.upsert({
        where: { ownerId_name: { ownerId: userId, name } },
        update: {},
        create: {
          ownerId: userId,
          name,
          color: PALETTE[i % PALETTE.length],
          isOwner: false,
        },
      }),
    ),
  );

  const game = await prisma.game.create({
    data: {
      hostUserId: userId,
      wordPairId: pair.id,
      participants: {
        create: assigned.map((r, i) => ({
          playerId: players[i].id,
          role: r.role,
        })),
      },
    },
    include: { participants: true },
  });

  // Always record usage (toggle controls reading, not writing — see plan hyp. #1).
  await prisma.usedWordPair.upsert({
    where: { userId_wordPairId: { userId, wordPairId: pair.id } },
    update: {},
    create: { userId, wordPairId: pair.id },
  });

  return {
    gameId: game.id,
    pair: { civilianWord: pair.civilianWord, undercoverWord: pair.undercoverWord },
    roster: assigned.map((r, i) => ({
      playerId: players[i].id,
      name: r.name,
      color: players[i].color,
      role: r.role,
      word: r.word,
    })),
  };
}

export type EliminationInput = {
  gameId: string;
  playerId: string;
  round: number;
};

export async function recordElimination(input: EliminationInput): Promise<void> {
  const userId = await requireUserId();
  const game = await prisma.game.findUnique({ where: { id: input.gameId } });
  if (!game || game.hostUserId !== userId) throw new Error("FORBIDDEN");
  await prisma.gameParticipant.update({
    where: {
      gameId_playerId: { gameId: input.gameId, playerId: input.playerId },
    },
    data: { wasEliminated: true, eliminationRound: input.round },
  });
}

export async function recordGameWinner(input: {
  gameId: string;
  winner: "civils" | "imposteurs";
}): Promise<void> {
  const userId = await requireUserId();
  const game = await prisma.game.findUnique({ where: { id: input.gameId } });
  if (!game || game.hostUserId !== userId) throw new Error("FORBIDDEN");
  await prisma.game.update({
    where: { id: input.gameId },
    data: { winner: input.winner, finishedAt: new Date() },
  });
}
