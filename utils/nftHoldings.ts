import axios from 'axios';

interface NFTHolding {
  walletAddress: string;
  mint: string;
  collection: string;
}

export async function getNFTHoldings(walletAddresses: string[]): Promise<NFTHolding[]> {
  const holdings: NFTHolding[] = [];
  
  for (const address of walletAddresses) {
    try {
      const response = await axios.get(
        `https://api.shyft.to/sol/v1/wallet/nfts?network=mainnet-beta&wallet=${address}`,
        {
          headers: {
            'x-api-key': process.env.SHYFT_API_KEY
          }
        }
      );
      
      if (response.data.success && response.data.result) {
        for (const nft of response.data.result) {
          holdings.push({
            walletAddress: address,
            mint: nft.mint,
            collection: nft.collection
          });
        }
      }
    } catch (error) {
      console.error(`Error fetching NFTs for ${address}:`, error);
    }
  }
  
  return holdings;
} 