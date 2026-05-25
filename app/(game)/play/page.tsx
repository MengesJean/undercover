import { listPlayers } from "@/lib/actions/players";
import { PlayClient } from "@/components/game/play-client";

export default async function PlayPage() {
  const players = await listPlayers();
  return <PlayClient knownPlayers={players} />;
}
