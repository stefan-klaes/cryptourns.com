---
name: commit-messages
description: >-
  Writes conventional commit messages and groups staged changes into commits.
  Use when the user asks to commit, write commit messages, or stage/split changes
  for git.
---

# Commit messages

## How many commits?

When the user asks you to commit their changes, **one commit is not required**.

- **Prefer several commits** when the diff clearly mixes unrelated concerns (e.g. a new feature plus a dependency bump plus unrelated refactors). Each commit should tell one story and be easy to revert or bisect.
- **`ai` commits stay alone**: Changes that belong to type `ai` (see table below) **must not** share a commit with application code, dependency bumps, or other non-`ai` work—always split into a separate commit (or commits) that only touch agent/skill/rule docs and tooling.
- **Prefer one commit** when everything is one logical change or a tiny follow-up that belongs with the same work.
- **Keep it simple**: aim for a small number of commits (often 1–3). Do **not** split into many micro-commits (per file or per trivial edit) unless the user explicitly wants that granularity.

If unsure, default to **fewer, clearer commits** over many tiny ones.

## Subject line (required)

```text
type(optional-scope): short description in imperative mood
```

- **Imperative, present tense** — as if completing: “This commit will …” (e.g. `add`, `fix`, not `added`, `fixes`).
- **Lowercase** start of the description; **no period** at the end.
- **Scope** is optional; use a short area name if it helps (`nav`, `wallet`, `api`). Do not use issue IDs as the scope.

**Common types**

| type       | Use for                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `feat`     | New user-facing capability or API                                                                                                                                         |
| `fix`      | Bug fix                                                                                                                                                                   |
| `refactor` | Internal change, same behavior                                                                                                                                            |
| `perf`     | Performance-only change                                                                                                                                                   |
| `style`    | Formatting, whitespace (no behavior change)                                                                                                                               |
| `test`     | Tests only                                                                                                                                                                |
| `docs`     | Documentation only                                                                                                                                                        |
| `build`    | Dependencies, build tooling, release version                                                                                                                              |
| `chore`    | Maintenance that does not fit above (e.g. `.gitignore`)                                                                                                                   |
| `ai`       | Agent-oriented docs and tooling only: `CLAUDE.md`, `AGENTS.md`, `.claude/` skills, `.cursor/` rules/skills, and similar—**never mix** with other types in the same commit |

**Breaking change**: append `!` before the colon, e.g. `feat(api)!: remove legacy endpoint`. Explain the break in the body or a `BREAKING CHANGE:` footer if needed.

## Body and footer (optional)

- **Body**: why the change, or context the subject does not carry. Imperative mood; blank line after subject.
- **Footer**: issue refs (`Closes #123`), or `BREAKING CHANGE: …` when applicable.

Skip the body when the subject is enough.

## Examples

```text
feat(wallet): add connect button and account sheet
```

```text
fix(nav): close mobile menu after route change
```

```text
build: bump wagmi and align peer dependencies
```

```text
ai(skills): document commit grouping and conventional types
```

```text
feat(api)!: drop v1 status route

BREAKING CHANGE: /v1/status removed; use /v2/status.
```
