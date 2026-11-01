# Cửa hàng và kinh tế người sáng tạo — triển khai tiếp

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
