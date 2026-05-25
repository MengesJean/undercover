// Pure game logic — no DB, no auth. Shared between server and client.

export type Role = "civil" | "under" | "white";

export type AssignedRole = {
  name: string;
  role: Role;
  word: string | null; // null for Mr. White
};

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Assign roles to players.
 *
 * `excludeIndices` lists players who should NOT be impostors this game if at
 * all possible (typically: people who were impostors in the last N games).
 * The impostor slots are filled from the non-excluded pool first; if there
 * aren't enough non-excluded eligible players to fill every slot, the
 * remaining slots fall back to the excluded pool so we never fail to start.
 */
export function assignRoles(
  playerNames: string[],
  civilianWord: string,
  undercoverWord: string,
  numUndercover: number,
  numMrWhite: number,
  excludeIndices: number[] = [],
): AssignedRole[] {
  if (playerNames.length < 3) {
    throw new Error("At least 3 players are required");
  }
  if (numUndercover + numMrWhite < 1) {
    throw new Error("At least 1 impostor (undercover or Mr. White) is required");
  }
  if (numUndercover + numMrWhite >= playerNames.length) {
    throw new Error("Too many impostors for the player count");
  }

  const numImpostors = numUndercover + numMrWhite;
  const allIndices = playerNames.map((_, i) => i);
  const excluded = new Set(excludeIndices);
  const preferred = shuffle(allIndices.filter((i) => !excluded.has(i)));
  const fallback = shuffle(allIndices.filter((i) => excluded.has(i)));

  // Fill impostor slots from the preferred pool first; spill to fallback only
  // when the preferred pool runs short.
  const impostors = shuffle([...preferred, ...fallback].slice(0, numImpostors));
  const underSet = new Set(impostors.slice(0, numUndercover));
  const whiteSet = new Set(
    impostors.slice(numUndercover, numUndercover + numMrWhite),
  );

  return playerNames.map((name, i) => {
    if (whiteSet.has(i))
      return { name, role: "white" as const, word: null };
    if (underSet.has(i))
      return { name, role: "under" as const, word: undercoverWord };
    return { name, role: "civil" as const, word: civilianWord };
  });
}

export type WinCheck = {
  winner: "civils" | "imposteurs" | null;
  gameOver: boolean;
};

export function checkWinCondition(
  roster: { role: Role }[],
  alive: boolean[],
): WinCheck {
  const remaining = roster.filter((_, i) => alive[i]);
  const undersAlive = remaining.filter((p) => p.role === "under").length;
  const whitesAlive = remaining.filter((p) => p.role === "white").length;
  const civsAlive = remaining.filter((p) => p.role === "civil").length;
  if (undersAlive === 0 && whitesAlive === 0)
    return { winner: "civils", gameOver: true };
  if (undersAlive + whitesAlive >= civsAlive)
    return { winner: "imposteurs", gameOver: true };
  return { winner: null, gameOver: false };
}
