# Validation — ReceiptLens 0.4.1

The exact page in `docs/index.html` passed JavaScript parsing and all 27 tests in
`test/page.test.cjs` in a Linux Node.js 22.16.0 environment during preparation.
These tests are repeated by the publisher before any GitHub write.
They cover synthetic finalized/failed results, exact amount preservation,
null/unsafe numbers, canonical program classification, RPC response identity,
transaction-signature/status-slot consistency, HTML escaping and stale exports.

Nine separate Chromium in-memory DOM checks with injected synthetic receipts passed.
Navigation was blocked by this environment; no browser navigation or RPC request
was executed in those nine checks. No live hosted end-to-end test was completed.

The earlier public Devnet observation of signature
`4irnZHz3Pvdazy14opVxjSLmHnSgUvu9iJesV39roTAZkSFw9Dg8fdQgBSxRBctAsmLuZerDfYa92pi1F8HAVoSr`
at slot 505834809 and fee 15500 lamports was recorded in an earlier run, not repeated
as part of this repair. Devnet sample funds are not real income.

The publisher records actual source and hosted-HTML verification separately.
It does not automatically assert competition eligibility or submit an entry.
