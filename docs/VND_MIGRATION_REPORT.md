# v0.3.8-vnd.1 — VND economy migration

Source checkpoint: `54e1e0b438dc25f3b772067fd0a7796b6c101d23` (retail foundation preserved). Prior production: 0.3.7-yearly.1. **RELEASED — G5 guest VERIFIED PASS. Final implementation SHA `f2f454b3b5a390e07744837b0bae4874f1cd3b7e`.** Exact source [CI41300461817](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41300461817) completed/success; live verified after deployment.

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
- Full78 core E2E at `b065d568158f922e53f04811d594ec3dbfec1126`: PASS, zero failures/skips. A subsequent UI-only fix makes help use VND when no life is selected; two targeted VND/DSM help/save E2E, all six browser contexts and full verify256 passed again. Final full CI passed256/78 on `f2f454b3b5a390e07744837b0bae4874f1cd3b7e`; evidence `evidence/vnd-help-browser-results.json`. Six viewport/settings each measure HUD, full narrative and first choice before input;20 first/middle/last decisions and device viewport checks. New default VND full-life UI includes history, summary and SVG validation. Evidence: `evidence/vnd-release-browser-results.json` and `evidence/v038-vnd1-local-viewport.json`.
- Secret scan PASS over working files, public dist and all reachable Git blobs; evidence `evidence/vnd-secrets.json`.
- Exact-SHA CI/deploy PASS at `f2f454b3b5a390e07744837b0bae4874f1cd3b7e`; full verify256 and78E2E, secrets and production smoke independently confirmed from CI logs. Guest live G5 PASS.
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

## Footer release guard

Live asset comparison and VND/DSM play passed at6f2f545, but the Pages smoke correctly rejected a stale hardcoded footer label0.3.7-yearly.1. It is now0.3.8-vnd.1, with an E2E check against package.json to catch future release mismatches locally. Full verify256 and two targeted desktop/mobile VND/DSM/guide/footer tests passed. No financial rule or simulation changed. Evidence: `evidence/vnd-footer-browser-results.json`. Resolved and verified in `f2f454b3b5a390e07744837b0bae4874f1cd3b7e`: CI256/78, deployment and final live G5 all PASS.

## Final release evidence

| Gate | Result / evidence |
|---|---|
| Exact source build/deploy | PASS — `evidence/vnd-source-ci.json` |
| Raw HTML JS/CSS/SW names and SHA256 against local release build | PASS — `evidence/vnd-live-assets.json` |
| Live version, complete life, five household forms, choice/advance, autosave, manual slots, history retention/export/import and fonts | PASS — Edge1440×1000 and375×812, `evidence/vnd-live-pages.json` |
| VND and missing-flag DSM decisions, tuition/training/wardrobe/finance text, manual slots, reload, canonical export/import and help | PASS — Chromium/Firefox/WebKit ×1440×900/375×667, `evidence/vnd-live-browsers.json` |
| HUD/narrative/full first choice before input, exact device viewport,20 first/middle/last decisions | PASS — six settings, `evidence/v038-vnd1-live-viewport.json` |

[Play](https://johnathanjjnbao.github.io/mot-kiep-viet/) · [Repository](https://github.com/Johnathanjjnbao/mot-kiep-viet). Earlier pending statements in historical project notes describe intermediate checkpoints. The two live issues found during release (help without a selected life and the stale footer label) are fixed; no remaining guest release blocker. Cloud owner login is NOT RUN, not claimed as verified. Digital business remains isolated and historical nominal economy modelling remains future work. Documentation/evidence are committed in the follow-up commit containing this report; the implementation SHA above identifies the deployed code.
