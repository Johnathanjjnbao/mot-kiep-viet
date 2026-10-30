# Thiết lập Supabase cho v0.3 — đang chờ chủ dự án

Trạng thái: backend production, Auth, thư mời, email recovery và đồng bộ thật **NOT RUN**. Mã nền chưa nối vào giao diện/phiên chơi. Website v0.2 vẫn hoạt động như trước. Không chạy migration này tự động trong Pages/CI.

## Thông tin cần từ chủ dự án

Tạo hoặc chọn một project Supabase riêng cho game, gói Free. Cần Project URL và publishable key công khai; không gửi password database, secret/service-role, refresh token hay email/mật khẩu của vợ vào chat/repo. Xác nhận project ID trước áp dụng SQL. Hiện không có connector Supabase trên phiên này, không có CLI Docker/psql/Supabase đã tìm được; có thể dùng Dashboard SQL Editor theo hướng dẫn sau khi chủ dự án xác nhận.

## Trình tự setup và xác nhận

1. Trong Auth, tắt **Allow new users to sign up**. Không có API signUp/admin invite trong frontend. Cấu hình này phải được thử bằng một yêu cầu đăng ký không được mời, không chỉ kiểm tra ảnh Dashboard.
2. Site URL và redirect allowlist gồm `https://johnathanjjnbao.github.io/mot-kiep-viet/`. Khi thử local thêm chính xác `http://127.0.0.1:5173/mot-kiep-viet/` hoặc URL dev thực dùng, không dùng wildcard production. Callback phải về đúng subpath.
3. Xem trước `supabase/migrations/202610300001_cloud.sql`, xác nhận đích rồi mới chạy. Migration nằm trong transaction, không sửa/xóa dữ liệu guest. Có private allowlist UUID, profiles, cloud_saves, completed_lives, sync_receipts và RPC an toàn kiểm tra revision. Không chạy lại mù quáng nếu bảng đã tồn tại; cần kiểm tra version/migration history.
4. Dashboard Auth → Users → Invite user. Chủ dự án nhập email thực tại Dashboard, không điền trong repo. Sau khi có UUID người dùng thật, quản trị thêm UUID ấy vào `mkv_private.invited_users`. Không cho client ghi bảng này. Chỉ có lời mời Auth mà chưa allowlist vẫn không được đọc/ghi dữ liệu game.
5. Kiểm tra thư mời/thiết lập mật khẩu/recovery thực. Có thể cần SMTP phù hợp với địa chỉ nhận. Không tạo dịch vụ SMTP trả phí khi chưa được phép; mặc định Supabase có giới hạn và không được coi là bằng chứng email sẽ tới người nhận thực.
6. Chỉ bật `VITE_CLOUD_ENABLED=true`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` khi mã tích hợp hoàn tất và tests backend/Auth thật đã qua. Hiện chưa được bật. SDK chỉ nhận publishable key, không nhận secret/service-role.

## SQL và giới hạn kiểm chứng

RLS bật trên mọi bảng ứng dụng; anon không có quyền. Người đã mời chỉ SELECT hàng của mình. Profiles chỉ cho sửa display_name, không user_id. Save/receipt/archive không cấp DML trực tiếp; RPC derive user_id từ auth.uid(), search_path rỗng, không SQL động, kiểm tra allowlist rồi khóa theo user/slot và CAS revision trong một transaction. SECURITY DEFINER cần thiết để client không bỏ qua CAS bằng UPDATE bảng trực tiếp; không có tham số user_id để giả chủ sở hữu. Hồi ký thêm một lần và không UPDATE/DELETE trong gameplay.

SQL kiểm tra envelope/version/identity/action count/kích thước; **không tái chạy engine TypeScript trong PostgreSQL**. Mọi tải về vẫn phải qua parseSave/replay và validateLifeRecord; dữ liệu cloud không đáng tin chỉ vì đã được ghi. SQL fixture archive có trạng thái ended tổng hợp chỉ thử quyền/bất biến DB, không chứng minh một cuộc đời hợp lệ qua replay.

Tests dùng PGlite PostgreSQL WASM với auth.uid fixture và `SET ROLE authenticated/anon`, đã xác minh role không superuser/bypassrls. Đây là kiểm thử policies thật trên PostgreSQL, nhưng không kiểm tra Supabase JWT gateway, email hay Auth. Production migration/RLS còn cần kiểm tra A/B/anon trên project thật.

## Các bước bắt buộc trước công bố hoàn tất

Chạy lại guest baseline/E2E/subpath; kiểm tra hai session A/B thật, không đặc quyền; deny đọc/sửa chéo, đổi chủ, ghi trực tiếp, sửa/xóa archive, tệp quá lớn/phiên bản sai; retry idempotent và revision cũ conflict. Thử đăng nhập/đăng xuất/session restore, thư hết hạn, reset password. Hai browser/device phải load cùng save và lịch sử; offline/reload/reconnect; giữ hai nhánh conflict; guest migration có xác nhận/xuất bản sao và không xóa guest. Điện thoại thật/two physical devices phải ghi NOT RUN nếu chỉ có mô phỏng. Không đánh dấu tài khoản của vợ sẵn sàng trước các bước đó.

## Nguồn chính thức đã đối chiếu

- [Supabase password sign-in và recovery](https://supabase.com/docs/guides/auth/passwords)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Database functions và quyền execute](https://supabase.com/docs/guides/database/functions)
- [Admin invitation](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail)
- [PGlite](https://pglite.dev/docs/)
