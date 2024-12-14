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
    // Log the request body for debugging
    console.log('Verify wallet request body:', req.body)

    const { wallet, userId, discordId } = req.body

    // Use wallet address from the correct field
    const walletAddress = wallet?.address || req.body.walletAddress

    if (!walletAddress) {
      console.log('Missing wallet address. Body:', req.body)
      return res.status(400).json({ 
        error: 'Missing wallet address',
        details: 'No wallet address provided in request'
      })
    }

    if (!userId || !discordId) {
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