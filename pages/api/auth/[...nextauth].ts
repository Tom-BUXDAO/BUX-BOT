import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { JWT } from 'next-auth/jwt';
import { prisma } from '../../../lib/prisma';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: DefaultSession['user'] & {
      id: string;
      discordId: string;
    };
  }
}

export default NextAuth({
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.discordId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: JWT }) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.discordId = token.discordId;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === 'discord') {
        try {
          await prisma.user.upsert({
            where: {
              discordId: account.providerAccountId,
            },
            update: {
              discordName: user.name || 'Unknown',
            },
            create: {
              discordId: account.providerAccountId,
              discordName: user.name || 'Unknown',
            },
          });
          return true;
        } catch (error) {
          console.error('Error saving user to database:', error);
          return false;
        }
      }
      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}); 