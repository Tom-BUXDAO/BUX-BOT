# BUX DAO NFT Verification

Discord bot and web app for BUX DAO holder verification and role management.

## Features

- Discord OAuth2 login
- Solana wallet connection
- Multi-wallet support per user
- NFT holder verification for:
  - Money Monsters (+ Top 10)
  - Money Monsters 3D (+ Top 10)
  - CelebCatz
  - FCKED CATZ
  - AI BitBots
  - Collab Collections:
    - Candy Bots
    - Doodle Bots
    - Energy Apes
    - RJCTD Bots
    - Squirrels
    - Warriors
- $BUX token balance tracking
- Automatic role assignment
- Real-time verification badge
- Multi-collection support
- Whale role thresholds
- Token balance thresholds

## Database System

### User Management
- Users can connect multiple wallets
- Each wallet tracks NFT ownership and token balances
- Automatic Discord ID syncing across wallets

### NFT Tracking
- Full NFT metadata storage
- Sales history tracking
- Listing price monitoring
- Rarity scores from HowRare.is
- Real-time ownership updates
- Historical ownership tracking

### Token Balances
- Real-time $BUX balance tracking
- Historical balance records
- Multi-wallet aggregation
- Automatic updates

## Tech Stack

- Next.js 14
- TypeScript
- Prisma
- PostgreSQL (Neon)
- NextAuth.js
- Solana Web3.js
- Magic Eden API
- HowRare.is API
- Discord.js

## Setup

1. Clone the repository: