# Cryptourns

**Cryptourns** is an NFT project: on-chain collectibles and related product surfaces built as a modern web app.

## Stack

| Layer | Choice |
|--------|--------|
| Framework | **Next.js 16** (App Router, React 19) |
| Wallet & chains | **Wagmi** + **RainbowKit** |
| Server/async state | **TanStack Query** |
| NFT accounts | **ERC-6551** token-bound accounts (Tokenbound) |
| Database | **Neon** (Postgres) |
| Hosting | **Cloudflare** |
| Tests | **Vitest** (Vite-based runner) |

Use this table as the intended architecture when adding dependencies or wiring new features.

## File naming

- **React components** — `ComponentName.tsx` (PascalCase file matches the default export).
- **Non-component modules** (hooks, utils, API helpers) — `functionName.ts` or `functionName.tsx` if JSX is required (camelCase).
- **Shared types** — `Type.ts` (PascalCase for the primary type name the file centers on).

Keep one main concern per file; colocate tests as `*.test.ts` / `*.test.tsx` next to sources or under a `__tests__` folder, consistent with the rest of the repo.

## Agent notes

For extra, repo-specific instructions, see `AGENTS.md` when present.
