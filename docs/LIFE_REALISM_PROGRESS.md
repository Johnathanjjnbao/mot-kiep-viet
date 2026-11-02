# v0.3.9 — Life Realism & Visual Experience

Baseline: `1b339ba1a1ab1a406700ef376d99ea1811343b0a`, nhánh main sạch khi bắt đầu. Không reset/clean, không sửa frozen v1/v2, không SQL/Auth/RLS hoặc đổi ID database. Trạng thái: đang kiểm chứng, chưa phát hành. Phần F chỉ bắt đầu triển khai sau khi A–D được xác minh live.

## Context map và tự kiểm trước sửa

| Ranh giới | Tệp chính | Quyết định |
|---|---|---|
| Selector bất biến | domain/model.ts, creator.ts, rules.ts | realism-v1 kế thừa creator; ngoại hình mới không áp ngược cho save cũ |
| Sổ tiền | engine/finance.ts, childhood.ts, domain/childhood.ts | Quỹ hộ riêng; tiền của trẻ vẫn qua transact; chuyển hai sổ cùng ID, đối chiếu từng cặp |
| Vai và nội dung | content/realism-events.ts, validation.ts, engine.ts | Pool v12 chỉ cho tuổi nhỏ của realism; người chăm sóc0–2, trẻ3–17; cấm hiệu ứng tiền/nghề người lớn |
| Avatar | ui/appearance.ts, Avatar.tsx, NewLife.tsx | Trai/gái và tóc chọn độc lập, hash không dùng RNG mô phỏng; ba tư thế nhỏ và sáu giai đoạn tuổi |
| Tài chính và lựa chọn | LifeScreens.tsx, ChildhoodFinance.tsx, Panels.tsx, styles.css | Đọc GameRun; dùng dispatch; chữ rõ, focus nằm trong khung cuộn; giữ HUD và toàn bộ lựa chọn đầu |
| Canonical | persistence/saves.ts, invariants.ts, diagnostics/simulation.ts | Zod strict/CAS, giữ512 actions,120 quản lý,5MiB; không thêm thao tác tháng |
| Bằng chứng | tests/realism*, avatar.test, qa-realism*, viewportJourney | Năm dạng gia đình, nghèo/giàu, đổi quyền18, forgery,16 golden, sáu browser và sáu viewport |

Tự kiểm: chỉ selector mới nhận sổ hộ và ngoại hình mới;14 golden cũ phải giữ nguyên. Tiền giữ hộ vẫn thuộc trẻ; quỹ hộ không tính vào tài sản ròng của trẻ. Quy đổi designMoney một lần thành số nguyên. Không viết state từ UI hoặc đụng migrations.

## A — Vai và quyền sở hữu tiền

Opening đưa dự phòng vào quỹ hộ, tiền cá nhân lúc sinh bằng0. Trẻ dưới6 không có tiền tự chi; quà vào savings đứng tên trẻ và người chăm sóc giữ hộ. Từ6 có tiêu vặt, từ13 có việc nhỏ sau giờ học; hộ tiếp tục trả sinh hoạt. Chuyển quỹ hộ sang trẻ có posting đối ứng cùng ID. Không nợ hoặc tài sản nghề người lớn trước18. Đủ18 chỉ mở quyền quản lý phần đứng tên mình; quỹ hộ không chuyển sang tài sản cá nhân, clock hộ dừng và giữ làm lịch sử.

UI dùng “Dành cho con”, “Tiền cá nhân”, “Tiền của bạn” theo tuổi. Panel tách sổ hộ và sổ cá nhân, giải thích quyền sở hữu, khoản nhỏ được dùng và sức mua thiết kế VND2026. Hành động để dành/chi nhỏ có strict schema, expected sequence và ngân sách120 chung. Prompt quyết định đọc người chăm sóc cư trú còn sống, có fallback khi không còn cha/mẹ cư trú.

## B — Avatar

setup.presentation lưu boy/girl; bỏ chọn dùng hash riêng có thể tái hiện, không suy từ tên. setup.hairstyle có short/long/curly cho cả hai. Preview và lúc sinh cùng setup đã chuẩn hóa. Render mới có tư thế nằm0 tuổi, ngồi1 tuổi, chập chững2 tuổi và các giai đoạn0/7/15/25/45/70. Wardrobe tiếp tục là nguồn trang phục đã mặc; ngoại hình không đổi luật nghề hoặc tính cách. Thiếu selector mới giữ chính sách avatar cũ.

Đã xem trực tiếp `realism-avatar-gallery.png` (hai cách thể hiện × sáu mốc, thêm1/2 tuổi), ảnh trước/sau desktop/mobile và ảnh focus. Đây là fixture trình bày theo tuổi; hành trình browser khác kiểm trưởng thành qua gameplay thật.

## C — Lựa chọn dễ đọc

Giữ Newsreader, BeVietnamPro và nền ivory. Thẻ charcoal #28332d, chữ cream #fff9ed, hint #e0d9c9; marker và mũi tên rõ. Hover/pressed/disabled riêng, keyboard focus3px nằm bên trong nên không bị clip ở đầu vùng cuộn; reduced motion tắt transition.

Đo RGB thực sau khi transition kết thúc: normal chữ12,50:1/hint9,33:1; hover8,74/6,52; pressed14,39/10,74; focus12,50/9,33; disabled5,43/5,43. Các mẫu cao ít nhất64px (>44). Disabled đo trên clone chỉ để kiểm CSS, không sửa GameRun hoặc nhận là một cảnh có thật. `realism-choice-contrast.json` giữ phương pháp và số đo. Acceptance viewport vẫn đo trước input/scroll, không clamp narrative và chỉ cuộn choice list.

## D — Nội dung tuổi nhỏ

45 cảnh có tên/nội dung/lựa chọn do tác giả viết:12 sơ sinh0–2,9 mẫu giáo3–5,14 tiểu học6–12,10 thiếu niên13–17. Tổng180 lựa chọn; không đếm instance IDs là truyện. Năm callback có điều kiện nối nếp đọc sách, chia chăm sóc, lập ngân sách, việc nhỏ và thử dự án sang cảnh sau, thay kết quả/kỹ năng thật. Validator kiểm cả hiệu ứng lồng, cấm schedule lách tuổi và thù lao trước13. Catalog cũ205 giữ nguyên; tổng mới250 templates tĩnh, các stages cũ độc lập.

## Kiểm chứng hiện có

- verify:300 tests/31 files,16 golden (14 cũ +2 mới) PASS; build Pages đúng base path PASS. Hai golden realism: opening1290334862, full387617215.
- Unit/integration: sinh→6→13→18→100+,5 dạng gia đình × nghèo/giàu; đối ứng từng posting; gift giữ hộ; CAS cũ/giả; không windfall ở18; canonical/import.
- Forced family:3 con +job+shop+channel, đủ120 quản lý, kết thúc tự nhiên107 tuổi;374 actions,986017 UTF-8 bytes,6008 postings hai sổ; replay/import PASS.
- University: học thật2 năm, qualification/progress qua canonical/import; fixture21 tuổi/48 actions/143617 bytes.
- Full-life golden:123 tuổi,251 actions/651814 bytes/4574 postings; không ép chết hoặc hồi ký để né cap.
- Production smoke trên build Pages: tạo đời, lựa chọn, tiến thời gian, autosave/reload, font license PASS. Audit production0; scan1639 text objects,0 findings trước vòng QA cuối.
- Browser mới: Chromium desktop/mobile và Firefox desktop/mobile đã qua preview→sinh→tiêu vặt6→để dành→reload→18, canonical và axe. Sáu browser tổng,96 E2E đầy đủ,1000 đời/replay, scan cuối, CI/deploy/live còn đang chạy.

Các lần thử ban đầu bị hủy do dev HMR hoặc preview sai base path; không nhận là PASS. Ca cửa hàng cũ dùng30 triệu trong khi đời mới chỉ có20,85 triệu; fixture mới góp20 triệu có sổ đủ và phục hồi thật. Ca wardrobe đổi từ đúng6 lên8 tuổi để tích đủ tiền riêng, không sửa luật hoặc cấp tiền giả. Thêm fixture save cũ5 lựa chọn để kiểm đủ4/5/6 khi20 lựa chọn đầu của realism có4. Chỉ kết quả cuối và đúng SHA mới dùng xác nhận release.

## E/F — Nghề bổ sung

Chưa triển khai trong release A–D này: hợp đồng freelancer, gaming career độc lập, collaboration, idol/biểu diễn. Niche gaming/performance cũ không thay cho các cơ chế đó. Sẽ tiếp tục theo thứ tự user yêu cầu sau khi A–D được xác minh live, với selector mới để không đổi đời realism đã phát hành. Không tăng512, không cắt replay và không mở tài khoản nền tảng thật.

Cloud owner login NOT RUN. PGlite chỉ kiểm envelope, không thay Auth/JWT/A–B–anon. Không cài thêm skill, không Antigravity, không dùng credential người chơi hoặc xóa production.

## Chốt gates cục bộ (02/11/2026)

verify cuối300 tests/31 files và16 golden PASS;14 golden cũ giữ nguyên. Simulation1000 đời mới +1000 canonical replay:0 vi phạm/0 fallback/0 tuổi thiếu/0 tuổi bỏ; max462 actions/919340 UTF-8 bytes/5790 postings hai sổ, sổ hộ tối đa578. Quan sát đủ45 cảnh realism mới,500 boy/500 girl;939 đời có kênh,705 kênh từng nhận thu nền tảng. Replay chậm nhất800ms trên máy Windows đang chạy QA song song; heap sample lớn nhất111276792 bytes, không gọi đây là phép đo leak của browser.

Lượt đầy đủ96 E2E cục bộ:88 pass/8 fail do kỳ vọng tài chính và fixture theo mặc định cũ. Sau sửa,16 ca tập trung (gồm cả8 ca đó và sáu viewport×20 lựa chọn đầu/giữa/cuối) đều PASS trên build cuối. Không nhận lượt đầu là fullcommandPASS. Sáu native browser contexts đều PASS và production smoke cuối đúng VITE_BASE_PATH PASS. CI đúng SHA phải chạy toàn bộ96, không skip, trước khi nhận deployed.94 bằng chứng lịch sử đã sao lưu riêng rồi khôi phục nguyên byte; các proof realism/v039 mới được giữ riêng.

Sau simulation chỉ làm rõ hai câu mở tình huống quà để tránh hiểu là đã nhận tiền vô điều kiện; không đổi effect, outcome, condition, selector, giao dịch hay chuỗi canonical.16 golden vẫn PASS. Audit production0; secret scan cuối/commit/push/CI/live đang chờ. Build có cảnh báo entry minified khoảng1,29MB (gzip390KB), giữ nguyên cảnh báo và không nâng ngưỡng để che. Mạng/font và UI đã kiểm thực tế.


## Rà soát ví rỗng — đã sửa trước phát hành

Không kể đã mua hoặc đã để dành khi tiền mặt bằng0, hoặc đã nhận quà tiền khi hộ chưa có phần dư. contextualChildhood thay đường đó bằng xem giá/chờ tiền/lập kế hoạch/giữ lời chúc/dùng đồ sẵn có; vẫn4 lựa chọn khả dụng với kết quả và tradeoff thật, không ghi khoản chi giả hoặc lấy tiền giữ hộ. Quà được chuyển trong cùng choice vẫn có thể cấp nguồn cho bước để dành tiếp sau; không chặn nhầm đường gift→save.

300 tests/31 files,16 golden PASS. Sau thay đổi authoritative này đã chạy lại1000 đời +1000 canonical replay:0 vi phạm/0 fallback engine/0 thiếu tuổi/0 bỏ tuổi; các max462 actions/919340 bytes/5790 postings giữ nguyên; replay max800ms, heap sample max111276792 bytes. Batch trước được giữ riêng, không dùng nó thay cho batch cuối.

Đã thêm snapshot canonical của ví rỗng ở6 tuổi và năm callback đi tới bằng choose/advance thật, không sửa flags hoặc GameRun từ UI. Sáu viewport đo cả những cảnh đó trước input. Cảnh hướng nghiệp ở chữ lớn ban đầu vượt28px; chỉ viết gọn câu nhắc kinh nghiệm trên màn hình, giữ nguyên toàn bộ outcome/effects trong nhật ký,16 golden và canonical không đổi. Không clamp/ẩn narrative. Đang kiểm lại viewport/build cuối và chờ CI/live.


Chốt nguồn trước commit:300 tests/31 files,16 golden;1000 final lives/replays;16 focused UI;6 viewport build cuối gồm5 callbacks và ví rỗng;6 native contexts;production smoke; audit0;secret scan1656 objects/0 findings đều PASS. CI/deploy/live PENDING. Nội dung outcome/effects không đổi khi viết gọn hai câu nhắc trải nghiệm để giữ first-choice trong chữ lớn.


## Đã phát hành0.3.9-realism.1 — G5 guest VERIFIED PASS (02/11/2026)

Nguồn **a2fc1b284a300fdfdbd0846b3cf5a68f283029b9**. [CI41393793903](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41393793903) completed/success cho build và deploy:300 tests/31 files,96 E2E không skip, secret scan1686 text objects/0 findings và production smoke PASS. [Live](https://johnathanjjnbao.github.io/mot-kiep-viet/), [repo](https://github.com/Johnathanjjnbao/mot-kiep-viet). JS/CSS/SW live khớp SHA-256 build lưu riêng. Chromium/Firefox/WebKit ×desktop/mobile6/6 chơi preview→sinh→tiêu vặt6→để dành→reload→18, canonical và axe0 PASS. G5 guest desktop/mobile: trọn đời,5 dạng gia đình, history độc lập/autosave/slot/export/import/font/network PASS; ảnh live đã xem trực tiếp. Không dùng HTTP200 thay cho gameplay.

A–D hoàn thành: selector bất biến realism-v1 kế thừa creator; quỹ hộ tách tiền đứng tên trẻ; quà giữ hộ, tiêu vặt6+, việc nhỏ13+, đủ18 chỉ mở quyền với tiền của mình. Nhánh không có tiền chuyển sang chờ/so giá/lập kế hoạch, không kể đã mua hoặc ghi tiết kiệm giả.45 cảnh tuổi nhỏ/180 lựa chọn, năm callback có hiệu quả thật. Trai/gái và tóc chọn độc lập; preview khớp, sơ sinh nằm/1 tuổi ngồi/2 tuổi chập chững và sáu giai đoạn tuổi. Choice cards có tương phản đã đo, focus không clip; sáu viewport×20 lựa chọn và5 callback/ví rỗng đo trước input, không ẩn narrative.

Giữ14 golden lịch sử, thêm2 golden realism riêng. Final1000 đời mới/1000 canonical replay:0 vi phạm/0 cảnh fallback engine/0 tuổi thiếu/0 tuổi bỏ; đủ45 cảnh mới, max462 actions/919340 bytes/5790 postings; max replay800ms và heap sample111276792 bytes trên Node QA (không coi là phép đo browser leak). Forced3con+job+shop+channel+120 quản lý tới107 tuổi,374 actions/986017 bytes/6008 postings; đời golden123 tuổi/251 actions. Giữ512/120/5MiB, không ép chết hoặc cắt replay. Engine/content3.0.0/schema4, save cũ không đổi luật/tiền tệ/ngoại hình; frozen v1/v2 nguyên vẹn.

Audit production0; scan local1656 objects/0 findings trước push. Lượt local đầy đủ ban đầu88/96 do kỳ vọng/fixture cũ; sau sửa16 focused PASS và6 viewport cuối PASS, CI đúng SHA chạy đủ96 PASS. Không nhận lệnh local fail là fullcommandPASS. Không SQL/Auth/RLS/DB-ID hoặc production deletion; cloud owner login NOT RUN. Cảnh báo bundle>500kB giữ nguyên (entry khoảng1,29MB/gzip391KB); mạng/font đã kiểm, không nâng ngưỡng để che.

Bằng chứng: LIFE_REALISM_PROGRESS.md, realism-source-ci/live-assets/live-pages/live-browsers/local-gates/1000-lives/forced-paths/choice-contrast.json và v039-realism1-local-viewport.json. F (freelancer contracts, gaming độc lập, collaboration, idol) còn INCOMPLETE; sẽ tiếp tục bằng selector mới, không tự thêm luật vào đời realism đã sinh. Kế hoạch CREATIVE_CAREERS_PLAN.md là thiết kế, chưa phải bằng chứng triển khai. Các mục phía dưới giữ làm lịch sử. Commit tài liệu bổ sung sẽ theo dõi workflow cuối riêng.
