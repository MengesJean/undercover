import { Screen, Sticker } from "@/components/ui";
import { GoogleG, SparkleIcon } from "@/components/ui/icons";
import { signIn } from "@/auth";
import { CardStack } from "@/components/game/card-stack";

export default function LoginPage() {
  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/home" });
  }

  return (
    <Screen label="00 Connexion">
      <div className="h-[54px] flex-shrink-0" />

      <div className="flex flex-1 flex-col px-6 pb-3 pt-6">
        <Sticker bg="var(--color-lemon)" rot={-3} className="self-start">
          <SparkleIcon color="var(--color-text)" />
          <span>Bienvenue</span>
        </Sticker>

        <h1 className="mb-[10px] mt-[14px] font-display text-[64px] font-extrabold leading-[0.9] tracking-[-3px] text-[var(--color-text)]">
          Prêt à
          <br />
          <span style={{ color: "var(--color-primary)" }}>bluffer</span>
          <span style={{ color: "var(--color-lemon)" }}>?</span>
        </h1>
        <p className="mb-[22px] max-w-[300px] text-[15px] font-medium leading-[1.45] text-[var(--color-sub)]">
          Connecte-toi pour retrouver tes parties, tes amis et tes statistiques.
        </p>

        <div className="relative min-h-[220px] flex-1">
          <CardStack />
        </div>

        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="flex h-[60px] w-full cursor-pointer items-center justify-center gap-3 rounded-[20px] bg-[var(--color-surface)] font-display text-[16px] font-bold tracking-[-0.2px] text-[var(--color-text)]"
            style={{
              border: "2px solid var(--color-text)",
              boxShadow: "0 4px 0 var(--color-text)",
              transform: "translateY(-2px)",
            }}
          >
            <GoogleG />
            Continuer avec Google
          </button>
        </form>

        <div className="mt-[18px] text-center text-[11px] font-medium leading-[1.5] text-[var(--color-faint)]">
          En continuant, tu acceptes nos conditions
          <br />
          d&apos;utilisation et notre politique de confidentialité.
        </div>
      </div>
    </Screen>
  );
}
