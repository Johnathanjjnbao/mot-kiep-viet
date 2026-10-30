# Một Kiếp Việt v0.3 — báo cáo phát hành

Ngày 30/10/2026 (Asia/Saigon). Tiếp tục đúng game/repository hiện có. Bản này thay yêu cầu SMTP/invitation trước đó bằng tài khoản Email/Password đã tạo thủ công. Kết quả CI/live sẽ được điền sau triển khai, không dùng số cũ thay chứng cứ mới.

## 1. Checkpoint khôi phục

Main HEAD ban đầu `9bbffbc853a42582517bdd7f67ea7826c19fec79`, remote [Johnathanjjnbao/mot-kiep-viet](https://github.com/Johnathanjjnbao/mot-kiep-viet). Working tree cloud dang dở được giữ, không reset/clean/force push.

## 2. Đã có trước lượt resume

Nền tảng SQL/RLS/cache trong commit 9bbffbc; uncommitted integration Auth, repository, autosave/ba slot/history, offline/retry/conflict/recovery, guest migration và service worker. Có bằng chứng cũ 71 unit/12 E2E/23 nhóm cloud QA, nhưng không tính chúng thay gates mới.

## 3. Hoàn thiện trong lượt này

Auth existing-account labels, bỏ nút gửi email recovery/URL invitation. Quyền allowlist cho chính tài khoản confirmed/có password đã tồn tại. Continuous storyAction, native one-tap choices, duplicate/stale guard, outcome không chặn, focus/scroll vào story. Local transaction CAS bảo vệ hai tab chung cache. Giữ engine/content2.0.0/schema3 và frozen v1, không đổi nội dung/tài chính/RNG. MASTER_PLAN và ROADMAP v0.4–v0.6 chỉ là thiết kế.

## 4. Tài khoản chủ dự án

Đã xác minh confirmed/password-present và game allowlist bằng truy vấn chỉ trả trạng thái, không đọc/in email hoặc mật khẩu. Không tạo lại account, không đăng nhập thay người chơi. **NOT RUN:** chủ dự án tự nhập credential trên live. Real QA dùng hai tài khoản synthetic riêng, không dùng account của chủ dự án.

## 5. Migrations production

Project ref `kqnapcyceddwvrvkquvg`, CLI 2.122.0 link đúng. Hai migration đã được người dùng phê duyệt riêng và áp dụng; kiểm tra remote list và file hash khớp:

- `202610300001_cloud.sql`: `8BC4FD0A180416406137649F8342B3F684B0AD7F77D5BD92EEB96FFED83158B0`.
- `202610300002_conflict_http.sql`: `BF9464E459B8EF604B2AE630702F28B383A2596A52AE25EE7C3D72A5168DB8E8`.

Lượt resume không áp migration mới, không nới RLS, không xóa production. QA mới chỉ vô hiệu hóa synthetic identities do lượt đó tạo, giữ dữ liệu theo chỉ thị unattended.

## 6. RLS/privileges

Bốn public tables RLS; anon denied; user chỉ đọc own rows. Profiles chỉ write display_name, UPDATE có USING/WITH CHECK. Save/history/receipt không direct DML; definer RPC lấy owner auth.uid, allowlist, CAS/receipt, search_path rỗng, không dynamic SQL. Archive immutable. PGlite 8 tests là SQL fixture; real A/B/anon authenticated JWT tests riêng. Advisor có 3 WARN về definer executable là API chủ đích, không tuyên bố zero cảnh báo.

## 7. Cloud Save

Autosave/ba slot/cache project-user, replay/version/size validation, CAS server/receipts. Queue hữu hạn/coalesce unsent, retry giữ cùng payload/operation ID, giữ latest local khi full. Local CAS chặn tab stale ghi đè nhánh mới; recovery fork UUID ngoài engine, không ghép action logs. Local real QA VERIFIED PASS 23 nhóm, gồm ba slot UI.

## 8. Đồng bộ giữa browser

Hai context độc lập desktop/mobile, Auth thật: A lưu/B tải, offline/reload/reconnect, revision conflict/chọn nhánh, logout/switch. Bổ sung ba slot UI và hai tab chung IndexedDB. Kết quả hiện hành trong evidence/v03-real-browser.json và v03-live-authenticated.json sau deploy. **NOT RUN:** hai thiết bị vật lý/Safari/Firefox.

## 9. Life History

Archive hoàn tất độc lập slot, giữ journal/memoir/replay/schema, idempotent và immutable. Guest tối đa 50/20 MiB tệp; cloud phân trang 20. Import/export và đời mới không xóa history. Owner self-test riêng chưa chạy.

## 10. One-click UX

Một tap = một choose hợp lệ rồi advance hữu hạn đến active event/ending. Không confirm/tiếp tục lặp lại, không chọn thay, không tự manage tiền/nghề. Guard token chứa runID/actionCount/month/eventID, ref cập nhật trước render; native double click/repeat không áp lần hai. Outcome vẫn hiện, chi tiết chronology trong recent-results và journal. Save outcome checkpoint cũ vẫn có nút tiếp tục một lần khi cần.

## 11. Viewport/accessibility

Story container ổn định, heading focus preventScroll và scroll đến card, không lên đầu toàn trang sau mỗi event; feedback nằm dưới lựa chọn. Không nested scroll. Bàn phím Enter/Space, screen reader live status, large text/reduced motion. E2E desktop1440/mobile375 đã qua; login axe1440/375 zero overflow/violation. Lỗi accessible name và mobile double-click focus ban đầu đã sửa.

## 12. Test matrix mới

| Gate                                | Trạng thái                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| Verify type/lint/unit/content/build | VERIFIED PASS cuối: 77/77, 9 files                                  |
| SQL fixtures                        | VERIFIED PASS 8/8 (nằm trong 77)                                               |
| Guest E2E production                | VERIFIED PASS 16/16 desktop/mobile                                             |
| Simulation                          | VERIFIED PASS 1.000 đời, 0 vi phạm/0 failures, 4–6 lựa chọn trong 35.045 event |
| Login visual/axe                    | VERIFIED PASS 1440/375, 0 overflow/violations                                  |
| Dependency audit                    | VERIFIED PASS 0 advisory                                                       |
| Final production smoke/secret scan | VERIFIED PASS; 0 findings cả dist/history |
| Real backend + browser mới | VERIFIED PASS 23/23, gồm ba slot, hai tab và history |
| CI/Pages/live guest/Auth            | PENDING sau commit                                                             |
| Owner manual login                  | NOT RUN                                                                        |

Các file evidence và logs được đối chiếu kết quả thật trước release. Preview QA từng thiếu VITE_BASE_PATH, harness login từng trùng selector sau đổi accessible label; sửa cấu hình/scoping, không nới assertion bảo mật.

## 13. Skills thực dùng

Kiểm kê thực tế 22 global directories và 5 system skills; dùng Context Map, Frontend Design, Webapp Testing, Security Review, Secret Scanning và Documentation Writer. Không cài skill/plugin mới, không Antigravity/GSAP/subagent. Browser QA bằng Playwright Node/Edge, CI Chromium.

## 14. Commit/branch

Branch main. SHA code phát hành/final HEAD và các commits ở V03_HANDOFF/git log sau commit. Chỉ stage file dự án, `.env.local/.local/.temp` ignored. Không có privileged key/user credential trong repo/log/frontend.

## 15. GitHub Actions

PENDING đúng SHA phát hành. CI npm ci → verify → secret scan → browser E2E → production smoke → dist artifact; deploy depends build. Không SQL/admin QA trong CI. Public URL/publishable key có chủ đích, không secret/service-role.

## 16. Website thật

[GitHub Pages](https://johnathanjjnbao.github.io/mot-kiep-viet/). Sau CI success chạy guest desktop/mobile, one-tap/save/history/login UI và authenticated QA; đối chiếu JS/CSS/SW hashes. HTTP200 hoặc CI success đơn lẻ không chứng minh cloud sync.

## 17. Giới hạn

Owner manual login NOT RUN là bước nghiệm thu ngoài automation. SMTP/invitation/email recovery OUT OF SCOPE. Hai contexts không là hai điện thoại. JS khoảng820 kB/gzip245 có warning500 kB, chưa tách tải. Offline shell cần lần mở online, browser có thể thu hồi quota/cache. Recovery branch local cần export/lưu cloud riêng. DB không chạy TS replay; frontend kiểm replay. Không penetration test độc lập hoặc chống sửa bằng DevTools.

## 18. Việc chủ dự án cần làm khi trở lại

Mở live → Đăng nhập, tự nhập tài khoản đã tạo; thử một lựa chọn, đợi Đã đồng bộ và tải trên browser khác. Không gửi mật khẩu/token. Nếu lỗi, cung cấp thông báo hiển thị đã bỏ thông tin riêng; hướng dẫn quản trị recovery ở SUPABASE_SETUP. Không cần SMTP/migration approval mới cho phạm vi hiện tại.
