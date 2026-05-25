type IconProps = { color?: string; className?: string };

const c = "currentColor";

export const BackIcon = ({ color = c, className }: IconProps) => (
  <svg width="11" height="18" viewBox="0 0 11 18" fill="none" className={className}>
    <path
      d="M9 1L1 9l8 8"
      stroke={color}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PlusIcon = ({ color = c, className }: IconProps) => (
  <svg width="14" height="14" viewBox="0 0 14 14" className={className}>
    <path d="M7 1v12M1 7h12" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

export const MinusIcon = ({ color = c, className }: IconProps) => (
  <svg width="14" height="2" viewBox="0 0 14 2" className={className}>
    <path d="M1 1h12" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

export const XIcon = ({ color = c, className }: IconProps) => (
  <svg width="11" height="11" viewBox="0 0 11 11" className={className}>
    <path d="M1 1l9 9M10 1l-9 9" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const ShieldIcon = ({ color = c, className }: IconProps) => (
  <svg width="20" height="22" viewBox="0 0 20 22" fill="none" className={className}>
    <path
      d="M10 1L1 4v7c0 5.5 4 9 9 10 5-1 9-4.5 9-10V4l-9-3z"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export const MaskIcon = ({ color = c, className }: IconProps) => (
  <svg width="24" height="16" viewBox="0 0 24 16" fill="none" className={className}>
    <path
      d="M2 3c0-1 1-2 2-2h16c1 0 2 1 2 2v3c0 5-3.5 8-7 8-1.5 0-2.5-1.2-4.5-1.2S8 14 6.5 14C3 14 -0.5 11 -0.5 6V3z"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
      transform="translate(1,0)"
    />
    <circle cx="8" cy="6" r="1.4" fill={color} />
    <circle cx="16" cy="6" r="1.4" fill={color} />
  </svg>
);

export const TrophyIcon = ({ color = c, className }: IconProps) => (
  <svg width="22" height="24" viewBox="0 0 22 24" fill="none" className={className}>
    <path
      d="M5 2h12v5c0 3.3-2.7 6-6 6S5 10.3 5 7V2z"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M5 4H2v2c0 2 1.5 3.5 3.5 3.5M17 4h3v2c0 2-1.5 3.5-3.5 3.5M7 22h8M11 13v9"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const InfoIcon = ({ color = c, className }: IconProps) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={className}>
    <circle cx="10" cy="10" r="9" stroke={color} strokeWidth="2" />
    <path
      d="M10 9v6M10 6v0.5"
      stroke={color}
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  </svg>
);

export const PlayIcon = ({ color = c, className }: IconProps) => (
  <svg width="14" height="16" viewBox="0 0 14 16" fill="none" className={className}>
    <path d="M2 1l11 7-11 7V1z" fill={color} />
  </svg>
);

export const SparkleIcon = ({ color = c, className }: IconProps) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className={className}>
    <path
      d="M9 1l1.8 5.5L16 9l-5.2 1.8L9 17l-1.8-5.5L2 9l5.2-2L9 1z"
      fill={color}
    />
  </svg>
);

export const GoogleG = ({ className }: { className?: string }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" className={className}>
    <path
      d="M21.6 11.23c0-.74-.07-1.45-.19-2.13H11v4.03h5.94c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.3-4.74 3.3-8.06z"
      fill="#4285F4"
    />
    <path
      d="M11 22c2.97 0 5.46-.99 7.28-2.66l-3.57-2.75c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H1.16v2.84A11 11 0 0011 22z"
      fill="#34A853"
    />
    <path
      d="M4.85 13.12A6.6 6.6 0 014.5 11c0-.74.13-1.45.35-2.12V6.04H1.16A11 11 0 000 11c0 1.78.42 3.46 1.16 4.96l3.69-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M11 4.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C16.46 1.09 13.97 0 11 0A11 11 0 001.16 6.04l3.69 2.84C5.71 6.31 8.14 4.38 11 4.38z"
      fill="#EA4335"
    />
  </svg>
);
