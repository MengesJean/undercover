"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Screen,
  TopBar,
  PrimaryButton,
  Sticker,
} from "@/components/ui";
import { PlusIcon, XIcon, InfoIcon, TrophyIcon } from "@/components/ui/icons";
import { RolePicker } from "@/components/ui/role-picker";
import {
  startGame,
  recordElimination,
  recordGameWinner,
  type StartedGame,
  type StartGameInput,
} from "@/lib/actions/game";
import type { PlayerSuggestion } from "@/lib/actions/players";
import { checkWinCondition, shuffle } from "@/lib/game-logic";

type Phase = "configure" | "reveal" | "debate" | "vote" | "result";
type RosterEntry = StartedGame["roster"][number];
type SeriesScores = Record<string, number>;

const CHIP_FALLBACK_COLORS = [
  "#FFD43B",
  "#3DDC97",
  "#DDE2FF",
  "#FFE0E6",
  "#FFF1B8",
  "#CFF4E1",
];

export function PlayClient({
  knownPlayers,
}: {
  knownPlayers: PlayerSuggestion[];
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("configure");
  const [game, setGame] = useState<StartedGame | null>(null);
  const [gameConfig, setGameConfig] = useState<StartGameInput | null>(null);
  const [alive, setAlive] = useState<boolean[]>([]);
  const [round, setRound] = useState(1);
  const [winner, setWinner] = useState<"civils" | "imposteurs" | null>(null);
  const [lastResult, setLastResult] = useState<
    { eliminatedIdx: number | null; tie: boolean } | null
  >(null);
  // Cumulative wins across consecutive games with the same roster.
  const [seriesScores, setSeriesScores] = useState<SeriesScores>({});
  const [seriesGames, setSeriesGames] = useState(0);
  const [replayPending, setReplayPending] = useState(false);

  const startSeriesGame = (g: StartedGame, cfg: StartGameInput) => {
    setGame(g);
    setGameConfig(cfg);
    setAlive(g.roster.map(() => true));
    setRound(1);
    setLastResult(null);
    setWinner(null);
    setPhase("reveal");
  };

  const handleReplay = async () => {
    if (!gameConfig || replayPending) return;
    setReplayPending(true);
    try {
      const result = await startGame(gameConfig);
      startSeriesGame(result, gameConfig);
    } catch (e) {
      console.error("Failed to restart game", e);
    } finally {
      setReplayPending(false);
    }
  };

  if (phase === "configure") {
    return (
      <ConfigureScreen
        knownPlayers={knownPlayers}
        onStarted={(g, cfg) => {
          // Brand-new series — reset cumulative scores.
          setSeriesScores({});
          setSeriesGames(0);
          startSeriesGame(g, cfg);
        }}
        onCancel={() => router.push("/home")}
      />
    );
  }
  if (!game) return null;

  if (phase === "reveal") {
    return (
      <RevealScreen
        roster={game.roster}
        onBack={() => setPhase("configure")}
        onDone={() => setPhase("debate")}
      />
    );
  }

  if (phase === "debate") {
    return (
      <DebateScreen
        roster={game.roster}
        alive={alive}
        round={round}
        onBack={() => setPhase("reveal")}
        onVote={() => setPhase("vote")}
      />
    );
  }

  if (phase === "vote") {
    return (
      <VoteScreen
        roster={game.roster}
        alive={alive}
        round={round}
        onBack={() => setPhase("debate")}
        onResult={async ({ eliminatedIdx, tie }) => {
          setLastResult({ eliminatedIdx, tie });
          if (tie || eliminatedIdx === null) {
            setPhase("result");
            return;
          }
          const newAlive = [...alive];
          newAlive[eliminatedIdx] = false;
          const win = checkWinCondition(game.roster, newAlive);
          // Update UI synchronously *before* any await — otherwise VoteScreen
          // re-renders with the shrunken aliveList while `voterPos` is stale.
          setAlive(newAlive);
          setWinner(win.winner);
          setPhase("result");
          if (win.gameOver && win.winner) {
            // Award a point to every player on the winning team.
            const winningTeam = win.winner;
            setSeriesScores((prev) => {
              const next = { ...prev };
              game.roster.forEach((p) => {
                const isImpostor = p.role === "under" || p.role === "white";
                const won =
                  winningTeam === "imposteurs" ? isImpostor : !isImpostor;
                if (won) next[p.name] = (next[p.name] ?? 0) + 1;
                else if (!(p.name in next)) next[p.name] = 0;
              });
              return next;
            });
            setSeriesGames((n) => n + 1);
          }
          // Persistence is fire-and-forget after the transition.
          try {
            await recordElimination({
              gameId: game.gameId,
              playerId: game.roster[eliminatedIdx].playerId,
              round,
            });
            if (win.gameOver && win.winner) {
              await recordGameWinner({
                gameId: game.gameId,
                winner: win.winner,
              });
            }
          } catch (e) {
            console.error("Failed to persist game state", e);
          }
        }}
      />
    );
  }

  // result
  return (
    <ResultScreen
      roster={game.roster}
      eliminatedIdx={lastResult?.eliminatedIdx ?? null}
      tie={lastResult?.tie ?? false}
      gameOver={!!winner}
      winner={winner}
      seriesScores={seriesScores}
      seriesGames={seriesGames}
      replayPending={replayPending}
      onReplay={handleReplay}
      onHome={() => router.push("/home")}
      onContinue={() => {
        // Mid-game (non-gameOver) "Manche suivante" button.
        setRound(round + 1);
        setLastResult(null);
        setPhase("debate");
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// CONFIGURE
// ─────────────────────────────────────────────────────────────
function ConfigureScreen({
  knownPlayers,
  onStarted,
  onCancel,
}: {
  knownPlayers: PlayerSuggestion[];
  onStarted: (g: StartedGame, cfg: StartGameInput) => void;
  onCancel: () => void;
}) {
  const me = knownPlayers.find((p) => p.isOwner);
  const [players, setPlayers] = useState<string[]>(me ? [me.name] : []);
  const [draft, setDraft] = useState("");
  const [numUndercover, setNumUndercover] = useState(1);
  const [numMrWhite, setNumMrWhite] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    const q = draft.trim().toLowerCase();
    if (!q) return [];
    return knownPlayers
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) && !players.includes(p.name),
      )
      .slice(0, 5);
  }, [draft, knownPlayers, players]);

  const add = (name?: string) => {
    const v = (name ?? draft).trim();
    if (!v || players.length >= 20 || players.includes(v)) return;
    setPlayers([...players, v]);
    setDraft("");
    inputRef.current?.focus();
  };
  const remove = (i: number) =>
    setPlayers(players.filter((_, idx) => idx !== i));

  const maxUnder = Math.max(0, Math.floor((players.length - 1) / 2));
  const canStart = players.length >= 3 && numUndercover >= 1;

  const colorFor = (name: string, i: number) => {
    const known = knownPlayers.find((p) => p.name === name);
    return known?.color ?? CHIP_FALLBACK_COLORS[i % CHIP_FALLBACK_COLORS.length];
  };

  const handleStart = () => {
    if (!canStart) return;
    setError(null);
    startTransition(async () => {
      try {
        const cfg: StartGameInput = {
          playerNames: players,
          numUndercover,
          numMrWhite,
        };
        const result = await startGame(cfg);
        onStarted(result, cfg);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur inconnue");
      }
    });
  };

  return (
    <Screen label="02 Configuration">
      <TopBar title="Configuration" onBack={onCancel} />

      <div className="flex-1 overflow-auto px-5 pb-6 pt-1">
        <h2 className="m-0 mb-[22px] font-display text-[40px] font-extrabold leading-none tracking-[-1.6px]">
          Qui joue
          <br />
          <span style={{ color: "var(--color-primary)" }}>ce soir</span>
          <span style={{ color: "var(--color-lemon)" }}>?</span>
        </h2>

        {/* input */}
        <div
          className="relative mb-4 flex h-[56px] items-center gap-2 rounded-[18px] bg-[var(--color-surface)] py-[5px] pl-[18px] pr-[5px]"
          style={{
            border: "1.5px solid var(--color-line)",
            boxShadow: "0 2px 0 rgba(26,20,24,0.04)",
          }}
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (suggestions.length > 0) add(suggestions[0].name);
                else add();
              }
            }}
            placeholder="Nom du joueur"
            className="flex-1 border-none bg-transparent font-display text-[16px] font-medium text-[var(--color-text)] outline-none"
          />
          <button
            onClick={() => add()}
            className="flex h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-[14px] border-none bg-[var(--color-text)] text-white"
            style={{ boxShadow: "0 2px 0 rgba(0,0,0,0.2)" }}
            aria-label="Ajouter le joueur"
          >
            <PlusIcon color="#FFFFFF" />
          </button>

          {suggestions.length > 0 && (
            <div
              className="absolute left-0 right-0 top-[60px] z-10 flex flex-col gap-1 overflow-hidden rounded-[14px] bg-[var(--color-surface)] p-2"
              style={{
                border: "1.5px solid var(--color-line)",
                boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
              }}
            >
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => add(s.name)}
                  className="flex cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2 text-left hover:bg-[var(--color-bg)]"
                >
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full font-display text-[13px] font-extrabold text-[var(--color-text)]"
                    style={{
                      background: s.color,
                      border: "1.5px solid var(--color-text)",
                    }}
                  >
                    {s.name[0]}
                  </div>
                  <span className="text-[15px] font-semibold text-[var(--color-text)]">
                    {s.name}
                  </span>
                  {s.isOwner && (
                    <span
                      className="ml-auto rounded-full px-2 py-[2px] text-[10px] font-extrabold uppercase tracking-[0.6px]"
                      style={{
                        background: "var(--color-lemon)",
                        color: "var(--color-text)",
                      }}
                    >
                      Toi
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* chips */}
        <div className="mb-6 flex flex-wrap gap-2">
          {players.map((p, i) => (
            <div
              key={p}
              className="flex h-[38px] items-center gap-2 rounded-[19px] pl-[14px] pr-[6px] text-[14px] font-bold"
              style={{
                background: colorFor(p, i),
                border: "1.5px solid var(--color-text)",
                boxShadow: "2px 2px 0 var(--color-text)",
              }}
            >
              <span>{p}</span>
              <button
                onClick={() => remove(i)}
                className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-none"
                style={{ background: "rgba(26,20,24,0.12)" }}
                aria-label={`Retirer ${p}`}
              >
                <XIcon color="var(--color-text)" />
              </button>
            </div>
          ))}
          {players.length < 3 && (
            <div className="px-1 py-[10px] text-[13px] font-medium text-[var(--color-sub)]">
              Ajoute encore {3 - players.length} joueur(s).
            </div>
          )}
        </div>

        {/* roles */}
        <div className="mb-[10px] text-[12px] font-extrabold uppercase tracking-[1.2px] text-[var(--color-sub)]">
          Rôles secrets
        </div>

        <RolePicker
          color="var(--color-primary)"
          colorDim="var(--color-primary-dim)"
          icon="mask"
          label="Undercover"
          subtitle="Un mot différent, mais proche"
          value={numUndercover}
          onChange={setNumUndercover}
          min={1}
          max={Math.max(1, maxUnder)}
        />
        <div className="h-[10px]" />
        <RolePicker
          color="var(--color-blue)"
          colorDim="var(--color-blue-dim)"
          icon="shield"
          label="Mr. White"
          subtitle="Aucun mot — doit improviser"
          value={numMrWhite}
          onChange={setNumMrWhite}
          min={0}
          max={Math.max(0, players.length - 2 - numUndercover)}
        />

        {/* summary */}
        <div
          className="mt-[22px] flex items-center justify-between rounded-[18px] bg-[var(--color-surface)] px-[18px] py-4"
          style={{
            border: "1.5px solid var(--color-line)",
            boxShadow: "0 2px 0 rgba(26,20,24,0.04)",
          }}
        >
          <Sum
            n={Math.max(0, players.length - numUndercover - numMrWhite)}
            label="Civils"
            color="var(--color-text)"
          />
          <div className="h-9 w-[1.5px] bg-[var(--color-line)]" />
          <Sum
            n={numUndercover}
            label="Undercover"
            color="var(--color-primary)"
          />
          <div className="h-9 w-[1.5px] bg-[var(--color-line)]" />
          <Sum n={numMrWhite} label="Mr. White" color="var(--color-blue)" />
        </div>

        {error && (
          <div className="mt-4 rounded-[14px] bg-[var(--color-primary-dim)] p-3 text-[13px] font-bold text-[var(--color-primary-deep)]">
            {error}
          </div>
        )}
      </div>

      <div
        className="flex-shrink-0 bg-[var(--color-bg)] px-5 pb-[34px] pt-3"
        style={{ borderTop: "1.5px solid var(--color-line-soft)" }}
      >
        <PrimaryButton disabled={!canStart || pending} onClick={handleStart}>
          {pending ? "Distribution…" : "Distribuer les cartes"}
        </PrimaryButton>
      </div>
    </Screen>
  );
}

function Sum({
  n,
  label,
  color,
}: {
  n: number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex-1 text-center">
      <div className="text-[11px] font-bold uppercase tracking-[0.5px] text-[var(--color-sub)]">
        {label}
      </div>
      <div
        className="mt-1 font-display text-[28px] font-extrabold leading-none"
        style={{ color }}
      >
        {n}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// REVEAL — pass and play, flip card
// ─────────────────────────────────────────────────────────────
function RevealScreen({
  roster,
  onBack,
  onDone,
}: {
  roster: RosterEntry[];
  onBack: () => void;
  onDone: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [seen, setSeen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const player = roster[idx];
  const isLast = idx === roster.length - 1;

  const next = () => {
    if (transitioning) return;
    if (isLast) {
      onDone();
      return;
    }
    // Flip the card back first, then swap to the next player AFTER the flip
    // animation finishes — otherwise the new player's role briefly shows
    // through the rotating backface.
    setTransitioning(true);
    setFlipped(false);
    setTimeout(() => {
      setIdx((i) => i + 1);
      setSeen(false);
      setTransitioning(false);
    }, 700);
  };

  return (
    <Screen label="03 Distribution">
      <TopBar
        title="Distribution"
        onBack={onBack}
        right={
          <div className="font-mono text-[12px] font-semibold text-[var(--color-sub)]">
            {String(idx + 1).padStart(2, "0")}/
            {String(roster.length).padStart(2, "0")}
          </div>
        }
      />

      <div className="flex flex-1 flex-col px-6 pt-1">
        <div className="mb-3 text-center">
          <div className="text-[12px] font-extrabold uppercase tracking-[1.4px] text-[var(--color-sub)]">
            Téléphone à
          </div>
          <h2 className="m-0 mt-1 font-display text-[44px] font-extrabold leading-[1.05] tracking-[-1.5px] text-[var(--color-text)]">
            {player.name}
          </h2>
        </div>

        {/* progress dots */}
        <div className="mb-4 flex justify-center gap-[5px]">
          {roster.map((_, i) => (
            <div
              key={i}
              className="h-2 rounded-[4px] transition-all duration-300"
              style={{
                width: i === idx ? 22 : 8,
                background:
                  i <= idx ? "var(--color-primary)" : "var(--color-line-soft)",
              }}
            />
          ))}
        </div>

        {/* card */}
        <div className="flip-perspective flex flex-1 items-center justify-center">
          <div
            onClick={() => {
              if (!seen && !transitioning) {
                setFlipped(true);
                setSeen(true);
              }
            }}
            className="flip-inner relative h-[340px] w-[240px] cursor-pointer"
            style={{
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            <CardFace face="back" />
            <CardFace face="front" player={player} />
          </div>
        </div>

        <div className="mt-[14px] min-h-[44px] text-center text-[14px] font-medium text-[var(--color-sub)]">
          {!flipped && !transitioning && "👆 Touche la carte pour révéler ton mot"}
          {transitioning && "Passe le téléphone au joueur suivant…"}
          {flipped && !isLast && "Mémorise puis passe au joueur suivant"}
          {flipped && isLast && "Tous les joueurs ont leur mot !"}
        </div>
      </div>

      <div className="flex-shrink-0 px-5 pb-[34px] pt-[14px]">
        <PrimaryButton disabled={!seen || transitioning} onClick={next}>
          {isLast ? "Commencer le débat" : "Joueur suivant"}
        </PrimaryButton>
      </div>
    </Screen>
  );
}

function CardFace({
  face,
  player,
}: {
  face: "back" | "front";
  player?: RosterEntry;
}) {
  if (face === "back") {
    return (
      <div
        className="flip-face flex flex-col items-center justify-center overflow-hidden rounded-[24px] p-[22px]"
        style={{
          background: "var(--color-primary)",
          border: "3px solid var(--color-text)",
          boxShadow: "8px 8px 0 var(--color-text)",
        }}
      >
        <span className="absolute left-[18px] top-4 text-[14px] font-extrabold tracking-[2px] text-[var(--color-text)]">
          U.
        </span>
        <span
          className="absolute bottom-4 right-[18px] text-[14px] font-extrabold tracking-[2px] text-[var(--color-text)]"
          style={{ transform: "rotate(180deg)" }}
        >
          U.
        </span>
        <div
          className="flex h-[130px] w-[130px] items-center justify-center rounded-full"
          style={{
            background: "var(--color-lemon)",
            border: "3px solid var(--color-text)",
          }}
        >
          <div className="font-display text-[84px] font-extrabold leading-none text-[var(--color-text)]">
            ?
          </div>
        </div>
        <div
          className="absolute bottom-[34px] rounded-full px-3 py-[6px] text-[11px] font-extrabold tracking-[2.5px] text-[var(--color-text)]"
          style={{ background: "#FFFFFF", border: "2px solid var(--color-text)" }}
        >
          TOUCHER POUR RÉVÉLER
        </div>
      </div>
    );
  }
  if (!player) return null;
  const isWhite = player.role === "white";
  const isUnder = player.role === "under";
  const roleLabel = isWhite ? "MR. WHITE" : isUnder ? "UNDERCOVER" : "CIVIL";
  const roleBg = isWhite
    ? "var(--color-blue)"
    : isUnder
      ? "var(--color-primary)"
      : "var(--color-mint)";
  const roleText = isWhite || isUnder ? "#FFFFFF" : "var(--color-text)";
  return (
    <div
      className="flip-face flip-face-back flex flex-col items-center justify-center overflow-hidden rounded-[24px] p-[22px]"
      style={{
        background: "var(--color-surface)",
        border: "3px solid var(--color-text)",
        boxShadow: "8px 8px 0 var(--color-text)",
      }}
    >
      <span
        className="absolute left-[18px] top-4 text-[14px] font-extrabold tracking-[2px]"
        style={{ color: roleBg }}
      >
        U.
      </span>
      <span
        className="absolute bottom-4 right-[18px] text-[14px] font-extrabold tracking-[2px]"
        style={{ color: roleBg, transform: "rotate(180deg)" }}
      >
        U.
      </span>
      <div
        className="mb-[22px] rounded-full px-[14px] py-[6px] text-[11px] font-extrabold tracking-[1.5px]"
        style={{
          background: roleBg,
          color: roleText,
          border: "2px solid var(--color-text)",
          boxShadow: "2px 2px 0 var(--color-text)",
        }}
      >
        {roleLabel}
      </div>
      <div className="mb-[6px] text-[12px] font-bold uppercase tracking-[0.6px] text-[var(--color-sub)]">
        Ton mot
      </div>
      {isWhite ? (
        <div className="px-2 text-center font-display text-[28px] font-bold leading-[1.1] text-[var(--color-text)]">
          aucun mot
          <br />
          <span style={{ color: "var(--color-blue)" }}>improvise !</span>
        </div>
      ) : (
        <div className="text-center font-display text-[48px] font-extrabold leading-none tracking-[-1.8px] text-[var(--color-text)]">
          {player.word}
        </div>
      )}
      <div className="flex-1" />
      <div className="text-center text-[11px] font-medium leading-[1.4] text-[var(--color-faint)]">
        🤫 Ne montre cette carte
        <br />à personne d&apos;autre.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DEBATE
// ─────────────────────────────────────────────────────────────
function DebateScreen({
  roster,
  alive,
  round,
  onBack,
  onVote,
}: {
  roster: RosterEntry[];
  alive: boolean[];
  round: number;
  onBack: () => void;
  onVote: () => void;
}) {
  // Randomise the speaking order on each new debate screen so the
  // first/last speaker advantage doesn't always fall on the same people.
  const aliveList = useMemo(
    () =>
      shuffle(
        roster
          .map((p, i) => ({ ...p, idx: i }))
          .filter((p) => alive[p.idx]),
      ),
    [roster, alive],
  );
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <Screen label="04 Débat">
      <TopBar
        title={`Manche ${String(round).padStart(2, "0")} · Débat`}
        onBack={onBack}
        right={
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)]"
            style={{ border: "1.5px solid var(--color-line)" }}
          >
            <InfoIcon color="var(--color-sub)" />
          </div>
        }
      />

      <div className="flex flex-1 flex-col overflow-auto px-5">
        <div
          className="rounded-[24px] p-[20px_22px]"
          style={{
            background: "var(--color-lemon)",
            border: "2.5px solid var(--color-text)",
            boxShadow: "4px 4px 0 var(--color-text)",
          }}
        >
          <div className="text-[11px] font-extrabold uppercase tracking-[1.6px] text-[var(--color-text)] opacity-70">
            À ton tour de parler
          </div>
          <h2 className="m-0 mt-[6px] font-display text-[38px] font-extrabold leading-none tracking-[-1.6px] text-[var(--color-text)]">
            {aliveList[activeIdx]?.name ?? "—"}
            <span style={{ color: "var(--color-primary)" }}>.</span>
          </h2>
          <div className="mt-2 text-[13px] font-medium text-[var(--color-text)] opacity-75">
            Dis <b>un seul mot</b> qui décrit ton mot — sans le révéler.
          </div>
        </div>

        <div className="mt-[22px]">
          <div className="mb-3 flex items-baseline justify-between">
            <div className="text-[12px] font-extrabold uppercase tracking-[1.2px] text-[var(--color-sub)]">
              Ordre de parole
            </div>
            <div className="text-[12px] font-semibold text-[var(--color-sub)]">
              {aliveList.length} joueurs
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {aliveList.map((p, i) => {
              const active = i === activeIdx;
              const done = i < activeIdx;
              return (
                <div
                  key={p.playerId}
                  onClick={() => setActiveIdx(i)}
                  className="flex cursor-pointer items-center gap-3 rounded-[16px] p-[12px_14px] transition-all"
                  style={{
                    background: active
                      ? "var(--color-blue-dim)"
                      : "var(--color-surface)",
                    border: `1.5px solid ${
                      active ? "var(--color-blue)" : "var(--color-line)"
                    }`,
                    boxShadow: active
                      ? "0 2px 0 var(--color-blue)"
                      : "0 2px 0 rgba(26,20,24,0.04)",
                  }}
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full font-display text-[14px] font-extrabold"
                    style={{
                      background: active
                        ? "var(--color-blue)"
                        : done
                          ? "var(--color-mint)"
                          : "var(--color-bg)",
                      color: active
                        ? "#FFFFFF"
                        : done
                          ? "var(--color-text)"
                          : "var(--color-sub)",
                      border: `1.5px solid ${
                        active
                          ? "var(--color-blue)"
                          : done
                            ? "var(--color-text)"
                            : "var(--color-line)"
                      }`,
                    }}
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  <div
                    className="flex-1 text-[16px] font-bold"
                    style={{
                      color: done
                        ? "var(--color-faint)"
                        : "var(--color-text)",
                      textDecoration: done ? "line-through" : "none",
                    }}
                  >
                    {p.name}
                  </div>
                  {active && (
                    <div
                      className="rounded-full px-[10px] py-1 text-[11px] font-extrabold tracking-[0.8px] text-white"
                      style={{ background: "var(--color-blue)" }}
                    >
                      EN COURS
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="mt-[18px] flex items-start gap-3 rounded-[16px] p-[14px_16px]"
          style={{
            background: "var(--color-mint-dim)",
            border: "1.5px solid var(--color-mint)",
          }}
        >
          <div className="mt-[1px]">
            <InfoIcon color="var(--color-text)" />
          </div>
          <div className="text-[13px] font-medium leading-[1.5] text-[var(--color-text)]">
            Chaque joueur dit <b>un seul mot</b> qui décrit son mot, sans le
            révéler. L&apos;Undercover doit bluffer.
          </div>
        </div>

        <div className="h-4" />
      </div>

      <div
        className="flex-shrink-0 bg-[var(--color-bg)] px-5 pb-[34px] pt-3"
        style={{ borderTop: "1.5px solid var(--color-line-soft)" }}
      >
        <PrimaryButton onClick={onVote}>Passer au vote</PrimaryButton>
      </div>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// VOTE
// ─────────────────────────────────────────────────────────────
function VoteScreen({
  roster,
  alive,
  round,
  onBack,
  onResult,
}: {
  roster: RosterEntry[];
  alive: boolean[];
  round: number;
  onBack: () => void;
  onResult: (r: { eliminatedIdx: number | null; tie: boolean }) => void;
}) {
  const aliveList = roster
    .map((p, i) => ({ ...p, idx: i }))
    .filter((p) => alive[p.idx]);
  const [votes, setVotes] = useState<Record<number, number>>({});
  const [voterPos, setVoterPos] = useState(0);

  const voter = aliveList[voterPos];
  const isLast = voterPos === aliveList.length - 1;

  const tally = useMemo(() => {
    const m: Record<number, number> = {};
    Object.values(votes).forEach((t) => {
      m[t] = (m[t] || 0) + 1;
    });
    return m;
  }, [votes]);

  if (!voter) return null;

  const vote = (targetIdx: number) => {
    const newVotes = { ...votes, [voter.idx]: targetIdx };
    setVotes(newVotes);
    if (isLast) {
      const finalTally: Record<number, number> = {};
      Object.values(newVotes).forEach((t) => {
        finalTally[t] = (finalTally[t] || 0) + 1;
      });
      let max = 0;
      let winnerIdx: number | null = null;
      let tie = false;
      Object.entries(finalTally).forEach(([k, v]) => {
        if (v > max) {
          max = v;
          winnerIdx = Number(k);
          tie = false;
        } else if (v === max) {
          tie = true;
        }
      });
      setTimeout(
        () => onResult({ eliminatedIdx: tie ? null : winnerIdx, tie }),
        350,
      );
    } else {
      setTimeout(() => setVoterPos(voterPos + 1), 250);
    }
  };

  return (
    <Screen label="05 Vote">
      <TopBar
        title={`Manche ${String(round).padStart(2, "0")} · Vote`}
        onBack={onBack}
        right={
          <div className="font-mono text-[12px] font-semibold text-[var(--color-sub)]">
            {voterPos + 1}/{aliveList.length}
          </div>
        }
      />

      <div className="flex-shrink-0 px-6 pb-[14px] pt-1 text-center">
        <div className="text-[12px] font-extrabold uppercase tracking-[1.5px] text-[var(--color-sub)]">
          Vote de
        </div>
        <h2 className="m-0 mt-1 font-display text-[42px] font-extrabold leading-[1.05] tracking-[-1.5px] text-[var(--color-text)]">
          {voter?.name}
        </h2>
        <div className="mt-2 text-[14px] font-medium text-[var(--color-sub)]">
          Qui est{" "}
          <span className="font-extrabold" style={{ color: "var(--color-primary)" }}>
            l&apos;Undercover
          </span>{" "}
          selon toi ?
        </div>
      </div>

      <div className="flex-1 overflow-auto px-5 pb-5 pt-1">
        <div className="flex flex-col gap-2">
          {aliveList
            .filter((p) => p.idx !== voter.idx)
            .map((p) => {
              const count = tally[p.idx] || 0;
              const isSelected = votes[voter.idx] === p.idx;
              return (
                <button
                  key={p.playerId}
                  onClick={() => vote(p.idx)}
                  className="flex cursor-pointer items-center gap-[14px] rounded-[18px] p-[14px_16px] text-left font-display text-[var(--color-text)] transition-all"
                  style={{
                    background: isSelected
                      ? "var(--color-primary-dim)"
                      : "var(--color-surface)",
                    border: `1.5px solid ${
                      isSelected
                        ? "var(--color-primary)"
                        : "var(--color-line)"
                    }`,
                    boxShadow: isSelected
                      ? "0 2px 0 var(--color-primary)"
                      : "0 2px 0 rgba(26,20,24,0.04)",
                  }}
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full font-display text-[18px] font-extrabold"
                    style={{
                      background: p.color,
                      color: "var(--color-text)",
                      border: "1.5px solid var(--color-text)",
                    }}
                  >
                    {p.name[0]}
                  </div>
                  <div className="flex-1 text-[17px] font-bold">{p.name}</div>
                  {count > 0 && (
                    <div
                      className="flex items-center gap-[6px] rounded-[10px] px-[10px] py-1"
                      style={{
                        background: "var(--color-bg)",
                        border: "1px solid var(--color-line)",
                      }}
                    >
                      <div className="flex gap-[2px]">
                        {Array.from({ length: count }).map((_, i) => (
                          <div
                            key={i}
                            className="h-[14px] w-[6px] rounded-[1px]"
                            style={{ background: "var(--color-primary)" }}
                          />
                        ))}
                      </div>
                      <div className="font-mono text-[12px] font-semibold text-[var(--color-sub)]">
                        {count}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
        </div>

        <div
          className="mt-[18px] rounded-[14px] p-[12px_14px] text-center text-[12px] font-semibold leading-[1.5] text-[var(--color-text)]"
          style={{
            background: "var(--color-lemon-dim)",
            border: "1.5px solid var(--color-lemon)",
          }}
        >
          🤫 Passe le téléphone après ton vote.
        </div>
      </div>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// RESULT
// ─────────────────────────────────────────────────────────────
function ResultScreen({
  roster,
  eliminatedIdx,
  tie,
  gameOver,
  winner,
  seriesScores,
  seriesGames,
  replayPending,
  onReplay,
  onContinue,
  onHome,
}: {
  roster: RosterEntry[];
  eliminatedIdx: number | null;
  tie: boolean;
  gameOver: boolean;
  winner: "civils" | "imposteurs" | null;
  seriesScores: SeriesScores;
  seriesGames: number;
  replayPending: boolean;
  onReplay: () => void;
  onContinue: () => void;
  onHome: () => void;
}) {
  const elim = eliminatedIdx != null ? roster[eliminatedIdx] : null;
  const roleLabel = elim?.role === "under"
    ? "UNDERCOVER"
    : elim?.role === "white"
      ? "MR. WHITE"
      : "CIVIL";
  const roleBg = elim?.role === "under"
    ? "var(--color-primary)"
    : elim?.role === "white"
      ? "var(--color-blue)"
      : "var(--color-mint)";
  const roleText = elim?.role === "civil" ? "var(--color-text)" : "#FFFFFF";

  if (gameOver && winner) {
    const winLabel = winner === "civils" ? "Les Civils" : "Les Imposteurs";
    const ranking = roster
      .map((p) => ({
        playerId: p.playerId,
        name: p.name,
        color: p.color,
        score: seriesScores[p.name] ?? 0,
      }))
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    const topScore = ranking[0]?.score ?? 0;

    return (
      <Screen label="07 Fin de partie">
        <TopBar title="Fin de partie" />
        <div className="flex flex-1 flex-col overflow-auto px-6 pt-2 text-center">
          <div className="flex flex-col items-center">
            <div
              className="mb-4 flex h-[88px] w-[88px] items-center justify-center rounded-full"
              style={{
                background: "var(--color-lemon)",
                border: "2.5px solid var(--color-text)",
                boxShadow: "4px 4px 0 var(--color-text)",
              }}
            >
              <TrophyIcon color="var(--color-text)" />
            </div>
            <Sticker bg="var(--color-primary)" color="#FFFFFF" rot={-3}>
              🎉 Victoire
            </Sticker>
            <h2 className="m-0 mb-2 mt-[12px] font-display text-[44px] font-extrabold leading-[0.95] tracking-[-1.8px]">
              <span style={{ color: "var(--color-primary)" }}>{winLabel}</span>
              <br />
              l&apos;emportent
            </h2>
          </div>

          <div className="mt-6 text-left">
            <div className="mb-3 flex items-baseline justify-between">
              <div className="text-[12px] font-extrabold uppercase tracking-[1.2px] text-[var(--color-sub)]">
                Classement
              </div>
              <div className="font-mono text-[12px] font-semibold text-[var(--color-sub)]">
                {seriesGames} {seriesGames > 1 ? "parties" : "partie"}
              </div>
            </div>
            <div
              className="overflow-hidden rounded-[18px] bg-[var(--color-surface)]"
              style={{
                border: "2px solid var(--color-text)",
                boxShadow: "4px 4px 0 var(--color-text)",
              }}
            >
              {ranking.map((p, i) => {
                const isLeader = p.score > 0 && p.score === topScore;
                return (
                  <div
                    key={p.playerId}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{
                      borderTop:
                        i === 0 ? "none" : "1.5px solid var(--color-line)",
                      background: isLeader
                        ? "var(--color-lemon-dim)"
                        : "transparent",
                    }}
                  >
                    <div className="w-6 font-mono text-[14px] font-bold text-[var(--color-sub)]">
                      {i + 1}.
                    </div>
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-display text-[15px] font-extrabold text-[var(--color-text)]"
                      style={{
                        background: p.color,
                        border: "1.5px solid var(--color-text)",
                      }}
                    >
                      {p.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 text-[16px] font-bold text-[var(--color-text)]">
                      {p.name}
                    </div>
                    <div
                      className="font-display text-[22px] font-extrabold leading-none"
                      style={{
                        color: isLeader
                          ? "var(--color-primary)"
                          : "var(--color-text)",
                      }}
                    >
                      {p.score}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="h-6" />
        </div>
        <div className="flex flex-shrink-0 flex-col gap-[10px] px-5 pb-[34px] pt-2">
          <PrimaryButton onClick={onReplay} disabled={replayPending}>
            {replayPending
              ? "Préparation…"
              : "Rejouer avec les mêmes joueurs"}
          </PrimaryButton>
          <button
            onClick={onHome}
            className="h-[54px] w-full cursor-pointer rounded-[18px] bg-[var(--color-surface)] font-display text-[15px] font-semibold text-[var(--color-text)]"
            style={{
              border: "1.5px solid var(--color-line)",
              boxShadow: "0 2px 0 rgba(26,20,24,0.04)",
            }}
          >
            Retour accueil
          </button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen label="06 Élimination">
      <TopBar title="Élimination" />
      <div className="flex flex-1 flex-col px-6">
        {tie ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Sticker bg="var(--color-lemon)" rot={-4}>
              🤝 Égalité
            </Sticker>
            <h2 className="m-0 mb-3 mt-[14px] font-display text-[46px] font-extrabold leading-none tracking-[-2px]">
              Personne n&apos;est
              <br />
              <span style={{ color: "var(--color-primary)" }}>éliminé</span>
            </h2>
            <p className="max-w-[260px] text-[15px] font-medium text-[var(--color-sub)]">
              Le vote est à égalité. On reprend la manche.
            </p>
          </div>
        ) : (
          elim && (
            <>
              <div className="mt-1 text-center">
                <Sticker bg="var(--color-text)" color="#FFFFFF" rot={-3}>
                  💥 Éliminé
                </Sticker>
                <h2 className="m-0 mb-4 mt-3 font-display text-[48px] font-extrabold leading-[1.05] tracking-[-1.8px] text-[var(--color-text)]">
                  {elim.name}
                </h2>
              </div>

              <div className="flex flex-1 items-center justify-center">
                <div
                  className="relative box-border flex h-[308px] w-[220px] flex-col items-center justify-center rounded-[24px] p-[22px]"
                  style={{
                    background: "var(--color-surface)",
                    border: "3px solid var(--color-text)",
                    boxShadow: "8px 8px 0 var(--color-text)",
                  }}
                >
                  <span
                    className="absolute left-[18px] top-4 text-[14px] font-extrabold tracking-[2px]"
                    style={{ color: roleBg }}
                  >
                    U.
                  </span>
                  <span
                    className="absolute bottom-4 right-[18px] text-[14px] font-extrabold tracking-[2px]"
                    style={{ color: roleBg, transform: "rotate(180deg)" }}
                  >
                    U.
                  </span>
                  <div
                    className="mb-[18px] rounded-full px-[14px] py-[6px] text-[11px] font-extrabold tracking-[1.5px]"
                    style={{
                      background: roleBg,
                      color: roleText,
                      border: "2px solid var(--color-text)",
                      boxShadow: "2px 2px 0 var(--color-text)",
                    }}
                  >
                    {roleLabel}
                  </div>
                  <div className="mb-1 text-[12px] font-bold uppercase tracking-[0.6px] text-[var(--color-sub)]">
                    Mot
                  </div>
                  <div className="text-center font-display text-[42px] font-extrabold leading-none tracking-[-1.5px] text-[var(--color-text)]">
                    {elim.word ?? (
                      <span style={{ color: "var(--color-faint)" }}>aucun</span>
                    )}
                  </div>
                </div>
              </div>

              <div
                className="rounded-[16px] p-[14px_16px] text-center text-[14px] font-semibold leading-[1.5] text-[var(--color-text)]"
                style={{
                  background:
                    elim.role === "civil"
                      ? "var(--color-primary-dim)"
                      : "var(--color-mint-dim)",
                  border: `1.5px solid ${
                    elim.role === "civil"
                      ? "var(--color-primary)"
                      : "var(--color-mint)"
                  }`,
                }}
              >
                {elim.role === "under" && (
                  <>👏 Les civils ont démasqué un undercover !</>
                )}
                {elim.role === "white" && <>👏 Mr. White s&apos;est fait prendre !</>}
                {elim.role === "civil" && (
                  <>😬 Un innocent vient de tomber. L&apos;undercover court toujours…</>
                )}
              </div>
            </>
          )
        )}
      </div>

      <div className="flex-shrink-0 px-5 pb-[34px] pt-[14px]">
        <PrimaryButton onClick={onContinue}>
          {tie ? "Reprendre la manche" : "Manche suivante"}
        </PrimaryButton>
      </div>
    </Screen>
  );
}

