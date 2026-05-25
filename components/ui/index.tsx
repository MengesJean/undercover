"use client";

import { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { BackIcon } from "./icons";

// ─────────────────────────────────────────────────────────────
// Screen wrapper — full-width responsive container
// ─────────────────────────────────────────────────────────────
export function Screen({
  children,
  label,
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <div
      data-screen-label={label}
      className="relative flex min-h-svh w-full flex-col bg-[var(--color-bg)] text-[var(--color-text)]"
    >
      <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TopBar — back button + title + optional right slot
// ─────────────────────────────────────────────────────────────
const BACK_BTN_CLASS =
  "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[var(--color-surface)]";
const BACK_BTN_STYLE: CSSProperties = {
  border: "1.5px solid var(--color-line)",
};

export function TopBar({
  title,
  backHref,
  onBack,
  right,
}: {
  title: string;
  backHref?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  const showBack = !!backHref || !!onBack;
  return (
    <div className="flex flex-shrink-0 items-center justify-between px-5 pb-3 pt-14">
      <div className={showBack ? "" : "invisible"}>
        {backHref ? (
          <Link
            href={backHref}
            aria-label="Retour"
            className={BACK_BTN_CLASS}
            style={BACK_BTN_STYLE}
          >
            <BackIcon color="var(--color-text)" />
          </Link>
        ) : (
          <button
            onClick={onBack}
            aria-label="Retour"
            className={BACK_BTN_CLASS}
            style={BACK_BTN_STYLE}
          >
            <BackIcon color="var(--color-text)" />
          </button>
        )}
      </div>
      <div className="text-[13px] font-bold uppercase tracking-[0.4px] text-[var(--color-sub)]">
        {title}
      </div>
      <div className="flex h-10 w-10 items-center justify-center">{right}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PrimaryButton — coral with hard 4px shadow + colored halo
// ─────────────────────────────────────────────────────────────
type PrimaryButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  color?: string;
  deep?: string;
  textColor?: string;
  type?: "button" | "submit";
};

export function PrimaryButton({
  children,
  onClick,
  disabled,
  className = "",
  color = "var(--color-primary)",
  deep = "var(--color-primary-deep)",
  textColor = "#ffffff",
  type = "button",
}: PrimaryButtonProps) {
  const style: CSSProperties = disabled
    ? { background: "var(--color-surface-2)", color: "var(--color-faint)" }
    : {
        background: color,
        color: textColor,
        boxShadow: `0 4px 0 ${deep}, 0 12px 24px ${color}40`,
        transform: "translateY(-2px)",
      };
  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`flex h-[60px] w-full items-center justify-center gap-[10px] rounded-[20px] border-0 font-display text-[17px] font-bold tracking-[-0.3px] transition-[transform,box-shadow] duration-100 ${
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
      style={style}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// GhostButton — white surface, thin border, slight shadow
// ─────────────────────────────────────────────────────────────
export function GhostButton({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-[54px] w-full cursor-pointer rounded-[18px] bg-[var(--color-surface)] font-display text-[15px] font-semibold text-[var(--color-text)] ${className}`}
      style={{
        border: "1.5px solid var(--color-line)",
        boxShadow: "0 2px 0 rgba(26,20,24,0.04)",
      }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Sticker — rotated uppercase pill badge
// ─────────────────────────────────────────────────────────────
export function Sticker({
  children,
  bg,
  color = "var(--color-text)",
  rot = -3,
  className = "",
}: {
  children: ReactNode;
  bg: string;
  color?: string;
  rot?: number;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-[6px] rounded-full px-3 py-[6px] text-[12px] font-bold uppercase tracking-[0.4px] ${className}`}
      style={{ background: bg, color, transform: `rotate(${rot}deg)` }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Toggle — mint when on, neobrutalist border
// ─────────────────────────────────────────────────────────────
export function Toggle({
  on,
  onChange,
  ariaLabel,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      onClick={() => onChange(!on)}
      className="relative h-[30px] w-[52px] cursor-pointer rounded-[15px] p-0 transition-colors duration-200"
      style={{
        background: on ? "var(--color-mint)" : "var(--color-bg)",
        border: "1.5px solid var(--color-text)",
      }}
    >
      <span
        className="absolute top-[2px] block h-[22px] w-[22px] rounded-full bg-[var(--color-surface)] transition-[left] duration-200"
        style={{
          left: on ? 24 : 2,
          border: "1.5px solid var(--color-text)",
        }}
      />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// StatTile — colored brick with big number + label
// ─────────────────────────────────────────────────────────────
export function StatTile({
  bg,
  n,
  label,
}: {
  bg: string;
  n: number | string;
  label: string;
}) {
  return (
    <div
      className="flex-1 rounded-[18px] p-[14px_12px] text-center"
      style={{
        background: bg,
        border: "2px solid var(--color-text)",
        boxShadow: "3px 3px 0 var(--color-text)",
      }}
    >
      <div className="font-display text-[32px] font-extrabold leading-none tracking-[-1.5px] text-[var(--color-text)]">
        {n}
      </div>
      <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.4px] text-[var(--color-text)]">
        {label}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SectionLabel — small uppercase header
// ─────────────────────────────────────────────────────────────
export function SectionLabel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mb-[10px] text-[12px] font-extrabold uppercase tracking-[1.2px] text-[var(--color-sub)] ${className}`}
    >
      {children}
    </div>
  );
}
