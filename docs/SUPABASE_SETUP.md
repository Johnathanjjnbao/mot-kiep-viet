# Supabase v0.3 — tài khoản Email/Password có sẵn

Project `mot-kiep-viet`, ref `kqnapcyceddwvrvkquvg`, URL https://kqnapcyceddwvrvkquvg.supabase.co. CLI 2.122.0 link đúng project. Hai migration 202610300001/202610300002 đã được duyệt và áp dụng; local/remote khớp. Không chạy lại migration mù quáng. Site URL là https://johnathanjjnbao.github.io/mot-kiep-viet/; redirect local 4173/5173 cùng subpath dành cho QA.

## Đăng nhập tài khoản đã tạo

Quyết định mới của chủ dự án thay yêu cầu SMTP/invitation cũ. Tài khoản được tạo thủ công đã có email confirmed và password, đã được cấp quyền game qua private allowlist. Không cần thư mời, không public signup, không cấu hình SMTP trong v0.3.

1. Mở website Pages, chọn **Đăng nhập**.
2. Tự nhập email/mật khẩu đã đặt trong biểu mẫu website. Không gửi credential cho agent/chat.
3. Sau đăng nhập, mở **Tài khoản của tôi** để xem đồng bộ. Chỉ chuyển dữ liệu khách nếu thực sự muốn, sau preview/backup/xác nhận.
4. Tạo đời/chọn một lần, đợi **Đã đồng bộ**. Mở trình duyệt thứ hai và đăng nhập để kiểm tra autosave, ba slot và lịch sử. Đăng xuất rồi xác minh quay lại dữ liệu khách.

Bước người chủ tự đăng nhập vẫn NOT RUN tới khi họ kiểm tra; kiểm tra tài khoản QA không được dùng làm bằng chứng mật khẩu của chủ dự án đúng. Tuyệt đối không đăng nhập thay người chơi hoặc in email/password/token vào báo cáo.

## Cấp quyền tài khoản khác nếu chủ dự án chủ động tạo sau này

Giữ nguyên `Allow new users to sign up` = off. Chỉ admin tạo tài khoản, đặt password/confirm theo quy trình riêng tư của họ và thêm UUID chính xác vào `mkv_private.invited_users`. Tên bảng giữ tương thích migration; đó là allowlist quyền game, không đòi hỏi đã gửi lời mời email.

```sql
insert into mkv_private.invited_users(user_id)
values ('UUID_LAY_TU_AUTH_USERS')
on conflict (user_id) do nothing;
```

Đây là cấp quyền user, không đổi schema. Không đặt email người chơi trong source. Frontend không có API tạo user/admin hoặc quyền chỉnh allowlist. Người dùng thường vẫn bị RLS giới hạn theo JWT.

## Quên mật khẩu khi chưa có SMTP

Website không cung cấp nút gửi email khôi phục. Người còn đăng nhập có thể đổi mật khẩu tại Tài khoản của tôi → Đổi mật khẩu. Nếu mất quyền truy cập, liên hệ chủ dự án qua kênh riêng đã xác thực danh tính. Admin dùng môi trường quản trị đáng tin cậy và [Supabase auth.admin.updateUserById](https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid) để đặt lại password cho đúng UUID, truyền giá trị từ đầu vào bí mật trong bộ nhớ. Không chạy với password viết trong shell history, SQL, source hoặc chat; không đưa secret key vào browser. Hết phiên hỗ trợ, người nhận tự đổi mật khẩu. Không tự đổi password của tài khoản hiện có khi chỉ đang kiểm thử.

Đăng nhập thông thường dùng [signInWithPassword](https://supabase.com/docs/guides/auth/passwords); SMTP chỉ liên quan luồng gửi thư và nằm ngoài phạm vi hiện tại.

## Cấu hình và QA

Frontend chỉ có URL và publishable key công khai. `.env.local`, `.local`, `supabase/.temp` được ignore. CLI login hiện có do chủ dự án thực hiện, không xin token/database password qua chat. `supabase/config.toml` chỉ quản lý các thuộc tính Auth cần thiết; không ghi đè SMTP hoặc cấu hình khác. Migration production mới phải được review và phê duyệt trước khi áp dụng. CI không chạy migration hay admin QA.

```powershell
npx.cmd supabase migration list --linked
$env:VITE_BASE_PATH='/mot-kiep-viet/'
npm.cmd run verify
# Preview build production trên cổng 4173, hoặc đặt MKV_QA_URL = URL live:
npm.cmd run test:cloud:live -- --browser
```

Runner chỉ dùng project ref cố định đã duyệt; tạo hai synthetic QA users với password ngẫu nhiên trong bộ nhớ. Assertions RLS dùng JWT authenticated bình thường, admin chỉ setup/vô hiệu hóa fixture. Chỉ thị unattended mới cấm xóa production: dữ liệu QA được giữ riêng và tài khoản synthetic của lượt chạy bị ban sau khi kết thúc, không xóa user/data, không đụng tài khoản chủ dự án. Không lưu trace/storageState chứa token. Báo cáo chỉ ghi kết quả, không email/password/link/token. Hai browser context không phải hai thiết bị vật lý.

## Sao lưu và sự cố đồng bộ

Xuất save JSON tối đa 5 MiB; history tối đa 50 bản/20 MiB mỗi tệp. Giữ nguyên database guest. Conflict hai thiết bị: chọn một nhánh, nhánh kia được giữ tại Bản sao khôi phục để xuất/chơi tiếp/lưu vào slot cloud riêng. Hai tab chung IndexedDB: ghi dựa trên nhánh cũ bị chặn nguyên tử, giữ nhánh mới vào recovery, báo lỗi và yêu cầu người chơi chọn tiếp. Không ghép action log. Queue/quota lỗi giữ local mới nhất; không xóa lịch sử. Dữ liệu local có thể bị trình duyệt thu hồi, vì vậy nên có export cá nhân.
