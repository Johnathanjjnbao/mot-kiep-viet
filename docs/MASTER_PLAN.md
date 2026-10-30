# Master Plan — Một Kiếp Việt

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
