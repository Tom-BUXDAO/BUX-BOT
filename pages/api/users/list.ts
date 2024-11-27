import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { UserWithWallets } from '@/types/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Use raw query to get users with wallets
        const users = await prisma.$queryRaw<UserWithWallets[]>`
            SELECT 
                u."discordName",
                u."createdAt",
                u."updatedAt",
                json_agg(
                    json_build_object('address', w."address")
                ) as wallets
            FROM "User" u
            LEFT JOIN "UserWallet" w ON w."userId" = u.id
            GROUP BY u."discordName", u."createdAt", u."updatedAt"
            ORDER BY u."createdAt" DESC
        `;

        // Format response to maintain backwards compatibility
        const formattedUsers = users.map(user => ({
            discordName: user.discordName,
            walletAddresses: user.wallets?.map(w => w.address) || [],
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }));

        return res.status(200).json(formattedUsers);

    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ error: 'Failed to fetch users' });
    }
} 