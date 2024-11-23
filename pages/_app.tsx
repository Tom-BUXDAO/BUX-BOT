import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import React, { useMemo } from 'react';
import '../styles/globals.css';
import {
  ConnectionProvider,
  WalletProvider
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  SolflareWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = "https://api.mainnet-beta.solana.com";
  
  const wallets = useMemo(() => [
    new SolflareWalletAdapter(),
    new LedgerWalletAdapter(),
  ], []);

  return (
    <SessionProvider session={session} refetchInterval={0}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect={false}>
          <WalletModalProvider>
            <Component {...pageProps} />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </SessionProvider>
  );
}

export default MyApp; 