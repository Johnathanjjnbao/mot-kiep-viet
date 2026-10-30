# v0.3 resume — 30/10/2026

Recovered main HEAD 9bbffbc853a42582517bdd7f67ea7826c19fec79. Preserve the uncommitted cloud integration from the interrupted session. Existing local evidence is historical until the final release gates run again.

Owner supersedes email invitation/SMTP with a manually provisioned, confirmed Email/Password account. Signup stays disabled; the existing private allowlist remains the server permission boundary. No new migration is planned. Both approved migration hashes match their deployed versions.

## Context map (reviewed before changes)

| File                                                  | Purpose / required change                                                             |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------- |
| src/application/story-flow.ts                         | New bounded orchestration of existing choose/advance actions; no new engine semantics |
| src/application/useGameSession.ts                     | Synchronous current-run guard; reject obsolete decision tokens; use orchestration     |
| src/ui/LifeScreens.tsx                                | Stable story container, one-tap native buttons, compact outcomes, focus/viewport      |
| src/ui/App.tsx                                        | Stop scrolling to page top on each event; login/guest entry labels                    |
| src/ui/AccountPanel.tsx, src/cloud/auth.ts            | Existing-account login; remove email recovery/invitation UI                           |
| src/application/useAccount.ts                         | Keep scoped JWT and allowlist checks; update account wording                          |
| tests/story-flow.test.ts, tests/e2e/game.spec.ts      | Exact replay, effects/schedules, duplicate/stale choices, save/history, mobile focus  |
| scripts/check-pages.mjs, scripts/qa-cloud-browser.mjs | Update actual local/live journeys to continuous decisions                             |

Dependencies: engine dispatch/activeDefinition, domain GameRun/RunAction, existing persistence repository/parseSave, Auth SDK, current CSS fonts/colors, production service worker. Reference patterns: existing engine replay tests, legacy read-only E2E, real JWT A/B/anon QA.

Risk review: engine/content remain 2.0.0 and save schema 3 because only the sequence of existing recorded actions changes. No content/RNG/ledger mutation outside engine. Old saves remain readable; old outcome checkpoints can continue explicitly. Automatic progression stops at every active event, never selects a choice or performs management actions. Run 1,000-seed simulation as requested because application progression changes. SQL migrations stay unchanged. Existing-user permission is admin allowlist DML, not a schema change.

Design: retain Newsreader/Be Vietnam Pro and established paper/ink/leaf/rust palette. One stable story column, heading followed by choices; recent outcome follows the choices so variable feedback cannot displace them. Native buttons, focus on the new event heading with preventScroll, align story below header only on transitions, no nested scroller or decorative motion. Full feedback remains in the journal and an expandable recent-results area.

Status: implementation/testing in progress. SMTP/email recovery out of scope; owner login on live form requires their personal verification, no credentials in chat.
