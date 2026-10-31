# M5 long-run handoff

31/10/2026, Asia/Saigon. Start2b24ebd178a4382d1240fe539de2d54d83a1ea3f/main sạch, khớp remote. Creator giữ nguyên.

## A. Dynamic Life

Nguyên nhân: RNG hoạt động và400replays khớp; nhưng tuổi3 có đúng3candidates ở cấu hình cố định, và priority30 ép first-school tại bước2/200 đời. education-path cũng bắt buộc ở bước7. Baseline193/200chuỗi5đầu đã vượt mục tiêu40, nên không gọi việc tăng unique first10 là cải thiện (trước/sau đều200).

| Sample | Seeds | First scene before/after | Unique first5 before/after | Unique first10 |
| --- | --- | --- | --- | --- |
| Cùng setup |200|3/11|193/200|200/200|
| Nhiều setup |200|4/15|193/200|200/200|

Giải pháp: setup.lifeRules=dynamic-v1 immutable, chỉ UI đời mới bật. Oldmissing giữ toàn bộ selector/RNG/content cũ; không migration.20early scenes khác quyết định/state và3adult followups (friendship/project/budget), điều kiện environment/wealth/region/era/parent+playertraits;6boundedflags vàschedule ổn định. Đến trường và exam trước18 là mandatory; optional childhood dùng prioritysoftweight và giảm trọng số category vừa gặp. Adults giữ priority/family/social hiện hữu. Không đổi thứ tựchoices, không synonyms-only.

Data before/after: evidence/m5-diversity-before.json vàafter.json, mỗifile400lives (200same+200diverse), first5/10/pools/categories/coverage/fallback. Baseline luôn chọn firstenabled, không chứng nhận cân bằng với mọi policy. Hai sample không fallback. Every23templates cóforced4distinct enabled paths;1000seed quan sát23/23mới,135/138template tổng;0fallback trong96.709event checks.

Version0.3.6-life-diversity.1, engine/content3/schema4, expansions cũ vàplayerTraits optional giữ nguyên. Frozen v1/v2 không sửa. Golden mới3732162397 (golden-dynamic-v1), độc lập5goldens cũ;400recorded old opening sequences không thay expected. Strict setup +canonical replay chống gắn ruleset lênsavecũ. Không DBID/UUID/slot/history/CAS/RLS/Auth/SQL thay đổi.

Local gates: verify140tests/17files/type/lint/content138templates/7arcs/buildPages PASS; E2E40/40 gồm6viewport×20/126pre-input measurements; newlife UI tests cùngseed/counters đúng,2fresh starts khôngrefresh khôngreuse seed; Chromium/Firefox/WebKit6/6journeys PASS; production subpath smoke PASS. Simulation1000distinctseed/1000replay/0violations,500creatoropt-in, max227actions/539118bytes. Sau đó chỉ sửa narrative dl-stage, không thay GameRun transitions, nên không lặp1000seed. Auditproduction0advisories. Secret scan vàCI/live đang chốt.

Failures được giữ rõ: lầnverify đầu dừng lint unused diagnostic variable; một currentcontent-count assertion cần tách115released/23new (không đổi golden); dl-computer được sửa theo model technologyfrom2000; một E2E run bị hủy vì trỏdist cũ sauverify fail (không tínhPASS); full E2E39/40 phát hiện choiceđầu bịcắt8px ởlarge-text/dl-stage, biên tập câu dẫn rồi target1/1 vàfull40/40 PASS. Không nới đo, khôngclamp/auto-scroll làm bằng chứng.

Tooling: Graft0.28.1 chạy qua C:/Users/triba/Documents/Codex/MKV_TOOLS/graft.cmd; Trailglobalwrapper vẫn thiếumodule. MCP cấu hìnhenabled trongcodex mcp list, nhưng khôngtoolGraft expose trong hostnày; CLIask/callers/skeleton/grep/build/check dùng thật, khônginit/deep/APIpaid.22global+5systemskills kiểm kê. Graph147cards/733nodes/1803edges trướcfinal changes, refresh tiếp saucheckpoint.

Securityreview scope: newsetup→selector→choices/schedules/ledger→replay, UI chỉdraft/start; no eval/HTML/runtimeAI/Math.random; references friend/residentparent ổn định; transactions qua existingledger. Khôngfinding trongdiff, không phải pentest. Realcloud readiness noninteractive status1/authenticationUnavailable=true; không lặp login, không QAidentities hay productionwrites. Owner tựloginNOT RUN.

Skills thực dùng: Graft workflow; Humanizer(newVietnamese scenes), WebappTesting(Playwright), WebDesignReviewer(ảnh+geometry), SecurityReview(replay/ledger boundaries), SecretScanning(prepush). FrontendDesign sẽ dùng ởUniversity UI. Không subagent/Antigravity/newskills.

## B/C tiếp theo

University0/12, admissions/progression/qualifications chưa triển khai; Jobapplications/rejection/cooldown/unemployment mới chưa triển khai. Digital/business/military NOT RUN, military NOT READY. B cần ruleset education-v1 táchdynamic-v1, không sửa v2/v3/family/dynamic goldens.12programs, tuitionledger/aid, từngterm códistinctchoices, delayedfailure/dropout/graduation vàcareerqualification guards. SauB ổn định mớiC. Không longevity/international/VND.

Currentpublication chưa gọiG5 PASS cho tới exactSHA CI+live. Source vàfinalSHA cập nhật saucommit.

A pre-push secret scan891objects/0findings PASS; source diff reviewed, frozen sources unchanged.

## A release verified

Source d3212f4f39bf889a2f72b47993fcaf391bed50ae/main; CI41208545352 completed/success build/deploy. Liveguest1440/375 andChromium/Firefox/WebKit6/6 diversity journeys VERIFIED PASS, freshseeds+sameexplicitseed/openings/one-tap/save-load/history/fonts/assets. JS/CSS/SW match local releasebytes. Evidence m5-diversity-live-*.json. G5guest A PASS, cloud BLOCKED. B source now in progress locally and not yet released.

## B. University — implemented, local release gates in progress

Version `0.3.6-university.1`, immutable `setup.lifeRules=education-v1`, engine/content 3.0.0/schema4 unchanged. Missing flag and dynamic-v1 retain old semantics, including separate historical goldens. New education golden 2785536325; old dynamic golden 3732162397 remains unchanged. NewLife enables education-v1 only for newly created lives. Save replay parses academic actions strictly, verifies all authoritative state, and preserves all storage identities.

Twelve actual program models: IT, engineering, health sciences (six years), business, accounting/audit, finance/banking, law, education, Korean, English, design/art, communications/marketing. Each has its own ID, fee/requirements/difficulty/era/skill pair/career links, description and incident with four paths. Durations are four years except health sciences. Era/fees/admission scores are fictional model parameters; health/law do not create a medical/legal license. There are 13 new education templates including the direction choice; total151 authored templates/7 arcs. An assessment is scheduled each year rather than treating enrollment as graduation.

Admission rejection costs no tuition and imposes a six-month same-program cooldown. Accepted applications record study only. Yearly tuition, conditional scholarship, family support and annual part-time income use idempotent ledger keys. Failed assessments repeat a year; rest defers progression. Repeated failure/rest eventually closes a program without a degree. Pause/resume preserves prepaid tuition and completed years. Accepted switching closes the previous record and starts a distinct program; rejection preserves the old program. Dropout awards no degree. Only completed required years create the matching qualification. Education degree gates the simulated teaching career for these new lives; other nonregulated job routes remain available under existing requirements. The new job application/unemployment model is not implemented in B.

UI: AcademicPanel in Career tab, searchable12-program catalog, duration/fee/requirements/skills/career links, unavailable reasons, conditional aid, application feedback, current progress, pause/resume/dropout/switch, recorded qualifications/history. No direct GameRun mutation. Academic focus cannot nest social/family; annual evaluation interrupts advance. Full-time study cannot coexist with a full-time career; paused studies can work to recover fees. Shared120 family management budget includes academics;40 academic operations,24 applications and12 studies bound state/action growth.

Verification: npm.cmd run verify163 tests/18 files PASS, typecheck/lint/content/build Pages PASS. Each12-program unit scenario completes degree, checks ledger and exact save/replay; rejection, cooldown, pause/resume, switch, failed year, failed program, internship, fake degree, insufficient funds/recovery and120-budget boundary tested. SQL003 envelope also accepts education-v1 academic payload locally in PGlite, with old identity/size/version guards retained; no production SQL applied, no real JWT claim.

Corrected simulation:1000 seeds/1000 canonical replays,500 creator-trait opt-ins,0 invariant failures,0 fallback,89,108 event checks with4–5 enabled choices. Admissions838 accepted/263 rejected;467 graduated/200 failed/170 paused/110 internships at the end. These are counts from one deterministic policy sample, not real admission rates. Dropped/switched and new natural children were0 in this sample; targeted tests cover dropout/switch and existing family tests remain, so do not claim natural cross-system child coverage. Max271 actions/546847-byte save. Evidence `m5-university-simulation.json`.

Failures/limits: the first1000-run controller incorrectly requested social interaction during academic focus; the engine rejected it. That batch was stopped and is not counted. Added eligibility/focus guards plus regression;30 debug lives and the final1000 pass. Initial full E2E used dev rather than production preview and was stopped; not counted as release evidence. The existing adult-job UI test searched an old education label, updated for the new direction choice after confirming the current content. WebKit exposed a QA helper race reading autosave before persistence; the helper now rejects pending reads correctly and importStudent polls until exact canonical equality, retaining strict assertions. No gameplay changes followed the final simulation.

B release status pending final E2E/browser/CI/live evidence. C employment remains INCOMPLETE. Digital/business not begun; military NOT READY because historical primary-source research is not complete. Cloud real QA BLOCKED, owner self-login NOT RUN. Next work should begin from this ruleset with a new immutable career selector, preserving both B and A goldens.

Additional browser regression: current university direction has four paths, so the first20 mixed-choice journey now naturally observes4/5 choices rather than4/5/6. Retained explicit6-choice coverage with a real replay-valid dynamic-v1 save (`tests/data/viewport-dynamic-v1.json`, generator in scripts/make-viewport-fixture.ts). Each viewport still makes20 first/middle/last choices in a new education-v1 life; then imports/reloads the old save and measures its six-choice layout before input. Geometry/HUD/narrative/focus/long-text/axe assertions remain. An overlapping targeted Playwright invocation also invalidated old trace artifacts; that run is not release evidence. Final complete suite runs alone after all helper fixes.

Local university browser harness: Chromium/Firefox/WebKit ×1440×900 and375×667 =6/6 VERIFIED PASS. Each journey submits all12 programs with one charge/no premature degree, completes Korean qualification, exports/replays/three-slot saves/reloads exactly, and handles rejection/cooldown/pause/resume/switch/dropout; axe0 and no page errors. Screenshots of assessment/catalog/degree inspected, including WebKit375. Additional UI flow from the actual direction event to application/acceptance at20 years passed desktop/mobile (`m5-university-local-direction.json`); no direct state mutation. General production guest smoke on the Pages build PASS. Final source/public/all-history secret scan945textobjects/0findings PASS. Dependencies did not change beyond root package version; production audit0 from A remains applicable.

Final local run alone:52/52 E2E,0 failed/0 skipped, followed by production subpath smoke PASS. Six new-life viewports ×20 mixed decisions plus6 old six-choice save views; another six academic viewports ×20 decisions. Source frozen directories unchanged. Source commit/push and exact-SHA CI/live verification follow. Historical tracked generic screenshots/reports restored byte-for-byte after copying this release evidence under m5-university prefixes.
