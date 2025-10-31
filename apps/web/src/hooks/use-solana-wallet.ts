'use client';

import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';

/**
 * Custom hook to interact with Solana wallet through Wallet Adapter
 * Provides easy access to wallet address, connection, and transaction signing
 */
export function useSolanaWallet() {
  const { publicKey, connected, signTransaction, signAllTransactions, sendTransaction } = useWallet();
  const { connection } = useConnection();

  // Sign and send a transaction
  const signAndSendTransaction = async (
    transaction: Transaction,
    options?: { skipPreflight?: boolean }
  ): Promise<string> => {
    if (!publicKey || !sendTransaction) {
      throw new Error('No Solana wallet connected');
    }

    try {
      // Get latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Send the transaction (wallet adapter handles signing)
      const signature = await sendTransaction(transaction, connection, {
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
    wallet: { publicKey, connected },
    address: publicKey?.toBase58() || null,
    publicKey,
    connected,
    
    // Solana connection
    connection,
    
    // Transaction methods
    signTransaction,
    signAllTransactions,
    signAndSendTransaction,
    sendTransaction,
  };
}

