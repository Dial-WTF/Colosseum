'use client';

import { useWallets } from '@privy-io/react-auth';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { useMemo } from 'react';

/**
 * Custom hook to interact with Solana wallet through Privy
 * Provides easy access to wallet address, connection, and transaction signing
 */
export function useSolanaWallet() {
  const { wallets } = useWallets();

  // Get the Solana wallet from Privy
  const solanaWallet = useMemo(
    () => wallets.find((wallet) => wallet.walletClientType === 'solana'),
    [wallets]
  );

  // Get wallet address as PublicKey
  const publicKey = useMemo(() => {
    if (!solanaWallet?.address) return null;
    try {
      return new PublicKey(solanaWallet.address);
    } catch (error) {
      console.error('Invalid Solana address:', error);
      return null;
    }
  }, [solanaWallet?.address]);

  // Get Solana connection (using public RPC by default, can be configured via env)
  const connection = useMemo(() => {
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    return new Connection(rpcUrl, 'confirmed');
  }, []);

  // Sign a transaction using Privy wallet
  const signTransaction = async (transaction: Transaction): Promise<Transaction> => {
    if (!solanaWallet) {
      throw new Error('No Solana wallet connected');
    }

    try {
      // @ts-expect-error - Privy wallet provider types need updating
      const signedTx = await solanaWallet.signTransaction(transaction);
      return signedTx;
    } catch (error) {
      console.error('Error signing transaction:', error);
      throw error;
    }
  };

  // Sign multiple transactions
  const signAllTransactions = async (transactions: Transaction[]): Promise<Transaction[]> => {
    if (!solanaWallet) {
      throw new Error('No Solana wallet connected');
    }

    try {
      // @ts-expect-error - Privy wallet provider types need updating
      const signedTxs = await solanaWallet.signAllTransactions(transactions);
      return signedTxs;
    } catch (error) {
      console.error('Error signing transactions:', error);
      throw error;
    }
  };

  // Sign and send a transaction
  const signAndSendTransaction = async (
    transaction: Transaction,
    options?: { skipPreflight?: boolean }
  ): Promise<string> => {
    if (!solanaWallet || !publicKey) {
      throw new Error('No Solana wallet connected');
    }

    try {
      // Get latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Sign the transaction
      const signedTx = await signTransaction(transaction);

      // Send the transaction
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: options?.skipPreflight ?? false,
      });

      // Confirm the transaction
      await connection.confirmTransaction(signature, 'confirmed');

      return signature;
    } catch (error) {
      console.error('Error signing and sending transaction:', error);
      throw error;
    }
  };

  return {
    // Wallet state
    wallet: solanaWallet,
    address: solanaWallet?.address || null,
    publicKey,
    connected: !!solanaWallet,
    
    // Solana connection
    connection,
    
    // Transaction methods
    signTransaction,
    signAllTransactions,
    signAndSendTransaction,
  };
}

