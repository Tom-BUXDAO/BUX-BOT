import NextAuth, { NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import type { User } from 'next-auth';
import type { Session } from 'next-auth';
import type { Account } from 'next-auth';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: 'identify guilds' } },
    }),
  ],
  callbacks: {
    async signIn({ user, account }: { user: User; account: Account | null }) {
      if (account?.provider === 'discord') {
        await prisma.user.upsert({
          where: { id: user.id },
          create: {
            id: user.id,
            discordId: user.id,
            discordName: user.name || 'Unknown'
          },
          update: {
            discordId: user.id,
            discordName: user.name || 'Unknown'
          }
        });
      }
      return true;
    },
    async session({ session, user }: { session: Session; user: User }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    }
  },
  pages: {
    signIn: '/',
    error: '/auth/error',
  },
  session: {
    strategy: 'database' as const
  }
};

export default NextAuth(authOptions); 