import { createContext, useContext, useState, useCallback } from 'react';
import { VerifyResult } from '@/types/verification';

interface WalletVerificationContextType {
  verifyResult: VerifyResult | null;
  verifyWallet: (walletAddress: string) => Promise<void>;
  isVerifying: boolean;
  error: string | null;
}

const WalletVerificationContext = createContext<WalletVerificationContextType | undefined>(undefined);

export function WalletVerificationProvider({ children }: { children: React.ReactNode }) {
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyWallet = useCallback(async (walletAddress: string) => {
    setIsVerifying(true);
    setError(null);
    
    try {
      const response = await fetch('/api/verify-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      });

      if (!response.ok) {
        throw new Error('Failed to verify wallet');
      }

      const result = await response.json();
      console.log('Verification result:', result);
      setVerifyResult(result); // This triggers UI updates
    } catch (err) {
      console.error('Error verifying wallet:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsVerifying(false);
    }
  }, []);

  return (
    <WalletVerificationContext.Provider value={{ verifyResult, verifyWallet, isVerifying, error }}>
      {children}
    </WalletVerificationContext.Provider>
  );
}

export function useWalletVerification() {
  const context = useContext(WalletVerificationContext);
  if (context === undefined) {
    throw new Error('useWalletVerification must be used within a WalletVerificationProvider');
  }
  return context;
} 