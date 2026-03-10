# Conduit Protocol — Setup Guide

Complete instructions to get the project running from a fresh clone.

## Prerequisites

### 1. Rust + Cargo
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup default stable
rustc --version  # should be 1.94+
```

### 2. Solana CLI
```bash
# macOS / Linux
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
solana --version  # should be 2.1+

# Generate a dev wallet if you don't have one
solana-keygen new --no-bip39-passphrase
solana config set --url localhost
```

### 3. Anchor CLI
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install 0.30.1
avm use 0.30.1
anchor --version  # should be 0.30.1
```

### 4. Node.js + pnpm
```bash
# Node 20+ required
node --version

# Install pnpm
npm install -g pnpm@9
pnpm --version
```

### 5. (Optional) Docker
Only needed if you want the containerized local dev setup.
```bash
docker --version
docker compose version
```

---

## First-Time Setup

```bash
# 1. Clone and enter
git clone <repo-url> conduit
cd conduit

# 2. Install all dependencies
pnpm install

# 3. Copy environment config
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY

# 4. Build Anchor programs
anchor build

# 5. Get program IDs and update everywhere
anchor keys list
# Copy each program ID and update:
#   - Anchor.toml (programs.localnet section)
#   - programs/vault/src/lib.rs (declare_id!)
#   - programs/agent-registry/src/lib.rs (declare_id!)
#   - programs/settlement/src/lib.rs (declare_id!)
#   - programs/audit-log/src/lib.rs (declare_id!)
#   - sdk/src/utils/constants.ts
#   - .env

# 6. Rebuild after updating IDs
anchor build

# 7. Build TypeScript packages
pnpm build

# 8. Run tests
anchor test
```

---

## Development Loops

### Loop 1: Solana Programs (Rust)
```bash
# Terminal 1 — Start local validator
solana-test-validator --reset

# Terminal 2 — Build + deploy + test loop
anchor build && anchor deploy && anchor test --skip-local-validator
```

When editing Rust programs:
1. Edit code in `programs/*/src/`
2. Run `anchor build` to compile
3. Run `anchor test` to run integration tests
4. Fix errors, repeat

### Loop 2: TypeScript SDK
```bash
# After anchor build, copy IDL files
cp target/idl/*.json sdk/src/idl/

# Typecheck SDK
cd sdk && npx tsc --noEmit

# Build SDK (needed before agent/dashboard)
pnpm --filter @conduit/sdk build
```

### Loop 3: Agent Service
```bash
# Make sure SDK is built first
pnpm --filter @conduit/sdk build

# Start agent in dev mode
pnpm --filter @conduit/agent dev

# Or typecheck only
cd agent && npx tsc --noEmit
```

### Loop 4: Dashboard
```bash
# Make sure SDK is built first
pnpm --filter @conduit/sdk build

# Start Next.js dev server
pnpm --filter @conduit/dashboard dev
# Opens at http://localhost:3000

# Or build for production
pnpm --filter @conduit/dashboard build
```

### Loop 5: Full Stack (Docker)
```bash
docker compose -f docker/docker-compose.yml up
# Validator at localhost:8899
# Dashboard at localhost:3000
# Agent runs automatically
```

### Loop 6: End-to-End Test
```bash
# 1. Start validator
solana-test-validator --reset

# 2. Deploy programs
anchor deploy

# 3. Run seed script (creates test institution, agent, vault)
pnpm --filter @conduit/agent run seed

# 4. Start agent
pnpm --filter @conduit/agent dev

# 5. Start dashboard
pnpm --filter @conduit/dashboard dev

# 6. Open http://localhost:3000 and watch the agent work
```

---

## Devnet Deployment

```bash
# Switch to devnet
solana config set --url devnet

# Airdrop SOL for deployment
solana airdrop 5

# Deploy all programs
anchor deploy --provider.cluster devnet

# Update .env with devnet RPC
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# Build and deploy dashboard (Vercel)
cd dashboard && npx vercel
```

---

## Troubleshooting

**`anchor build` fails with "no such file or directory"**
→ Make sure you're in the repo root (where Anchor.toml lives)

**`Program ID mismatch`**
→ Run `anchor keys list` and update all declare_id! macros + constants.ts

**`account not found` during tests**
→ The test validator needs to be reset: `solana-test-validator --reset`

**`insufficient funds`**
→ Airdrop: `solana airdrop 5` (localnet has unlimited, devnet has limits)

**Windows Rust linker errors**
→ Solana/Anchor dev requires Mac or Linux. Use WSL2 on Windows:
```bash
wsl --install
# Then follow Linux instructions inside WSL
```
