import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const users = await prisma.user.findMany({
            select: {
                discordName: true,
                wallets: {
                    select: {
                        address: true
                    }
                },
                createdAt: true,
                updatedAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Format response to maintain backwards compatibility
        const formattedUsers = users.map(user => ({
            discordName: user.discordName,
            walletAddresses: user.wallets.map(w => w.address),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }));

        return res.status(200).json(formattedUsers);

    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ error: 'Failed to fetch users' });
    }
} 