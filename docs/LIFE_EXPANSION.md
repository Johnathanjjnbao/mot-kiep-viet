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

M1 VERIFIED PASS và đã phát hành. M2/M3/M4 NOT RUN; chưa có shop/romance/parenting mở rộng. Wearables mới0, events mới0, arcs mới0. Không kỳ bí/trường thọ/quốc tế/VNĐ trong phạm vi này. Mỗi mốc sẽ ghi commit/CI/live và giới hạn riêng.

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
