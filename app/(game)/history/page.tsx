import { Screen, TopBar, Sticker } from "@/components/ui";
import { SparkleIcon, MaskIcon } from "@/components/ui/icons";
import { listPlayersWithStats } from "@/lib/actions/players";

export default async function HistoryPage() {
  const players = await listPlayersWithStats();
  const totalGames = players.reduce((sum, p) => sum + p.played, 0);

  return (
    <Screen label="10 Historique">
      <TopBar title="Historique" backHref="/home" />

      <div className="flex-1 overflow-auto px-5 pb-8">
        <Sticker bg="var(--color-blue-dim)" rot={-3} className="self-start" color="var(--color-text)">
          <SparkleIcon color="var(--color-text)" />
          {totalGames} {totalGames > 1 ? "parties jouées" : "partie jouée"}
        </Sticker>

        <h2 className="mb-5 mt-3 font-display text-[40px] font-extrabold leading-none tracking-[-1.6px]">
          Tes
          <br />
          <span style={{ color: "var(--color-primary)" }}>compagnons</span>
          <span style={{ color: "var(--color-lemon)" }}>.</span>
        </h2>

        {players.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {players.map((p) => (
              <PlayerCard key={p.id} {...p} />
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
}

function PlayerCard({
  name,
  color,
  isOwner,
  played,
  wins,
  undercover,
  mrWhite,
}: {
  name: string;
  color: string;
  isOwner: boolean;
  played: number;
  wins: number;
  undercover: number;
  mrWhite: number;
}) {
  const imposterCount = undercover + mrWhite;
  return (
    <div
      className="flex items-center gap-4 rounded-[20px] bg-[var(--color-surface)] p-4"
      style={{
        border: "2px solid var(--color-text)",
        boxShadow: "4px 4px 0 var(--color-text)",
      }}
    >
      <div
        className="flex h-[58px] w-[58px] flex-shrink-0 items-center justify-center rounded-full font-display text-[24px] font-extrabold text-[var(--color-text)]"
        style={{
          background: color,
          border: "2px solid var(--color-text)",
        }}
      >
        {name[0].toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate text-[17px] font-bold text-[var(--color-text)]">
            {name}
          </div>
          {isOwner && (
            <span
              className="rounded-full px-2 py-[2px] text-[10px] font-extrabold uppercase tracking-[0.6px]"
              style={{
                background: "var(--color-lemon)",
                color: "var(--color-text)",
                border: "1px solid var(--color-text)",
              }}
            >
              Toi
            </span>
          )}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-[12px] font-bold text-[var(--color-sub)]">
          <Stat label="Parties" value={played} />
          <Stat label="Victoires" value={wins} color="var(--color-mint)" />
          <Stat label="Imposteur" value={imposterCount} color="var(--color-primary)" icon={<MaskIcon color="var(--color-primary)" />} />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color = "var(--color-text)",
  icon,
}: {
  label: string;
  value: number;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-[2px]">
      <div className="flex items-center gap-1">
        {icon}
        <span className="font-display text-[20px] font-extrabold leading-none" style={{ color }}>
          {value}
        </span>
      </div>
      <span className="text-[10px] uppercase tracking-[0.5px]">{label}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-[20px] bg-[var(--color-surface)] px-6 py-10 text-center"
      style={{
        border: "1.5px dashed var(--color-line)",
      }}
    >
      <div className="text-[40px]">🎲</div>
      <div className="font-display text-[20px] font-bold text-[var(--color-text)]">
        Pas encore de partie
      </div>
      <p className="m-0 max-w-[260px] text-[14px] font-medium text-[var(--color-sub)]">
        Lance une partie depuis l&apos;accueil pour commencer à construire ton
        historique.
      </p>
    </div>
  );
}
