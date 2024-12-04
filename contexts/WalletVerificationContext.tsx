import { createContext, useContext, useState, useCallback } from 'react';
import { VerificationResult } from '@/types/verification';

interface WalletVerificationContextType {
  verifyResult: VerificationResult | null;
  setVerifyResult: (result: VerificationResult | null) => void;
  clearVerification: () => void;
  verifyWallet: (walletAddress: string) => Promise<void>;
}

const WalletVerificationContext = createContext<WalletVerificationContextType | undefined>(undefined);

export function WalletVerificationProvider({ children }: { children: React.ReactNode }) {
  const [verifyResult, setVerifyResult] = useState<VerificationResult | null>(null);

  const clearVerification = useCallback(() => {
    setVerifyResult(null);
  }, []);

  const verifyWallet = useCallback(async (walletAddress: string) => {
    try {
      const response = await fetch('/api/verify-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: walletAddress })
      });

      if (!response.ok) {
        throw new Error('Failed to verify wallet');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.verification) {
        setVerifyResult(data.verification);
      }

    } catch (error) {
      console.error('Verification error:', error);
      throw error;
    }
  }, []);

  return (
    <WalletVerificationContext.Provider 
      value={{ 
        verifyResult, 
        setVerifyResult, 
        clearVerification,
        verifyWallet 
      }}
    >
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