import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Keep the adapter typed against NextAuth's public contract. This also
  // avoids package-identity conflicts if npm installs @auth/core twice.
  adapter: PrismaAdapter(prisma) as Adapter,
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
        session.user.role = null;
        session.user.isActive = false;
      } else {
        session.user.role = dbUser.role;
        session.user.isActive = true;
      }

      return session;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
});
