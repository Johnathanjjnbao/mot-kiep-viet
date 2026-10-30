# v0.3 — checkpoint hiện tại

30/10/2026. Khôi phục main 9bbffbc và giữ uncommitted integration, không làm lại. Chủ dự án thay SMTP/invitation bằng existing Email/Password; đã kiểm tra confirmed/password/allowlist, owner self-login NOT RUN.

Đã có cloud autosave/ba slot, history, offline/retry/CAS/receipt, recovery và explicit guest migration. Resume thêm continuous one-click, outcome/focus/scroll/duplicate guard và local CAS cho hai tab. Engine/content2.0.0/schema3 giữ nguyên, legacy read-only. Hai approved migrations khớp hash/remote, không SQL mới, không nới quyền/xóa production.

Gates mới: 77 unit/integration, 16 desktop/mobile E2E, 1.000 seed/0 vi phạm, login axe0, audit0. Real Supabase23 nhóm PASS, production smoke/secret scan0 PASS; đang commit/push/CI/live. Chưa coi số PASS cũ là kết quả mới. QA mới giữ dữ liệu, ban synthetic identities tự tạo. Không dùng credentials của chủ dự án.

Xem V03_REPORT (18 mục), V03_HANDOFF và V03_RESUME. MASTER_PLAN/ROADMAP chỉ thiết kế v0.4–v0.6. Bước owner đăng nhập live sẽ không chặn các công việc phát hành/kiểm thử độc lập.
