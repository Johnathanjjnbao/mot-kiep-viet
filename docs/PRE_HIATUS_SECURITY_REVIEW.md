# Security review — pre-hiatus 0.3.10-stable.1

| Severity | Verified findings |
|---|---:|
| Critical | 0 |
| High | 0 |
| Medium | 1 development-tool advisory (12 affected dependency entries) |
| Low | 0 |

Scope: current TypeScript/React source, client cloud boundary, native careers, strict save import, public build, workflow and reachable history. Review date02/11/2026. This is a source/dependency review, not a claim of penetration testing against production.

## Dependency finding — development tools

Confidence HIGH. `minimatch10.2.6`, reached through ESLint and typescript-eslint, is affected by [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249). The advisory describes CPU/memory amplification for attacker-controlled glob patterns at optimizationLevel>=2. npm audit reports12 moderate entries because dependents inherit the one advisory. Production dependency audit reports0 vulnerabilities.

In this project, the matcher runs against repository-owned lint configuration during local/CI checks; it is absent from player runtime. Pages workflow accepts main pushes/manual runs, not an unauthenticated pattern submitted by a player. Treat this as P2 development-tool maintenance. No known player-facing path was found. Do not run untrusted lint configuration. No blind npm audit fix or major override was applied: the suggested fix includes incompatible tool downgrades. Reassess upstream compatible releases before future dependency updates. This finding remains OPEN and is not described as an all-zero audit.

## Source data-flow review

- Import boundary: `SaveManager.importFile` checks5MiB before reading; `parseSave` validates strict envelope/actions, replays from immutable setup, checks invariants and canonical equality. New stable selector is explicitly allowlisted. No import directly assigns a supplied state into the engine. Character/story strings render as React text; Graft found no `dangerouslySetInnerHTML` sink.
- Payments: freelancer status/deadline/review/payment gates end in a unique project payout and closed state; repeated received balance throws. Gaming resolves pending round once and uses a single prize transaction; platform audience/payout stays on the existing channel. Collaboration changes bounded channel audience, never invents an additional fee. Artist invoices keep gross/cut/received/cost separately, with unique show IDs, monthly clock, affordability and terminal retirement. Ledger invariants and canonical replays verify those boundaries.
- New v16 scenes permit only stat/flag effects. Their context reads recorded history and available NPCs. Narrative cannot create accounts, jobs, NPCs, balances or clock changes.
- Auth review: `useAccount.adopt` invalidates the old bound token, closes the old repository and creates a token closure per user; sequence checks reject stale adoption. Account cache ownership and remote owner filters remain unchanged. No account/cloud/SQL/RLS code changed in this candidate. PGlite regression is local evidence, not replacement for Auth/JWT live deny tests.
- Workflow retains contents:read, pinned actions and deploy-only Pages/OIDC permissions. Lazy screens do not delay the auth provider or parser. Service-worker policy remains public shell only; no API/Auth caching was introduced.
- Guest writes now compare the exact observed cell and commit in one IndexedDB readwrite transaction, using the same pending-write queue as raw reads. Unchanged autosaves do not refresh savedAt and invalidate another observer. Six concurrency tests and real desktop/mobile two-tab export checks passed. A conflicting branch stays in the UI for explicit export; no account recovery branch is falsely promised. Database name/version and saved envelope remain unchanged.

## Evidence and limits

Initial WIP secret scan:1827 text objects,0 findings, including source/public dist/reachable history. Source pre-push scan:1,974 text objects/0findings; CI source scan completed successfully. Final documentation scan and workflow are recorded in the external final recovery manifest. Public Supabase publishable configuration is intentionally public; no privileged credential was needed or copied.

Owner Email/Password live login: **NOT RUN** in this session. Live A/B/anonymous cloud deny run: **NOT RUN** in this session; no cloud code or policy changed. No production records, identities, permissions, migrations or backups were deleted or altered by this review.
