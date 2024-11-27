import { Prisma } from '@prisma/client';

export type UserWithWallets = {
    id: string;
    discordId: string;
    discordName: string;
    wallets: {
        id: string;
        address: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
    }[];
    createdAt: Date;
    updatedAt: Date;
};

export type TokenBalanceWithOwner = {
    walletAddress: string;
    balance: bigint;
    ownerDiscordId: string | null;
    lastUpdated: Date;
}; 