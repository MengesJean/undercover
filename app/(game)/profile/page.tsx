import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOwnerStats } from "@/lib/actions/players";
import { getWordPairStats } from "@/lib/actions/words";
import { ProfileClient } from "@/components/game/profile-client";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      color: true,
      noRepeat: true,
    },
  });
  if (!user) redirect("/login");

  const [stats, wordStats] = await Promise.all([
    getOwnerStats(),
    getWordPairStats(),
  ]);

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <ProfileClient
      user={{
        name: user.name ?? "Joueur",
        email: user.email ?? "",
        color: user.color,
        noRepeat: user.noRepeat,
      }}
      stats={stats}
      wordStats={wordStats}
      signOutAction={signOutAction}
    />
  );
}
