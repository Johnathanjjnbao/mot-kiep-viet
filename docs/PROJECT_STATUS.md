# Một Kiếp Việt — trạng thái dự án và quy tắc làm việc

## Employment đã phát hành — G5 guest VERIFIED PASS, 01/11/2026

`0.3.6-employment.1`, source `b01d6a57761847f4529e3689fbdf48c5283b66ec`/main; [CI 41231316353](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41231316353) completed/success build/deploy. Tiếp tục baseline5184554, giữ A/B và Creator. Đời mới dùng career-v1; mọi selector cũ, frozen v1/v2, engine/content3/schema4 và save/history IDs giữ nguyên. Tuyển dụng có thể từ chối/cooldown, đổi việc giữ lịch sử, thất nghiệp có thời gian và chi phí, việc tạm/học kỹ năng/làm trái ngành/mất việc và phục hồi đã chơi được.

Local/CI191 tests,66 E2E, production Pages smoke PASS;1.000seed/1.000replay/0vi phạm/0fallback, max341actions/534921bytes. Live guest desktop/mobile và3browsers×2viewport =6/6 C journeys PASS;6viewport×20mixed choices vàsave cũ6choices PASS; JS/CSS/SW khớp SHA-256 build, font/history/save/load không lỗi. Auditproduction0; source secret scan1057/CI1080objects,0findings. Học tập, paid retraining, mất việc và gia đình có con được kiểm riêng bằng replay-valid fixtures; không gọi mọi nhánh đã được random sample bao phủ.

Full M5 vẫn INCOMPLETE: digital/business mới NOT RUN; quân sự đã có [nghiên cứu nguồn gốc](MILITARY_RESEARCH.md) nhưng NOT READY. Real cloud/JWT/RLS mới BLOCKED vì CLI chưa đăng nhập; owner tự đăng nhập NOT RUN. Không production SQL/Auth/RLS changes hoặc dùng credential người chơi. Bằng chứng/giới hạn/điểm tiếp tục ở [M5_EMPLOYMENT_PROGRESS](M5_EMPLOYMENT_PROGRESS.md), manifest `evidence/m5-employment-release.json`. Những mục Candidate và A/B bên dưới giữ lịch sử; bước tiếp theo là digital/business dưới selector mới, không làm lại A/B/C.

## Employment — local gates VERIFIED PASS, 01/11/2026

Candidate `0.3.6-employment.1` tiếp tục main5184554, không làm lại A/B. `career-v1` bất biến bổ sung tuyển dụng có chấp nhận/từ chối và cooldown6 tháng; từ chối giữ việc đang làm, chuyển việc được nhận giữ lịch sử; việc tạm6 tháng trả đúng6 kỳ; thất nghiệp có thời gian/chi phí/áp lực và phục hồi, học kỹ năng qua ledger, mất việc/hỗ trợ chuyển tiếp và làm trái ngành. Giữ engine/content3/schema4, toàn bộ luật/golden cũ và ID save/history. Local verify191 tests/19files,66 E2E,3browsers×2viewport, production Pages smoke, audit0 và secret scan1057objects/0findings PASS. Mô phỏng1.000seed/1.000replay/0vi phạm/0fallback,97.662event checks≥4choices, max341actions/534921bytes. C CI/live INCOMPLETE cho tới exact-SHA verification; production A/B vẫn VERIFIED PASS. Real cloud QA BLOCKED (CLI thiếu login), owner NOT RUN. Digital/business mới NOT RUN, quân sự NOT READY; full M5 INCOMPLETE. Xem [M5_EMPLOYMENT_PROGRESS](M5_EMPLOYMENT_PROGRESS.md). Các mục dưới giữ lịch sử.

## Tiếp tục A/B — 31/10/2026

Dynamic Life đã phát hành tại `d3212f4f39bf889a2f72b47993fcaf391bed50ae`, [CI 41208545352](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41208545352) completed/success; live guest và Chromium/Firefox/WebKit trên desktop/mobile VERIFIED PASS.

Bản `0.3.6-university.1` đã phát hành, source `84f1235b500da1dcaa3cbe66c7c3331764f6a647`/main; [CI 41213819210](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41213819210) completed/success cả build/deploy. University G5 guest VERIFIED PASS: 12 ngành, tuyển sinh chấp nhận/từ chối và cooldown, đánh giá từng năm, học phí/học bổng/hỗ trợ/làm thêm qua ledger, học lại, bảo lưu/trở lại, chuyển ngành, nghỉ học và văn bằng khi đủ tiến độ. `education-v1` chỉ cho đời mới; `dynamic-v1`, missing flag, frozen v1/v2 và golden cũ giữ nguyên. Local/CI163 tests,52 E2E; B1.000seed/replay/0vi phạm/0fallback. Live guest desktop/mobile, Chromium/Firefox/WebKit6/6 university journeys,6viewport×20choices và6save cũ có6choices PASS. JS/CSS/SW khớp SHA-256 build; font/save/load/history không lỗi. Secret scan local945/CI979objects,0findings; dependencies không đổi, auditproduction0 từA còn áp dụng. Full M5 INCOMPLETE: Employment mới chưa triển khai; digital/business mới NOT RUN, quân sự NOT READY. Real cloud/JWT/RLS mới BLOCKED vì CLI chưa đăng nhập; owner tự đăng nhập NOT RUN. Không SQL/Auth/RLS hoặc production writes. Manifest `evidence/m5-university-release.json`; chi tiết ở [M5_LONG_RUN_HANDOFF](M5_LONG_RUN_HANDOFF.md). Các mục bên dưới giữ lịch sử.

## Dynamic Life, local checkpoint 31/10/2026

Đang phát hành `0.3.6-life-diversity.1`, tiếp tục2b24ebd/main. Local140unit/40E2E/1000seed+replay/0vi phạm và3browsers6journeys PASS.20cảnh tuổi thơ+3cảnh nối tiếp; mẫu200same-setup: cảnh đầu3→11, chuỗi5đầu193→200;200diverse:4→15 và193→200. Old400opening sequences vàgoldens giữ nguyên; lifeRules dynamic-v1 chỉ cho đời mới. Cloud QA BLOCKED thiếuCLIlogin, không SQL/Auth change. CI/live mới INCOMPLETE cho tới bằng chứng đúngSHA. B/C chưa triển khai; tiếp tục University sau khi chốtA. Xem M5_LONG_RUN_HANDOFF.

## Checkpoint A v0.3.6-creator.1 — 31/10/2026

Creator đã phát hành: source `28c1dc51aebadd3bf826224e653ad0f5a10ff9a6`/main, [CI41202694295](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41202694295) completed/success. G5 guest VERIFIED PASS: live Creator Chromium/Firefox/WebKit desktop/mobile6/6,6viewport×20choices,guest save/load/history/font/assets và CSS/JS/SW khớp artifact. Local/CI133tests/38E2E;1000seed/1000replay/0vi phạm còn áp dụng (sau đó chỉ sửa CSS/test/docs). Engine/content3/schema4, frozen/goldens giữ nguyên. Auth/cloud mới BLOCKED vì thiếu Supabase CLI login; owner tự nhập account NOT RUN. Full Education & Career v0.3.6 INCOMPLETE:0ngành/0event/0arc mới. Chi tiết [M5_CREATOR_REPORT](M5_CREATOR_REPORT.md); các đoạn sau giữ bằng chứng lịch sử.

M4 v0.3.5 G5 VERIFIED PASS: release dc6bf1b094a343939d653c0f1ffb4f699ffc08b4/main, CI41136632974 completed/success; live guest desktop/mobile,6viewport×20,8family/social journeys,26realAuth/cloud and JS/CSS/SW hashes PASS. M5 foundation4f4e969 (7new tests) only; full M5 INCOMPLETE. Final verify124/36existing E2E/1000M4 replay0violations. Owner personal login NOT RUN.

Older pending paragraphs below are historical checkpoints.

M4 v0.3.5 local gates VERIFIED PASS:117unit/36E2E/1000seed+replay/0violations/26realAuth-cloud, production smoke, secrets0/audit0. Source77acc1a/main; CI/live pending. M3 G5 remains PASS; M5 preparation only. Owner personal login NOT RUN.

M4 v0.3.5: source complete, local verify117/117 and production smoke VERIFIED PASS; final simulation/E2E/real cloud in progress. NOT deployed yet. M3 v0.3.4 remains verified production. Owner personal login NOT RUN; no production SQL/Auth changes.

M3 v0.3.4 G5 VERIFIED PASS: d2e9c810/main, CI41132580664 completed/success; live4social/sixviewport×20/25cloud/asset hashes PASS.102unit/32E2E/1000replay0violations. Owner tự đăng nhập NOT RUN. M4 family đang làm; M5 NOT RUN. Không có SQL production mới.

M3 v0.3.4 local VERIFIED PASS:102unit,32E2E,1000seed/replay/0vi phạm,25realAuth/cloud,scan0/audit0.99templates/5arcs;22new social/2arcs/3NPC. Đang phát hành CI/live, chưa gọi M3 G5. Oldruleset/goldens/saveIDs giữ nguyên; không SQL mới. Baseline fd0409c, checkpoint Graft9260746. Xem LIFE_EXPANSION.

M3 v0.3.4 đang chốt local gates:22social templates/2arc,3NPC riêng, full relationship/dialogue/resume/household. E2E32/production PASS; simulation/cloud đang chạy. Chưa push/deploy M3. Oldruleset vẫn giữ nguyên, không SQL production. Xem LIFE_EXPANSION.

## Hiện hành — v0.3.3, 31/10/2026

M1 avatar/visual và M2 wardrobe: **VERIFIED PASS, đã deploy**. Code `a2388aee7a44d7189a6ef08fa1beaaf21466111b` / main; [CI41100506471](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41100506471) completed/success. Local89 tests,26E2E +2bổ sung schema3,1000seed/replay/0vi phạm. Live guest,6viewport×20decisions,24realAuth/cloud,oldsave desktop/mobile và asset hashes PASS. 28wearable,77event/3arc,6avatarages. Migration003 approved/applied; no RLS loosening/deletes. Owner tự nhập account NOT RUN. M3draft22scene chưa nối engine/UI; M4 NOT RUN; Life Expansion INCOMPLETE. Tiếp tục chính checkpoint này, không làm lại M1/M2. Chi tiết [LIFE_EXPANSION](LIFE_EXPANSION.md). Các mục pending phía dưới là lịch sử trước khi chốt G5.

M2 v0.3.3 chốt gate:28món/5fashion scenes; engine3/schema4, schema3 vẫn chơi qua frozen2. Local89 tests/24 real cloud groups/1000seed-replay không vi phạm. Final E2E/CI/live đang kiểm tra, chưa gọi M2 deployed. Xem LIFE_EXPANSION.

**G5 M1 v0.3.2 VERIFIED PASS.** Code403509669f237d410f40c6027bd80a030b0da39d/main đã push/deploy; [workflow41096367741](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41096367741) completed/success. Live guest,6viewport×20decision,23realAuth/cloud và artifact CSS/JS/SW hashes PASS. Owner tự nhập tài khoản NOT RUN. M2–M4 đang làm, chưa nghiệm thu. Chi tiết [LIFE_EXPANSION](LIFE_EXPANSION.md).

## Life Expansion — M1 v0.3.2, 31/10/2026

Tiếp tục baseline sạch `a204bd0bba62f341eda66e3b6788c87f18c545f3` trên main. M1 thêm avatar gốc nhiều lớp/sáu tuổi, identity theo seed, biểu cảm và giao diện đồng bộ creator/HUD/history/memoir; không đổi engine/content2/schema3. Local verify81 và E2E24/production smoke PASS; six viewport20decisions đo avatar/HUD/story/choice trước input. CI/live mới đang kiểm tra, chưa gọi G5 PASS. Migration mở tuple3/schema4 đã được chủ dự án duyệt đúng hash và áp đúng project; không đổi RLS/dữ liệu. M2–M4 chưa xong, không gọi Life Expansion complete. Chi tiết [LIFE_EXPANSION](LIFE_EXPANSION.md).


## Hiện hành — v0.3.1 đã phát hành, VERIFIED PASS, 30/10/2026

Tiếp tục main `53802c8a5bf3cf0fc7214dfa82c8197d1fc20bc8`, working tree sạch trước sửa. Sửa đúng hai lỗi chủ dự án báo: stats ẩn/scroll khỏi màn hình và căn card nhưng lựa chọn vẫn thấp. HUD lấy trực tiếp GameRun, desktop sticky bên trái, mobile strip đủ sáu chỉ số; landscape chia narrative/choices hai cột. Nội dung truyện giữ nguyên, chỉ danh sách lựa chọn cuộn theo ngân sách chiều cao thực. Focus/resize/fonts cập nhật viewport, không reset inner-scroll do observer; giữ v0.3 guards/actions/cloud/save.

Bằng chứng trước sửa v031-before.json/screenshots; acceptance mới đo trước mọi click, hit test HUD/narrative/full first option, kiểm viewport CSS khớp device để bắt auto-zoom, chọn đầu/giữa/cuối 20 lần mỗi case và xác minh đúng choice ID/HUD/save/replay. Lỗi năm trang trí tràn ở chữ lớn đã sửa. Engine/content2/schema3, SQL/RLS/account permissions không đổi; không chạy lại mô phỏng1.000 seed cho UI-only. Gates/deploy/live VERIFIED PASS, xem [V031_REPORT](V031_REPORT.md). Các phần dưới giữ lịch sử v0.3/v0.2.

**G5 v0.3.1 VERIFIED PASS.** Code `3db40a426e59bb08c776acebb72446be3c16fc56`, [CI41089793438](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41089793438) build/deploy completed/success. Local/CI77 unit,22 E2E, production smoke, scan0/audit0. Local và live sáu case×20=120 choices mỗi lượt;126 measurements trước input, toàn bộ HUD/sáu chỉ số/narrative/first choice rõ và trong viewport, label/value không chồng, innerWidth/Height khớp device. Auth/cloud thật23 nhóm trên cả local/live PASS. JS/CSS/SW live khớp SHA256 build. Bằng chứng ci-v031, v031-live-viewport/cloud-live/guest/assets. Docs/evidence bổ sung commit/push và theo dõi workflow cuối; final HEAD/workflow báo trong chat/git log.

## Hiện hành — v0.3 resume, 30/10/2026

Khôi phục đúng main `9bbffbc853a42582517bdd7f67ea7826c19fec79`, giữ toàn bộ uncommitted cloud implementation từ phiên ngắt. Đã nối Auth/account/guest repositories, autosave/ba slot/history, offline shell/outbox, conflict/recovery và explicit guest migration. Bổ sung continuous one-click bằng action choose/advance cũ, guard duplicate/stale, focus/scroll và outcome không chặn. Local CAS chặn hai tab dùng chung cache ghi đè nhánh cũ. Engine/content 2.0.0, schema3 và legacy v1 giữ nguyên.

Chủ dự án thay yêu cầu SMTP/invitation bằng tài khoản Email/Password đã tạo thủ công. Đã kiểm tra tài khoản confirmed/có password và cấp allowlist chính tài khoản đó; không tạo lại, không dùng mật khẩu người chơi. Chủ dự án tự đăng nhập live: **NOT RUN**. Không có nút gửi email recovery; hướng dẫn quản trị an toàn ở SUPABASE_SETUP. Hai migration đã duyệt/applied khớp hash; không migration production mới, không nới RLS, không xóa production. QA mới giữ dữ liệu synthetic và vô hiệu hóa đúng các identity tự tạo.

Local verify 77/77, guest production E2E 16/16 và simulation 1.000 đời/0 vi phạm đã qua trong lượt resume; real Supabase23/production smoke/secret scan0 PASS; đã commit/push và xác minh CI/live. Không dùng số PASS cũ thay bằng chứng mới. Chi tiết [V03_RESUME](V03_RESUME.md), [V03_REPORT](V03_REPORT.md), [V03_HANDOFF](V03_HANDOFF.md). v0.4–v0.6 chỉ chuẩn bị thiết kế trong MASTER_PLAN/ROADMAP.

**G5 v0.3 phát hành kỹ thuật VERIFIED PASS.** Code `4cafcbced975ba9b6b7b16b04331a2186aa65aa7` trên main đã push/deploy bằng [workflow41044765048](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41044765048), completed/success build/deploy. Local/CI verify77, E2E16, content/type/lint/build, production smoke và scan0 PASS; simulation1000/0 vi phạm. Live guest1440/375 và real Auth/cloud23 (ba slot, offline/reconnect, conflict, hai tab, history) PASS; JS/CSS/SW hashes khớp. Evidence: ci-v03, v03-live-guest/authenticated/assets. Owner tự đăng nhập tài khoản đã có NOT RUN; nghiệm thu riêng đó INCOMPLETE. SMTP/invitation ngoài scope. Các checkpoint bên dưới là lịch sử. Tài liệu/evidence bổ sung được commit/push, final HEAD/workflow báo trong chat/git log.

## Checkpoint 9bbffbc — lịch sử nền tảng v0.3

Tiếp tục từ 479fa05, không làm lại v0.2. Nền tảng cloud/RLS/cache đã có mã, 15 test mới cục bộ PASS; chưa nối UI/session, chưa áp SQL production hay xác minh Auth thực. Đang chờ chủ dự án cung cấp project Supabase URL/publishable key và xác nhận đích trước migration. Không có secret/service-role, email hay password thật trong repo. [Checkpoint](V03_PROGRESS.md), [setup](SUPABASE_SETUP.md). Website công khai hiện vẫn là v0.2 đã kiểm chứng bên dưới; không gọi v0.3/tài khoản vợ COMPLETE.

## Hiện hành — beta v0.2, 30/10/2026

Tiếp tục từ baseline main 3508765374d94b8150e852ff0aa74b9678cd8940 tại C:\Users\triba\OneDrive\Desktop\game. Đã triển khai Creator nâng cao, lựa chọn trên đủ 72 mẫu và Life History IndexedDB riêng. Engine/content 2.0.0, schema 3; v1 đóng băng cho save cũ chỉ đọc, không xóa ba slot. Chi tiết phạm vi/bằng chứng: [V02_REPORT.md](V02_REPORT.md).

**G5 v0.2 VERIFIED PASS.** Code a108d25036af58db8034369db06085a88e4e66fe đã push và triển khai qua workflow [41007485656](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41007485656), build/deploy completed/success. Local và CI: 49/49 test, content/type/lint/build, 10/10 E2E và production subpath smoke PASS; audit 0 advisory, secret scan 0 findings. Live Edge 1440×1000 và 375×812: random/custom/5 gia đình, chơi hết đời với ≥4 lựa chọn, save/load, export/import lịch sử, đổi kiếp/reload giữ lịch sử, font/assets/không tràn ngang và 0 lỗi page/network. JS/CSS live khớp SHA-256 build cục bộ. Bằng chứng trong evidence/pages-live.json, pages-assets-v02.json, ci-v02.json.

Luật mới có 1.000 seed, 0 vi phạm/0 failures, 72/72 mẫu quan sát; 4–6 lựa chọn enabled trong 35.045 lượt. Mẫu mô phỏng phủ 41 năm; unit riêng chơi/replay 52 năm. Batch 52 đời từng timeout 30 giây; nâng riêng lên 120 giây, không đổi assertion, lượt cuối 49/49 qua. Tài khoản cloud cho vợ và kỳ bí/trường thọ chỉ là kế hoạch, NOT RUN. Tài liệu/bằng chứng được commit/push bổ sung; SHA HEAD và kiểm tra workflow cuối báo trong chat/git log, không lặp ghi SHA của chính commit vào tài liệu.

**Các phần dưới là lịch sử v0.1 và kiểm toán ban đầu**, không dùng số PASS hoặc backlog cũ thay cho v0.2. Trạng thái mới nhất ở mục này và kết quả phát hành v0.2 cuối file.

**Cập nhật:** 30/10/2026 (Asia/Saigon)  
**Phạm vi kiểm toán:** bản `game.rar` người dùng gửi; đối chiếu với checkout `C:\Users\triba\OneDrive\Desktop\game` cùng HEAD `872bf5fa80815cace7699457a1eac2a4f110e02f`.  
**Trạng thái hiện tại:** beta đã phát hành công khai, CI và live browser QA VERIFIED PASS. URL: https://johnathanjjnbao.github.io/mot-kiep-viet/. Phần kiểm toán HEAD 872bf5f bên dưới được giữ làm lịch sử.

Tài liệu này là điểm bắt đầu cho Codex ở các lượt sau. Mã nguồn, bài test và cấu hình hiện hành là bằng chứng kỹ thuật; `docs/HANDOFF.md` là báo cáo lịch sử của bản beta. Khi thay đổi tính năng hay triển khai, cập nhật tài liệu này theo kết quả thực tế, ghi rõ ngày, commit và điều chưa xác minh. Không giữ một trạng thái “PASS” chỉ vì báo cáo cũ nói vậy.

## 1. Điều đã xác minh

| Mục                          | Kết quả tại HEAD `872bf5f`                                                                                                                                                                                                                                    | Bằng chứng                                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Kiến trúc                    | React + TypeScript + Vite, chạy trong trình duyệt; engine tách khỏi UI, nội dung và lưu trữ                                                                                                                                                                   | `package.json`, `src/domain/model.ts`, `src/engine/`, `src/content/`, `src/application/`, `src/persistence/`, `src/ui/`, `docs/ARCHITECTURE.md` |
| Chức năng beta               | 72 mẫu sự kiện, 3 tuyến truyện, 10 nghề, tài chính, quan hệ, sức khỏe, nhật ký và hồi ký                                                                                                                                                                      | `src/content/`, `src/engine/`, `src/ui/`, `npm run validate:content`                                                                            |
| Lưu game                     | IndexedDB, autosave + 3 ô, import/export JSON; kiểm tra schema và phát lại hành động                                                                                                                                                                          | `src/persistence/saves.ts`, `tests/saves.test.ts`                                                                                               |
| Kiểm thử chạy lại từ bản nén | `npm.cmd run verify`: 22/22 test, typecheck, lint, kiểm tra nội dung và build đều qua; `npm.cmd run simulate`: 1.000/1.000 lượt, 0 vi phạm, 72/72 sự kiện xuất hiện; `npm.cmd run test:e2e`: 6/6 luồng qua; `npm.cmd run test:production`: qua trên localhost | Các lệnh chạy ngày 30/10/2026; `tests/`, `scripts/`, `docs/evidence/`                                                                           |
| Git/triển khai               | `main` sạch, HEAD `872bf5f`; **không có Git remote**, chưa push; workflow hiện tại chỉ kiểm thử, chưa deploy                                                                                                                                                  | `git status`, `git remote -v`, `.github/workflows/ci.yml`, `vite.config.ts`                                                                     |

Giới hạn bằng chứng: các lệnh chạy lại với `node_modules` có sẵn trong bản nén, chưa kiểm chứng một lần `npm ci` sạch. E2E dùng Edge trên máy Windows với viewport desktop/mobile mô phỏng; chưa kiểm tra điện thoại thật, Safari/Firefox hoặc người chơi thật. Bài production smoke chạy ở `127.0.0.1:4173`, không chứng minh website công khai hoạt động. CI từ xa và GitHub Pages chưa chạy. Kết quả mô phỏng xác nhận các bất biến được mã hóa, không xác nhận độ hay, độ cân bằng hoặc tính đại diện đời sống Việt Nam.

## 2. Kiến trúc cần giữ khi mở rộng

`src/ui/` nhận lựa chọn → `src/application/useGameSession.ts` điều phối → `src/engine/engine.ts` chuyển trạng thái → `src/domain/model.ts` định nghĩa dữ liệu → `src/persistence/saves.ts` lưu/khôi phục. `src/content/` chứa quy tắc bối cảnh, nghề, sự kiện và tuyến truyện. `src/diagnostics/` cùng `scripts/` chạy mô phỏng và kiểm tra nội dung.

Game dùng seed và action log để phát lại. Thay đổi mô hình khởi tạo, luật tuổi thọ, cấu trúc NPC hoặc nội dung có thể làm bản lưu cũ không còn phát lại giống trước. Trước khi phát hành thay đổi như vậy, quyết định chính sách tương thích, tăng version phù hợp, có migration hoặc thông báo từ chối rõ ràng, và thêm test cho cả save cũ lẫn save mới. Không sửa trực tiếp trạng thái từ UI hay bỏ đối soát sổ cái để làm tính năng mới.

## 3. Khoảng cách với mong muốn của chủ dự án

| Mong muốn đã nêu                                                                                | Hiện trạng thực tế                                                                                                                               | Ưu tiên             |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- |
| Tự nhập tên nhân vật                                                                            | Tên đang chọn từ danh sách trong `src/engine/engine.ts`; màn tạo kiếp không có ô tên                                                             | P1                  |
| Tự chọn nơi và năm sinh                                                                         | Chỉ chọn 3 bối cảnh vùng và 3 năm 1975/1995/2005; `RunSetup` và schema save cũng giới hạn như vậy                                                | P1                  |
| Chọn điều kiện gia đình, có cả cha mẹ/chỉ cha/chỉ mẹ/sống riêng với một người, tính cách cha mẹ | Gia cảnh tạo ngẫu nhiên; cha và mẹ luôn được tạo, chưa có cấu hình tính cách                                                                     | P1                  |
| Sự kiện kỳ bí, cơ chế tăng tuổi thọ                                                             | Chưa có hệ thống này; game kết thúc muộn nhất ở 82 tuổi (`src/engine/engine.ts`)                                                                 | P2                  |
| Mỗi đợt có bản chơi trên `github.io` để quan sát                                                | Chưa có remote, chưa có deploy, chưa có URL                                                                                                      | P0                  |
| Chia sẻ game qua đường link, chưa kiếm tiền                                                     | Ứng dụng hiện không có thanh toán/đăng nhập; GitHub Pages công khai sẽ cho **bất kỳ ai biết URL** truy cập, không phải chế độ chỉ người được mời | Ràng buộc phát hành |

## 4. Backlog theo thứ tự

### P0 — Đưa beta hiện tại lên GitHub Pages, xác minh trên URL thật

1. Xác nhận tài khoản và tên repository đích; thiết lập remote cho checkout chính. Không tự đoán chủ sở hữu hoặc URL.
2. Chọn repo công khai phù hợp với mong muốn chia sẻ bằng link. Trước khi bật Pages, giải thích rõ trang công khai có thể được người khác tìm thấy; nếu cần hạn chế người xem thì phải chọn phương án truy cập khác.
3. Cấu hình Vite `base`: `/` cho `<user>.github.io` hoặc domain riêng; `/<repo>/` cho project Pages. Hiện `dist/index.html` dùng `/assets/...` và `/favicon.svg`, nên bản build hiện tại chưa phù hợp với đường dẫn con.
4. Thêm workflow build/deploy GitHub Pages, với quyền `contents: read`, `pages: write`, `id-token: write`, artifact `dist` và environment `github-pages`; chỉ deploy sau khi các kiểm tra đạt. Cấu hình Pages source là GitHub Actions.
5. Commit và push; theo dõi CI/deployment trên GitHub; mở URL thật để kiểm tra tải CSS/JS/font, tạo và chơi một đoạn, reload và autosave. Ghi commit SHA, URL, kết quả kiểm tra và lỗi nếu có. Kiểm tra save theo origin mới; dữ liệu ở localhost sẽ không tự chuyển sang Pages, cần export/import.

### P1 — Tạo nhân vật và gia đình theo lựa chọn

1. Thiết kế màn bắt đầu cho tên, năm/nơi sinh, điều kiện gia đình, cấu trúc người chăm sóc và tính cách cha mẹ. Giữ lựa chọn ngẫu nhiên như một chế độ.
2. Mở rộng `RunSetup`, mô hình NPC/household và logic tạo kiếp; đảm bảo lựa chọn thực sự ảnh hưởng sự kiện, quan hệ và kết quả. Không để UI nhận lựa chọn nhưng engine vẫn sinh cấu trúc mặc định.
3. Xử lý các sự kiện tham chiếu cha/mẹ khi nhân vật đó vắng mặt; thêm test cho từng kiểu gia đình, các năm/vùng được hỗ trợ và phát lại save. Chốt phạm vi năm/địa danh trước khi viết nội dung lịch sử tương ứng.

### P2 — Kỳ bí và trường thọ

1. Thiết kế mức độ hư cấu, cách kích hoạt và đánh đổi của sự kiện kỳ bí; phân biệt rõ với lịch sử thật trong nội dung.
2. Thay trần tuổi 82 bằng luật tuổi thọ có giới hạn và cân bằng; rà soát mốc tuổi, thế giới tương lai, NPC, sức khỏe, hồi ký, mô phỏng, invariant và save/replay.
3. Thêm test cho nhánh trường thọ, kết thúc hợp lệ, tương thích save và những cuộc đời dài hơn bình thường; chơi thử để kiểm tra nhịp chơi.

### P3 — Chơi thử và cân bằng

Thử trên điện thoại thật và nhiều trình duyệt; ghi thời lượng, chỗ bỏ cuộc, độ lặp tuyến gia đình, nợ và cảm giác lựa chọn. Hiện mô phỏng cho thấy tuyến gia đình hoàn tất 1.000/1.000 lượt và tài sản ròng thấp nhất −61.813 đSM; đây là tín hiệu cần xem bằng người chơi thật, chưa đủ để kết luận lỗi cân bằng.

## 5. Quy tắc cho mỗi lượt Codex tiếp theo

1. Bắt đầu bằng `git status`, HEAD, remote, workflow và tài liệu này. Đối chiếu với mã thật; không coi báo cáo cũ là kết quả kiểm thử mới.
2. Nêu phạm vi thay đổi và test liên quan. Dùng skill phù hợp với pha công việc nếu đang có trên máy; chỉ đọc skill cần dùng. Không làm lại phần đã được chứng minh là ổn nếu không có lý do.
3. Sau khi sửa, chạy ít nhất `npm.cmd run verify`; khi đổi engine/nội dung/save chạy thêm `npm.cmd run simulate`; khi đổi UI/luồng chơi chạy `npm.cmd run test:e2e`; khi đổi cấu hình build/deploy chạy `npm.cmd run test:production` và thử trên URL Pages thật. Sửa lỗi rồi chạy lại các kiểm tra liên quan.
4. Với **mỗi lượt giao việc triển khai sau này**, yêu cầu Codex tạo commit có nội dung rõ, push lên GitHub và cập nhật GitHub Pages sau khi kiểm thử đạt. Chỉ báo thành công khi đã xác nhận deployment và game chạy trên URL thật. Nếu thiếu remote, quyền hoặc Pages setup, ghi đúng blocker và bước cần chủ dự án thực hiện; không ghi “đã deploy” khi mới build cục bộ.
5. Bàn giao ngắn gọn: thay đổi, kết quả test, commit SHA, nhánh/remote, CI, deployment, URL live, các giới hạn còn lại. Cập nhật trạng thái ở file này cùng commit tương ứng.

**Tài liệu triển khai chính thức:** [Vite — Deploying a Static Site](https://vite.dev/guide/static-deploy.html); [GitHub — Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages); [GitHub — Pages site visibility](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site).

## Đợt phát hành GitHub Pages — 30/10/2026

Repository công khai đã tạo: https://github.com/Johnathanjjnbao/mot-kiep-viet. Pages source đã đặt workflow. Build base /mot-kiep-viet/, không đổi engine/content. Local verify 22/22 test, lint/typecheck/content/build PASS; production subpath smoke và browser desktop/mobile (chọn, tiến thời gian, autosave reload, manual slot load, font/assets) PASS. Audit 0 CVE được biết, quét file/history chưa thấy credential. Workflow và URL công khai đang chờ xác minh, G5 INCOMPLETE. Trạng thái đợt phát hành này thay phần mô tả chưa có remote ở báo cáo baseline phía trên; giữ baseline làm lịch sử.

## Kết quả phát hành đã xác minh

- Phiên bản beta 0.1.0, engine/content 1.0.0 giữ nguyên. 72 event, 3 arc, 10 nghề không đổi.
- Repo: https://github.com/Johnathanjjnbao/mot-kiep-viet ; website công khai: https://johnathanjjnbao.github.io/mot-kiep-viet/ .
- Code phát hành: 8245d8d5932567977b27e6059e3efecaccd1be29. Workflow 40943722482 completed/success cả build/deploy: https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/40943722482 .
- GitHub đã npm ci sạch, verify (22 test), scan secrets, 6 E2E Chromium và production smoke PASS. Lượt 5936c79 thất bại ở nhận diện log có màu của smoke, đã sửa bằng HTTP readiness; không có deploy bản lỗi.
- Live QA trên Edge 1440x1000 và 375x812: tạo đời, lựa chọn, tiến thời gian, autosave reload, slot save/load, font/asset, không tràn ngang; 0 lỗi page/network. Bằng chứng docs/evidence/pages-live.json.
- G5: PASS cho phát hành beta Pages đầu tiên, không chứng nhận cân bằng hay mọi trình duyệt. Chưa playtest người thật/điện thoại thật/Safari/Firefox. Không chạy lại mô phỏng vì không đổi engine.
- Global skills kiểm kê: 22 thư mục tại .agents/skills và 5 system skills. Thực dùng Security Review, Secret Scanning, Webapp Testing; không cài thêm. Không có GitHub CLI; dùng Git Credential Manager hiện có và REST API, không ghi hoặc in token.
- Từ phiên sau: đọc AGENTS.md; qua gates, commit/push main, theo dõi workflow tới success rồi chạy node scripts/check-pages.mjs trên URL thật, cập nhật tài liệu. Nếu sửa luật/content/save mới chạy 1.000 seed.
- Ưu tiên tiếp: thiết kế Advanced Character Creator và chính sách save; backlog còn lại trong ROADMAP. Lưu từ localhost cần export/import; IndexedDB cùng origin có thể chung giữa subpath.
- Commit bổ sung tài liệu sau code phát hành không đổi dist; workflow của HEAD bàn giao phải kiểm tra lại, SHA cuối ghi trong chat/git log.
