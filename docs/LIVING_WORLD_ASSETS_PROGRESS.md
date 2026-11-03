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
| A: nhà ở đầy đủ | INCOMPLETE |
| B: phương tiện | NOT RUN |
| C: thiết bị | NOT RUN |
| D: PC Builder | NOT RUN |
| E: tích hợp/narrative/ngân sách/gates/CI/live | NOT RUN |

Gates sẽ ghi lệnh, kết quả mới, SHA, CI và ảnh thật khi thực hiện. Chưa có tuyên bố v0.3.11 đã deployed.
