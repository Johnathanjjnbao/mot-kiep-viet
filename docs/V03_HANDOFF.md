# v0.3 — bàn giao phiên unattended

Cập nhật 30/10/2026. Đã phát hành và xác minh kỹ thuật v0.3. G5 VERIFIED PASS; chủ dự án tự đăng nhập tài khoản cá nhân NOT RUN.

1. **HEAD đầu:** 9bbffbc853a42582517bdd7f67ea7826c19fec79 trên main.
2. **HEAD cuối/commits:** code release `4cafcbced975ba9b6b7b16b04331a2186aa65aa7`; commit đầu: feat complete secure cloud accounts and continuous one-tap gameplay. Có commit tài liệu/bằng chứng sau đó, final HEAD/workflow xem git log/chat để tránh self-reference.
3. **Giữ checkpoint:** toàn bộ uncommitted cloud integration từ phiên ngắt được giữ; không reset/clean/force push.
4. **Hoàn thành:** Auth/account/guest repositories; cloud autosave/ba slot/history; offline/retry/conflict/recovery; guest migration có xác nhận; one-click bounded progression; focus/scroll/outcome; duplicate/stale guard; local CAS hai tab.
5. **Chưa hoàn tất:** owner tự đăng nhập NOT RUN; nghiệm thu cá nhân INCOMPLETE. SMTP không thuộc phạm vi.
6. **Auth:** existing manual confirmed/password account đã cấp allowlist; không đọc/dùng password, không tạo lại account. SMTP/invitation/email recovery OUT OF SCOPE, không là blocker.
7. **Migration/RLS:** hai migrations được duyệt/applied từ trước, hash khớp; không SQL mới. 8 SQL fixtures PASS; JWT A/B/anon thật VERIFIED PASS. Không tắt RLS/xóa production.
8. **Cloud save:** cache/queue/CAS/receipt, ba slot, branch recovery; nguồn JWT gắn account, logout không trộn dữ liệu.
9. **History:** immutable/dedup, journal/memoir/replay, phân trang cloud và import/export; đời mới giữ history.
10. **One-click:** 5 regression tests + E2E repeated/double/keyboards/scroll/autosave, engine2/schema3 giữ nguyên.
11. **Test matrix:** verify77, E2E16, simulation1000/0 violation, login axe0, audit0; real-cloud23 PASS; production/scan0 PASS; CI77/16/scan0/production và live guest2 viewports/Auth23 VERIFIED PASS.
12. **Skills:** Context Map, Frontend Design, Webapp Testing, Security Review, Secret Scanning, Documentation Writer; 22 global+5 system, không cài mới.
13. **GitHub Actions:** [41044765048](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41044765048) đúng SHA code: build/deploy completed/success. Repo https://github.com/Johnathanjjnbao/mot-kiep-viet.
14. **Live:** https://johnathanjjnbao.github.io/mot-kiep-viet/ — VERIFIED PASS guest/Auth/cloud23, JS/CSS/SW hashes khớp build. Bằng chứng v03-live-guest.json, v03-live-authenticated.json, v03-live-assets.json, ci-v03.json.
15. **Owner action:** tự nhập email/password ở live, thử sync hai browser. Không cần SMTP. Không gửi token/secret/password qua chat.
16. **Tiếp tục:** đọc AGENTS/PROJECT_STATUS/V03_PROGRESS, git status/HEAD/remote/workflow; đọc evidence và chỉ làm khoảng trống. Sau gates commit/push main, theo dõi đúng SHA, live guest/Auth/assets, bổ sung docs rồi kiểm workflow cuối. QA mới giữ synthetic data và ban identities tự tạo vì owner cấm xóa production.

Giới hạn: hai browser context không phải hai thiết bị thật; Safari/Firefox/phone thật NOT RUN. Không triển khai v0.4–v0.6; MASTER_PLAN/ROADMAP là thiết kế. Không đổi Windows shutdown schedule.

Code và bằng chứng được bảo toàn trong GitHub. Thứ tự tiếp tục: owner tự đăng nhập live → kiểm autosave/ba slot/history trong browser khác → ghi nghiệm thu riêng. Không chạy lại toàn bộ v0.3 hoặc yêu cầu SMTP. Source engine/content không đổi; không cần chạy lặp simulation nếu chỉ cập nhật tài liệu.
