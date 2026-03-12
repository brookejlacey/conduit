/**
 * Seed script — populates devnet/localnet with demo data for the Conduit Protocol demo.
 *
 * Usage: pnpm --filter @conduit/agent run seed
 *
 * Creates:
 * 1. Mock USX token mint + token accounts
 * 2. Institution (AMINA Demo Bank)
 * 3. Agent (Tier 3 — full authority)
 * 4. Vault with policy config
 * 5. Deposits into vault
 * 6. Yield accrual
 * 7. Settlement batch with entries
 * 8. Audit log entries
 */

import {
  Keypair,
  LAMPORTS_PER_SOL,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  createMint,
  mintTo,
  getOrCreateAssociatedTokenAccount,
  createAccount as createTokenAccount,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { createHash } from "crypto";
import { loadConfig } from "./config";
import { createConnection } from "./chain/connection";
import { createLogger } from "./logging/local";
import {
  createRegisterInstitutionIx,
  createRegisterAgentIx,
  createInitializeVaultIx,
  createInitializeSettlementConfigIx,
  createDepositIx,
  createAccrueYieldIx,
  createBatchIx,
  createAddEntryIx,
  createLogEventIx,
  PolicyConfigArgs,
} from "./chain/instructions";
import {
  findInstitutionPda,
  findAgentPda,
  findVaultPda,
  findDepositReceiptPda,
  findSettlementBatchPda,
  findSettlementEntryPda,
  findSettlementConfigPda,
  findAuditEntryPda,
  VAULT_PROGRAM_ID,
  SETTLEMENT_PROGRAM_ID,
  AUDIT_LOG_PROGRAM_ID,
} from "@conduit/sdk";
import * as fs from "fs";
import * as path from "path";

const logger = createLogger("seed");

const USX = 1_000_000; // 6 decimals

async function sendTx(
  connection: ReturnType<typeof createConnection>,
  tx: Transaction,
  signers: Keypair[],
  label: string,
) {
  try {
    const sig = await sendAndConfirmTransaction(connection, tx, signers);
    logger.info({ sig }, `${label} confirmed`);
    return sig;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // If account already exists (init constraint), skip gracefully
    if (msg.includes("already in use") || msg.includes("0x0")) {
      logger.warn(`${label}: account already exists, skipping`);
      return null;
    }
    throw err;
  }
}

async function main() {
  const config = loadConfig();
  const connection = createConnection(config.solana.rpcUrl);

  logger.info("=== CONDUIT SEED SCRIPT ===");

  // Load payer wallet
  const keypairPath = config.agent.keypairPath.replace("~", process.env.HOME || "");
  const resolvedPath = path.resolve(keypairPath);
  const payerSecret = JSON.parse(fs.readFileSync(resolvedPath, "utf-8"));
  const payer = Keypair.fromSecretKey(Uint8Array.from(payerSecret));

  logger.info({ wallet: payer.publicKey.toBase58() }, "Payer wallet loaded");

  const balance = await connection.getBalance(payer.publicKey);
  logger.info({ sol: balance / LAMPORTS_PER_SOL }, "Current balance");

  // Airdrop SOL if on localnet
  if (config.solana.rpcUrl.includes("localhost") || config.solana.rpcUrl.includes("127.0.0.1")) {
    logger.info("Airdropping SOL on localnet...");
    const sig = await connection.requestAirdrop(payer.publicKey, 10 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig);
    logger.info("Airdrop confirmed");
  }

  // =========================================================================
  // Step 1: Create mock USX mint
  // =========================================================================
  logger.info("Step 1: Creating USX mock token mint...");
  const usxMint = await createMint(
    connection,
    payer,
    payer.publicKey, // mint authority
    payer.publicKey, // freeze authority
    6 // 6 decimals like USDC
  );
  logger.info({ mint: usxMint.toBase58() }, "USX mint created");

  // Create payer's token account and mint USX
  const payerTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    usxMint,
    payer.publicKey,
  );

  const mintAmount = 50_000_000 * USX; // 50M USX for demo
  await mintTo(connection, payer, usxMint, payerTokenAccount.address, payer, mintAmount);
  logger.info({ amount: "50,000,000 USX" }, "Minted USX to payer");

  // =========================================================================
  // Step 2: Register institution
  // =========================================================================
  logger.info("Step 2: Registering institution (AMINA Demo Bank)...");

  const [institutionPda] = findInstitutionPda(payer.publicKey);
  const nameBytes = Buffer.alloc(32, 0);
  Buffer.from("AMINA Demo Bank").copy(nameBytes);
  const kycHash = createHash("sha256").update("AMINA-KYC-2026-DEMO").digest();

  const registerInstitutionTx = new Transaction().add(
    createRegisterInstitutionIx(institutionPda, payer.publicKey, nameBytes, kycHash),
  );
  await sendTx(connection, registerInstitutionTx, [payer], "Register institution");
  logger.info({ institution: institutionPda.toBase58() }, "Institution registered");

  // =========================================================================
  // Step 3: Register agent (Tier 3 — full authority)
  // =========================================================================
  logger.info("Step 3: Registering agent...");

  const [agentPda] = findAgentPda(institutionPda, payer.publicKey);
  const scopedPrograms = [VAULT_PROGRAM_ID, SETTLEMENT_PROGRAM_ID, AUDIT_LOG_PROGRAM_ID];

  const registerAgentTx = new Transaction().add(
    createRegisterAgentIx(
      institutionPda,
      agentPda,
      payer.publicKey,
      payer.publicKey,
      3, // Tier 3 = full authority
      scopedPrograms,
    ),
  );
  await sendTx(connection, registerAgentTx, [payer], "Register agent");
  logger.info({ agent: agentPda.toBase58() }, "Agent registered (Tier 3)");

  // =========================================================================
  // Step 4: Initialize vault with policy
  // =========================================================================
  logger.info("Step 4: Initializing vault...");

  const [vaultPda] = findVaultPda(payer.publicKey);

  // Create token account owned by the vault PDA
  const vaultTokenKeypair = Keypair.generate();
  const vaultTokenAccount = await createTokenAccount(
    connection,
    payer,
    usxMint,
    vaultPda,
    vaultTokenKeypair,
  );
  logger.info({ tokenAccount: vaultTokenAccount.toBase58() }, "Vault token account created");

  const policy: PolicyConfigArgs = {
    dailySpendLimit: new BN(10_000_000 * USX), // 10M USX daily limit
    maxSingleTxSize: new BN(5_000_000 * USX),  // 5M USX per transaction
    approvedCounterparties: [],                  // open for demo
    allowedTxTypes: 0b1111,                     // all types allowed
    dailySpent: new BN(0),
    lastResetTs: new BN(0),
  };

  const initVaultTx = new Transaction().add(
    createInitializeVaultIx(
      vaultPda,
      vaultTokenAccount,
      payer.publicKey,
      policy,
      [payer.publicKey], // multisig with payer as sole signer
      1,                 // threshold = 1
      institutionPda,
    ),
  );
  await sendTx(connection, initVaultTx, [payer], "Initialize vault");
  logger.info({ vault: vaultPda.toBase58() }, "Vault initialized");

  // =========================================================================
  // Step 5: Deposit USX into vault (multiple deposits)
  // =========================================================================
  logger.info("Step 5: Making deposits...");

  const deposits = [
    { amount: 5_000_000 * USX, label: "5M USX initial deposit" },
    { amount: 2_500_000 * USX, label: "2.5M USX institutional deposit" },
    { amount: 1_000_000 * USX, label: "1M USX follow-on" },
  ];

  for (let i = 0; i < deposits.length; i++) {
    const { amount, label } = deposits[i];
    const [depositReceiptPda] = findDepositReceiptPda(vaultPda, payer.publicKey, new BN(i));
    const depositKycHash = createHash("sha256").update(`deposit-${i}-kyc`).digest();

    const depositTx = new Transaction().add(
      createDepositIx(
        vaultPda,
        depositReceiptPda,
        payerTokenAccount.address,
        vaultTokenAccount,
        payer.publicKey,
        new BN(amount),
        depositKycHash,
      ),
    );
    await sendTx(connection, depositTx, [payer], label);
    logger.info({ amount: amount / USX, depositIndex: i }, `Deposit ${i} complete`);
  }

  // =========================================================================
  // Step 6: Accrue yield
  // =========================================================================
  logger.info("Step 6: Accruing yield...");

  // Create a yield source token account and fund it
  const yieldSourceKeypair = Keypair.generate();
  const yieldSourceTokenAccount = await createTokenAccount(
    connection,
    payer,
    usxMint,
    payer.publicKey,
    yieldSourceKeypair,
  );
  await mintTo(connection, payer, usxMint, yieldSourceTokenAccount, payer, 500_000 * USX);

  const accrueYieldTx = new Transaction().add(
    createAccrueYieldIx(
      vaultPda,
      yieldSourceTokenAccount,
      vaultTokenAccount,
      payer.publicKey,
      new BN(125_000 * USX), // 125K USX yield (1.47% on 8.5M)
    ),
  );
  await sendTx(connection, accrueYieldTx, [payer], "Accrue yield");
  logger.info({ yield: "125,000 USX" }, "Yield accrued");

  // =========================================================================
  // Step 7: Initialize settlement config + create batch
  // =========================================================================
  logger.info("Step 7: Creating settlement batch...");

  const [configPda] = findSettlementConfigPda();
  const initConfigTx = new Transaction().add(
    createInitializeSettlementConfigIx(configPda, payer.publicKey, new BN(3600)),
  );
  await sendTx(connection, initConfigTx, [payer], "Initialize settlement config");

  const batchId = new BN(1);
  const [batchPda] = findSettlementBatchPda(payer.publicKey, batchId);

  const createBatchTx = new Transaction().add(
    createBatchIx(batchPda, payer.publicKey, batchId),
  );
  await sendTx(connection, createBatchTx, [payer], "Create settlement batch");

  // Add settlement entries (cross-border payments)
  const entries = [
    { amount: 500_000 * USX, currency: [0x45, 0x55, 0x52], fxRate: 92_000_000, label: "USX→EUR 500K" }, // EUR
    { amount: 300_000 * USX, currency: [0x47, 0x42, 0x50], fxRate: 79_000_000, label: "USX→GBP 300K" }, // GBP
    { amount: 200_000 * USX, currency: [0x4A, 0x50, 0x59], fxRate: 15_700_000_000, label: "USX→JPY 200K" }, // JPY
  ];

  for (let i = 0; i < entries.length; i++) {
    const { amount, currency, fxRate, label } = entries[i];
    const [entryPda] = findSettlementEntryPda(batchPda, i);

    const addEntryTx = new Transaction().add(
      createAddEntryIx(
        batchPda,
        entryPda,
        vaultPda, // from vault
        vaultPda, // to vault (self for demo)
        payer.publicKey,
        new BN(amount),
        currency,
        new BN(fxRate),
      ),
    );
    await sendTx(connection, addEntryTx, [payer], label);
  }
  logger.info({ entries: entries.length }, "Settlement entries added");

  // =========================================================================
  // Step 8: Log audit entries
  // =========================================================================
  logger.info("Step 8: Creating audit log entries...");

  const auditEvents = [
    { action: 0, label: "Deposit", vault: vaultPda, amount: new BN(5_000_000 * USX) },
    { action: 0, label: "Deposit", vault: vaultPda, amount: new BN(2_500_000 * USX) },
    { action: 0, label: "Deposit", vault: vaultPda, amount: new BN(1_000_000 * USX) },
    { action: 2, label: "Rebalance", vault: vaultPda, amount: new BN(750_000 * USX) },
    { action: 5, label: "Yield Accrual", vault: vaultPda, amount: new BN(125_000 * USX) },
    { action: 3, label: "Settlement", vault: null, amount: new BN(1_000_000 * USX) },
    { action: 4, label: "Policy Update", vault: vaultPda, amount: null },
  ];

  for (let i = 0; i < auditEvents.length; i++) {
    const event = auditEvents[i];
    const nonce = new BN(i);
    const [auditEntryPda] = findAuditEntryPda(payer.publicKey, nonce);

    const reasoningText = `AI agent performed ${event.label} action. Analysis: optimal timing based on market conditions and vault utilization.`;
    const reasoningHash = createHash("sha256").update(reasoningText).digest();
    const reasoningUri = Buffer.alloc(64, 0);
    Buffer.from(`ipfs://demo-reasoning-${i}`).copy(reasoningUri);

    const logTx = new Transaction().add(
      createLogEventIx(
        auditEntryPda,
        payer.publicKey,
        agentPda,
        institutionPda,
        event.action,
        event.vault,
        event.amount,
        reasoningHash,
        reasoningUri,
        nonce,
      ),
    );
    await sendTx(connection, logTx, [payer], `Audit: ${event.label}`);
  }
  logger.info({ events: auditEvents.length }, "Audit entries logged");

  // =========================================================================
  // Summary
  // =========================================================================
  logger.info("");
  logger.info("=== SEED COMPLETE ===");
  logger.info({
    usxMint: usxMint.toBase58(),
    institution: institutionPda.toBase58(),
    agent: agentPda.toBase58(),
    vault: vaultPda.toBase58(),
    vaultTokenAccount: vaultTokenAccount.toBase58(),
    settlementBatch: batchPda.toBase58(),
    payer: payer.publicKey.toBase58(),
  });
  logger.info("");
  logger.info("Environment variables to set:");
  logger.info(`  USX_MINT=${usxMint.toBase58()}`);
  logger.info("");
  logger.info("Dashboard should now show:");
  logger.info("  - 1 institution (AMINA Demo Bank)");
  logger.info("  - 1 agent (Tier 3, full authority)");
  logger.info("  - 1 vault with 8.5M USX deposits + 125K yield");
  logger.info("  - 1 settlement batch with 3 cross-border entries");
  logger.info("  - 7 audit log entries");
  logger.info("");
  logger.info("Next: pnpm --filter @conduit/agent dev  (start agent)");
  logger.info("      pnpm --filter @conduit/dashboard dev  (start dashboard)");
}

main().catch((err) => {
  logger.error(err, "Seed script failed");
  process.exit(1);
});
