# v0.3 — bàn giao phiên unattended

Cập nhật 30/10/2026. Gates cục bộ và real Auth/cloud đã qua; đang commit/push/CI/live. Chưa tuyên bố đã phát hành.

1. **HEAD đầu:** 9bbffbc853a42582517bdd7f67ea7826c19fec79 trên main.
2. **HEAD cuối/commits:** PENDING sau gates; ghi code SHA tại đây, final docs HEAD qua git log/chat để tránh self-reference.
3. **Giữ checkpoint:** toàn bộ uncommitted cloud integration từ phiên ngắt được giữ; không reset/clean/force push.
4. **Hoàn thành:** Auth/account/guest repositories; cloud autosave/ba slot/history; offline/retry/conflict/recovery; guest migration có xác nhận; one-click bounded progression; focus/scroll/outcome; duplicate/stale guard; local CAS hai tab.
5. **Chưa hoàn tất:** chốt CI/live; owner tự đăng nhập NOT RUN.
6. **Auth:** existing manual confirmed/password account đã cấp allowlist; không đọc/dùng password, không tạo lại account. SMTP/invitation/email recovery OUT OF SCOPE, không là blocker.
7. **Migration/RLS:** hai migrations được duyệt/applied từ trước, hash khớp; không SQL mới. 8 SQL fixtures PASS; JWT A/B/anon thật VERIFIED PASS. Không tắt RLS/xóa production.
8. **Cloud save:** cache/queue/CAS/receipt, ba slot, branch recovery; nguồn JWT gắn account, logout không trộn dữ liệu.
9. **History:** immutable/dedup, journal/memoir/replay, phân trang cloud và import/export; đời mới giữ history.
10. **One-click:** 5 regression tests + E2E repeated/double/keyboards/scroll/autosave, engine2/schema3 giữ nguyên.
11. **Test matrix:** verify77, E2E16, simulation1000/0 violation, login axe0, audit0; real-cloud23 PASS; production/scan0 PASS; CI/live PENDING.
12. **Skills:** Context Map, Frontend Design, Webapp Testing, Security Review, Secret Scanning, Documentation Writer; 22 global+5 system, không cài mới.
13. **GitHub Actions:** PENDING đúng SHA code. Repo https://github.com/Johnathanjjnbao/mot-kiep-viet.
14. **Live:** https://johnathanjjnbao.github.io/mot-kiep-viet/ — v0.3 mới chưa xác minh deployment trong checkpoint này.
15. **Owner action:** tự nhập email/password ở live, thử sync hai browser. Không cần SMTP. Không gửi token/secret/password qua chat.
16. **Tiếp tục:** đọc AGENTS/PROJECT_STATUS/V03_PROGRESS, git status/HEAD/remote/workflow; đọc evidence và chỉ làm khoảng trống. Sau gates commit/push main, theo dõi đúng SHA, live guest/Auth/assets, bổ sung docs rồi kiểm workflow cuối. QA mới giữ synthetic data và ban identities tự tạo vì owner cấm xóa production.

Giới hạn: hai browser context không phải hai thiết bị thật; Safari/Firefox/phone thật NOT RUN. Không triển khai v0.4–v0.6; MASTER_PLAN/ROADMAP là thiết kế. Không đổi Windows shutdown schedule.
