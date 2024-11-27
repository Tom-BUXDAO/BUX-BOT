import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyHolder } from '@/utils/verifyHolder';
import { UserWithWallets } from '@/types/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { walletAddress, discordId } = req.body;

        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }

        console.log('Starting wallet verification for:', walletAddress);

        // Verify the wallet
        const verifyResult = await verifyHolder(walletAddress);
        
        if (discordId) {
            // Get user with wallets
            const users = await prisma.$queryRaw<UserWithWallets[]>`
                SELECT u.*, json_agg(w.*) as wallets
                FROM "User" u
                LEFT JOIN "UserWallet" w ON w."userId" = u.id
                WHERE u."discordId" = ${discordId}
                GROUP BY u.id
            `;

            const user = users[0];
            if (user) {
                // Add wallet to user if it doesn't exist
                const existingWallet = user.wallets?.find(w => w.address === walletAddress);
                
                if (!existingWallet) {
                    await prisma.$executeRaw`
                        INSERT INTO "UserWallet" ("id", "address", "userId", "createdAt", "updatedAt")
                        VALUES (gen_random_uuid()::text, ${walletAddress}, ${user.id}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    `;
                }
            }
        }

        return res.status(200).json(verifyResult);

    } catch (error) {
        console.error('Error verifying wallet:', error);
        return res.status(500).json({ error: 'Failed to verify wallet' });
    }
} 