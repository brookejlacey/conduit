/**
 * Seed script — populates devnet/localnet with demo data for the Conduit Protocol demo.
 *
 * Usage: pnpm --filter @conduit/agent run seed
 *
 * Creates:
 * 1. A mock USX token mint
 * 2. Token accounts with 10M USX for demo
 *
 * After running, use Anchor tests or CLI to:
 * - register_institution
 * - register_agent
 * - initialize_vault
 * - deposit USX
 */

import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  createMint,
  mintTo,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { loadConfig } from "./config";
import { createConnection } from "./chain/connection";
import { createLogger } from "./logging/local";
import * as fs from "fs";
import * as path from "path";

const logger = createLogger("seed");

async function main() {
  const config = loadConfig();
  const connection = createConnection(config.solana.rpcUrl);

  logger.info("Starting seed script...");

  // Load payer wallet
  const keypairPath = config.agent.keypairPath.replace("~", process.env.HOME || "");
  const resolvedPath = path.resolve(keypairPath);
  const payerSecret = JSON.parse(fs.readFileSync(resolvedPath, "utf-8"));
  const payer = Keypair.fromSecretKey(Uint8Array.from(payerSecret));

  logger.info({ wallet: payer.publicKey.toBase58() }, "Payer wallet loaded");

  // Airdrop SOL if on localnet
  if (config.solana.rpcUrl.includes("localhost") || config.solana.rpcUrl.includes("127.0.0.1")) {
    logger.info("Airdropping SOL on localnet...");
    const sig = await connection.requestAirdrop(payer.publicKey, 10 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig);
    logger.info("Airdrop confirmed");
  }

  // 1. Create mock USX mint
  logger.info("Creating USX mock token mint...");
  const usxMint = await createMint(
    connection,
    payer,
    payer.publicKey, // mint authority
    payer.publicKey, // freeze authority
    6 // 6 decimals like USDC
  );
  logger.info({ mint: usxMint.toBase58() }, "USX mint created");

  // 2. Create token accounts and mint USX to payer
  const payerTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    usxMint,
    payer.publicKey
  );

  // Mint 10M USX for demo
  const mintAmount = 10_000_000 * 1_000_000; // 10M with 6 decimals
  await mintTo(connection, payer, usxMint, payerTokenAccount.address, payer, mintAmount);
  logger.info({ amount: "10,000,000 USX" }, "Minted USX to payer");

  // Log summary
  logger.info("=== SEED COMPLETE ===");
  logger.info({
    usxMint: usxMint.toBase58(),
    payer: payer.publicKey.toBase58(),
    payerTokenAccount: payerTokenAccount.address.toBase58(),
  });

  logger.info("");
  logger.info("Next steps:");
  logger.info("1. Update .env with USX_MINT=" + usxMint.toBase58());
  logger.info("2. Use the Anchor test suite or CLI to:");
  logger.info("   - register_institution (AMINA Demo Bank)");
  logger.info("   - register_agent (Tier 3)");
  logger.info("   - initialize_vault (with policy)");
  logger.info("   - deposit USX into vault");
  logger.info("3. Start the agent: pnpm --filter @conduit/agent dev");
  logger.info("4. Start the dashboard: pnpm --filter @conduit/dashboard dev");
}

main().catch((err) => {
  logger.error(err, "Seed script failed");
  process.exit(1);
});
