import { Screen, TopBar, Sticker } from "@/components/ui";
import { SparkleIcon, MaskIcon, ShieldIcon, InfoIcon } from "@/components/ui/icons";

type RuleSection = {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  title: string;
  body: React.ReactNode;
};

const SECTIONS: RuleSection[] = [
  {
    icon: <InfoIcon color="var(--color-text)" />,
    iconBg: "var(--color-lemon-dim)",
    iconColor: "var(--color-lemon)",
    borderColor: "var(--color-lemon)",
    title: "Le principe",
    body: (
      <>
        Trois rôles, un secret : <b>Civils</b>, <b>Undercover</b> et parfois{" "}
        <b>Mr. White</b>. Chacun reçoit un mot — ou rien — et doit deviner qui
        est qui sans se faire repérer.
      </>
    ),
  },
  {
    icon: <ShieldIcon color="var(--color-mint)" />,
    iconBg: "var(--color-mint-dim)",
    iconColor: "var(--color-mint)",
    borderColor: "var(--color-mint)",
    title: "Les Civils",
    body: (
      <>
        Ils partagent <b>le même mot</b>. Ils gagnent en éliminant tous les
        imposteurs avant d&apos;être en infériorité numérique.
      </>
    ),
  },
  {
    icon: <MaskIcon color="var(--color-primary)" />,
    iconBg: "var(--color-primary-dim)",
    iconColor: "var(--color-primary)",
    borderColor: "var(--color-primary)",
    title: "Les Undercover",
    body: (
      <>
        Ils ont un mot <b>proche mais différent</b>. Leur mission : se fondre
        dans la masse et désigner les Civils au vote.
      </>
    ),
  },
  {
    icon: <ShieldIcon color="var(--color-blue)" />,
    iconBg: "var(--color-blue-dim)",
    iconColor: "var(--color-blue)",
    borderColor: "var(--color-blue)",
    title: "Mr. White",
    body: (
      <>
        Aucun mot. Il doit <b>improviser</b> en se basant sur ce que disent les
        autres. Risqué mais redoutable.
      </>
    ),
  },
  {
    icon: <SparkleIcon color="var(--color-text)" />,
    iconBg: "var(--color-surface-2)",
    iconColor: "var(--color-text)",
    borderColor: "var(--color-line)",
    title: "Le tour de jeu",
    body: (
      <>
        À chaque manche : <b>1.</b> chaque joueur décrit son mot par{" "}
        <b>un seul mot</b> sans le dire. <b>2.</b> Tout le monde vote pour
        éliminer un suspect. <b>3.</b> Le rôle de l&apos;éliminé est révélé.
      </>
    ),
  },
];

export default function RulesPage() {
  return (
    <Screen label="09 Règles">
      <TopBar title="Règles" backHref="/home" />

      <div className="flex-1 overflow-auto px-5 pb-8">
        <Sticker bg="var(--color-lemon)" rot={-3} className="self-start">
          <SparkleIcon color="var(--color-text)" />
          Comment on joue
        </Sticker>

        <h2 className="mb-5 mt-3 font-display text-[40px] font-extrabold leading-none tracking-[-1.6px]">
          Bluffe.
          <br />
          <span style={{ color: "var(--color-primary)" }}>Devine</span>
          <span style={{ color: "var(--color-lemon)" }}>.</span>{" "}
          <span style={{ color: "var(--color-blue)" }}>Trahis</span>
          <span style={{ color: "var(--color-lemon)" }}>.</span>
        </h2>

        <div className="flex flex-col gap-3">
          {SECTIONS.map((s) => (
            <div
              key={s.title}
              className="flex gap-[14px] rounded-[18px] bg-[var(--color-surface)] p-4"
              style={{
                border: `1.5px solid var(--color-line)`,
                boxShadow: "0 2px 0 rgba(26,20,24,0.04)",
              }}
            >
              <div
                className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-[14px]"
                style={{
                  background: s.iconBg,
                  border: `1.5px solid ${s.borderColor}`,
                }}
              >
                {s.icon}
              </div>
              <div className="flex-1">
                <div className="text-[16px] font-bold text-[var(--color-text)]">
                  {s.title}
                </div>
                <div className="mt-1 text-[14px] font-medium leading-[1.5] text-[var(--color-sub)]">
                  {s.body}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-5 flex gap-3 rounded-[16px] p-4 text-[13px] font-medium leading-[1.5] text-[var(--color-text)]"
          style={{
            background: "var(--color-mint-dim)",
            border: "1.5px solid var(--color-mint)",
          }}
        >
          <div className="mt-[1px]">
            <InfoIcon color="var(--color-text)" />
          </div>
          <div>
            <b>Conditions de victoire.</b> Les Civils gagnent en éliminant tous
            les imposteurs. Les imposteurs gagnent dès qu&apos;ils sont en
            nombre égal aux Civils restants.
          </div>
        </div>
      </div>
    </Screen>
  );
}
