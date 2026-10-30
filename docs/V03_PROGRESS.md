# v0.3 — checkpoint triển khai, chưa phát hành

Baseline main 479fa05fcaef005700919e0cfc3ee7dcad46cf9e sạch; giữ bản game hiện tại, không sửa engine/content/replay.

Đã đọc yêu cầu v0.3, AGENTS, PROJECT_STATUS, V02_REPORT, CLOUD_ACCOUNTS_PLAN, ROADMAP, SAVES_AND_SECURITY và các đường đi session/save/history/UI/test. Kiểm kê thực tế skill tại máy; dùng Context Map và Security Review. Baseline typecheck và 49 test PASS; không coi kết quả này là bằng chứng cloud.

## Phần đã có mã

- SQL migration trong transaction: allowlist người được mời do admin quản lý, RLS/grants, profiles, 4 save/account, immutable archive và receipt.
- Save RPC derive owner từ JWT, khóa transaction, CAS theo revision và operation receipt; archive dedup nội dung, khác nội dung báo conflict. Không cấp quyền DML trực tiếp lên save/history/receipt.
- Contract/repository Supabase tải xuống qua parseSave/replay/validateLifeRecord, phân trang lịch sử 20 bản; không để engine phụ thuộc SDK.
- AuthProvider chỉ sign-in/recovery/update password/logout; không signup/admin invitation; feature config mặc định tắt, từ chối secret key.
- Cache/queue IndexedDB riêng theo project và user, không sửa database guest; coalesce bản chưa gửi, giữ operation ID khi retry, backoff/tối đa 8 attempts, giữ nhánh conflict, dừng cập nhật UI khi worker đã stop.
- 8 tests SQL/RLS và 7 tests cache/sync/config mới đã PASS (15 tổng mới). Mock network không chứng minh sync thật. Chưa có UI tài khoản, chưa nối repository vào phiên chơi, chưa có giải quyết conflict/chuyển guest/queue archive hoàn chỉnh.

## Trạng thái tách biệt

| Mục                                           | Trạng thái                                         |
| --------------------------------------------- | -------------------------------------------------- |
| Nền tảng cục bộ                               | INCOMPLETE, có mã và 15 test mới                   |
| Typecheck/lint/content/build                  | VERIFIED PASS, build base /mot-kiep-viet/          |
| Unit/integration tổng                         | VERIFIED PASS, 64/64 (49 cũ + 15 mới), 8 file      |
| Production guest smoke                        | VERIFIED PASS; JS/CSS entry hashes giữ nguyên v0.2 |
| npm audit                                     | VERIFIED PASS, 0 advisory tại checkpoint           |
| RLS fixtures PostgreSQL                       | VERIFIED PASS trong môi trường PGlite có kiểm soát |
| Production migration/RLS                      | NOT RUN, chưa có project đích                      |
| Auth/email invitation/recovery thực           | NOT RUN                                            |
| Cross-device, cloud history thực              | NOT RUN                                            |
| UI/account switching/migration guest tích hợp | INCOMPLETE                                         |
| Bản live hiện hành                            | v0.2, chưa phát hành cloud v0.3                    |

Đã hỏi chủ dự án Project URL và publishable key qua câu hỏi chờ; không xin bí mật hay email của vợ. Không áp SQL production trước xác nhận đích/quyền. Xem SUPABASE_SETUP cho thao tác chủ dự án. Chưa tạo tài khoản/dịch vụ trả phí, không cài skill mới.

Checkpoint này có thể push an toàn vì không kích hoạt tài khoản hoặc gọi Supabase trong game; browser bundle giữ nguyên, Pages vẫn hiển thị v0.2. Commit/release foundation không phải công bố v0.3 COMPLETE. Workflow và SHA cuối được xác minh riêng, không dùng deploy Pages thay bằng chứng Auth.

## Tiếp tục

Khi có project: kiểm tra Auth config/đích, xin phép áp đúng migration đã review, thực thi deny tests bằng JWT A/B; rồi hoàn thiện account UI/session repositories, history/outbox, explicit migration và conflict branches; các luồng guest/cloud phải qua gates trước push/release. Trước đó có thể tiếp tục tests và hoàn thiện mã độc lập. Không chạy 1.000 seed khi không đổi simulation.
