# ReceiptLens

A dependency-free, read-only **Solana Devnet** transaction inspector.

## Demo

Live MVP: https://tomlemur57-ux.github.io/receiptlens/

The hosted page and its public sample lookup were verified in a browser on
5 October 2026. The sample returned a finalized Devnet receipt at slot 505834809;
this live observation is separate from the synthetic tests below.

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

Public demonstration sample activity belongs to an unrelated third party.
It is not the owner's income.
Not affiliated with Solana, Superteam or Colosseum. No prize or accepted submission
is implied. MIT license.
