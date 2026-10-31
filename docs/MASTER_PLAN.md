# Master Plan — Một Kiếp Việt

## Employment đã phát hành — G5 guest VERIFIED PASS, 01/11/2026

`0.3.6-employment.1`, source `b01d6a57761847f4529e3689fbdf48c5283b66ec`/main; [CI 41231316353](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41231316353) completed/success build/deploy. Tiếp tục baseline5184554, giữ A/B và Creator. Đời mới dùng career-v1; mọi selector cũ, frozen v1/v2, engine/content3/schema4 và save/history IDs giữ nguyên. Tuyển dụng có thể từ chối/cooldown, đổi việc giữ lịch sử, thất nghiệp có thời gian và chi phí, việc tạm/học kỹ năng/làm trái ngành/mất việc và phục hồi đã chơi được.

Local/CI191 tests,66 E2E, production Pages smoke PASS;1.000seed/1.000replay/0vi phạm/0fallback, max341actions/534921bytes. Live guest desktop/mobile và3browsers×2viewport =6/6 C journeys PASS;6viewport×20mixed choices vàsave cũ6choices PASS; JS/CSS/SW khớp SHA-256 build, font/history/save/load không lỗi. Auditproduction0; source secret scan1057/CI1080objects,0findings. Học tập, paid retraining, mất việc và gia đình có con được kiểm riêng bằng replay-valid fixtures; không gọi mọi nhánh đã được random sample bao phủ.

Full M5 vẫn INCOMPLETE: digital/business mới NOT RUN; quân sự đã có [nghiên cứu nguồn gốc](MILITARY_RESEARCH.md) nhưng NOT READY. Real cloud/JWT/RLS mới BLOCKED vì CLI chưa đăng nhập; owner tự đăng nhập NOT RUN. Không production SQL/Auth/RLS changes hoặc dùng credential người chơi. Bằng chứng/giới hạn/điểm tiếp tục ở [M5_EMPLOYMENT_PROGRESS](M5_EMPLOYMENT_PROGRESS.md), manifest `evidence/m5-employment-release.json`. Những mục Candidate và A/B bên dưới giữ lịch sử; bước tiếp theo là digital/business dưới selector mới, không làm lại A/B/C.

## Employment — local gates VERIFIED PASS, 01/11/2026

Candidate `0.3.6-employment.1` tiếp tục main5184554, không làm lại A/B. `career-v1` bất biến bổ sung tuyển dụng có chấp nhận/từ chối và cooldown6 tháng; từ chối giữ việc đang làm, chuyển việc được nhận giữ lịch sử; việc tạm6 tháng trả đúng6 kỳ; thất nghiệp có thời gian/chi phí/áp lực và phục hồi, học kỹ năng qua ledger, mất việc/hỗ trợ chuyển tiếp và làm trái ngành. Giữ engine/content3/schema4, toàn bộ luật/golden cũ và ID save/history. Local verify191 tests/19files,66 E2E,3browsers×2viewport, production Pages smoke, audit0 và secret scan1057objects/0findings PASS. Mô phỏng1.000seed/1.000replay/0vi phạm/0fallback,97.662event checks≥4choices, max341actions/534921bytes. C CI/live INCOMPLETE cho tới exact-SHA verification; production A/B vẫn VERIFIED PASS. Real cloud QA BLOCKED (CLI thiếu login), owner NOT RUN. Digital/business mới NOT RUN, quân sự NOT READY; full M5 INCOMPLETE. Xem [M5_EMPLOYMENT_PROGRESS](M5_EMPLOYMENT_PROGRESS.md). Các mục dưới giữ lịch sử.

## Tiếp tục A/B — 31/10/2026

Dynamic Life đã phát hành tại `d3212f4f39bf889a2f72b47993fcaf391bed50ae`, [CI 41208545352](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41208545352) completed/success; live guest và Chromium/Firefox/WebKit trên desktop/mobile VERIFIED PASS.

Bản `0.3.6-university.1` đã phát hành, source `84f1235b500da1dcaa3cbe66c7c3331764f6a647`/main; [CI 41213819210](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41213819210) completed/success cả build/deploy. University G5 guest VERIFIED PASS: 12 ngành, tuyển sinh chấp nhận/từ chối và cooldown, đánh giá từng năm, học phí/học bổng/hỗ trợ/làm thêm qua ledger, học lại, bảo lưu/trở lại, chuyển ngành, nghỉ học và văn bằng khi đủ tiến độ. `education-v1` chỉ cho đời mới; `dynamic-v1`, missing flag, frozen v1/v2 và golden cũ giữ nguyên. Local/CI163 tests,52 E2E; B1.000seed/replay/0vi phạm/0fallback. Live guest desktop/mobile, Chromium/Firefox/WebKit6/6 university journeys,6viewport×20choices và6save cũ có6choices PASS. JS/CSS/SW khớp SHA-256 build; font/save/load/history không lỗi. Secret scan local945/CI979objects,0findings; dependencies không đổi, auditproduction0 từA còn áp dụng. Full M5 INCOMPLETE: Employment mới chưa triển khai; digital/business mới NOT RUN, quân sự NOT READY. Real cloud/JWT/RLS mới BLOCKED vì CLI chưa đăng nhập; owner tự đăng nhập NOT RUN. Không SQL/Auth/RLS hoặc production writes. Manifest `evidence/m5-university-release.json`; chi tiết ở [M5_LONG_RUN_HANDOFF](M5_LONG_RUN_HANDOFF.md). Các mục bên dưới giữ lịch sử.

## Checkpoint A v0.3.6-creator.1 — 31/10/2026

Creator đã phát hành: source `28c1dc51aebadd3bf826224e653ad0f5a10ff9a6`/main, [CI41202694295](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41202694295) completed/success. G5 guest VERIFIED PASS: live Creator Chromium/Firefox/WebKit desktop/mobile6/6,6viewport×20choices,guest save/load/history/font/assets và CSS/JS/SW khớp artifact. Local/CI133tests/38E2E;1000seed/1000replay/0vi phạm còn áp dụng (sau đó chỉ sửa CSS/test/docs). Engine/content3/schema4, frozen/goldens giữ nguyên. Auth/cloud mới BLOCKED vì thiếu Supabase CLI login; owner tự nhập account NOT RUN. Full Education & Career v0.3.6 INCOMPLETE:0ngành/0event/0arc mới. Chi tiết [M5_CREATOR_REPORT](M5_CREATOR_REPORT.md); các đoạn sau giữ bằng chứng lịch sử.

M4 v0.3.5 G5 VERIFIED PASS: release dc6bf1b094a343939d653c0f1ffb4f699ffc08b4/main, CI41136632974 completed/success; live guest desktop/mobile,6viewport×20,8family/social journeys,26realAuth/cloud and JS/CSS/SW hashes PASS. M5 foundation4f4e969 (7new tests) only; full M5 INCOMPLETE. Final verify124/36existing E2E/1000M4 replay0violations. Owner personal login NOT RUN.

Older pending paragraphs below are historical checkpoints.

## Next phase after verified M3/M4 — M5 preparation

M3 relationships is live v0.3.4; M4 family source is checkpointed locally and remains under final gates. M5 is INCOMPLETE, no university/military/digital-career expansion is exposed yet. Do not enable new rules on an existing wardrobe/social/family save.

1. Creator vertical slice: one seeded, pure randomizer per player/father/mother, compatible combinations under the same schema as manual selection, independent reroll counters, and explicit lock controls for randomize-all. Show selected traits in preview. Preserve all manually selected fields. A persisted optional player-trait setup field must gate new behavior; consume the historical RNG draw even when overriding it so old worlds do not shift. Parent modifiers continue through the existing resident-parent childhood rules. Test input immutability, same seed/counter determinism, locks, conflicting sets, old goldens, replay/reload/cloud and mobile keyboard controls.
2. Education: add an immutable education-ruleset switch or new version tuple before changing existing degree semantics. Define12 distinct programs (IT, engineering, healthcare, business, accounting, finance, law, education, Korean, English, design/arts, communications) with duration, tuition, entry conditions, skills and career links. Keep all tuition/aid/part-time income in ledger; tie scholarship, burnout, internships, changing majors, dropout and delayed graduation to stable program records and seeded choices. Record attempted/completed qualifications separately.
3. Work: applications produce reproducible acceptance/rejection from qualification, skill, experience, era and market context. Bound retries and record rejection/unemployment, allow out-of-field and lower-qualification work, retraining, layoffs and recoverable job searches. Volatile digital/creative careers require era/platform availability, operating costs, burnout and losses; follower count is not guaranteed income. No external platform APIs or real money.
4. Military: research primary historical/legal sources for separate periods before implementing eligibility. Do not reuse current law across1975–2026 or force all characters into service. Keep fictional gameplay eligibility clear; enforce age/health/education/context inside engine and test eligible/ineligible periods. No speculative legal table in production.
5. Release gates: old frozen/current goldens, strict schema/replay and ledger invariants,1000 unique seeds after authoritative rule changes,4 enabled choices per scene,6 viewport×20 decisions, real A/B/anon RLS and complex-save sync, source/public/history secret scan, verify/E2E/Pages smoke, main commit/push and exact-SHA CI/live proof. Any new production SQL requires owner review; prepare/test first, keep old production safe if approval is unavailable.

M5 full acceptance additionally requires all12 programs, graduation/failure/dropout, rejection and prolonged unemployment, out-of-field work/career switching, era-gated online jobs, military eligibility, and independent creator randomization. A creator-only release must be labeled partial M5; it is not Education & Career completion. Supernatural longevity/international/VND remain later roadmap.


Life Expansion: M1 v0.3.2 và M2 v0.3.3 VERIFIED PASS/deployed; M3 v0.3.4 (22scene nháp) INCOMPLETE, M4 v0.3.5 NOT RUN. Không thay ba mốc tương lai kỳ bí/quốc tế/VNĐ. Trạng thái và bước tiếp tục ở LIFE_EXPANSION.

## Life Expansion v0.3.2–v0.3.5 — phạm vi được giao

M1: hệ thị giác và avatar sống sáu tuổi (local gates đã qua, đang phát hành). M2: cửa hàng/tủ đồ ≥24 món, ledger đSM và social context. M3: ≥3 NPC độc lập, hẹn hò/thỏa thuận/hôn nhân/ngoại tình với agency. M4: nhiều con, hành vi nuôi dạy tích lũy và đường trưởng thành tự quyết. Từng mốc qua test/commit/push/CI/live rồi tiếp tục; trạng thái thực và save plan ở [LIFE_EXPANSION](LIFE_EXPANSION.md). Không mở rộng sang ba mốc tương lai bên dưới.


Cập nhật 30/10/2026. Đây là kế hoạch sản phẩm; không tự mở phạm vi triển khai. Trạng thái phát hành thực ở PROJECT_STATUS/V03_HANDOFF. Không thay tính xác định của engine hay xóa dữ liệu để thêm tính năng.

## v0.3 — hoàn tất nền tảng tài khoản và nhịp chơi

Mục tiêu: guest độc lập, account Email/Password có sẵn, autosave/ba slot, cloud history, offline/retry, explicit migration và lựa chọn một chạm. Release cần local gates, SQL/JWT RLS, hai browser độc lập, CI/Pages và live guest/Auth QA. Người chủ tự nhập thông tin để nghiệm thu tài khoản thật; không dùng credentials người chơi trong automation. SMTP/invitation ngoài phạm vi. Giữ engine/content2.0.0/schema3 và legacy read-only. Không có migration mới tự chạy production.

## v0.4 — Supernatural Longevity

Ít nhất 24 sự kiện kỳ bí, 5 tuyến truyện và nhiều cơ duyên trường sinh hiếm có đánh đổi. Tuổi 100–1.000+, tách tuổi sinh học/tuổi lịch. Future eras ghi rõ hư cấu, NPC thay nhiều thế hệ, luật tài chính/sức khỏe/quan hệ/hồi ký phù hợp. Time skipping hữu hạn, không bỏ lựa chọn/hệ quả, không vòng lặp theo tháng vô hạn.

Trước làm: thiết kế schema/version và chính sách save cũ; prototype lịch/NPC; invariant tests, golden replay, mô phỏng đời thường và đời nhiều thế kỷ; kiểm tra bộ nhớ/thời gian tối đa. Không ép mọi đời thành bất tử.

## v0.5 — International Life

Du học, lao động quốc tế, đoàn tụ, di cư/định cư và trở về Việt Nam; các tuyến tìm kiếm bảo vệ khi có nguy cơ bức hại cần bối cảnh thận trọng. Quốc gia/đường đi theo thời kỳ, điều kiện kinh tế/học vấn/quan hệ và hệ quả dài hạn. Cuộc sống ở nước ngoài có chi phí, nghề, gia đình, định kiến và lựa chọn riêng. Không mô tả tình huống hư cấu như tư vấn pháp lý hay quy định nhập cư hiện hành.

Trước làm: mô hình địa điểm/tình trạng cư trú/tiền tệ, nguồn theo thời kỳ và provenance, điều kiện eligibility, transition/replay tests, tương thích đời ở Việt Nam. Không thêm dịch vụ visa hay thanh toán trong game.

## v0.6 — Economy & Asset Shop

Thiết kế chuyển đSM sang VNĐ có versioning: đơn vị/độ chính xác, ledger, inflation, save migration và replay theo luật gốc. Lương phụ thuộc vùng, năm, nghề và độ ổn định; không cap cứng tổng tài sản. Các nguồn số liệu phải ghi thời kỳ, mức độ mô phỏng và phạm vi; tránh trộn VNĐ danh nghĩa ở hai thời đại.

Danh mục: nhà đô thị/nông thôn, xe máy/ô tô thương hiệu thực có bán tại Việt Nam và đúng năm, điện thoại theo hãng/đời máy, PC Builder chọn linh kiện. Mỗi tài sản có giá theo era, điều kiện sở hữu, bảo trì/hao mòn, nợ/lãi, bán lại và hệ quả trong gameplay. Aura/social impression là giá trị hư cấu, không đánh đồng vật chất với phẩm chất con người.

Trước làm: schema tài sản/hợp đồng/ledger version mới, lịch catalog và nguồn/giấy phép hình ảnh, kiểm tra tương thích PC, mua/bán/idempotency/âm tiền/nợ, save lớn và balancing. Không chuyển sang VNĐ, không thêm shop trong phiên v0.3.

## Nguyên tắc nghiệm thu từng mốc

Chia nhỏ theo một vertical slice có version/migration và test phù hợp; không khởi động refactor engine lớn sát shutdown. Sau gates: commit/push main, theo dõi đúng SHA CI, live QA và cập nhật bằng chứng. Giữ lịch sử bàn giao, phân biệt VERIFIED PASS/FAIL/BLOCKED/INCOMPLETE/NOT RUN. Không tự phê duyệt SQL production mới hoặc xóa dữ liệu production.
