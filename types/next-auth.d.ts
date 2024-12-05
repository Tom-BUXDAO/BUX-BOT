import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";
import { UserWallet } from '@prisma/client';

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            discordId?: string;
            wallets?: Pick<UserWallet, 'address'>[];
        }
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        discordId?: string;
    }
} 