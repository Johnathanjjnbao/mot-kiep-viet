# Life Expansion — bốn mốc phát hành

M4 v0.3.5 local gates VERIFIED PASS:117unit/36E2E/1000seed+replay/0violations/26realAuth-cloud, production smoke, secrets0/audit0. Source77acc1a/main; CI/live pending. M3 G5 remains PASS; M5 preparation only. Owner personal login NOT RUN.

M4 v0.3.5: source complete, local verify117/117 and production smoke VERIFIED PASS; final simulation/E2E/real cloud in progress. NOT deployed yet. M3 v0.3.4 remains verified production. Owner personal login NOT RUN; no production SQL/Auth changes.

M3 v0.3.4 G5 VERIFIED PASS: d2e9c810/main, CI41132580664 completed/success; live4social/sixviewport×20/25cloud/asset hashes PASS.102unit/32E2E/1000replay0violations. Owner tự đăng nhập NOT RUN. M4 family đang làm; M5 NOT RUN. Không có SQL production mới.

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

## Tiếp tục M3 — 31/10/2026, baseline fd0409c

Graft wiring graph synchronized119files/621nodes ban đầu, đã dùng map/ask/skeleton/grep để phân biệt current src/engine với frozen v1/v2. Không deep/API tính phí, không init lại. Giữ các thay đổi cấu hình Graft của owner (.gitignore/AGENTS/.ignore) và sẽ đưa phần hướng dẫn nhỏ vào commit; graph cache vẫn ignored. Inventory thực22global +5system.

Đã nối model social và22drafts vào nội dung typed (99template/5arc),3NPC độc lập, thấu cảm/điều hòa từ hành vi, từ chối và thỏa thuận riêng, sống chung/hôn nhân/thuê nhà/đóng góp có giới hạn và chi phí, study pause, bí mật/discovery12–24tháng, confession/separation/divorce/repair và death. Eventfocus lưu template+NPC+instance+resume trong state, mở đối thoại không mất baseevent. Thay placeholder bằng tên nội bộ và React escape; không eval/HTML từ save. SocialAction có expected sequence,80request/250management cap và strict parser; dưới512actions. Oldwardrobe/frozen2/v1 không nhận state mới. Schema4/engine-content3+setup.expansion social bất biến; không SQL production mới. Golden wardrobe1173022751/v2/v1 qua; golden social520037075 khóa riêng.

Local đang chốt:102 unit dự kiến (13social đã qua riêng và89 nền), full E2E32/32 qua (desktop/mobile/newPeople+sixviewport20choices,axe0), production smoke PASS. Simulation1000 và realAuth/cloud đang chạy; chưa gọi release M3 PASS. Sau xem ảnh đã sửa typography và bỏ duplicate social NPC khỏi danh sách cũ; không đổi luật sau simulation bắt đầu. M4/M5 chưa bắt đầu. Skills áp dụng có chọn lọc: Graft,Security Review,Humanizer,Frontend Design,Webapp Testing; sẽ dùng Secret Scanning/Documentation Writer lúc phát hành. Owner cho phép tự cập nhật/sửa mã nên không cần approval outline của skill.

### M3 release candidate — local VERIFIED PASS

Final verify102/102; full E2E32/32, six viewport×20decisions and social/wardrobe axe0; production Pages-subpath smoke PASS. Simulation1000/1000replay,0invariant/failures,124.616decision scenes with4–6enabled choices, maxsave569.041bytes.98/99templates observed (all22new social; old grown-child not sampled in this mix, not claimed observed). Forced13social tests cover3independent interests, refusal, dating/exclusivity,marriage,secret refusal/acceptance/discovery,divorce,reconciliationdelay,death,remarriage,malformed imports and golden520037075. Default new runs social; oldwardrobe golden1173022751, frozen2 4148875142 and frozen1 still PASS.

Real Supabase25groups PASS, including complex married snapshot/memories through JWT-scoped UI,3slots,guestmigration/logout isolation,offline/retry,409conflict,two tabs,completedLives across browsers. First archive test failed because source memoir changed after the preview build; rebuilt consistently and full25 rerun PASS. Synthetic accounts disabled, data preserved. No ownercredentials or Auth settings changed. Secret scan0 across674text objects/publicdist/reachableGit, npm audit0. Graft663nodes/1551edges/126files synchronized. Build warning: JS~1MB/~308KB gzip, no chunk-size failure; frozen compatibility contributes to bundle. No physical-device/Safari/Firefox QA.

Source is being committed/pushed; M3 CI/live pending. M4/M5 NOT RUN yet. No production SQL/migrations in this session.


## M4 — v0.3.5 implementation checkpoint, 31/10/2026

New lives use immutable family ruleset; wardrobe/social/frozen saves retain their original routes. Added16 parenting templates,64 choices and2 family arcs:115 total templates/7 arcs,43 templates and4 arcs added since baseline72/3. Every presented scene still requires4 enabled choices. No migration or dependency was added.

Each of up to4 children has a stable NPC ID, exact birth month, immutable recorded parents, current caregivers/visits, independent temperament/interest,8 accumulated parenting patterns, wellbeing/bond/skills, schooling, aspirations and eventual occupation. Birth is mutually planned with a living adult partner; a one-year queue cannot duplicate children. Education and career follow the child's preferences and opportunities, with vocational and creative paths alongside university. Adult children can move out, form a concise family record, and remain in the memoir without generating an unbounded tree.

Divorce, death and remarriage preserve parents and memories; step-caregivers never replace recorded parents. A changed household produces one seeded, child-specific adjustment response. Deceased children retain records and stop receiving development milestones. Cross-system focus guards preserve parenting decisions and the interrupted story. The Family section uses existing People UI, bounded recent memories, and narrative choices.

Forced15 family tests cover birth→career, two children,8 parenting patterns, divergent guidance/preferences, divorce/visits, death/guardian, remarriage, stale references, cross-focus guards, archive import/dedup, canonical replay and separate golden2051297714. Wardrobe1173022751/social520037075/frozen2 4148875142 and frozen1 remain unchanged. Local verify117 PASS. Final E2E/simulation/real-cloud gates are still running at this checkpoint; not a deployment claim.

Budget correction: the historical manage branch still allowed400 operations, while wardrobe guarded combined budgets. Historical replay semantics are preserved. New family runs share a120 discretionary-operation budget (social40), and the UI reserves room for the remaining story on all runs. Family events use existing choose/advance logs. JSON512-action/5MiB caps remain.

Production smoke initially raced the autosave status of the preceding event. The check now waits for a persisted action-count change before reload; the rebuilt production smoke passes. Family screenshots were inspected at1440/375: no horizontal overflow, existing ivory/terracotta typography retained. The six pre-input viewport measurements remain required.


M4 final local gates: verify117/117,36/36 E2E (desktop/mobile,6viewport×20 decisions), production subpath smoke,1000unique seeded lives with1000canonical replays and0invariant failures,26real Auth/cloud groups PASS. Snapshot max569041bytes;96708 decisions all4–6enabled choices. Random policy sampled114/115 authored templates; sibling scene covered by forced two-child path, ordinary-days fallback not sampled. Only2children/2adult children arose naturally under this mixed random policy;15forced family tests supply the targeted birth-to-career/divorce/care/death/multiple-child coverage. Do not infer broad family-distribution balance from2random births.

Real JWT tests verify A/B/anon isolation, denied forged ownership/writes/invalid versions,3slots/idempotent409conflict,offline queue/reconnect/two tabs,immutable history across browsers, complex marriage plus child education/career/parents on a third independent mobile context. Synthetic identities disabled; all production data preserved. First browser cloud attempt used a preview without the production base-path environment and could not load JS; restarted preview with the correct subpath, all26groups rerun PASS. No product/Auth/SQL change was needed.

Secret scan:0findings across750text objects including public assets and reachable Git; audit0advisories. Frozen source unchanged; all4 existing goldens and new family golden pass. Graft133files/701nodes/1695edges synchronized, deep layer not generated. Skills this continuation: Security Review,Humanizer,Frontend Design,Webapp Testing,Secret Scanning,Documentation Writer. G5/CI/live still pending until the next evidence entry.


## M5 foundation — continuation checkpoint

M5 Education & Career remains INCOMPLETE. Added pure, unconnected creator foundations:6 player trait names/compatible selection schema and deterministic randomization for player/mother/father with independent counters, explicit locks,1–3 compatible traits, and no mutation of input. Seven tests include500 seeds, independent subjects, order independence, locks and invalid combinations. No creator control or new player-trait rule is enabled in the game yet. MASTER_PLAN records the integration/version/regression plan and the remaining12 majors, university outcomes, employment/rejection, military research and era-gated digital careers.

Foundation gates: verify124/124 across15files (117 existing +7 new), type/lint/content/Pages build and production smoke PASS; secret scan0 across771text objects/publicdist/reachableGit. Built JS/CSS/SW hashes are unchanged and match the verified v0.3.5 website. No engine/content/persistence/UI behavior changed for this preparation, so the M4 1000-seed result is retained rather than rerun for an unused helper. No package installation, new SQL, Auth setting, owner credential or production deletion.

Recovered HEAD for the full implementation:fd0409cbee09cbcb10a1da2d1dfbd7e92b658ed0/main. Owner Graft guidance preserved in9260746; M3 source d2e9c810 and evidence eefc670; M4 source77acc1a3e6f4602603e6d7cf7b138224e2a06c53, release dc6bf1b094a343939d653c0f1ffb4f699ffc08b4. Graft wiring checked synchronized; no deep/paid calls, cache ignored. Skills actually used:Security Review,Humanizer,Frontend Design,Webapp Testing,Secret Scanning,Documentation Writer. No subagents or new global skills.

Known limits: owner personally entering the existing password on live is NOT RUN; real authenticated cloud proof uses isolated synthetic accounts with normal JWTs. Physical-device/Safari/Firefox tests NOT RUN. Main bundle remains about1.04MB/318KB gzip; no broad compatibility refactor was attempted. Synthetic QA identities are disabled after each run and rows preserved. No known release-blocking failure remains in the verified checks; no claim of full M5 completion.
