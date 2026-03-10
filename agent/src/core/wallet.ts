import { Keypair } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

export function loadWallet(keypairPath: string): Keypair {
  const resolvedPath = keypairPath.startsWith('~')
    ? path.join(os.homedir(), keypairPath.slice(1))
    : keypairPath;

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Keypair file not found: ${resolvedPath}`);
  }

  const secretKeyString = fs.readFileSync(resolvedPath, 'utf-8');
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  return Keypair.fromSecretKey(secretKey);
}

export function generateWallet(): Keypair {
  return Keypair.generate();
}

export function saveWallet(keypair: Keypair, outputPath: string): void {
  const resolvedPath = outputPath.startsWith('~')
    ? path.join(os.homedir(), outputPath.slice(1))
    : outputPath;

  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(resolvedPath, JSON.stringify(Array.from(keypair.secretKey)));
}
