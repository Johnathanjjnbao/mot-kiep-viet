# v0.3.8-vnd.1 — VND economy migration

Source checkpoint: `54e1e0b438dc25f3b772067fd0a7796b6c101d23` (retail foundation preserved). Prior production: 0.3.7-yearly.1. Implementation and local gates: PASS. Exact-SHA deployment and live checks: PENDING.

## Context map

| Boundary | Files | Decision |
|---|---|---|
| Immutable unit | domain/model.ts, creator.ts, currency.ts | Optional setup.currency; absent means dsm-v1 |
| Ledger | engine/finance.ts | transact takes raw denomination, sole balance writer |
| Design amounts | content/world.ts, engine/engine.ts, academics.ts, employment.ts, social.ts, wardrobe.ts | Convert authored amounts once; percentages apply to raw balances |
| UI | ui/common.tsx, NewLife.tsx, LifeScreens.tsx, Panels.tsx, AcademicPanel.tsx, EmploymentPanel.tsx, Wardrobe.tsx, App.tsx, styles.css | New creator opts into VND; context-aware formatting |
| Replay/export/history | persistence/saves.ts, application/summary.ts, diagnostics/simulation.ts | Schema4 unchanged, flag participates in canonical replay |
| Isolated business | engine/enterprise.ts | Unit-aware capital, costs, limits and per-order fees; no new shop UI |

## Economy contract

1 design unit = 200,000 VND at designed 2026 purchasing power. This is a gameplay conversion, not an exchange rate or a claim about historical nominal prices. Housing and existing authored prices retain their relative design values. Existing era, region, experience and performance multipliers remain. New VND lives store integer dong in every financial balance, asset and posting; old lives retain their original units and replay rules. Mandatory costs draw savings then record a credit deficit. Month settlement rejects duplicates. No SQL, cloud, Auth, RLS, database ID or engine/content version changes are needed for the immutable schema4 setup selector. Frozen rulesets are untouched.

## Validation

- `npm.cmd run verify` with `VITE_BASE_PATH=/mot-kiep-viet/`: PASS (256 tests /27 files; typecheck, lint, content validation and build).
- Nine historical golden tests unchanged and PASS; separate VND full-life golden `3126831863`. Frozen v1/v2 source remains unchanged.
- 13 targeted VND tests: raw initialization, formatting, salary/living costs, tuition/support/scholarship/part-time postings, savings/loans/housing/wardrobe, mandatory deficit credit, one-dong interest, duplicate settlement, overflow/fraction rejection, selector tampering, canonical import/replay, isolated retail quantities and monetary conversion.
- `npm.cmd run simulate -- 1000 --annual --creator --vnd`: 1,000 complete lives +1,000 canonical replays, zero invariant violations/failures; max428 actions and700,545 bytes (<512 /5MiB). 145,049 event checks, minimum4/max5 enabled choices. Zero missing/skipped ages; endings65–107 (mean87.16). Net worth may be negative because debt is recorded, never silently clamped. Evidence: `evidence/vnd-simulation-1000.json`.
- `npm.cmd run test:production` on the Pages subpath build: PASS (new VND life, choice, advance, autosave, reload, built fonts/license/assets). Existing build-size warning remains informational.
- VND/DSM browser roundtrips: PASS in Chromium, Firefox and WebKit, desktop1440×900/mobile375×667 (six contexts), with canonical decisions, VND tuition/training labels, wardrobe/finance without legacy unit text, distinct manual slots, manual load, export/import, reload and full-width integer money. Evidence: `evidence/vnd-local-browsers.json`.
- Full final78 E2E: PASS, zero failures/skips. Six viewport/settings each measure HUD, full narrative and first choice before input;20 first/middle/last decisions and device viewport checks. New default VND full-life UI includes history, summary and SVG validation. Evidence: `evidence/vnd-release-browser-results.json` and `evidence/v038-vnd1-local-viewport.json`.
- Secret scan PASS over working files, public dist and all reachable Git blobs; evidence `evidence/vnd-secrets.json`.
- Exact-SHA CI/deploy and live checks: PENDING.
- QA fixture initially omitted the existing `decisionKey` argument, so its expected state was correctly rejected by the stale-choice guard; fixed in QA, no gameplay guard changed. The two currency fixtures now save to separate empty manual slots, preserving the existing overwrite confirmation. Wardrobe E2E now expects the actual denomination rather than subtracting12 raw dong.
- Cloud owner login remains NOT RUN; no SQL/Auth/RLS or cloud authorization change in this release.

## Financial coverage and limits

| System | Implementation |
|---|---|
| Opening money / family transfers / cohabitant contribution / pension | Authored amounts → raw denomination at source |
| Salary, temporary employment, old freelance/business income | Existing wage, experience, performance and period rules; converted income once |
| Layoff support / training | Raw salary-based support with converted cap; converted training price |
| Monthly living / rent / children | Existing household formula and era factor, converted once |
| Education / scholarship / family tuition support / part-time | Converted tuition then percentage support in integer dong; full ledger entries |
| Events and delayed effects | Authored base effects retained; applyEffect converts cash once; minCash/minDebt and affordability use same boundary |
| Housing / wardrobe | Converted price, affordability, ledger, stored asset value and memories |
| Savings / debt / interest | Converted transfer steps and limits; interest on raw balances with ceil/floor in dong; no duplicate month |
| Isolated retail foundation | Capital/funding API arguments are raw run-denominated amounts; run-denominated stock valuation, operating/marketing/per-order fees, revenues, COGS, limits and liquidation; order counts/stats unchanged; no runtime/UI integration |
| Display / history / exports | Explicit run context for HUD, birth/creator, career/academic/finance/wardrobe, journal/summary and SVG card; canonical save uses immutable setup flag |

Housing still costs120,000,000 VND under the old600-unit authored design. A50-unit transfer is10,000,000 VND. These intentionally preserve relative gameplay prices and are not market appraisals. Salaries retain the existing progression and situational multipliers, so a stated worker/entry/skilled target is a design illustration rather than a guaranteed wage. Historical inflation, redenomination and nominal-price modelling remain a separate future milestone.

## Review

Self-review traced all current engine transact/mandatoryCost callers and raw monetary thresholds, UI money callers and authored monetary prose. No player balance writes added outside transact. No extra action type or budget expansion. Save parser recomputes the run and rejects selector-only edits; old saves are not automatically stamped with currency. No production data, player save, credential or database identifier was changed. Retail remains an internal reducer, not a claim that digital career/business expansion is complete.
