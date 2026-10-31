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
