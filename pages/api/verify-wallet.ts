import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { verifyWalletOwnership } from '@/utils/verifyWallet'
import { calculateRoleChanges } from '@/utils/discordRoles'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { walletAddress, userId, discordId } = req.body

    if (!walletAddress || !userId || !discordId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'walletAddress, userId, and discordId are required'
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
        result: verificationResult
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
      changes: roleChanges || []  // Ensure we always have an array
    })

    return res.status(200).json({
      success: true,
      verification,
      roleChanges: roleChanges || [] // Ensure we always return an array
    })

  } catch (error) {
    console.error('Error in verify-wallet:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    })
  }
} 