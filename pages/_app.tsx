import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import {
  ConnectionProvider,
  WalletProvider
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { useMemo } from 'react';
import { getWalletAdapters, walletConfig } from '@/utils/walletConfig';
import '@solana/wallet-adapter-react-ui/styles.css';
import '../styles/globals.css';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const wallets = useMemo(() => getWalletAdapters(), []);

  return (
    <SessionProvider session={session}>
      <ConnectionProvider endpoint={walletConfig.endpoint}>
        <WalletProvider wallets={wallets} autoConnect={walletConfig.autoConnect}>
          <WalletModalProvider>
            <Component {...pageProps} />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </SessionProvider>
  );
} 