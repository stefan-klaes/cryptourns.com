---
name: blockchain-functions
description: >-
  Guides on-chain and indexer reads in Cryptourns: `withFallback` composition,
  Alchemy vs viem vs future providers (e.g. Moralis). Use when adding or changing
  blockchain RPC, NFT/portfolio queries, or indexer clients under `src/lib/clients`.
---

# Blockchain functions (indexer & RPC)

## Layout in this repo

| Area | Path | Role |
|------|------|------|
| Fallback wrapper | `src/lib/clients/indexer/withFallback.ts` | Ordered async providers; first success wins |
| Alchemy (NFT API, asset transfers, metadata) | `src/lib/clients/indexer/alchemy/` | Rich indexing; not generic JSON-RPC |
| Viem (contract reads via public client) | `src/lib/clients/indexer/viem/` | On-chain `readContract` style calls |
| Public RPC client | `src/lib/clients/rpc/cryptournsPublicClient.ts` | Shared `PublicClient` (transport URL today: Alchemy) |
| Service surface | `src/lib/clients/indexer/services/*.ts` | App-facing functions; should use `withFallback` when multiple backends exist |

## Current `withFallback` behavior

- **Signature**: `withFallback(label, fn1, fn2?, ...)` — each `fn` has the same args and return type.
- **Semantics**: Calls `fn1`, then `fn2`, … until one resolves; **first successful result is returned**. On failure, logs `console.error('[indexer] ${label} fallback:', err)` and tries the next function. If all fail, rethrows the last error.
- **Single provider**: If only one function is passed, it is returned as-is (no extra wrapper or try/catch overhead).

Implementations must be **drop-in compatible**: same arguments, same normalized return shape, so callers never branch on provider.

## Stability: do not rely on Alchemy alone when you have alternatives

**Principle**: Blockchain reads should tolerate one provider being rate-limited, degraded, or wrong for a given call type. Prefer **layered** backends:

1. **Viem / standard RPC** — Use for anything expressible as chain state: `ownerOf`, registry reads, supply from contract if reliable, TBA address computation, etc. Viem is already the stack standard (see `CLAUDE.md`). Today the public client may still use an Alchemy-hosted RPC URL; **conceptually** viem is the abstraction; **URL failover** (second RPC provider) is a separate lever for stability.
2. **Alchemy** — Strong for NFT portfolio shapes, `getNFTs`, `alchemy_getAssetTransfers`, and metadata helpers that are painful to reproduce on raw RPC alone.
3. **Future: Moralis (or similar)** — Reasonable **secondary indexer** for NFT/wallet APIs when you need a different vendor’s availability or data shape. Treat like another `withFallback` step: normalize to the same domain types as Alchemy-backed code (`Asset`, portfolio rows, etc.).

**When adding a new read**:

- If it is **pure on-chain**: implement or reuse a **viem** function first; optionally add Alchemy only if it adds value (e.g. enriched metadata).
- If it is **indexer-heavy** (wallet NFT list, transfer history): keep Alchemy but plan a **second indexer** (another Alchemy route is weak; viem-only may be incomplete; Moralis or similar can be a real fallback once normalized).

**Current state (as of this skill)**: Several services wrap a **single** implementation in `withFallback` (e.g. portfolio and `getNfts` are Alchemy-only; owner/TBA are viem-only). That matches the API shape for future fallbacks but does **not** yet diversify providers — new work should **add** a second function to the same `withFallback` call when feasible.

## Patterns

- **Export from services**: `export const getX = withFallback("getX", primary, ...fallbacks);`
- **Label**: Use a stable string matching the export name for grep-friendly logs.
- **Order**: Put the preferred provider first (fastest, cheapest, or most accurate for the common case); put resilient or broader alternatives later.
- **Errors**: Do not swallow errors inside providers except to map to a common error type; let `withFallback` log and continue.

## RPC URL redundancy

`getCryptournsPublicClient()` is the single place that wires HTTP transport for viem reads. If you introduce a non-Alchemy RPC (or a second URL), keep **one** public client factory and document env vars (e.g. primary + fallback chain) so viem-based indexer code does not duplicate transport logic.

## Checklist before merging blockchain read changes

- [ ] Service exposed through `src/lib/clients/indexer/services/` with a clear name.
- [ ] If more than one viable backend exists, **multiple** functions are passed to `withFallback`.
- [ ] Return types match existing domain types (`Asset`, `Address`, portfolio rows, etc.).
- [ ] Sensitive or provider-specific quirks are isolated in `alchemy/`, `viem/`, or a future `moralis/` (or similar) module — not in React or route handlers.
