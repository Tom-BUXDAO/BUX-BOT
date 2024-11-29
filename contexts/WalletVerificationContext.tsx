import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface RoleUpdate {
  added: string[];
  removed: string[];
}

interface VerifyResult {
  isHolder: boolean;
  collections: Array<{
    name: string;
    count: number;
  }>;
  buxBalance: number;
  totalNFTs: number;
  totalValue: number;
  assignedRoles?: string[];
  roleUpdate?: RoleUpdate;
}

interface WalletVerificationContextType {
  verifyResult: VerifyResult | null;
  loading: boolean;
  error: string | null;
  verifyWallet: (address: string) => Promise<void>;
}

const WalletVerificationContext = createContext<WalletVerificationContextType | null>(null);

export function WalletVerificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastVerified, setLastVerified] = useState(0);
  const VERIFY_INTERVAL = 5 * 60 * 1000; // 5 minutes

  const verifyWallet = useCallback(async (walletAddress: string) => {
    if (!walletAddress || !session?.user?.id || status !== 'authenticated') return;
    
    // Check if we need to verify again
    const now = Date.now();
    if (now - lastVerified < VERIFY_INTERVAL) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/verify-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });

      if (!response.ok) {
        throw new Error(response.status === 401 ? 'Please log in again' : 'Failed to verify wallet');
      }

      const result = await response.json();
      setVerifyResult(result);
      setLastVerified(now);
    } catch (err) {
      console.error('Error verifying wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify wallet');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, status, lastVerified]);

  return (
    <WalletVerificationContext.Provider value={{ verifyResult, loading, error, verifyWallet }}>
      {children}
    </WalletVerificationContext.Provider>
  );
}

export function useWalletVerification() {
  const context = useContext(WalletVerificationContext);
  if (!context) {
    throw new Error('useWalletVerification must be used within a WalletVerificationProvider');
  }
  return context;
} 