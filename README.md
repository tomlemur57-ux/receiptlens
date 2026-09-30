# ReceiptLens

A dependency-free, read-only **Solana Devnet** transaction inspector.

## Demo

Expected Pages address after deployment: https://tomlemur57-ux.github.io/receiptlens/

The presence of this URL in the README is not evidence that deployment succeeded.
The publisher verifies the deployed HTML hash and saves its result locally.

Open `docs/index.html` for the complete auditable source. It calls only
`getTransaction` and `getSignatureStatuses` at the fixed public Solana Devnet RPC.
No wallet, key entry, signing, payment, transfer, airdrop or transaction submission
is implemented. Devnet has no real monetary value. Token instruction amounts
are not net recipient credits. A finalized transaction does not prove a real-world
commercial obligation was satisfied.

The app shows execution/finality, network fee, slot, block time, invoked programs,
canonical SPL token transfer instructions, native balance deltas, memos and signers.
Native balance changes include rent and fees. Unsafe integer balances are omitted.
Unknown time, fees and signer metadata are not guessed. Failed token instructions
are omitted. RPC IDs, transaction signature and status slot are validated.

## Local validation

Requires Node.js 18 or newer; no package installation:

```sh
node --test test/page.test.cjs
```

Tests use synthetic responses and a simulated DOM. They do not claim a live-chain
or hosted-browser test. The page also received nine Chromium in-memory DOM checks using injected
synthetic receipts during this repair; see VALIDATION.md.

## Provenance

AI-authored prototype prepared for the repository owner. Public demonstration
sample activity belongs to an unrelated third party. It is not the owner's income.
Not affiliated with Solana, Superteam or Colosseum. No prize or accepted submission
is implied. MIT license.
