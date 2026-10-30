# Một Kiếp Việt v0.3.1 — Persistent Stats + Decision Viewport

Ngày30/10/2026 (Asia/Saigon). Báo cáo phân biệt local/CI/live và đo trước thao tác, không dùng Playwright auto-scroll làm bằng chứng. Tính năng chỉ sửa UI; không mở gameplay mới.

## 1. HEAD đầu và cuối

HEAD đầu `53802c8a5bf3cf0fc7214dfa82c8197d1fc20bc8`, main sạch, remote [Johnathanjjnbao/mot-kiep-viet](https://github.com/Johnathanjjnbao/mot-kiep-viet). HEAD/CI phát hành được bổ sung sau gates; final docs HEAD qua git log/chat để tránh self-reference. Không reset/clean/force push.

## 2. Thay đổi UI

Character hiển thị trực tiếp name/age/year/cash và sáu chỉ số Health/Mood/Knowledge/Skill/Social/Stress từ GameRun, không bản sao state. Bỏ disclosure/đồ trang trí avatar/side-note. Nghề/nơi sinh có trên desktop khi còn chỗ. Story giảm khoảng ornament/typography/spacing, narrative đầy đủ; chỉ options list overflow. Giữ nguyên callback/guards/actions/autosave và original outcome/journal.

## 3. Vì sao lỗi cuộn xảy ra

v0.3 căn đầu card~16px, nhưng ornament/title/text/spacing còn đẩy lựa chọn thấp. Profile chứa stats disclosure closed và trên mobile nằm trước story, bị cuộn khỏi màn hình. Baseline live375×667 profile top−207.5/bottom−64.6; landscape667×375 first choice bottom405.6 > height375. Bằng chứng v031-before.json/3 screenshots. Ở chữ lớn, năm trang trí và tab từng gây tràn mobile, innerWidth/Height lớn hơn device làm assertion cũ dễ báo sai; đã sửa.

## 4. Decision viewport mới

Sau event token mới: focus heading preventScroll, reset cuộn options một lần, căn cả grid chứa HUD/story vào vùng chơi; tính maxHeight options bằng innerHeight−actual list top−12. ResizeObserver/fonts/resize cập nhật ngân sách nhưng không reset vị trí lựa chọn người chơi đã cuộn. Narrative không clamp/ẩn/scroll riêng. Một vùng choices có scrollbar tự nhiên khi cần; wheel/touch/Tab không bị chặn, không overscroll containment/trap. Feedback/history ở dưới nên không đẩy context/choices xuống.

## 5. HUD desktop/mobile

Desktop sticky trái top12px, narrative/choices giữa, secondary world/journal phải khi đủ rộng. Phone/low-height HUDstrip top0, name/age/year/cash và3×2 stats (chữ lớn2×3 để số100 không đè nhãn); landscape rộng dùng6 stat một hàng và narrative/choices cạnh nhau. Header/account/modal không bị che. Labels luôn hiện, không mở Chi tiết; áp lực thấp được mô tả nhẹ nhõm hơn, không màu hóa giảm áp lực thành xấu. Root large text và reduced motion được giữ.

## 6. Đo viewport thực

Sáu case, mỗi case21 measurements trước thao tác (đầu +20 transitions), raw pointer/touch; toàn bộ HUD, sáu rows, narrative và first choice trong viewport, hit test không bị che. innerWidth/Height phải bằng requested device; không chỉ kiểm docWidth<=innerWidth. Chọn middle/last chỉ cuộn list và assert documentScroll không đổi; không dùng locator.click để tiếp cận option. Kiểm ID event/choice được ghi đúng và đúng một lần.

Local mới nhất (px, max qua mọi frame; toàn bộ bounds chi tiết trong v031-local-viewport.json):

| Case        | Viewport | HUD cao nhất | Narrative bottom cao nhất | First choice bottom cao nhất | Decisions |
| ----------- | -------- | ------------ | ------------------------- | ---------------------------- | --------- |
| desktop1440 | 1440×900 | 394.6        | 303.1                     | 407.5                        | 20/20     |
| desktop1366 | 1366×768 | 394.6        | 231.0                     | 335.3                        | 20/20     |
| mobile390   | 390×844  | 111.6        | 363.3                     | 467.7                        | 20/20     |
| mobile375   | 375×667  | 111.6        | 363.3                     | 487.6                        | 20/20     |
| landscape   | 667×375  | 68.6         | 363                       | 266.4                        | 20/20     |
| large-text  | 375×667  | 159.1        | 460.5                     | 600.6                        | 20/20     |

Ảnh trước/sau trong evidence/v031-before-* và v031-local-_-0/10/20.png; live tương ứng v031-live-_ sau deploy. Landscape narrative bottom363 vẫn nằm trên height375; chữ lớn cũng giữ lựa chọn đầu đầy đủ trong height667 (số mới trong bảng).

## 7. Repeated-choice E2E

VERIFIED PASS local: 6 cases×20=120 decisions, đầu/giữa/cuối luân phiên, có4/5/6 options, narrative≥100 ký tự và choice+hint≥70. Mỗi frame số HUD/cash/year/age khớp run vừa lưu; exact seeded replay sau20 hành động chọn; reload giữ nguyên run/event. Mobile dùng native touchscreen, khoảng nghỉ human input>OS double-tap threshold; rapid taps có regression riêng, không nới guard để test qua. Axe0 violations cuối mỗi case.

## 8. Unit/integration/browser gates

Local verify77/77 (9 files), type/lint/content/build PASS. Production E2E22/22 (16 cũ+6 acceptance), 0 fail. Production smoke VERIFIED PASS, secret scan VERIFIED PASS0 findings trong source/dist/history; dependency audit0 advisory. Simulation1.000 seed NOT RUN lại vì engine/content/action semantics không đổi; giữ bằng chứng v0.3. Không đổi engine2/content2/saveSchema3.

## 9. Guest/Auth/save regressions

Guest, manual slot/import/export, full ending/history/new life/reload, legacy v0.1 read-only, keyboard Enter/Space, rapid double mouse/native touch, large text/reduced motion và horizontal overflow PASS trong E2E. Auth/cloud thật VERIFIED PASS23/23 trên build local, với checks HUD được thêm vào harness cũ. Không dùng credentials người chơi, không sửa quyền account hiện có, không migration SQL/RLS mới. Synthetic QA identities được vô hiệu hóa, dữ liệu giữ nguyên theo policy; không xóa production. Bổ sung label/value bounds không chồng lấn, sửa HUD chữ lớn qua hai cột. Một assertion count recovery từng đua async-render đã đổi sang expect.poll, không đổi product behavior.

## 10. Global Skills thực dùng

Kiểm kê22 global directories +5 system. Context Map, Frontend Design, Webapp Testing, Web Design Reviewer, Secret Scanning và Documentation Writer theo pha. Không cài skill/library, không Antigravity/GSAP/subagent. Chỉ scope UI và regression; không làm lại cloud/security architecture.

## 11. Commit

PENDING sau gates. Version0.3.1 trong package/lock/footer. Chỉ stage file dự án; ignored .env.local/.local/.temp không vào Git. Các báo cáo/bàn giao v0.3 giữ nguyên và có addendum patch.

## 12. GitHub Actions

PENDING đúng SHA patch. Workflow Pages giữ npm ci/verify/scan/Chromium E2E/production/artifact/deploy phụ thuộc build, quyền tối thiểu. CI mới có6 viewport journeys chung với local. Sau success còn phải kiểm live, không gọi CI là UX/cloud proof.

## 13. Website thật

[Production](https://johnathanjjnbao.github.io/mot-kiep-viet/). Live6 viewport×20/raw input, guest flow, Auth/cloud và JS/CSS/SW hash verification PENDING sau deploy. Chưa dùng số PASS local/v0.3 thay bằng chứng live v0.3.1.

## 14. Giới hạn

Danh sách dài/lựa chọn sau cần cuộn bên trong vùng options; narrative luôn đầy đủ. Cuộn main document vẫn dùng để về navigation/đọc world/journal, không cần để tìm quyết định tiếp theo ở các case đã kiểm. Phone thật/Safari/Firefox/actual screen-reader software NOT RUN (đã axe/native focus/keyboard/ARIA). Owner tự đăng nhập account cá nhân vẫn NOT RUN; QA dùng riêng synthetic users. Không đảm bảo viewport nhỏ hơn/zoom cực lớn ngoài matrix luôn chứa cả story; không ẩn dữ liệu để giả PASS. Bundle~819kB/gzip245 vẫn warning500kB từ v0.3; không refactor engine/split backend trong UX patch.

## Context map đã review trước triển khai

| File                                        | Purpose/change                                                                                                       |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| src/ui/LifeScreens.tsx                      | Always-visible Character HUD; compact narrative/decisions; position actual decision viewport and reset inner choices |
| src/ui/App.tsx                              | HUD placement/sticky container; remove decorative sidebar note; patch version                                        |
| src/styles.css                              | Scoped gameplay desktop/mobile/short-height layout, readable stats, bounded choices only                             |
| tests/e2e, scripts/qa-decision-viewport.mjs | Pre-click measurements over 20 mixed first/middle/last decisions at six requested viewport/settings cases            |
| scripts/check-pages.mjs, cloud browser QA   | Preserve existing real guest/cloud regression; viewport checks on deployed build                                     |
| package.json/lock, docs                     | Version0.3.1, actual gates/deploy/evidence                                                                           |

Dependencies unchanged: storyAction/decisionKey, session ref/action/autosave, GameRun stats/currentCareer/money, guest/account repositories, frozen v1/history. Reference: native double-click/touch guard and replay tests already in v0.3. Risks: UI layout/focus/scroll only; no API/schema/database migration. New tests must not count Playwright auto-scroll as positioning proof.
