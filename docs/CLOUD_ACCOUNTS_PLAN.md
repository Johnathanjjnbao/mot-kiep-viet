# Tài khoản cá nhân và đồng bộ — kế hoạch sau v0.2

**Cập nhật triển khai v0.3: INCOMPLETE.** Có mã SQL/RLS/repository/AuthProvider/cache/sync và 15 tests mới cục bộ; chưa nối UI/session và chưa có project thật. Không đổi trạng thái tài khoản của vợ thành COMPLETE. Xem [V03_PROGRESS](V03_PROGRESS.md), [SUPABASE_SETUP](SUPABASE_SETUP.md). Phần kế hoạch ban đầu dưới đây là bối cảnh v0.2.

**Trạng thái: NOT RUN.** v0.2 chỉ có dữ liệu trên thiết bị. Chưa tạo Supabase project, tài khoản cho vợ chủ dự án, đăng nhập hay đồng bộ; không có dịch vụ trả phí hoặc thông tin đăng nhập trong frontend. Đây là thiết kế cho người bảo trì ở đợt phát triển kế tiếp.

## Trải nghiệm cần đạt

Giữ chế độ khách, chơi và xuất dữ liệu ngay cả khi mất mạng. Chủ dự án mời vợ bằng email qua công cụ quản trị phía máy chủ; không mở đăng ký đại trà. Người được mời thiết lập mật khẩu hoặc dùng liên kết đăng nhập được Supabase Auth hỗ trợ. Không dùng tài khoản/mật khẩu cố định trong mã. Có đăng xuất, khôi phục truy cập, trạng thái đồng bộ và cách xuất bản sao trước khi đổi tài khoản.

Website Pages vẫn công khai. Auth bảo vệ dữ liệu cá nhân bằng quyền cơ sở dữ liệu, không biến HTML/JS thành bí mật. Không đưa tên hay email thật vào repo hoặc dữ liệu mẫu.

## Ranh giới và mô hình dữ liệu đề xuất

Tách bộ lưu cục bộ và bộ đồng bộ trong `src/persistence`; engine chỉ nhận JSON đã kiểm chứng. IndexedDB hiện hành vẫn là bản cục bộ; không đổi ID/xóa store khi bật cloud. UUID cuộc đời ở ngoài RNG/replay. Lịch sử hoàn tất giữ memoir và phiên bản gốc.

| Bảng              | Khóa và trường                                                             | Quy tắc                            |
| ----------------- | -------------------------------------------------------------------------- | ---------------------------------- |
| `profiles`        | `user_id` FK Auth, tên hiển thị tùy chọn                                   | Chỉ đọc/sửa hồ sơ của mình         |
| `saves`           | `(user_id, slot)`, `life_id`, snapshot, versions, `revision`, `updated_at` | Autosave và 3 slot theo người dùng |
| `completed_lives` | `(user_id, life_id)`, snapshot, memoir, checksum, `created_at`             | Thêm một lần; không sửa hồi ký     |
| `sync_receipts`   | `(user_id, operation_id)`, `life_id`, kết quả                              | Gửi lại thao tác không nhân bản    |

Đây là đề xuất, chưa phải migration triển khai được. Kiểm tra kích thước, số action, version và replay ở ranh giới đồng bộ. Checksum phát hiện thay đổi/xung đột, không chứng minh người chơi không sửa dữ liệu.

## Quyền truy cập và lời mời

Bật RLS trên mọi bảng được API truy cập. Chính sách role `authenticated` ràng buộc `(select auth.uid()) = user_id`; UPDATE có cả `USING` và `WITH CHECK`, không cho chuyển chủ sở hữu. SELECT/INSERT/DELETE có chính sách riêng. `completed_lives` không cấp UPDATE; xóa dữ liệu cá nhân là luồng riêng có xác nhận, không xảy ra khi bắt đầu kiếp mới. Khách không có quyền đọc cloud. Không chỉ lọc `user_id` ở frontend.

Danh sách người được mời và `inviteUserByEmail` thuộc máy chủ/admin. Chặn người ngoài danh sách kể cả gọi API đăng ký trực tiếp; không chỉ ẩn nút đăng ký. Khóa publishable có thể dùng trong client sau khi RLS hoàn chỉnh; secret/service-role và quyền mời chỉ nằm phía máy chủ. Khóa đặc quyền có thể bỏ qua RLS: không đặt trong `VITE_*`, bundle, log hay repository. Dùng HTTPS và redirect allowlist riêng cho local/production.

Tài liệu chính thức: [Auth users và lời mời](https://supabase.com/docs/guides/auth/users), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [bảo vệ dữ liệu/API](https://supabase.com/docs/guides/database/secure-data). Cần kiểm tra lại API/cấu hình tại thời điểm triển khai.

## Chuyển dữ liệu khách

1. Sau đăng nhập hiển thị số save/lịch sử cục bộ và cloud; không tự upload khi vừa nhập email.
2. Xem trước danh sách và tài khoản đích, xác nhận sao chép, xuất bản sao; kiểm tra schema/replay trước upload.
3. Mỗi thao tác có UUID/receipt, tiến trình và retry; giữ dữ liệu cục bộ sau thành công hoặc thất bại.
4. Cùng life ID/nội dung: bỏ qua. Cùng ID/nội dung khác: báo xung đột, cho giữ hai bản bằng UUID mới; không ghi đè hồi ký. Hai đời cùng seed vẫn riêng biệt.
5. Đăng xuất gỡ phiên và cache tài khoản khỏi giao diện. Không gán dữ liệu người trước cho tài khoản sau. Chọn giữ/xóa cache cá nhân trên máy dùng chung; không xóa kèm dữ liệu khách.

## Đồng bộ và xung đột

Ghi save dùng optimistic concurrency: gửi `expected_revision`, máy chủ tăng revision trong transaction khi khớp; không dùng giờ máy khách quyết định ai thắng. Khi lệch revision, giữ cả hai bản cùng metadata. Cho chọn tiếp tục một nhánh hoặc tách hai đời; không ghép action log. Lịch sử append-only, dedup theo người dùng + UUID + nội dung. Hàng đợi offline trong IndexedDB có giới hạn và retry/backoff; lỗi mạng/quota vẫn cho xuất dữ liệu, chơi cục bộ.

## Điều kiện gọi là hoàn tất

Chỉ đánh dấu tài khoản của vợ COMPLETE sau khi xác minh lời mời thực, đăng nhập/đăng xuất/khôi phục, A không đọc/sửa B kể cả gọi API trực tiếp, khách không đọc bảng, chuyển dữ liệu có xác nhận, hai thiết bị đồng bộ, hai nhánh xung đột, retry không nhân bản, offline/quota và tương thích save/lịch sử. Kiểm tra RLS bằng session thật, không dùng service-role để chứng minh phân quyền. Quét bundle/history không có credential. Email thật chỉ đi qua luồng quản trị khi triển khai; không xin mật khẩu/token qua chat.
