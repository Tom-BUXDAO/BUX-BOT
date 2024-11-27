import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyHolder } from '@/utils/verifyHolder';

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
            // Get user
            const user = await prisma.user.findUnique({
                where: { discordId },
                include: { wallets: true }
            });

            if (user) {
                // Add wallet to user if it doesn't exist
                const existingWallet = user.wallets.find(w => w.address === walletAddress);
                
                if (!existingWallet) {
                    await prisma.userWallet.create({
                        data: {
                            address: walletAddress,
                            userId: user.id
                        }
                    });
                }
            }
        }

        return res.status(200).json(verifyResult);

    } catch (error) {
        console.error('Error verifying wallet:', error);
        return res.status(500).json({ error: 'Failed to verify wallet' });
    }
} 