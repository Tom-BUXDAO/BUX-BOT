import axios from 'axios';

interface TokenBalance {
  walletAddress: string;
  amount: number;
}

export async function getTokenBalances(walletAddresses: string[]): Promise<TokenBalance[]> {
  const balances: TokenBalance[] = [];
  
  for (const address of walletAddresses) {
    try {
      const response = await axios.get(
        `https://api.shyft.to/sol/v1/wallet/token_balance?network=mainnet-beta&wallet=${address}`,
        {
          headers: {
            'x-api-key': process.env.SHYFT_API_KEY
          }
        }
      );
      
      if (response.data.success && response.data.result) {
        balances.push({
          walletAddress: address,
          amount: parseFloat(response.data.result.balance)
        });
      }
    } catch (error) {
      console.error(`Error fetching token balance for ${address}:`, error);
    }
  }
  
  return balances;
} 