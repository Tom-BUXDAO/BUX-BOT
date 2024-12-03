import { createContext, useContext, useState, useCallback } from 'react';
import { VerificationResult } from '@/types/verification';

interface WalletVerificationContextType {
  verifyResult: VerificationResult | null;
  setVerifyResult: (result: VerificationResult | null) => void;
  clearVerification: () => void;
  verifyWallet: (address: string) => Promise<void>;
}

const WalletVerificationContext = createContext<WalletVerificationContextType | undefined>(undefined);

export function WalletVerificationProvider({ children }: { children: React.ReactNode }) {
  const [verifyResult, setVerifyResult] = useState<VerificationResult | null>(null);

  const clearVerification = useCallback(() => {
    setVerifyResult(null);
  }, []);

  const verifyWallet = useCallback(async (address: string) => {
    try {
      const response = await fetch('/api/verify-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to verify wallet');
      }

      const data = await response.json();
      setVerifyResult(data.verification);
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