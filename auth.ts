import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const PALETTE = ["#FFD43B", "#FF4D6D", "#3A56F5", "#3DDC97", "#BFA6E6", "#FF8C42"];
const randomColor = () => PALETTE[Math.floor(Math.random() * PALETTE.length)];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      const color = randomColor();
      const name = user.name ?? user.email?.split("@")[0] ?? "Joueur";
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { color },
        }),
        prisma.player.create({
          data: {
            ownerId: user.id,
            name,
            color,
            isOwner: true,
          },
        }),
      ]);
    },
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
