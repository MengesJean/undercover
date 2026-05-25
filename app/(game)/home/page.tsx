import Link from "next/link";
import { auth } from "@/auth";
import { Screen, Sticker } from "@/components/ui";
import { SparkleIcon, PlayIcon } from "@/components/ui/icons";
import { CardStack } from "@/components/game/card-stack";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const session = await auth();
  const name = session?.user?.name ?? "Invité";
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { color: true },
      })
    : null;
  const color = user?.color ?? "#FFD43B";
  const initial = (name[0] ?? "?").toUpperCase();

  return (
    <Screen label="01 Accueil">
      <div className="h-[54px] flex-shrink-0" />

      {/* greeting + avatar */}
      <div className="flex items-center justify-between px-6 pt-3">
        <div>
          <div className="text-[12px] font-bold uppercase tracking-[0.6px] text-[var(--color-sub)]">
            Salut
          </div>
          <div className="text-[18px] font-extrabold tracking-[-0.4px] text-[var(--color-text)]">
            {name} 👋
          </div>
        </div>
        <Link
          href="/profile"
          className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full font-display text-[18px] font-extrabold text-[var(--color-text)]"
          style={{
            background: color,
            border: "2px solid var(--color-text)",
            boxShadow: "3px 3px 0 var(--color-text)",
          }}
          aria-label="Mon profil"
        >
          {initial}
        </Link>
      </div>

      <div className="flex flex-1 flex-col px-6 pt-[14px]">
        <Sticker bg="var(--color-lemon)" rot={-4} className="self-start">
          <SparkleIcon color="var(--color-text)" />
          <span>3–20 joueurs</span>
        </Sticker>

        <div className="mt-[18px]">
          <h1 className="m-0 font-display text-[84px] font-extrabold leading-[0.88] tracking-[-4px] text-[var(--color-text)]">
            Under
            <br />
            <span style={{ color: "var(--color-primary)" }}>cover</span>
            <span style={{ color: "var(--color-lemon)" }}>.</span>
          </h1>
        </div>

        <p className="m-0 mt-4 max-w-[280px] text-[16px] font-medium leading-[1.45] text-[var(--color-sub)]">
          Découvre qui parmi tes amis se cache derrière un mot différent. Bluff,
          déduction, trahison.
        </p>

        <div className="relative mt-[18px] min-h-[200px] flex-1">
          <CardStack />
        </div>
      </div>

      <div className="flex flex-shrink-0 flex-col gap-3 px-5 pb-9">
        <Link
          href="/play"
          className="flex h-[60px] w-full items-center justify-center gap-[10px] rounded-[20px] font-display text-[17px] font-bold tracking-[-0.3px] text-white"
          style={{
            background: "var(--color-primary)",
            boxShadow:
              "0 4px 0 var(--color-primary-deep), 0 12px 24px rgba(255,77,109,0.25)",
            transform: "translateY(-2px)",
          }}
        >
          <PlayIcon color="#FFFFFF" />
          Nouvelle partie
        </Link>
        <div className="flex gap-[10px]">
          <Link
            href="/rules"
            className="flex h-[54px] flex-1 items-center justify-center rounded-[18px] bg-[var(--color-surface)] font-display text-[15px] font-semibold text-[var(--color-text)]"
            style={{
              border: "1.5px solid var(--color-line)",
              boxShadow: "0 2px 0 rgba(26,20,24,0.04)",
            }}
          >
            Règles
          </Link>
          <Link
            href="/history"
            className="flex h-[54px] flex-1 items-center justify-center rounded-[18px] bg-[var(--color-surface)] font-display text-[15px] font-semibold text-[var(--color-text)]"
            style={{
              border: "1.5px solid var(--color-line)",
              boxShadow: "0 2px 0 rgba(26,20,24,0.04)",
            }}
          >
            Historique
          </Link>
        </div>
      </div>
    </Screen>
  );
}
