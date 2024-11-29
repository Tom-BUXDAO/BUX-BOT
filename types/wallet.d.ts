import { Prisma } from '@prisma/client';

export type UserWithWallets = Prisma.UserGetPayload<{
  include: {
    userWallet: {
      include: {
        nft: {
          include: {
            collection: true
          }
        },
        tokenBalance: true
      }
    }
  }
}>;

export type NFTHoldingWithCollection = Prisma.NftGetPayload<{
  include: {
    collection: true
  }
}>; 