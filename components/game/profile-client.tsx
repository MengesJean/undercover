"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Screen,
  TopBar,
  StatTile,
  Toggle,
  SectionLabel,
} from "@/components/ui";
import {
  setNoRepeat,
  updateOwnerColor,
} from "@/lib/actions/players";
import { resetUsedPairs } from "@/lib/actions/words";

const AVATAR_COLORS = [
  "#FFD43B",
  "#FF4D6D",
  "#3A56F5",
  "#3DDC97",
  "#BFA6E6",
  "#FF8C42",
];

export function ProfileClient({
  user,
  stats,
  wordStats,
  signOutAction,
}: {
  user: { name: string; email: string; color: string; noRepeat: boolean };
  stats: { played: number; wins: number; undercover: number };
  wordStats: { used: number; total: number };
  signOutAction: () => Promise<void>;
}) {
  const router = useRouter();
  const [color, setColor] = useState(user.color);
  const [noRepeat, setNoRepeatState] = useState(user.noRepeat);
  const [usedCount, setUsedCount] = useState(wordStats.used);
  const [, startTransition] = useTransition();

  const handleColor = (c: string) => {
    setColor(c);
    startTransition(() => updateOwnerColor(c).catch(() => setColor(user.color)));
  };

  const handleToggle = (v: boolean) => {
    setNoRepeatState(v);
    startTransition(() => setNoRepeat(v).catch(() => setNoRepeatState(!v)));
  };

  const handleReset = () => {
    if (usedCount === 0) return;
    if (
      !confirm(
        "Réinitialiser les mots utilisés ? Tous les mots redeviendront tirables.",
      )
    )
      return;
    startTransition(() =>
      resetUsedPairs().then(() => {
        setUsedCount(0);
        router.refresh();
      }),
    );
  };

  const pct = wordStats.total
    ? Math.round((usedCount / wordStats.total) * 100)
    : 0;

  return (
    <Screen label="08 Profil">
      <TopBar title="Profil" backHref="/home" />

      <div className="flex-1 overflow-auto px-5 pb-8">
        {/* avatar + name */}
        <div
          className="mb-[22px] flex items-center gap-[18px] rounded-[24px] bg-[var(--color-surface)] px-5 py-6"
          style={{
            border: "2.5px solid var(--color-text)",
            boxShadow: "4px 4px 0 var(--color-text)",
          }}
        >
          <div
            className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full font-display text-[34px] font-extrabold text-[var(--color-text)]"
            style={{
              background: color,
              border: "2.5px solid var(--color-text)",
              boxShadow: "3px 3px 0 var(--color-text)",
            }}
          >
            {user.name[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="m-0 truncate font-display text-[28px] font-extrabold leading-none tracking-[-1px] text-[var(--color-text)]">
              {user.name}
            </h2>
            <div className="mt-1 truncate text-[13px] font-medium text-[var(--color-sub)]">
              {user.email}
            </div>
          </div>
        </div>

        {/* stats */}
        <div className="mb-[22px] flex gap-[10px]">
          <StatTile bg="var(--color-lemon)" n={stats.played} label="Parties" />
          <StatTile
            bg="var(--color-primary-dim)"
            n={stats.wins}
            label="Victoires"
          />
          <StatTile
            bg="var(--color-blue-dim)"
            n={stats.undercover}
            label="Undercover"
          />
        </div>

        {/* avatar color picker */}
        <SectionLabel>Couleur d&apos;avatar</SectionLabel>
        <div
          className="flex justify-between gap-[10px] rounded-[18px] bg-[var(--color-surface)] px-4 py-[14px]"
          style={{
            border: "1.5px solid var(--color-line)",
            boxShadow: "0 2px 0 rgba(26,20,24,0.04)",
          }}
        >
          {AVATAR_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => handleColor(c)}
              aria-label={`Choisir la couleur ${c}`}
              className="h-[38px] w-[38px] cursor-pointer rounded-full transition-transform"
              style={{
                background: c,
                border: "2px solid var(--color-text)",
                boxShadow: color === c ? "3px 3px 0 var(--color-text)" : "none",
                transform: color === c ? "translate(-1px, -1px)" : "none",
              }}
            />
          ))}
        </div>

        {/* word bank */}
        <SectionLabel className="mt-[22px]">Banque de mots</SectionLabel>

        <div
          className="mb-[10px] flex items-center gap-[14px] rounded-[18px] bg-[var(--color-surface)] px-4 py-[14px]"
          style={{
            border: "1.5px solid var(--color-line)",
            boxShadow: "0 2px 0 rgba(26,20,24,0.04)",
          }}
        >
          <div
            className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-[12px] text-[20px]"
            style={{
              background: "var(--color-mint-dim)",
              border: "1.5px solid var(--color-mint)",
            }}
          >
            🔁
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-bold text-[var(--color-text)]">
              Pas de mots répétés
            </div>
            <div className="text-[13px] font-medium text-[var(--color-sub)]">
              Évite de retomber sur les mêmes mots
            </div>
          </div>
          <Toggle on={noRepeat} onChange={handleToggle} ariaLabel="Activer la non-répétition" />
        </div>

        <div
          className="mb-[10px] rounded-[18px] bg-[var(--color-surface)] px-4 py-[14px]"
          style={{
            border: "1.5px solid var(--color-line)",
            boxShadow: "0 2px 0 rgba(26,20,24,0.04)",
          }}
        >
          <div className="mb-[10px] flex items-baseline justify-between">
            <div className="text-[15px] font-bold text-[var(--color-text)]">
              Mots utilisés
            </div>
            <div className="font-mono text-[13px] font-semibold text-[var(--color-sub)]">
              {usedCount}/{wordStats.total}
            </div>
          </div>
          <div
            className="h-[10px] overflow-hidden rounded-[5px]"
            style={{
              background: "var(--color-bg)",
              border: "1.5px solid var(--color-line)",
            }}
          >
            <div
              className="h-full transition-[width]"
              style={{
                width: `${pct}%`,
                background: "var(--color-primary)",
              }}
            />
          </div>
          {usedCount === wordStats.total && noRepeat && (
            <div className="mt-[10px] text-[12px] font-bold text-[var(--color-primary)]">
              ⚠️ Toutes les paires ont été utilisées. Réinitialise pour
              continuer.
            </div>
          )}
        </div>

        <button
          onClick={handleReset}
          disabled={usedCount === 0}
          className="flex h-[54px] w-full items-center justify-center gap-2 rounded-[18px] font-display text-[15px] font-extrabold tracking-[-0.2px]"
          style={{
            background:
              usedCount === 0
                ? "var(--color-surface)"
                : "var(--color-primary-dim)",
            color:
              usedCount === 0 ? "var(--color-faint)" : "var(--color-primary)",
            border: `1.5px solid ${
              usedCount === 0 ? "var(--color-line)" : "var(--color-primary)"
            }`,
            cursor: usedCount === 0 ? "not-allowed" : "pointer",
            boxShadow:
              usedCount === 0 ? "none" : "0 2px 0 rgba(26,20,24,0.04)",
          }}
        >
          🗑️ Réinitialiser les mots utilisés
        </button>

        <SectionLabel className="mt-[22px]">Compte</SectionLabel>
        <form action={signOutAction}>
          <button
            type="submit"
            className="h-[54px] w-full cursor-pointer rounded-[18px] bg-[var(--color-surface)] font-display text-[15px] font-bold text-[var(--color-text)]"
            style={{
              border: "1.5px solid var(--color-line)",
              boxShadow: "0 2px 0 rgba(26,20,24,0.04)",
            }}
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </Screen>
  );
}
