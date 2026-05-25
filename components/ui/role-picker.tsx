"use client";

import { CSSProperties } from "react";
import { MaskIcon, MinusIcon, PlusIcon, ShieldIcon } from "./icons";

const stepperBtnStyle = (dim: boolean): CSSProperties => ({
  width: 38,
  height: 40,
  border: "none",
  background: "transparent",
  cursor: dim ? "not-allowed" : "pointer",
  opacity: dim ? 0.3 : 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export function RolePicker({
  label,
  subtitle,
  value,
  onChange,
  min,
  max,
  icon,
  color,
  colorDim,
}: {
  label: string;
  subtitle: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  icon: "mask" | "shield";
  color: string;
  colorDim: string;
}) {
  return (
    <div
      className="flex items-center gap-[14px] rounded-[20px] bg-[var(--color-surface)] p-[14px_14px_14px_16px]"
      style={{
        border: "1.5px solid var(--color-line)",
        boxShadow: "0 2px 0 rgba(26,20,24,0.04)",
      }}
    >
      <div
        className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-[14px]"
        style={{
          background: colorDim,
          border: `1.5px solid ${color}`,
        }}
      >
        {icon === "mask" ? <MaskIcon color={color} /> : <ShieldIcon color={color} />}
      </div>
      <div className="flex-1">
        <div className="text-[16px] font-bold text-[var(--color-text)]">{label}</div>
        <div className="text-[13px] font-medium text-[var(--color-sub)]">
          {subtitle}
        </div>
      </div>
      <div
        className="flex h-10 items-center rounded-[14px] bg-[var(--color-bg)]"
        style={{ border: "1.5px solid var(--color-line)" }}
      >
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          style={stepperBtnStyle(value <= min)}
          aria-label="Diminuer"
        >
          <MinusIcon color="var(--color-text)" />
        </button>
        <div className="w-8 text-center font-display text-[17px] font-extrabold text-[var(--color-text)]">
          {value}
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          style={stepperBtnStyle(value >= max)}
          aria-label="Augmenter"
        >
          <PlusIcon color="var(--color-text)" />
        </button>
      </div>
    </div>
  );
}
