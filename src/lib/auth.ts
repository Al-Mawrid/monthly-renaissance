import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return true;
      const existing = await prisma.user.findUnique({
        where: { email: user.email },
        select: { isActive: true },
      });
      if (existing && existing.isActive === false) return false;
      return true;
    },
    async session({ session, user }) {
      if (!session.user) return session;

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true, isActive: true },
      });

      session.user.id = user.id;

      if (!dbUser || dbUser.isActive === false) {
        (session.user as any).role = null;
        (session.user as any).isActive = false;
      } else {
        session.user.role = dbUser.role;
        (session.user as any).isActive = true;
      }

      return session;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
});
