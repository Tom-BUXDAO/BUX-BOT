import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { verifyHolder } from '@/utils/verifyHolder';
import type { VerificationResult } from '@/types/verification';

export const config = {
  api: {
    bodyParser: true,
    responseLimit: false,
    externalResolver: true
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initial response to prevent timeout
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked'
    });

    // Log request details
    console.log('\n=== Starting Wallet Verification ===');
    console.log('Request body:', req.body);

    // Check session
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      res.write(JSON.stringify({ error: 'Unauthorized' }));
      res.end();
      return;
    }
    console.log('User ID:', session.user.id);

    // Validate wallet address
    const { address } = req.body;
    if (!address || typeof address !== 'string') {
      res.write(JSON.stringify({ error: 'Valid wallet address is required' }));
      res.end();
      return;
    }
    console.log('Wallet Address:', address);

    // Get Discord ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { discordId: true }
    });

    if (!user?.discordId) {
      res.write(JSON.stringify({ error: 'Discord account not connected' }));
      res.end();
      return;
    }
    console.log('Discord ID:', user.discordId);

    // Verify wallet
    const verificationResult = await verifyHolder(address, user.discordId);
    console.log('Verification result:', verificationResult);

    // Update user wallet if verification successful
    if (verificationResult.isHolder) {
      await prisma.userWallet.upsert({
        where: { address },
        create: {
          address,
          userId: session.user.id
        },
        update: {
          userId: session.user.id
        }
      });
      console.log('Updated user wallet');
    }

    // Send final response
    res.write(JSON.stringify({ 
      success: true,
      verification: verificationResult 
    }));
    res.end();

  } catch (error) {
    console.error('Error verifying wallet:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.write(JSON.stringify({ 
      error: 'Failed to verify wallet',
      message: errorMessage
    }));
    res.end();
  }
} 