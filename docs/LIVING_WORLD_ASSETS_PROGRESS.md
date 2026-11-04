# Living World & Assets — v0.3.11

## Checkpoint phát triển — 04/11/2026

**INCOMPLETE; chưa phát hành.** Bắt đầu từ `a3b7cad877bb58810ea7d34f61fab8a5c0afaab1`, nhánh `codex/living-world-assets-20261104`. Tag stable `pre-hiatus-v0.3.10-stable.1` giữ nguyên ở nguồn `a07e34faac8e024fd842603f1355e1cabc980a86`. Working tree ban đầu sạch và remote main khớp. Không sửa hoặc ghi đè backup stable.

401 tests,29 golden,120 E2E và1.000+1.000 là kết quả **lịch sử** của stable; chưa nhận là kiểm chứng mới cho tài sản.

## Context Map — đã tự review trước triển khai

| Tệp | Trách nhiệm và thay đổi dự kiến |
|---|---|
| src/domain/model.ts,creator.ts,rules.ts | Selector assets-v1 bất biến, kế thừa stable; field/action mới chỉ tồn tại ở đời mới |
| src/domain/living-assets.ts mới | State/action strict, tài sản đang giữ, nơi ở, tiền cọc, khoản vay có giới hạn |
| src/content/living-assets.ts,pc-parts.ts mới | Catalog mô phỏng theo thời kỳ, vùng/tầng giá; tách định nghĩa khỏi ownership |
| src/engine/finance.ts | transact vẫn là nơi ghi số dư; đối ứng tài sản và nợ mua trả góp, net worth trừ đúng từng khoản |
| src/engine/living-assets.ts mới | Thuê/mua/chuyển/bán/sửa/nâng cấp, chi phí và khấu hao tự động, khoản vay và chậm trả |
| src/content/world.ts | Không thu trùng phần thuê nhà trừu tượng; lợi ích có trần cho đời assets |
| src/engine/engine.ts,invariants.ts | Khởi tạo/dispatch/settlement, gate sự kiện nhà cũ và đối soát mới; giữ replay cũ |
| src/persistence/saves.ts | Allowlist action mới, giữ replay/canonical và giới hạn512/5MiB; không đổi DB ID |
| src/engine/academics.ts,employment.ts,creator-economy.ts,freelance.ts | Lợi ích học/làm/sáng tạo nhỏ, không trả doanh thu thêm và không ép mọi nghề mua PC |
| src/ui/App.tsx,Panels.tsx,LivingAssetsPanel.tsx mới | Một mục Đời sống, danh mục con; chi phí trước mua, xác nhận và expected sequence |
| src/content/living-assets-events.ts mới | Tình huống có context và mạch nhiều năm, ít nhất4 lựa chọn khả dụng |
| tests/living-assets*,scripts/qa-living-assets*,diagnostics | Giao dịch, replay, golden độc lập, browser và forced near-cap đời dài |

Tham chiếu Graft: model.ts:96–143,277–354; rules.ts:1–24; finance.ts:7–115; engine.ts:168–350,476–546,786–881,999–1267; invariants.ts:18–152; saves.ts:36–184; App.tsx:252–290. Caller graph `hasStableRules --depth all` đã kiểm đường kế thừa tới engine, diagnostics, UI và tests. Cạnh GameRun/transact bị mơ hồ do frozen cùng tên; không coi kết quả caller rỗng là không có phụ thuộc.

## Quyết định version và rủi ro

- Giữ engine/content3.0.0, schema4 theo cơ chế capability đã có; selector mới assets-v1 và golden riêng. Không sửa stable/creative/realism hoặc frozen; không tự gán đồ cho save cũ.
- Giữ512actions,120discretionary,5MiB. Ownership đang giữ có giới hạn; đồ đã bán không giữ object đầy đủ, lịch sử ý nghĩa ở journal/actions. Chi phí thường kỳ không thêm action.
- Giá trị tài sản hiện hành chỉ ở finance.assets. Giá mua, tuổi món đồ và linh kiện là chứng từ lịch sử; không nhân giá trị vào net worth lần nữa. Tiền cọc là khoản phải thu, không phải căn nhà sở hữu.
- Khoản vay mua tài sản mới có principal riêng và posting riêng; nợ sinh hoạt cũ không bị diễn giải lại. Integer VND sức mua thiết kế2026, không phải giá danh nghĩa lịch sử.
- Catalog bắt đầu bằng tên/tầng mô phỏng, không bịa model hoặc thông số hãng thật. Phần tương lai được ghi rõ hư cấu. Điều kiện sử dụng phương tiện là tham số game, không tự nhận đã mô phỏng mọi giấy phép/lệ phí thực tế.
- Default UI vẫn stable-v1 tới khi các vòng chơi mới qua gates. Các checkpoint A–D được commit an toàn trên nhánh phát triển; chỉ hợp nhất và deploy phần đã hoàn chỉnh, không phát hành PC chỉ có catalog.
- Không migration SQL/Auth/RLS. Owner login và fresh cloud QA: NOT RUN; kiểm PGlite không thay Auth/JWT thật.

## Mốc thực hiện

| Mốc | Trạng thái |
|---|---|
| Baseline/tag/remote/context map | VERIFIED PASS |
| A: nhà ở đầy đủ | LOCAL PASS; chuẩn bị commit nền tảng |
| B: phương tiện | LOCAL PASS; checkpoint transport đã bổ sung3ca canonical |
| C: thiết bị | LOCAL PASS core + Edge desktop/mobile; checkpoint riêng tiếp theo |
| D: PC Builder | LOCAL PASS core/cấu hình/financing + Edge desktop/mobile; checkpoint riêng tiếp theo |
| E: tích hợp/narrative/ngân sách/gates/CI/live | INCOMPLETE; final1000/fullE2E/CI/live chưa chạy |

Gates sẽ ghi lệnh, kết quả mới, SHA, CI và ảnh thật khi thực hiện. Chưa có tuyên bố v0.3.11 đã deployed.

## Lõi tài sản — kiểm chứng đầu tiên

Typecheck và full unit/integration mới: **417 tests/41files PASS**, gồm16ca tài sản;29golden lịch sử không đổi. Hành trình canonical university-0 kiếm đủ520triệu ở28tuổi bằng luật thật, mua nhà497,25triệu tiền mặt/trả trước đều strict-save/replay PASS. Cọc thuê phòng1,224triệu đối ứng tài sản phải thu; tiền thuê612nghìn +150nghìn chi phí nhà mỗi tháng tách sinh hoạt cơ bản. Chưa chạy final verify/E2E/1.000seed của expansion; chưa phát hành.

Đã phát hiện writer ngoài hệ nhà ở: social cohabit tự gán housing=rent. Chỉ assets-v1 giữ nơi ở đã có khi sống chung; thuê/chuyển nhà phải có thao tác và sổ tiền thật. Đời cũ giữ hành vi cũ. Effect housing cũ (kể cả chance/schedule) bị loại khỏi pool assets, thay bằng nội dung mới sau đó.

## Kế hoạch UI — đã review theo brief

Giữ palette và font hiện hành: giấy ngà, mực xanh sẫm, đất nung, đường kẻ nhạt; Newsreader cho tiêu đề và Be Vietnam Pro cho điều khiển. Không tạo hệ thẩm mỹ mới. Bố cục: Tài chính → Đời sống và tài sản → Nhà ở/Phương tiện/Thiết bị/PC Builder. Năm mục điều hướng chính và Tủ đồ giữ nguyên. Đầu panel có lối về câu chuyện đang chờ; HUD dùng khung hiện hành.

So sánh từng lựa chọn bằng tiền cần trả ngay, chi phí tháng, tình trạng, tác dụng và lý do chưa mua được. Xác nhận giữ expected sequence để double tap không mua hai lần. PC chọn linh kiện ở draft, chỉ trừ tiền khi xác nhận cấu hình hợp lệ. Responsive một cột trên mobile, nút44px và focus nhìn thấy; dùng Modal đã có. Tự review: không thêm biểu đồ/tô màu hoặc các nút trang trí; thông tin sở hữu và nghĩa vụ tiền quan trọng hơn số lượng thẻ.

## Checkpoint A — nền tảng chơi được, chưa phát hành

Lõi dùng chung đã có nhà thuê/cọc/đổi chỗ/mua/vay/bán/sửa,7phương tiện,8thiết bị và PC9nhóm/41linh kiện. Tổng22mục catalog sở hữu/thuê; UI Tài chính mở đủ4nhóm, tải panel riêng. Giữ default stable-v1 và package0.3.10-stable.1 trong giai đoạn kiểm chứng; save cũ không tự chuyển selector.

Fresh `VITE_BASE_PATH=/mot-kiep-viet/ npm.cmd run verify`:448tests/42files,29golden lịch sử,content365/errors0,lint/typecheck/build PASS.27ca narrative tách theo từng cảnh để100nhánh canonical không dồn vào một test30giây; lần grouped timeout là FAIL, không gọi là PASS. Fixture25/25cảnh/100lựa chọn đều đi qua engine thật, lưu và replay, không sửa số dư/NPC/tuổi. Ba mạch phòng thuê/PC/khoản vay có callback cách nhau ít nhất12tháng.

Browser mới:2/2Edge desktop/mobile mua nhà, xe+tập dùng, thay điện thoại, PC sai RAM bị chặn/cấu hình đúng mua được;3slot/export/import/reload,axe0,focus sau xác nhận PASS. Đã xem ảnh thật home/PCmobile và vehicledesktop. Sáu viewport×25cảnh và20lựa chọn đầu/giữa/cuối:6/6PASS. Lượt đầu6FAIL do helper dùng vị trí choice trước khi UI lọc lựa chọn không khả dụng; đã sửa phép đo và thêm đối chiếu data-choice-id trước click. Không sửa story UI/HUD để che lỗi.

P0 tìm được và đã sửa: đường công khai lặp bỏ việc/tìm việc có thể kết thúc ở91tuổi với554actions, vượt parser512. Riêng assets-v1 dự trữ story cho mọi optional command và direct manage; không chặn choose/advance. Cùng ca sau sửa kết thúc96tuổi/348actions/43optional,strict save/replay PASS; không cắt lịch sử/tuổi hoặc ép chết. Combined có bằng thật,3con,8lượt nghề,tiệm+kênh,nhà vay/PCvay,hai lần thuê,xe máy+ô tô,3lần thay điện thoại và nâng PC:86tuổi/324actions/107optional/1.033.032bytes PASS. Đây chưa phải ca100+ hoặc near512; sẽ có kiểm tra bổ sung. Một biến thể dùng đủ120optional đạt85tuổi/333actions/988.417bytes.

Vốn cửa hàng được giữ độc lập trong finance.assets; không bị invariant ownership cá nhân coi là orphan. Thu hồi linh kiện tính đúng tuổi/giá riêng, không phân bổ từ giá trị các linh kiện mới. Chỉ cảnh tiền bạc khẩn cấp một lần được đi trước notice tìm việc; notice vẫn giữ để xử lý sau. Cảnh gia đình chật được ưu tiên một lần để không mất cửa sổ con nhỏ; milestone con không bị bỏ.

Các mốc trên là local. Final1000, golden assets riêng, fullE2E,3engines×2devices, production smoke cuối, audit/secret scan, main push/CI/live còn INCOMPLETE. Không Auth/RLS/SQL mới; migration003 cho phép envelope schema4/actions512, không có allowlist chặn type mới. Owner login và fresh live A/B/anon vẫn NOT RUN.

Trước commit nền tảng: typecheck/lint bổ sung PASS; secret scan2036text objects (working files,publicdist,reachableGitblobs)/0findings PASS. Auditproduction0; auditall12moderate/0high/0critical trong nhánh ESLint/minimatch của dev tools hiện có. Không đổi dependency hoặc downgrade cưỡng bức để làm đẹp báo cáo. .env.local chỉ có3biến public client config, không có tài khoản synthetic A/B sẵn dùng; không tạo Auth identities mới.

## Checkpoint B — phương tiện

Nền tảng A đã commit `f2aa36583125210d866db8bec95caf139b7ec63c`; final1000 đang chạy từ lõi ấy, kèm fingerprint nội dung/luật. Thêm3ca canonical phương tiện PASS: quyền sở hữu khác tập vận hành, hỗ trợ đi lại tối đa3không cấp lương/nghề; hai phương tiện thu đúng2,7triệu/tháng trong12tháng một posting gộp, hao mòn/sửa tốn tiền; bán/thay giữ lịch sử và chặn bán ID cũ lần hai. Hành trình Edge desktop/mobile đã mua/tập sử dụng ô tô và ảnh thật được xem. Không đổi engine/content trong checkpoint B; browser3engines/finalrelease còn PENDING.
