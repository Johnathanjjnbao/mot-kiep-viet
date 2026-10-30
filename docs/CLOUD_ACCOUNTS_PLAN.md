# Personal Cloud Account — v0.3

Life Expansion M4: engine/content3/schema4 retains immutable wardrobe/social/family rulesets and frozen v1/v2 routes. FamilyAction and per-child state are canonical-replayed; recorded parents never follow a changed spouse. Migrations001/002/003 already approved/applied, no production SQL in this continuation. Real A/B/anon and complex-family cloud26groups PASS locally; live pending. This is private-save isolation/integrity, not server anti-cheat against editing one's own JSON. Owner personal login stays NOT RUN.

Tiếp tục main 9bbffbc, giữ uncommitted cloud implementation. Đã nối Auth Email/Password, account cache/outbox, autosave/ba slot, immutable history, explicit guest migration, CAS/receipt và recovery branches vào game v0.2.

Quyết định mới: chỉ tài khoản đã được admin tạo/confirmed/cấp quyền. SMTP, invitation và email recovery ngoài phạm vi. Tài khoản hiện có đã kiểm tra confirmed/password/allowlist; chủ dự án tự đăng nhập trên live, không đưa credential vào chat.

GuestRepository giữ DB cũ. AccountRepository theo project/user; nguồn JWT riêng cho mỗi account, gỡ worker cũ khi switch. Sync dùng revision server, không chọn thắng bằng timestamp. Hai tab chung cache có local CAS và giữ nhánh cũ vào recovery. CompletedLifeRepository phân trang/immutable, kiểm replay/version. Engine không import Supabase.

Bốn public tables có RLS/grants; private invited_users chỉ admin quản lý (tên cũ giữ tương thích, không phải yêu cầu email). Save/history/receipt chỉ ghi bằng RPC kiểm auth.uid, allowlist và revision trong transaction. Hai migration đã được duyệt/applied, không thay SQL trong lượt resume này.

Cần hoàn tất gates mới, commit/push/Pages/live và báo trạng thái từng phần. Kiểm thử QA A/B/anon không thay bước chủ dự án tự dùng tài khoản của mình. Xem [V03_REPORT](V03_REPORT.md), [SUPABASE_SETUP](SUPABASE_SETUP.md), [CLOUD_ARCHITECTURE](CLOUD_ARCHITECTURE.md). Roadmap v0.4–v0.6 không thuộc triển khai hiện tại.
