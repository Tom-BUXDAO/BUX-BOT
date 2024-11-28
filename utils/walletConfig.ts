import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
  CloverWalletAdapter,
  Coin98WalletAdapter,
  SolongWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

export const NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork) || WalletAdapterNetwork.Mainnet;
export const ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://solana-mainnet.g.alchemy.com/v2/your-api-key';

export const getWalletAdapters = () => {
  return [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new TorusWalletAdapter(),
    new LedgerWalletAdapter(),
    new CloverWalletAdapter(),
    new Coin98WalletAdapter(),
    new SolongWalletAdapter(),
  ];
};

export const walletConfig = {
  autoConnect: true,
  network: NETWORK,
  endpoint: ENDPOINT,
  walletConnectTimeout: 10000,
  onError: (error: Error) => {
    console.error('Wallet error:', error);
  },
  onConnect: () => {
    console.log('Wallet connected');
  },
  onDisconnect: () => {
    console.log('Wallet disconnected');
  }
}; 