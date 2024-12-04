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
      console.log('Verifying wallet:', walletAddress);
      
      const response = await fetch('/api/verify-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: walletAddress })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Verification failed:', error);
        throw new Error('Failed to verify wallet');
      }

      const data = await response.json();
      console.log('Verification response:', data);

      if (data.verification) {
        console.log('Setting verification result:', data.verification);
        setVerifyResult(data.verification);
      } else {
        console.error('No verification data in response');
        throw new Error('Invalid verification response');
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