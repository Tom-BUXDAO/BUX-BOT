import NextAuth, { NextAuthOptions, Session, User, Profile, Account } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import DiscordProvider from 'next-auth/providers/discord';
import { prisma } from '@/lib/prisma';

// Define Discord profile type
interface DiscordProfile extends Profile {
  id: string;
  username?: string;
  global_name?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: 'identify guilds' } },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      const discordProfile = profile as DiscordProfile;
      if (!discordProfile?.id) return false;
      
      await prisma.user.upsert({
        where: { discordId: discordProfile.id },
        create: {
          discordId: discordProfile.id,
          discordName: discordProfile.global_name || discordProfile.username || 'Unknown'
        },
        update: {
          discordName: discordProfile.global_name || discordProfile.username || 'Unknown'
        }
      });
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        const dbUser = await prisma.user.findUnique({
          where: { discordId: token.sub }
        });
        if (dbUser) {
          session.user.id = dbUser.id;
        }
      }
      return session;
    },
    async jwt({ token, profile }) {
      const discordProfile = profile as DiscordProfile;
      if (discordProfile?.id) {
        token.sub = discordProfile.id;
      }
      return token;
    }
  },
  session: {
    strategy: 'jwt' as const
  },
  pages: {
    signIn: '/',
    error: '/auth/error',
  }
};

export default NextAuth(authOptions); 