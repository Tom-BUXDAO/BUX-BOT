import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import {
  ConnectionProvider,
  WalletProvider
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BackpackWalletAdapter,
  // Add other wallet adapters as needed
} from '@solana/wallet-adapter-wallets';
import { useMemo } from 'react';
import '@solana/wallet-adapter-react-ui/styles.css';
import '../styles/globals.css';

// Default RPC endpoint
const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  // Initialize wallet adapters
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new BackpackWalletAdapter(),
    // Add other wallet adapters here
  ], []);

  return (
    <SessionProvider session={session}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <Component {...pageProps} />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </SessionProvider>
  );
} 