"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  return session.user.id;
}

export async function getWordPairStats(): Promise<{
  used: number;
  total: number;
}> {
  const userId = await requireUserId();
  const [used, total] = await Promise.all([
    prisma.usedWordPair.count({ where: { userId } }),
    prisma.wordPair.count(),
  ]);
  return { used, total };
}

export async function resetUsedPairs(): Promise<void> {
  const userId = await requireUserId();
  await prisma.usedWordPair.deleteMany({ where: { userId } });
}
