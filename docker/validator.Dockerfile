FROM solanalabs/solana:v1.18.26

# Create a genesis config directory
RUN mkdir -p /root/.config/solana

# Generate a default keypair for the validator
RUN solana-keygen new --no-bip39-passphrase -o /root/.config/solana/id.json

# Expose RPC and WebSocket ports
EXPOSE 8899 8900

# Start the test validator
CMD ["solana-test-validator", \
     "--bind-address", "0.0.0.0", \
     "--rpc-port", "8899", \
     "--ledger", "/tmp/test-ledger", \
     "--reset"]
