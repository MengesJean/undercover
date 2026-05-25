"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  return session.user.id;
}

export type PlayerSuggestion = {
  id: string;
  name: string;
  color: string;
  isOwner: boolean;
};

/** All player profiles for the connected user (host + saved guests). */
export async function listPlayers(): Promise<PlayerSuggestion[]> {
  const userId = await requireUserId();
  return prisma.player.findMany({
    where: { ownerId: userId },
    orderBy: [{ isOwner: "desc" }, { name: "asc" }],
    select: { id: true, name: true, color: true, isOwner: true },
  });
}

export type PlayerHistory = {
  id: string;
  name: string;
  color: string;
  isOwner: boolean;
  played: number;
  wins: number;
  undercover: number;
  mrWhite: number;
};

/** Aggregate stats per player profile for the History screen. */
export async function listPlayersWithStats(): Promise<PlayerHistory[]> {
  const userId = await requireUserId();

  const players = await prisma.player.findMany({
    where: { ownerId: userId },
    include: {
      games: {
        include: { game: { select: { winner: true, finishedAt: true } } },
      },
    },
    orderBy: [{ isOwner: "desc" }, { name: "asc" }],
  });

  return players.map((p) => {
    const finished = p.games.filter((g) => g.game.finishedAt);
    const played = finished.length;
    const undercover = finished.filter((g) => g.role === "under").length;
    const mrWhite = finished.filter((g) => g.role === "white").length;
    const wins = finished.filter((g) => {
      const isImpostor = g.role === "under" || g.role === "white";
      return isImpostor
        ? g.game.winner === "imposteurs"
        : g.game.winner === "civils";
    }).length;
    return {
      id: p.id,
      name: p.name,
      color: p.color,
      isOwner: p.isOwner,
      played,
      wins,
      undercover,
      mrWhite,
    };
  });
}

/** Stats for the connected user's own "isOwner" player profile (Home + Profile). */
export async function getOwnerStats(): Promise<{
  played: number;
  wins: number;
  undercover: number;
}> {
  const userId = await requireUserId();
  const me = await prisma.player.findFirst({
    where: { ownerId: userId, isOwner: true },
    include: {
      games: {
        include: { game: { select: { winner: true, finishedAt: true } } },
      },
    },
  });
  if (!me) return { played: 0, wins: 0, undercover: 0 };
  const finished = me.games.filter((g) => g.game.finishedAt);
  const played = finished.length;
  const undercover = finished.filter(
    (g) => g.role === "under" || g.role === "white",
  ).length;
  const wins = finished.filter((g) => {
    const isImpostor = g.role === "under" || g.role === "white";
    return isImpostor
      ? g.game.winner === "imposteurs"
      : g.game.winner === "civils";
  }).length;
  return { played, wins, undercover };
}

export async function updateOwnerColor(color: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { color } }),
    prisma.player.updateMany({
      where: { ownerId: userId, isOwner: true },
      data: { color },
    }),
  ]);
}

export async function setNoRepeat(noRepeat: boolean): Promise<void> {
  const userId = await requireUserId();
  await prisma.user.update({ where: { id: userId }, data: { noRepeat } });
}
