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
| C: thiết bị | LOCAL PASS;3ca thiết bị/import và2ca policy reserve mới |
| D: PC Builder | LOCAL PASS;8golden assets,PC financing/upgrade và history browser |
| E: tích hợp/narrative/ngân sách/gates/CI/live | INCOMPLETE;1000/replay đã hoàn tất, fullE2E/cross-browser/CI/live còn PENDING |

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

## Checkpoint C — thiết bị và negative import

Checkpoint B `ed85da3` đã commit.3ca thiết bị mới PASS: tier có lợi ích nhỏ nhưng không sinh lương/kênh/thu nhập; sửa tốn tiền và không reset tuổi, thay xóa ownership cũ; parser từ chối sửa owner, thêm tiền hoặc command field lạ. UI ghi rõ chỉ số hỗ trợ là tổng của các đồ đang giữ. Không gán mức tính toán của PC cho riêng điện thoại.

Lượt1000 đầu đã dừng sau khi ghi100/1000 và gặp seed103/118: policy tự nghỉ việc rồi cố resume học dù phần dự trữ đã hết chỗ cho bước thứ hai. Đây là engine từ chối optional command, không phải chấp nhận mua vượt tiền. Đã sửa policy để kiểm phần dự trữ giữa hai thao tác, kể cả mua/mặc đồ; thêm2regression canonical PASS. Không sửa luật hoặc bỏ hành động trong đời người chơi. Lượt dở không được nhận là1000PASS; log giữ ngoài repo. Fresh verify sau sửa:456tests/45files,29golden lịch sử,content365/errors0,lint/typecheck/Pages-base build PASS. Final1000 sẽ chạy lại trọn bộ từ checkpoint C.

## Checkpoint D — PC, hồi ký và kiểm chứng đời dài

PC đã có9nhóm/41linh kiện, tương thích socket/RAM/form/clearance/lưu trữ/tản nhiệt/nguồn, build tiền mặt hoặc trả trước50%/24tháng, thay linh kiện/bán/sửa với chứng từ riêng. Browser Edge desktop/mobile đã nâng vỏ→nguồn→GPU, vay PC8,65triệu và vay nhà348,075triệu, canonical từng bước PASS. Trước1995 panel giải thích chưa có PC thay vì đưa9ô trống; máy đã mua hiển thị cấu hình thật đang giữ. UI đọc draft và chỉ dispatch khi xác nhận.

8golden assets mới khóa độc lập29golden lịch sử: opening,cọc hư hại/rời thuê,mortgage,PC financed+upgrade,bán xử lý nhà,combined86tuổi,long112tuổi và death107tuổi còn2.299.996₫ nợ PC.3ca PC economy kiểm không trẻ hóa CPU khi thay vỏ, không thu hồi nhầm giá linh kiện mới và giới hạn12hồ sơ vay. Không sửa expected của golden cũ. Fresh verify cuối D:468tests/47files,37golden tổng,content365/errors0,lint/typecheck/build Pages-base PASS.

Final1000 đã hoàn tất trên cùng luật/content/parser từ `ea4ae64`:1.000đời +1.000strict canonical replay,0vi phạm/0mismatch/0fallback/0tuổi thiếu-bỏ, max371actions/109optional/1.169.112bytes, tuổi62–100,1.000người từng sở hữu/thuê và291người từng vay. Báo cáo [assets-1000-lives.json](evidence/assets-1000-lives.json) giữ rõ2batch:999đời hợp lệ của lượt đầu; seed955 bị engine từ chối đổi tài sản khi pending story mất điều kiện, được policy xử lý như một lần từ chối rồi trả lời câu chuyện trước. Chỉ chạy lại seed955; `git diff --quiet ea4ae64 -- src/domain src/engine src/content src/persistence` xác nhận không đổi luật. Giữ [lượt FAIL ban đầu](evidence/assets-1000-initial-guard-failure.json),không nhận lượt ấy là một lệnh1000PASS. Presentation counters gồm cả prefix đã thử; tổng tài chính/hành động chỉ tính1.000đời đã hoàn tất.

[Forced paths](evidence/assets-forced-paths.json):11fixture canonical, trong đó combined có bằng thật/3con/8lượt nghề/tiệm+kênh/housing moves/ô tô/3lần thay điện thoại/PCvay+nâng cấp tới86tuổi,324actions/107optional/1.033.032bytes; biến thể120optional tới85tuổi/333actions; long-life112tuổi; death107tuổi còn nợ;12vay đã tất toán và lần13bị từ chối. Reserve-boundary churn thực sự chạm dự báo512 ở198actions, từ chối optional tiếp rồi kết thúc tự nhiên97tuổi/348actions, không cắt log/tuổi. Không gọi đây là canonical đời511actions. Input giả513 chỉ là negative parser check và bị từ chối.

Browser history mới2/2PASS: kết thúc112/107tuổi, số nợ Summary gồm cả khoản vay tài sản,2hồi ký/export canonical, mở đời đang chơi khác vẫn giữ2bản. Đã sửa UI refresh khi archive vừa hoàn tất; trước đó mở lịch sử quá nhanh có thể giữ danh sách rỗng cũ. Chờ đọc2save dài có thể vượt5giây nên test chờ đúng điều kiện tới20giây; không coi việc tăng timeout là cải thiện hiệu năng. Cả số dư/hành động/archive vẫn được kiểm, có trạng thái đang giữ hồi ký và nút thử lại khi lỗi. Không đổi DB ID hoặc format history.

Default/package/main/live vẫn stable ở checkpoint D. E còn: bật default mới ở candidate đã bảo vệ, full130E2E,cross3engines×2devices,profileCPU4×,production smoke,secret scan/audit cuối,main push/exact-SHA CI/live. Entry khoảng1,337MB/gzip404KB, panel riêng22,62KB; giữ cảnh báo500KB, chưa tuyên bố tăng tốc. Owner login/fresh cloud A/B/anon NOT RUN; không Auth/RLS/SQL mới.

## Candidate E —0.3.11-assets.1, chỉ ở nhánh phát triển

D đã commit `46b1c866f2df9bb1342505a498415740268e061e`. Bật assets-v1 ở cả4đường setup/portrait/quick-start/confirm của NewLife; chỉ ảnh hưởng đời tạo mới. Package/lockfile đổi version0.3.11-assets.1, không đổi dependency. Fresh verify468tests/47files/37golden/content365errors0/Pages-base build PASS. Edge desktop/mobile đã tạo đời assets từ giao diện, chọn2cảnh tuổi nhỏ rồi chơi nhà/xe/điện thoại/PC+vay/nâng cấp/save-load PASS2/2. Các assertion của active browser suites về default được đổi sang assets-v1; fixture/golden stable/frozen giữ nguyên. Script qa-pre-hiatus-personas vẫn là công cụ lịch sử dành cho stable0.3.10.

Chưa push main hoặc deploy. Full130E2E trên build sản xuất,6browser combinations,production smoke,profileCPU4×,scan/audit cuối và exact-SHA CI/live đang PENDING. Backup/tag stable không đổi; chỉ đọc đường dẫn bản dist đã restore để chuẩn bị benchmark so sánh, không sửa bộ phục hồi.

## Tiếp tục nghiệm thu candidate E

Candidate E đã commit `0e8a0b02e06e51fe91a04cf07f9334153d3f7fae`; không làm lại checkpoint hoặc lượt 1.000 đời. Cross-browser trên production dist đã **VERIFIED PASS 6/6**: Chromium (Edge), Firefox và WebKit × desktop/mobile; gồm tạo đời assets, nhà/xe/điện thoại/PC, vay, nâng cấp, ba ô lưu/export/import/reload và hai hồi ký dài. Đã xem ảnh thực tế, gồm Firefox mobile housing và WebKit desktop vehicle. Không thấy tràn ngang trong các ảnh đã kiểm; Firefox mobile vẫn là viewport/touch mô phỏng.

`npm.cmd run test:production` trên Pages-base dist đã **VERIFIED PASS**: HTML/font license, tạo đời, chọn, tiến thời gian, tự lưu và reload đúng cảnh. Secret scan cuối trước push đã **PASS: 2.170 text objects, 0 findings**, gồm working files, public dist và reachable history. Production dependency audit: 0; audit toàn bộ: 12 moderate dev, 0 high/critical. Review có phạm vi và rủi ro còn mở ở [LIVING_WORLD_ASSETS_SECURITY.md](LIVING_WORLD_ASSETS_SECURITY.md).

Lượt full 130 E2E đầu có lỗi nên **FAIL**, chưa có full-suite PASS. Hai assertion còn gắn default cũ được sửa: kết thúc đời mới phải giữ assets-v1; thao tác thuê dùng catalog và dialog xác nhận mới, sau đó kiểm lease thật trong autosave. Hai nhóm focused đã PASS trên desktop/mobile (2/2 mỗi nhóm). Một lỗi landscape của creative viewport còn đang điều tra; không bỏ kiểm canonical hoặc viewport để nhận PASS. Chưa push/deploy. [Báo cáo phát hành](LIVING_WORLD_ASSETS_RELEASE_REPORT.md) ghi các gate còn thiếu; số liệu profile và CI/live chưa được nhận là đã chạy.

Lượt đầu kết thúc **125 PASS / 5 FAIL, 25,6 phút**. Bốn failure thuộc hai kỳ vọng cũ × desktop/mobile nói trên. Failure creative-landscape là `ENOENT` ở trace khi `context.close()`: lượt focused chạy chồng đã dọn thư mục artifact dùng chung của lượt tổng. Đây là lỗi orchestration QA; không sửa runtime hoặc hạ assertion. Giữ [báo cáo lỗi](evidence/assets-e2e-initial-failures.json) và raw report trong `.local`; các lượt sau chạy tuần tự, không có Playwright runner dùng chung output directory. Cần một lượt đầy đủ mới để nhận 130 PASS.

Profile CPU 4× đã đo tuần tự, ba tiến trình Edge mới cho mỗi nhóm stable/candidate/assets, không có E2E chạy chồng. Cùng save cũ: trung vị quyết định 175→179 ms, nhập save 356 hành động 4.529→4.804 ms; không nhận là tăng tốc. Save tài sản lớn nhất 1.169.112 byte nhập 5.303 ms, reload prefix đời dài 4.835 ms. Heap tăng qua các chuỗi import ở cả stable/candidate; chưa xác định retained objects/leak. Không có page error. Chi tiết, phương pháp và raw reports ở [LIVING_WORLD_ASSETS_PERFORMANCE.md](LIVING_WORLD_ASSETS_PERFORMANCE.md). Full 130 E2E mới chạy riêng sau profile; không thay luật hoặc chạy lại 1.000 đời.

## Final local gates — VERIFIED PASS, chưa push/deploy

Checkpoint F `15372d40058de2a3f18b92063665625d952ddfc6` giữ test fix, cross-browser và profile. Lượt tổng mới `npm.cmd run test:e2e` với E2E_PRODUCTION=1 và VITE_BASE_PATH=/mot-kiep-viet/ đã **130/130 PASS, 34,4 phút**, một lệnh, không skip/flaky/retry. [Raw report](evidence/assets-e2e-local.json). Bốn kỳ vọng cũ và lỗi artifact collision của lượt đầu đều đã qua trong lượt mới. Không sửa runtime hoặc hạ kiểm canonical/viewport. Đã đối chiếu 49 tệp JS/CSS/font/SW của máy chủ 5173 với dist, tất cả khớp byte: [build proof](evidence/assets-e2e-build-proof.json).

Typecheck/lint sau sửa test đều PASS. [Production smoke](evidence/assets-production-local.json) PASS trên cùng Pages-base dist. Scan sau F: **2.191 text objects/0 findings**, [raw](evidence/assets-secret-scan-local.json); sẽ quét working/history lần nữa trước push. Source engine/content/parser giữ nguyên từ lượt 1.000 đời. Không chạy lại mô phỏng. Job Pages nâng 40→60 phút theo thời gian thực tế local E2E 34,4 phút cộng cài đặt/verify/scan/browser; không bỏ bước, đổi quyền hoặc tách deploy khỏi build. CI và live G5 còn NOT RUN; main công khai vẫn stable tại mốc này.

Scan ngay trước push sau khi chốt full E2E/tài liệu/workflow: **2.195 text objects, 0 findings**. [Raw report](evidence/assets-secret-scan-prepush.json). Typecheck/lint sau test fix PASS; working tree không còn sửa src/tests/scripts ngoài các checkpoint đã commit. Chuẩn bị commit bằng chứng và fast-forward main từ baseline, không force.
