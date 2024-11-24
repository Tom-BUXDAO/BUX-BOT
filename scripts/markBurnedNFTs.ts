import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function markBurnedNFTs() {
  try {
    // First, let's count NFTs with null images by collection
    const burnedByCollection = await prisma.nFT.groupBy({
      by: ['collection'],
      where: {
        image: null
      },
      _count: true
    });

    console.log('\nNFTs with null images by collection:');
    burnedByCollection.forEach(result => {
      console.log(`${result.collection}: ${result._count} burned NFTs`);
    });

    // Add 'burned' field to NFTs with null images
    const updateResult = await prisma.nFT.updateMany({
      where: {
        image: null
      },
      data: {
        attributes: {
          set: { burned: true }
        }
      }
    });

    console.log(`\nMarked ${updateResult.count} NFTs as burned`);

    // Update collection supply counts
    for (const collection of burnedByCollection) {
      const validNFTCount = await prisma.nFT.count({
        where: {
          collection: collection.collection,
          image: { not: null }
        }
      });

      await prisma.collection.update({
        where: { name: collection.collection },
        data: { totalSupply: validNFTCount }
      });

      console.log(`Updated ${collection.collection} supply to ${validNFTCount}`);
    }

  } catch (error) {
    console.error('Error marking burned NFTs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

markBurnedNFTs(); 