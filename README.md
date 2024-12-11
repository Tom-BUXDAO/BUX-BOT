# BUX DAO NFT Verification

Discord bot and web app for BUX DAO holder verification and role management.

## Project Structure

- Discord bot
- Web app

## Features

- Discord OAuth2 login
- Solana wallet connection
- Multi-wallet support per user
- NFT holder verification for:
  - Money Monsters (+ Top 10)
  - Money Monsters 3D (+ Top 10)
  - Celeb Catz
  - Fcked Catz
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
- Real-time wallet verification
- Historical wallet tracking

### NFT Tracking
- Full NFT metadata storage
- Sales history tracking
- Listing price monitoring
- Rarity scores from HowRare.is
- Real-time ownership updates
- Historical ownership tracking
- Burned NFT tracking
- Collection statistics

### Token Balances
- Real-time $BUX balance tracking
- Historical balance records
- Multi-wallet aggregation
- Automatic updates
- Balance verification
- Transaction history

### Verification System
- Database-first verification
- No external API calls for verification
- Real-time data validation
- Cross-reference checking
- Data integrity enforcement
- Automatic sync triggers
- Performance optimized queries

### Performance
- Connection pooling
- Rate limiting
- Query optimization
- Index management
- Cache utilization
- Transaction batching

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

```bash
git clone https://github.com/buxdao/nft-verification.git
cd nft-verification

```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:
- Copy `.env.example` to `.env.local`
- Fill in required variables:
  ```
  DATABASE_URL=
  DISCORD_CLIENT_ID=
  DISCORD_CLIENT_SECRET=
  DISCORD_BOT_TOKEN=
  NEXTAUTH_URL=
  NEXTAUTH_SECRET=
  MAGIC_EDEN_API_KEY=
  HOWRARE_API_KEY=
  SOLANA_RPC_URL=
  ```

4. Initialize database:

```bash
npx prisma generate
npx prisma db push
```

5. Start development server:

```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run verify` - Run NFT verification
- `npm run check-data` - Validate database integrity
- `npm run mark-burned` - Update burned NFT status

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT License - see LICENSE file for details
