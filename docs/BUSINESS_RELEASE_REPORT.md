# Cửa hàng và kinh tế người sáng tạo — triển khai tiếp

## Cửa hàng0.3.8-business.1 — local release candidate (01/11/2026)

Tiếp tục checkpoint927e734, giữ toàn bộ VND và save cũ. Đời tạo mới dùng enterprise-v1; ba nhóm hàng, policy giá/quảng bá/tồn kho, sổ tháng, góp/rút vốn, tạm dừng/mở lại, thanh lý50% và12cảnh bốn lựa chọn đã nối UI/dispatch/ledger/save/replay. Hồi ký giữ lịch sử tiệm; salary abstraction bị chặn hai chiều, việc làm thông thường/học tập/gia đình vẫn đi cùng tiệm. Frozen v1/v2,9golden lịch sử vàVND3126831863 giữ nguyên; enterprise opening2481017761 vàfull-life548030889 riêng.

Local verify274tests/28files PASS;18testGameRun cửa hàng gồm30năm/bốnID/120quản lý/100+tuổi. Chromium/Firefox/WebKit ×desktop/mobile6/6 chơi từ0, mở/lỗ/góp vốn/phục hồi/rút/ba slot/reload/export-import/đóng/mởIDmới PASS, axe0. Production Pages-subpath smoke PASS; audit production0; secret scan1484text objects/0findings. PGlite nhận snapshot business thật trong envelope đã duyệt, không phải Auth/JWT/RLS thật. Lượt E2E đầu phát hiện kỳ vọng selector cũ và một request trùng lúc rebuild; đã sửa kỳ vọng QA, đang chạy lại86E2E gồm6business viewports×20quyết định. 1.000đời+canonical mới đang RUNNING; không coi pilot20đời là gate ấy.

Chưa push/deploy bản này. C/D creator vẫn INCOMPLETE; nguồn nền tảng đã đối chiếu tại CREATOR_PLATFORM_RESEARCH.md, chưa bật audience/monetization/TikTokLIVE/YouTube. G5 guest deployment PENDING; owner cloud login NOT RUN. Giữ512actions/5MiB và tối đa4sổ, chung120quản lý, khôngSQL/Auth/RLS mới.


Baseline `7dc19a29fce1d5da56dfe9e47f3f68f47cee6e76`, main sạch/đồng bộ. Trạng thái mới: **INCOMPLETE**, chưa thay mặc định người chơi hoặc phát hành shop.

## Context map và hợp đồng

| Ranh giới | File | Cách tiếp tục |
|---|---|---|
| Nhánh bất biến | domain/model.ts, creator.ts, rules.ts | enterprise-v1 kế thừa annual, academics, employment; currency độc lập |
| Sổ tiệm sẵn có | engine/enterprise.ts, domain/enterprise.ts | Giữ công thức; tách thao tác trên bản engine sở hữu để tick không clone cả đời mỗi tháng |
| Thao tác chính thức | domain/enterprise-actions.ts, engine/business.ts | Zod strict, expected/CAS, vốn/chiến lược/rút vốn/tạm dừng/đóng; tối đa4 ID không tái dùng |
| Clock và truyện | engine/engine.ts, annual.ts | Một clock tháng; không tick qua sự kiện; thanh lý tài sản khi kết thúc; không xóa truyện đang chờ |
| Bảo toàn dữ liệu | persistence/saves.ts, engine/invariants.ts | Actions tái dựng cả sổ, canonical comparison; schema4/512/5MiB giữ nguyên |
| Giao diện | ui/Panels.tsx, EnterprisePanel.tsx, NewLife.tsx | Khu cửa hàng trong Nghề nghiệp; giữ HUD/avatar/5 tab; chỉ dispatch |
| Kiểm chứng | tests/business*.test.ts, scripts/qa-business*, simulate.ts | Đời thật, replay, budget10/30năm và100+, browser6cấu hình, CI/live đúng SHA |

Tiền công việc và sinh hoạt vẫn qua settleMonth. Tiệm dùng posting/transact cho vốn, hàng, doanh thu thuần, COGS, chi phí, rút vốn và thanh lý; profit khác cash flow. Lợi nhuận giữ ở tiệm cho tới khi rút/đóng, không trả thêm salary abstraction business/freelance. Nghỉ hưu không tự xóa tiệm; kết thúc đời thanh lý toàn bộ book còn mở tại cùng tháng, giữ lịch sử. Giao dịch/thao tác thất bại hủy toàn bộ clone. Chỉ đời mới có nhánh mới; chín golden lịch sử và golden VND riêng giữ nguyên.

Ngân sách: tối đa120 thao tác tùy chọn chung cho nhánh mới, kể cả học/quan hệ/gia đình/tủ đồ/tiệm; vận hành tháng không thêm action. UI giữ dự trữ truyện hiện có. Không nâng512, không ép chết/nghỉ hưu để né ngân sách. SQL/Auth/RLS, database IDs và frozen v1/v2 không sửa.

Checkpoint A chỉ PASS khi actions/tick/save/import/replay/invariants nối thật. B chỉ phát hành khi có UI, truyện4lựa chọn, full gates và1.000đời/replay mới. Creator/platform nghiên cứu sau khi shop ổn định. Mọi kết quả VND trước đây là baseline, không dùng làm PASS cho thay đổi này.

## Checkpoint A

33tests liên quan PASS; includes8testGameRun thật,13testVND và12testreducer. Khởi tạo/clock10năm/terminal100+/mid-operation save/import/canonical replay, atomic rejection, stale action, forged state, đóng/mở ID kế tiếp và salary conflict đã kiểm. Golden khởi tạo enterprise2481017761 độc lập. Full hồi quy264tests/28files PASS; chưa UI/default activation/deploy.
