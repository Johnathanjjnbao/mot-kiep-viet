# Backlog sau beta v0.3

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
