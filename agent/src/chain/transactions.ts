import {
  Connection,
  Keypair,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
} from '@solana/web3.js';

export interface TransactionResult {
  signature: string;
  slot: number;
  success: boolean;
}

/**
 * Build and send a transaction with compute budget optimization.
 */
export async function buildAndSendTransaction(
  connection: Connection,
  payer: Keypair,
  instructions: TransactionInstruction[],
  signers: Keypair[] = [],
  computeUnits: number = 200_000,
): Promise<TransactionResult> {
  const tx = new Transaction();

  // Add compute budget instructions for optimal fees
  tx.add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnits }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 }),
  );

  for (const ix of instructions) {
    tx.add(ix);
  }

  const allSigners = [payer, ...signers];

  const signature = await sendAndConfirmTransaction(connection, tx, allSigners, {
    commitment: 'confirmed',
    maxRetries: 3,
  });

  const txInfo = await connection.getTransaction(signature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  });

  return {
    signature,
    slot: txInfo?.slot ?? 0,
    success: txInfo?.meta?.err === null,
  };
}

/**
 * Get a recent blockhash with a fresh fetch.
 */
export async function getRecentBlockhash(connection: Connection): Promise<string> {
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  return blockhash;
}
