# Backlog sau beta v0.3

Year-by-Year0.3.7-yearly.1 đang chốt phát hành sau local gates. Phạm vi phiên này là từng tuổi, bảo lưu thật và chiều sâu12ngành; Digital/business và quân sự không được tự mở lại từ backlog. Tuổi thọ500/1000năm cần định dạng lưu/replay/cloud được version và duyệt riêng, không phải mở trần512actions toàn cục. Xem YEAR_BY_YEAR_PROGRESS.md.


## Employment đã phát hành — G5 guest VERIFIED PASS, 01/11/2026

`0.3.6-employment.1`, source `b01d6a57761847f4529e3689fbdf48c5283b66ec`/main; [CI 41231316353](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41231316353) completed/success build/deploy. Tiếp tục baseline5184554, giữ A/B và Creator. Đời mới dùng career-v1; mọi selector cũ, frozen v1/v2, engine/content3/schema4 và save/history IDs giữ nguyên. Tuyển dụng có thể từ chối/cooldown, đổi việc giữ lịch sử, thất nghiệp có thời gian và chi phí, việc tạm/học kỹ năng/làm trái ngành/mất việc và phục hồi đã chơi được.

Local/CI191 tests,66 E2E, production Pages smoke PASS;1.000seed/1.000replay/0vi phạm/0fallback, max341actions/534921bytes. Live guest desktop/mobile và3browsers×2viewport =6/6 C journeys PASS;6viewport×20mixed choices vàsave cũ6choices PASS; JS/CSS/SW khớp SHA-256 build, font/history/save/load không lỗi. Auditproduction0; source secret scan1057/CI1080objects,0findings. Học tập, paid retraining, mất việc và gia đình có con được kiểm riêng bằng replay-valid fixtures; không gọi mọi nhánh đã được random sample bao phủ.

Full M5 vẫn INCOMPLETE: digital/business mới NOT RUN; quân sự đã có [nghiên cứu nguồn gốc](MILITARY_RESEARCH.md) nhưng NOT READY. Real cloud/JWT/RLS mới BLOCKED vì CLI chưa đăng nhập; owner tự đăng nhập NOT RUN. Không production SQL/Auth/RLS changes hoặc dùng credential người chơi. Bằng chứng/giới hạn/điểm tiếp tục ở [M5_EMPLOYMENT_PROGRESS](M5_EMPLOYMENT_PROGRESS.md), manifest `evidence/m5-employment-release.json`. Những mục Candidate và A/B bên dưới giữ lịch sử; bước tiếp theo là digital/business dưới selector mới, không làm lại A/B/C.

## Tiếp tục v0.3.6 — 31/10/2026

Dynamic Life đã xác minh production tại d3212f4. University 12 ngành đã phát hành tại84f1235/CI41213819210, G5 guest VERIFIED PASS. Ưu tiên kế tiếp là job applications/rejection/cooldown/unemployment/career changes dưới selector bất biến mới; không thay quy tắc của các đời cũ. Digital/business chưa triển khai, quân sự NOT READY; các mục longevity/international/VNĐ vẫn ở backlog. Xem M5_LONG_RUN_HANDOFF cho trạng thái và bằng chứng mới nhất.

## Checkpoint A v0.3.6-creator.1 — 31/10/2026

Creator đã phát hành: source `28c1dc51aebadd3bf826224e653ad0f5a10ff9a6`/main, [CI41202694295](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41202694295) completed/success. G5 guest VERIFIED PASS: live Creator Chromium/Firefox/WebKit desktop/mobile6/6,6viewport×20choices,guest save/load/history/font/assets và CSS/JS/SW khớp artifact. Local/CI133tests/38E2E;1000seed/1000replay/0vi phạm còn áp dụng (sau đó chỉ sửa CSS/test/docs). Engine/content3/schema4, frozen/goldens giữ nguyên. Auth/cloud mới BLOCKED vì thiếu Supabase CLI login; owner tự nhập account NOT RUN. Full Education & Career v0.3.6 INCOMPLETE:0ngành/0event/0arc mới. Chi tiết [M5_CREATOR_REPORT](M5_CREATOR_REPORT.md); các đoạn sau giữ bằng chứng lịch sử.

M4 v0.3.5 G5 VERIFIED PASS: release dc6bf1b094a343939d653c0f1ffb4f699ffc08b4/main, CI41136632974 completed/success; live guest desktop/mobile,6viewport×20,8family/social journeys,26realAuth/cloud and JS/CSS/SW hashes PASS. M5 foundation4f4e969 (7new tests) only; full M5 INCOMPLETE. Final verify124/36existing E2E/1000M4 replay0violations. Owner personal login NOT RUN.

Older pending paragraphs below are historical checkpoints.

Current continuation: M1/M2/M3 deployed VERIFIED PASS; M4 v0.3.5 local gates PASS, release verification pending. M5 is conditional INCOMPLETE; implementation plan in MASTER_PLAN. v0.4–v0.6 remain backlog. Older status paragraphs below are historical checkpoints.

Life Expansion: M1 v0.3.2 và M2 v0.3.3 VERIFIED PASS/deployed; M3 v0.3.4 (22scene nháp) INCOMPLETE, M4 v0.3.5 NOT RUN. Không thay ba mốc tương lai kỳ bí/quốc tế/VNĐ. Trạng thái và bước tiếp tục ở LIFE_EXPANSION.

## Life Expansion đang triển khai

v0.3.2 avatar6tuổi/visual: local gates PASS, phát hành đang kiểm tra. v0.3.3 wardrobe ≥24món; v0.3.4 romance/agreement/agency; v0.3.5 parenting/generations: chưa hoàn tất. Xem [LIFE_EXPANSION](LIFE_EXPANSION.md); không coi backlog là tính năng đã có. Mục kỳ bí/quốc tế/kinh tế VNĐ bên dưới tiếp tục là roadmap.


Ngày cập nhật: 30/10/2026. v0.2 triển khai Character Creator, lựa chọn trên 72 sự kiện và lịch sử cục bộ. Kết quả phát hành nằm trong PROJECT_STATUS/V02_REPORT. Backlog không tự mở phạm vi phiên hiện tại.

## v0.3 — Personal Cloud Account và One-Click Gameplay

- Đăng nhập Email/Password bằng tài khoản admin đã tạo/confirmed/cấp quyền, không SMTP/invitation/public signup.
- Guest riêng; autosave/ba slot/history cloud có RLS, offline queue/retry, CAS/receipt, recovery và migration có xác nhận.
- Một chạm thực thi lựa chọn, tự đến sự kiện kế tiếp; không chọn thay, giữ outcome/delayed effects/replay, focus/scroll desktop/mobile.
- Bằng chứng kỹ thuật QA và bước chủ dự án tự nhập tài khoản live được báo riêng.

Chi tiết: [V03_REPORT](V03_REPORT.md), [CLOUD_ACCOUNTS_PLAN](CLOUD_ACCOUNTS_PLAN.md), [MASTER_PLAN](MASTER_PLAN.md).

## v0.3.1 — Persistent Stats + Zero-Scroll Continuous Decisions

Sửa stats ẩn và vùng chọn thấp: HUD luôn hiện, bố cục riêng desktop/phone/landscape, đo actual viewport trước click qua20 quyết định mỗi case. Đã giữ v0.3 Auth/cloud/save/engine, qua77 unit/22 E2E và live6×20/Auth23; CI/deploy VERIFIED PASS. Trạng thái thực ở V031_REPORT/PROJECT_STATUS. Chưa mở gameplay mới.

## v0.4 — Supernatural Longevity

- Ít nhất 24 sự kiện kỳ bí và 5 tuyến truyện dài, ghi rõ là hư cấu.
- Cơ duyên hiếm, tình cờ, có đánh đổi; không buộc mọi nhân vật bất tử.
- Khả năng sống 100, 500, 1.000 năm và xa hơn tùy nhánh.
- Tách tuổi sinh học và tuổi theo lịch; rà lại sức khỏe, nghề, quan hệ, hồi ký, điều kiện sự kiện.
- Chuyển thế hệ NPC/gia đình; không giữ mọi NPC sống mãi theo nhân vật.
- Thời đại tương lai hư cấu, không trình bày như lịch sử thật.
- Nhảy thời gian hiệu quả, ngân sách bước hữu hạn và điều kiện kết thúc; không vòng lặp vô hạn.
- Thiết kế version/save mới và regression cho đời thường/trường thọ trước đổi luật.

**OUT OF SCOPE v0.3.** Chưa triển khai kỳ bí hay bỏ trần 82 tuổi của luật hiện tại.

## v0.5 — International Life

Du học, làm việc quốc tế, đoàn tụ gia đình, di cư/định cư; tuyến truyện về đàn áp chính trị và tìm kiếm bảo hộ cần bối cảnh lịch sử/pháp lý phù hợp. Gợi ý nơi đến theo hoàn cảnh và thời đại, quan hệ/tài chính/nghề nghiệp dài hạn ở nước ngoài. Chỉ là backlog, không triển khai trong v0.3.

## v0.6 — Economy & Asset Shop

- Chuyển tiền mô phỏng sang VNĐ chỉ với versioning, save/replay migration và kế hoạch ledger/inflation/balancing; không chuyển trong v0.3.
- Lương theo vùng/năm/nghề, không một mức cố định mọi thời đại; không giới hạn cứng tổng tài sản.
- Nhà đô thị/nông thôn, chi phí sở hữu và tác động nghề/tài chính.
- Xe máy/ô tô thương hiệu thực bán tại Việt Nam, availability theo thời đại.
- Điện thoại theo thương hiệu/đời máy; PC Builder chọn linh kiện tương thích.
- Aura/social impression, bảo trì/hao mòn, nợ, bán lại và sự kiện liên quan.

Chỉ chuẩn bị thiết kế. Không refactor kinh tế hay thêm shop khi v0.3 chưa nghiệm thu.

## Chơi thử và cải tiến

Ưu tiên điện thoại thật, Safari/Firefox và người chơi thật; đánh giá độ lặp, lựa chọn và nợ dài hạn. Mô phỏng xác minh bất biến, không chứng nhận cân bằng hay tính đại diện Việt Nam. Xem xét tối ưu bundle có frozen v1 và phân trang trước tăng giới hạn 50 kiếp; không xóa lịch sử để xử lý quota.
