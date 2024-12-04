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

      if (!response.body) {
        throw new Error('No response body');
      }

      // Handle chunked response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
      }

      // Handle final chunk
      result += decoder.decode();

      try {
        const data = JSON.parse(result);
        if (data.error) {
          throw new Error(data.error);
        }
        if (data.verification) {
          setVerifyResult(data.verification);
        }
      } catch (error) {
        console.error('Error parsing verification result:', error);
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