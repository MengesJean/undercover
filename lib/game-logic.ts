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

export function assignRoles(
  playerNames: string[],
  civilianWord: string,
  undercoverWord: string,
  numUndercover: number,
  numMrWhite: number,
): AssignedRole[] {
  if (playerNames.length < 3) {
    throw new Error("At least 3 players are required");
  }
  if (numUndercover < 1) {
    throw new Error("At least 1 undercover is required");
  }
  if (numUndercover + numMrWhite >= playerNames.length) {
    throw new Error("Too many impostors for the player count");
  }

  const indices = shuffle(playerNames.map((_, i) => i));
  const underSet = new Set(indices.slice(0, numUndercover));
  const whiteSet = new Set(
    indices.slice(numUndercover, numUndercover + numMrWhite),
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
