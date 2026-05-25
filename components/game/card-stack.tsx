// Decorative card pile used on Login + Home screens.
// Three offset cards: two back-faces (blue, lemon), one front-face (CIVIL).

type Card = {
  rot: number;
  x: number;
  y: number;
  face: "back" | "front";
  bg?: string;
  z: number;
};

const CARDS: Card[] = [
  { rot: -16, x: -90, y: 14, face: "back", bg: "var(--color-blue)", z: 1 },
  { rot: 11, x: 76, y: 0, face: "back", bg: "var(--color-lemon)", z: 2 },
  { rot: -3, x: -8, y: -12, face: "front", z: 3 },
];

export function CardStack() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {CARDS.map((c, i) => (
        <div
          key={i}
          className="absolute box-border flex h-[196px] w-[140px] items-center justify-center rounded-[20px] p-[14px]"
          style={{
            transform: `translate(${c.x}px, ${c.y}px) rotate(${c.rot}deg)`,
            zIndex: c.z,
            background: c.face === "front" ? "var(--color-surface)" : c.bg,
            border: "2.5px solid var(--color-text)",
            boxShadow: "6px 6px 0 var(--color-text)",
          }}
        >
          <span
            className="absolute left-[14px] top-[12px] text-[12px] font-extrabold tracking-[1.5px]"
            style={{
              color:
                c.face === "front"
                  ? "var(--color-primary)"
                  : "var(--color-text)",
            }}
          >
            U.
          </span>
          <span
            className="absolute bottom-[12px] right-[14px] text-[12px] font-extrabold tracking-[1.5px]"
            style={{
              color:
                c.face === "front"
                  ? "var(--color-primary)"
                  : "var(--color-text)",
              transform: "rotate(180deg)",
            }}
          >
            U.
          </span>
          {c.face === "front" ? (
            <div className="text-center">
              <div className="font-display text-[30px] font-extrabold leading-none tracking-[-1px] text-[var(--color-text)]">
                Chat
              </div>
              <div className="mt-[10px] text-[9px] font-extrabold tracking-[1.5px] text-[var(--color-primary)]">
                TON MOT
              </div>
            </div>
          ) : (
            <div
              className="font-display text-[64px] font-extrabold text-[var(--color-text)]"
              style={{ transform: "translateY(-4px)" }}
            >
              ?
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
