# Life Expansion — bốn mốc phát hành

Baseline main sạch `a204bd0bba62f341eda66e3b6788c87f18c545f3`, v0.3.1; engine/content2, schema3, 72 event. Không dùng PASS cũ thay kiểm thử mới.

## Context map đã review

| Mốc | Files / trách nhiệm | Kiểm thử |
| --- | --- | --- |
| M1 | ui/appearance.ts, Avatar.tsx: chân dung SVG nhiều lớp, identity thuần theo seed; LifeScreens/NewLife/LifeHistory: tích hợp; styles.css: hệ thị giác | 6 stages, identity/reload, hình ảnh, viewport6×20 và guest/cloud |
| M2 | domain/engine/content/persistence: inventory, buy/equip/outfits, ledger, contextual attire; UI Shop | phiên bản/replay, chi tiêu/idempotency/ownership, cloud JSON validator |
| M3 | NPC ID, preferences/agreement/status/memory; adult-only choices và tuyến drama; UI People | độc lập3 admirers, rejection/marriage/affair/discovery/reconcile/death |
| M4 | children IDs/parent/caregiver/development/agency; narrative family; UI Family | sinh–trưởng thành, đa con, divorce/custody/death, schooling/career/replay |

Dependencies: useGameSession/storyAction và GameRepository giữ ranh giới UI→engine→replay→save; Auth scoped JWT/CAS/receipts không thay. Frozen v1 không sửa. M1 không đổi domain, engine, content hay save; appearance là dữ liệu trình bày dẫn xuất nên save/history hiện có tự có chân dung nhất quán. Không tiêu thụ RNG mô phỏng.

## Hướng mỹ thuật M1

Giấy ngà #f5f2e9, trắng ấm #fcfaf5, mực #2e352e, đất nung #974733, lá #526d50, vàng cũ #a47b43. Newsreader kể chuyện, Be Vietnam Pro cho thao tác/số. Chân dung bút nét tối + mảng màu phẳng có bóng nhẹ; hình người có mặt/tóc/thân/trang phục/giày riêng, không dùng icon làm avatar. Hình lớn ở chào đời/hồi ký, bên trái desktop, crop chân dung nhỏ trên phone. Ưu tiên story/choices; không thêm chiều cao HUD mobile nếu không cần. Giữ contrast/focus/touch44 và reduced motion.

Đã đọc Frontend Design + Context Map; tham khảo UI/UX Pro Max. Kết quả design-system tự động thiên SaaS không phù hợp game, không áp palette/font đó; dùng truy vấn UX có mục tiêu và bộ nhận diện đã có. Không thêm thư viện/hình có bản quyền bên ngoài.

## Version và bảo toàn dữ liệu

M1 vẫn engine/content2/schema3. M2 dự kiến engine/content3/schema4, giữ v2 nguyên bản và route replay theo version; old run không chạy luật mới. Schema/cloud validator hiện chỉ cho1/2; cần migration mở thêm tuple3/schema4, không đổi table/ownership/RLS. SQL mới phải kiểm thử/rà/hash và xin duyệt trước production. M2–M4 dùng chung version foundation; phát hành sau mỗi gate, không giả hoàn tất khi chỉ có UI. Không overwrite/xóa guest, slots hoặc archives khi đổi luật. Chi tiết được chốt trước thay domain.

## Trạng thái

M1 VERIFIED PASS và đã phát hành. M2 local VERIFIED PASS, CI/live đang kiểm tra; M3/M4 NOT RUN; chưa có shop/romance/parenting mở rộng. Wearables28 (3mặc định), events mới5, arcs mới0; tổng77templates/3arcs. Không kỳ bí/trường thọ/quốc tế/VNĐ trong phạm vi này. Mỗi mốc sẽ ghi commit/CI/live và giới hạn riêng.

## M1 — v0.3.2, 31/10/2026

- Avatar SVG nguyên bản có 6 tuổi, 5 màu da, 5 kiểu tóc, biến thể mặt/vóc dáng/màu vải; nhận diện từ hash có namespace `mkv-portrait-v1`, không tiêu thụ RNG. Có biểu cảm từ sức khỏe, tâm trạng, áp lực; tuổi sinh học có thể truyền riêng cho tương lai.
- Creator xem trước cùng seed sẽ sinh; chân dung ở chào đời, HUD desktop/mobile, hồi ký và Life History. Tinh chỉnh bề mặt giấy ngà, đường vàng/đất nung, lựa chọn và khoảng cách. Không đổi luật, event hay schema ở M1.
- Local: verify81/81 (11 files), E2E24/24 (18 luồng và6 viewport), production subpath smoke PASS. Sáu viewport ×20 quyết định, đo avatar/HUD/6stats/narrative/firstchoice trước input bằng tọa độ thật, reload/replay và axe; ảnh `v032-local-*`, bảng đo `v032-local-viewport.json`. Ảnh sáu tuổi `v032-avatar-stages.png` đã xem trực tiếp; không continuous animation/nested main scroll. Chưa kiểm tra thiết bị vật lý/Safari/Firefox.
- Hai lượt E2E từng chồng máy chủ làm connection refused; chạy sạch riêng24/24. Một production smoke thiếu biến base path làm asset không tải; chạy lại đúng `/mot-kiep-viet/` PASS. Không lấy kết quả lỗi làm PASS.
- Simulation1000 không chạy lại ở M1 vì engine/content không đổi; không dùng kết quả lịch sử như kết quả mới. Các mốc authoritative sau phải chạy lại.
- Migration `202610300003_life_expansion.sql` đã được chủ dự án duyệt đúng SHA A4F089D74B3E9EBD77EE148A63DE742F4FD749A1B3C1599D9421D3B3F719C26B và áp đúng project `kqnapcyceddwvrvkquvg` qua CLI db query. Trước validator chưa có3.0.0, sau có3.0.0, md5 function `56acd647c63bb2c93c5af6acb6e2f278`. Giữ tuple cũ, bảng/RLS/grants/giới hạn5MiB/actions512; không sửa/xóa user data. PGlite kiểm thử mới giữ grants và chặn identity/header/version/actions sai. M1 vẫn chỉ ghi schema3.
- Cloud/Auth local23/23 VERIFIED PASS bằng hai synthetic users với JWT thường và browser contexts độc lập (`v032-local-authenticated.json`): RLS A/B/guest,3slot,outbox/offline,retry,conflict,archive đều qua. Secret Scanning0 findings trên working/public/history và npm audit production0 advisory. Code commit403509669f237d410f40c6027bd80a030b0da39d đã deploy qua [workflow41096367741](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41096367741), completed/success. Live guest desktop/mobile,6viewport×20decision, Auth/cloud23/23 và0page/network lỗi VERIFIED PASS. CSS/JS/SW khớp từng byte với artifact GitHub12995149488 của đúng SHA (ZIP SHA256 a134826d6e9ee86669ab010806d6eb810d330d68a53c2d1ccf065eca45495f2b); local precommit assets khác tên CI nên không dùng làm bằng chứng khớp, xác minh trực tiếp artifact đã deploy. Evidence `v032-live-guest/authenticated/assets/viewport.json`, ảnh đã xem trực tiếp. Owner tự đăng nhập tài khoản hiện có NOT RUN; automation chỉ dùng synthetic fixture riêng, không xóa production và không ghi credentials.
- Skills thực dùng: Context Map, Frontend Design, UI/UX Pro Max, Webapp Testing, Web Design Reviewer, Secret Scanning, Documentation Writer. Không cài thêm skill/library, không Antigravity. User đã cho phép tự cập nhật tài liệu nên không chờ outline approval của skill.

## Tiếp tục M2–M4

Freeze v2 trước đổi luật. Schema4/engine-content3 dùng setup có ruleset bất biến để replay các đời wardrobe/social/family đúng luật đã tạo; UI không tự thêm inventory/relationship state. Áp ledger và action IDs cho mua/equip; validate replay cả snapshot và archive; kiểm tra old schema3 vẫn chơi được bằng frozen2. Không xóa hoặc tự nâng các đời đang chơi. M2 cần ≥24 item và social contexts có thật; M3–M4 cần35–50 event mới/≥4arc, agency và tham chiếu gia đình. Những mục này chưa triển khai ở M1.

Migration003 đã ghi nhận applied vào lịch sử CLI bằng migration repair sau khi kiểm tra function thực tế; không chạy lại SQL lần hai.

## M2 — v0.3.3, chốt phát hành

Đời mới engine/content3.0.0/schema4 có setup.expansion=wardrobe bất biến; chưa chấp nhận social/family chưa phát hành. Frozen v2 giữ nguyên bộ luật cũ, schema3 vẫn chơi đúng luật cũ, golden4148875142 và v1 không đổi. Golden wardrobe1173022751 khóa riêng cho các mốc sau. Không đổi ID database,3slots,UUID,history,CAS/receipt; không tự nâng/xóa save. Parser strict action + replay + canonical mọi field, từ chối inventory/outfit tự gán.

28 wearable (25 mua +3 mặc định),14 kiểu cắt/phụ kiện,6 vị trí mặc. Có SVG áo dài/váy/áo khoác/giày/nơ/mũ/khăn/kính và thumbnails gốc. Shop lọc loại, thử không lưu, mua qua ledger, chỉ mặc đồ sở hữu, tháo về mặc định, lưu8 bộ và mặc lại. Engine xét tuổi/era, trẻ dùng khoản gia đình trong kinh tế có sẵn. Giá đSM, không VNĐ; không tự vay mua đồ. Chặn duplicate/stale và gesture kép. Ngân sách350 thao tác manage+wardrobe (wardrobe160) để log cả đời dưới512.

Thêm5 template thực (phỏng vấn/nghi lễ/vận động/nhóm sáng tạo/tiết kiệm), mỗi template4 lựa chọn có hệ quả khác và delayed effects. Tổng77 template/3arc. Presentation theo context capped -4..5, có lợi/bất lợi khác nhau; không cộng tri thức/attraction chung. Purchase memories vào journal/memoir/archive. Chưa làm M3/M4.

Local89 tests,24 nhóm real Auth/cloud (mua+mặc desktop→reload mobile, chỉ1ledger/item),1.000seed/1.000replay/0vi phạm/1.000mua;77/77event quan sát,34.997scene có4–6choices, maxsave397.942bytes. Full E2E26 PASS trước visual refinement; lượt final đang chạy. Không tính lượt E2E đã dừng để bổ sung gesture guard là PASS. Không lặp simulation khi chỉ sửa CSS/buttons. CI/live M2 chưa xác nhận.

Security Review: UI chỉ dispatch, preview không ghi state; không innerHTML/eval/secrets mới. Replay/canonical chống forge/import sai; SQL authorize/giới hạn envelope, không chống người dùng cố ý tự sửa JSON riêng qua REST. RLS/JWT mới là biên riêng tư;8 SQL auth tests và24 backend/browser groups qua. Không thay policy/grant/SECURITY DEFINER; migration003 đã được duyệt/applied, không SQL production khác.

M2 final local gates: verify89/89, E2E26/26 (có shop axe0, double-click, outfit/reload,6viewport×20choice), production subpath smoke PASS. Ảnh shop desktop/mobile đã xem và chỉnh button/thumbnail/HUD để không che nội dung quản lý. Secret scan0 findings; simulation1000/replay1000/0 violations chỉ chạy một lần sau luật ổn định. Chưa gọi M2 G5 trước CI/live.

## G5 M2 — VERIFIED PASS

Code `a2388aee7a44d7189a6ef08fa1beaaf21466111b` / main đã deploy bằng [workflow41100506471](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41100506471), completed/success. Live guest desktop/mobile,6viewport×20choices,24 nhóm real Auth/cloud (gồm shop→mobile, offline/retry/conflict/3slots/history) và CSS/JS/SW khớp build: VERIFIED PASS. Thêm regression import schema3 trên desktop/mobile cả local và live: tiếp tục đúng frozen2, giữ toàn bộ run sau reload, không tự thêm wardrobe. Không dùng credential owner. Owner tự đăng nhập NOT RUN. Evidence `v033-live-*`; physical device/Safari/Firefox NOT RUN.

## Checkpoint M3/M4 — INCOMPLETE

M3 có bản nháp22 cảnh/88 lựa chọn ở `docs/drafts/romance-events.ts.txt`, model đề xuất ở `docs/drafts/social-model.ts.txt`. Đây là input thiết kế chưa nối engine/UI, không phải22 template đang chơi được. Tổng đang hoạt động vẫn77event (5mới),3arc,28wearable,6avatar stages. Chưa có ví dụ3admirers hay marriage/infidelity mới chạy thật; M3 gameplay NOT RUN. M4 parenting chưa triển khai, NOT RUN. Toàn bộ Life Expansion INCOMPLETE, không dùng PASS M1/M2 thay cho M3/M4.

Bước tiếp theo:1) bật ruleset social chỉ cho đời mới, giữ golden wardrobe1173022751/v2/v1;2) tạo3NPC ổn định, preferences/trust/affection/interest riêng, EQ theo hành vi, adult/consent/agreement guards;3) nối22 cảnh và People UI, timeline/context resume giữ mọi event đang chờ;4) tests các nhánh rejection/exclusive/marriage/secret/discovery/reconciliation/divorce/death và replay/cloud,1000seed, release v0.3.4;5) ruleset family,15–20scene/2arc parenting, stableparents/caregivers/custody,8patterns/childagency và birth→career tests;6) release v0.3.5. Không tự bật social/family cho wardrobe runs đã lưu. SQL003 đã mở engine3/schema4, không cần SQL mới nếu giữ envelope; mọi SQL mới vẫn phải duyệt.

Skills thực dùng thêm: Security Review cho save/ledger/auth boundaries và Humanizer cho biên tập lời kể. Không có sub-agent, không cài skill/library mới. Hai draft được bảo tồn trong Git để không phụ thuộc thư mục .local khi tiếp tục.
