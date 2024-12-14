import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { verifyWalletOwnership } from '../../utils/verifyWallet'
import { calculateRoleChanges } from '../../utils/discordRoles'
import { Prisma } from '@prisma/client'

interface VerificationResultJson {
  success: boolean;
  error?: string;
  [key: string]: any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Detailed request logging
    console.log('Request body:', JSON.stringify(req.body, null, 2))
    console.log('Request headers:', req.headers)

    const { wallet, user, session } = req.body

    // Extract data from nested structure
    const walletAddress = wallet?.publicKey?.toString() || wallet?.address || req.body.walletAddress
    const userId = user?.id || session?.user?.id || req.body.userId
    const discordId = user?.discordId || session?.user?.discordId || req.body.discordId

    console.log('Extracted data:', { walletAddress, userId, discordId })

    if (!walletAddress) {
      console.log('Missing wallet address. Full body:', JSON.stringify(req.body, null, 2))
      return res.status(400).json({ 
        error: 'Missing wallet address',
        details: 'No wallet address provided in request'
      })
    }

    if (!userId || !discordId) {
      console.log('Missing user data:', { userId, discordId })
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'userId and discordId are required'
      })
    }

    // Verify wallet ownership
    const verificationResult = await verifyWalletOwnership(walletAddress)
    
    if (!verificationResult.success) {
      return res.status(400).json({
        error: 'Verification failed',
        details: verificationResult.error
      })
    }

    // Create verification record
    const verification = await prisma.walletVerification.create({
      data: {
        walletAddress,
        userId,
        status: 'verified',
        result: verificationResult as unknown as Prisma.JsonObject
      }
    })

    // Calculate role changes
    const roleChanges = await calculateRoleChanges({
      userId,
      discordId,
      walletAddress
    })

    console.log('Role changes calculated:', {
      userId,
      discordId,
      changes: roleChanges || []
    })

    return res.status(200).json({
      success: true,
      verification,
      roleChanges: roleChanges || []
    })

  } catch (error) {
    console.error('Error in verify-wallet:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
} 