# Bàn giao MVP cục bộ · Một Kiếp Việt

## Tiếp tục A/B — 31/10/2026

Dynamic Life đã phát hành tại `d3212f4f39bf889a2f72b47993fcaf391bed50ae`, [CI 41208545352](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41208545352) completed/success; live guest và Chromium/Firefox/WebKit trên desktop/mobile VERIFIED PASS.

Bản `0.3.6-university.1` có 12 ngành, tuyển sinh có xác suất và thời gian chờ, đánh giá từng năm, học phí/học bổng/hỗ trợ qua ledger, bảo lưu, chuyển ngành, nghỉ học và cấp bằng sau khi đủ tiến độ. Ruleset `education-v1` chỉ áp dụng cho đời mới; `dynamic-v1` và các đời cũ giữ nguyên. Local verify 163 tests, 52 E2E, 1.000 seed/replay, ba browser/sáu luồng và production smoke VERIFIED PASS. Secret scan 945 objects/0 findings, audit dependencies 0 (không đổi dependency). CI/live đang chốt, chưa gọi University G5 PASS. Employment mới INCOMPLETE, digital/business chưa triển khai, quân sự NOT READY. Cloud QA BLOCKED do CLI chưa đăng nhập; owner tự đăng nhập NOT RUN. Không thay SQL/Auth/RLS hoặc dữ liệu production. Bằng chứng chi tiết trong [M5_LONG_RUN_HANDOFF](M5_LONG_RUN_HANDOFF.md). Các mục bên dưới giữ lịch sử.

## Dynamic Life, local checkpoint 31/10/2026

Đang phát hành `0.3.6-life-diversity.1`, tiếp tục2b24ebd/main. Local140unit/40E2E/1000seed+replay/0vi phạm và3browsers6journeys PASS.20cảnh tuổi thơ+3cảnh nối tiếp; mẫu200same-setup: cảnh đầu3→11, chuỗi5đầu193→200;200diverse:4→15 và193→200. Old400opening sequences vàgoldens giữ nguyên; lifeRules dynamic-v1 chỉ cho đời mới. Cloud QA BLOCKED thiếuCLIlogin, không SQL/Auth change. CI/live mới INCOMPLETE cho tới bằng chứng đúngSHA. B/C chưa triển khai; tiếp tục University sau khi chốtA. Xem M5_LONG_RUN_HANDOFF.

## Checkpoint A v0.3.6-creator.1 — 31/10/2026

Creator đã phát hành: source `28c1dc51aebadd3bf826224e653ad0f5a10ff9a6`/main, [CI41202694295](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41202694295) completed/success. G5 guest VERIFIED PASS: live Creator Chromium/Firefox/WebKit desktop/mobile6/6,6viewport×20choices,guest save/load/history/font/assets và CSS/JS/SW khớp artifact. Local/CI133tests/38E2E;1000seed/1000replay/0vi phạm còn áp dụng (sau đó chỉ sửa CSS/test/docs). Engine/content3/schema4, frozen/goldens giữ nguyên. Auth/cloud mới BLOCKED vì thiếu Supabase CLI login; owner tự nhập account NOT RUN. Full Education & Career v0.3.6 INCOMPLETE:0ngành/0event/0arc mới. Chi tiết [M5_CREATOR_REPORT](M5_CREATOR_REPORT.md); các đoạn sau giữ bằng chứng lịch sử.

M4 v0.3.5 G5 VERIFIED PASS: release dc6bf1b094a343939d653c0f1ffb4f699ffc08b4/main, CI41136632974 completed/success; live guest desktop/mobile,6viewport×20,8family/social journeys,26realAuth/cloud and JS/CSS/SW hashes PASS. M5 foundation4f4e969 (7new tests) only; full M5 INCOMPLETE. Final verify124/36existing E2E/1000M4 replay0violations. Owner personal login NOT RUN.

Older pending paragraphs below are historical checkpoints.

M4 v0.3.5 local gates VERIFIED PASS:117unit/36E2E/1000seed+replay/0violations/26realAuth-cloud, production smoke, secrets0/audit0. Source77acc1a/main; CI/live pending. M3 G5 remains PASS; M5 preparation only. Owner personal login NOT RUN.

M4 v0.3.5: source complete, local verify117/117 and production smoke VERIFIED PASS; final simulation/E2E/real cloud in progress. NOT deployed yet. M3 v0.3.4 remains verified production. Owner personal login NOT RUN; no production SQL/Auth changes.

M3 v0.3.4 G5 VERIFIED PASS: d2e9c810/main, CI41132580664 completed/success; live4social/sixviewport×20/25cloud/asset hashes PASS.102unit/32E2E/1000replay0violations. Owner tự đăng nhập NOT RUN. M4 family đang làm; M5 NOT RUN. Không có SQL production mới.

M3 v0.3.4 local VERIFIED PASS:102unit,32E2E,1000seed/replay/0vi phạm,25realAuth/cloud,scan0/audit0.99templates/5arcs;22new social/2arcs/3NPC. Đang phát hành CI/live, chưa gọi M3 G5. Oldruleset/goldens/saveIDs giữ nguyên; không SQL mới. Baseline fd0409c, checkpoint Graft9260746. Xem LIFE_EXPANSION.

M3 v0.3.4 đang chốt local gates:22social templates/2arc,3NPC riêng, full relationship/dialogue/resume/household. E2E32/production PASS; simulation/cloud đang chạy. Chưa push/deploy M3. Oldruleset vẫn giữ nguyên, không SQL production. Xem LIFE_EXPANSION.

## Hiện hành — v0.3.3, 31/10/2026

M1 avatar/visual và M2 wardrobe: **VERIFIED PASS, đã deploy**. Code `a2388aee7a44d7189a6ef08fa1beaaf21466111b` / main; [CI41100506471](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41100506471) completed/success. Local89 tests,26E2E +2bổ sung schema3,1000seed/replay/0vi phạm. Live guest,6viewport×20decisions,24realAuth/cloud,oldsave desktop/mobile và asset hashes PASS. 28wearable,77event/3arc,6avatarages. Migration003 approved/applied; no RLS loosening/deletes. Owner tự nhập account NOT RUN. M3draft22scene chưa nối engine/UI; M4 NOT RUN; Life Expansion INCOMPLETE. Tiếp tục chính checkpoint này, không làm lại M1/M2. Chi tiết [LIFE_EXPANSION](LIFE_EXPANSION.md). Các mục pending phía dưới là lịch sử trước khi chốt G5.

M2 v0.3.3 chốt gate:28món/5fashion scenes; engine3/schema4, schema3 vẫn chơi qua frozen2. Local89 tests/24 real cloud groups/1000seed-replay không vi phạm. Final E2E/CI/live đang kiểm tra, chưa gọi M2 deployed. Xem LIFE_EXPANSION.

**G5 M1 v0.3.2 VERIFIED PASS.** Code403509669f237d410f40c6027bd80a030b0da39d/main đã push/deploy; [workflow41096367741](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41096367741) completed/success. Live guest,6viewport×20decision,23realAuth/cloud và artifact CSS/JS/SW hashes PASS. Owner tự nhập tài khoản NOT RUN. M2–M4 đang làm, chưa nghiệm thu. Chi tiết [LIFE_EXPANSION](LIFE_EXPANSION.md).

## Bàn giao tiếp nối Life Expansion — 31/10/2026

M1 v0.3.2 đã qua local verify81/E2E24/production smoke; avatar sáu tuổi/seed ổn định, phong cách giấy ngà và HUD ưu tiên câu chuyện. Đang theo dõi phát hành; CI/live sẽ ghi bằng chứng riêng trong [LIFE_EXPANSION](LIFE_EXPANSION.md). M2 wardrobe, M3 romance, M4 parenting chưa hoàn tất. Giữ save engine2/schema3 và mọi guest/cloud/history. Migration003 chỉ mở tuple mới đã được duyệt/áp, không thay bảng/RLS. Phần bên dưới giữ nguyên lịch sử bàn giao trước đây.


Ngày kiểm chứng: **30/10/2026**, múi giờ người dùng Asia/Saigon. Trạng thái: **local beta đã kiểm chứng**, chưa phải phát hành production.

## 1. Executive Summary

Ứng dụng đã chơi được từ tạo một cuộc đời đến kết thúc và hồi ký. Có lựa chọn ngẫu nhiên/tùy chọn, ba năm sinh 1975/1995/2005, ba bối cảnh vùng, gia đình ban đầu, giáo dục, mười nghề, đổi việc/thất nghiệp, kinh nghiệm, tài chính theo tháng có sổ cái, tiết kiệm/nợ/nhà, quan hệ, con cái, tuổi già và sức khỏe. Có 72 mẫu sự kiện viết riêng, ba story arc nhiều năm, nhật ký và thẻ hồi ký SVG tải xuống.

Autosave, ba slot, export/import JSON, schema version, migration nội bộ và replay hoạt động. UI tiếng Việt hỗ trợ desktop/mobile, bàn phím, chữ lớn và giảm chuyển động. Không dùng backend, tài khoản, AI runtime, paid service hay asset của trò chơi tham khảo.

**Kết quả cuối:** **22 test unit/integration**, **6 E2E**, **1 production-bundle smoke**, **1.000 seed mô phỏng** ở bản cuối, **0 vi phạm invariant**. Không có playtest người thật hoặc production QA được thực hiện.

## 2. Repository

| Mục                           | Thực tế                                                                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Thư mục                       | `C:\Users\triba\OneDrive\Desktop\game`                                                                                                                       |
| Trạng thái bắt đầu            | Thư mục trống, không có Git/HEAD/branch cũ                                                                                                                   |
| Branch hiện tại               | `main`                                                                                                                                                       |
| Commit nền                    | `fd64c0b` — vertical slice, tạo/sống/kết thúc, 5 kiểm thử và build đã qua                                                                                    |
| Commit hệ thống               | `577db4e` — engine, gói 72 sự kiện, story arc, persistence và replay                                                                                         |
| Commit ứng dụng đã kiểm chứng | `357f5cc` — UI, browser journeys, CI definition, license và production smoke                                                                                 |
| Commit bàn giao               | Commit tiếp sau `357f5cc`, tên `docs: record verified local beta and test evidence`; HEAD chính xác báo trong chat bàn giao và xem bằng `git rev-parse HEAD` |
| Remote                        | Không cấu hình/push/merge/deploy                                                                                                                             |

Các commit đều cục bộ. Không có worktree khác, không ghi đè dự án cũ, không dọn lịch sử hay xóa file người dùng. Sau commit bàn giao, trạng thái cây làm việc được kiểm tra lại trong chat; artefact build/test tạm được ignore.

## 3. Implementation Matrix

| Phase | Việc đã làm và file chính                                                                                           | Trạng thái / phần chưa làm                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 0     | Kiểm tra thư mục trống, Node 24.20.0, npm 11.19.0, Git 2.55.0, Edge có sẵn, skills, Graft help                      | Hoàn tất cục bộ; không init Graft hoặc cài browser trùng                                                       |
| 1     | Mô hình miền, quyền sở hữu, lịch, RNG, event/effect, kinh tế, save/replay; `ARCHITECTURE.md`, `src/domain/model.ts` | Hoàn tất; lựa chọn kỹ thuật do agent thực hiện trong phạm vi, không gọi là owner duyệt thiết kế                |
| 2     | React/TS strict/Vite/Tailwind, font cục bộ, lint/test/build, lockfile, workflow CI                                  | Hoàn tất local; remote CI **NOT RUN**                                                                          |
| 3     | Vertical slice đầu tiên 8 sự kiện, đời hoàn chỉnh, RNG seed, journal, tests                                         | Đã kiểm chứng trước mở rộng 72 sự kiện                                                                         |
| 4     | Giáo dục/nghề/tài chính/quan hệ/sức khỏe/nhà, ledger, delayed effects; `src/engine`, `src/content/world.ts`         | Hoàn tất mức MVP; các quy tắc là mô hình đơn giản có tài liệu                                                  |
| 5     | Era, vùng, 72 event, prerequisite/weight/cooldown, ba arc, nguồn lịch sử và future policy                           | Validator 72/72, 3/3 arc; mọi template được quan sát ít nhất một lần trong 1.000 seed                          |
| 6     | Home, new life, birth, game, panels, journal, summary, settings, save manager; `src/ui`                             | Desktop/mobile journey đã qua; điện thoại thật và Safari/Firefox **NOT RUN**                                   |
| 7     | IndexedDB, autosave + 3 slot, export/import, migration, canonical replay; `src/persistence/saves.ts`                | Roundtrip, active event, pending effects, tệp hỏng/quá lớn/phiên bản lạ đều được kiểm tra                      |
| 8     | Unit/integration/golden, 1.000 lives, browser/a11y, audit và production-bundle smoke                                | Hoàn tất kiểm tra tự động cục bộ; playtest người thật, kiểm tra xuyên trình duyệt và production QA **NOT RUN** |
| 9     | README, hướng dẫn nội dung/save/lịch sử/license, bằng chứng, commit cục bộ                                          | Hoàn tất bàn giao local; chưa có phát hành hay URL công khai                                                   |

## 4. Quality Gate Matrix

| Gate | Trạng thái        | Bằng chứng trực tiếp                                                                                       | Giới hạn                                                             |
| ---- | ----------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| G0   | **VERIFIED PASS** | `ARCHITECTURE.md`, domain model, phân lớp engine/content/UI/persistence                                    | Không phải phê duyệt thiết kế của owner                              |
| G1   | **VERIFIED PASS** | `engine.test.ts`, `golden.test.ts`, cuộc đời đủ ba cohort và replay                                        | Fingerprint chỉ khóa engine/content hiện tại                         |
| G2   | **VERIFIED PASS** | `systems.test.ts`, `arcs.test.ts`, đối soát ledger và 1.000 seed                                           | Không chứng minh thống kê đời thực                                   |
| G3   | **VERIFIED PASS** | `validate:content`: 72 event đúng 7 nhóm, 10 nghề, 3 arc, 0 lỗi; 72 template đã xuất hiện trong stress run | Chưa có biên tập văn hóa độc lập                                     |
| G4   | **VERIFIED PASS** | 22 tests, 6 E2E Edge, 0 lỗi axe tại các màn được xét, 1.000 seed 0 vi phạm; built bundle smoke đã qua      | Mobile là mô phỏng viewport; không phải QA production                |
| G5   | **INCOMPLETE**    | Tài liệu, lockfile, build, CI definition, rà soát an toàn và cách quay lại đã có                           | Remote CI và deployment **NOT RUN**; human/cross-browser QA chưa làm |

Không có gate cuối nào đang FAIL hoặc blocker cục bộ được phát hiện. Điều này không bảo đảm không còn bug ở những đường đi chưa kiểm tra.

## 5. Test Results

| Lệnh thực tế                                                     | Kết quả cuối                                                                                                     |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `npm.cmd run verify`                                             | Exit 0: TypeScript, ESLint, 5 test files/22 tests, content validation, production build                          |
| `npm.cmd run simulate`                                           | Exit 0: 1.000/1.000 seed hoàn tất, 0 invariant violations, 0 failure                                             |
| `npm.cmd run test:e2e`                                           | Exit 0: 6/6 journeys, 0 flaky, 0 skipped, khoảng 71 giây trong lượt cuối                                         |
| `npm.cmd run lint` và `npm.cmd run build` sau thêm smoke/license | Exit 0                                                                                                           |
| `npm.cmd run test:production`                                    | **VERIFIED PASS**: bản build trả 200, license được đóng gói, tạo/chọn/tiến/lưu, reload đúng event, 0 page errors |
| `npm.cmd audit --json`                                           | 0 lỗ hổng được công cụ biết tại thời điểm kiểm tra, gồm cả dependencies phát triển                               |
| `git diff --check`                                               | Exit 0                                                                                                           |

Các lần kiểm tra đầu đã phát hiện và sửa: lỗi narrowing của TypeScript trước commit đầu; nhãn thương hiệu không khớp tên truy cập; header mobile tràn hàng che nút lưu/cài đặt; focus không về nút mở sau đóng dialog; hai aside chưa có nhãn phân biệt. Những kiểm tra liên quan được chạy lại và đã qua, không tắt quy tắc axe để lách lỗi.

Bộ mô phỏng được chạy hai lượt cùng tập **1.000 seed riêng biệt** (`stress-0`…`stress-999`); lượt sau bổ sung kiểm tra tuổi/era nghề, trùng quan hệ/tài sản và lựa chọn. Không tính thành 2.000 seed khác nhau.

| Chỉ tiêu lượt cuối                                      | Kết quả                      |
| ------------------------------------------------------- | ---------------------------- |
| Cohort 1975 / 1995 / 2005                               | 334 / 333 / 333              |
| Đô thị Nam / làng Bắc / ven biển Trung                  | 334 / 333 / 333              |
| Kết thúc do sức khỏe / hồi ký                           | 441 / 559                    |
| Tuổi kết thúc min / mean / max                          | 66 / 78,78 / 82              |
| Tài sản ròng min / mean / max                           | −61.813 / 8.383 / 41.788 đSM |
| Arc hoàn tất: làm ăn / gia đình / hồi phục nghề         | 545 / 1.000 / 204            |
| Tiệm có lãi / lỗ / rút vốn                              | 206 / 171 / 168              |
| Template được quan sát                                  | 72/72                        |
| Vi phạm trạng thái/sổ cái/NPC/era/ending được phát hiện | 0                            |

Các seed và chính sách test không đại diện người Việt hoặc hành vi người chơi thực. Golden replay `golden-1995`, vùng ven biển, policy 2: fingerprint FNV-1a `2525264403`, tháng 876, death, 33 choices, cash 13.265 đSM. Chỉ cập nhật golden sau khi chủ động phiên bản hóa thay đổi luật.

Bằng chứng máy đọc được: [simulation.json](evidence/simulation.json), [browser-results.json](evidence/browser-results.json), [production-smoke.json](evidence/production-smoke.json), [dependency-audit.json](evidence/dependency-audit.json), [verification.json](evidence/verification.json). Bốn ảnh home/game desktop/mobile ở cùng thư mục đã được xem trực tiếp.

## 6. Skills and Tools

Đã đọc và áp dụng UI/UX Pro Max (tra design system, typography và checklist), Sites (nhánh local-only, preview và kiểm tra), Webapp Testing (Playwright cục bộ với Edge). Không cài thêm skill, không dùng Antigravity hay subagent.

Công cụ đã dùng: PowerShell, Git cục bộ, Node/npm, TypeScript/Vite/Tailwind/React, Vitest, Zod, idb/fake-indexeddb, Playwright, axe, Prettier/ESLint, Python cho tra cứu skill/đọc trace, npm audit, trình xem ảnh, browser preview của Codex. Graft chỉ kiểm tra help, không init/build graph. Web dùng để đối chiếu tài liệu Vite, nguồn lịch sử và bản phát hành GitHub Actions, không tải file người dùng lên dịch vụ.

CI khóa commit của [checkout v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1), [setup-node v7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0) và [upload-artifact v7.0.2](https://github.com/actions/upload-artifact/releases/tag/v7.0.2); SHA đã đối chiếu bằng remote tag. Chưa chạy workflow nên đây chỉ là cấu hình đã chuẩn bị.

## 7. Known Limitations

- Kinh tế, sức khỏe, trợ cấp, lãi, tuổi NPC, nhà và ngưỡng mở công nghệ đều là thiết kế; không phải dữ liệu VNĐ hay mô hình y khoa/thống kê.
- Từ 2027 là tương lai giả định. Dùng địa danh vùng rộng thay tên tỉnh qua nhiều lần thay đổi.
- Mục tiêu session 15–25 phút chưa có playtest con người xác nhận. Tỷ lệ lặp arc gia đình và độ nặng của lãi kép cần kiểm chứng cảm giác chơi.
- Save cục bộ theo origin; không đồng bộ, không bảo vệ xung đột nhiều tab, không khôi phục được khi trình duyệt bị xóa dữ liệu nếu chưa export.
- Schema 1 chỉ là định dạng nội bộ có migration; không giả định tương thích các game hoặc phiên bản chưa hỗ trợ. Tối đa 400 thao tác quản lý cho một cuộc đời để giới hạn replay.
- Nhà là tài sản đơn giản, không mua bán thị trường; NPC và gia đình có mô hình gọn, không mô phỏng mọi quan hệ xã hội.
- Chưa có thử trên điện thoại thật, Safari/Firefox, screen reader thực, quota/khôi phục mất điện, đánh giá bảo mật độc lập, remote CI hay production QA.
- Không có thiếu hụt so với chỉ tiêu 72 event/10 nghề/3 arc của gói MVP; chưa có nội dung mở rộng ngoài gói này.

## 8. How to Play

```powershell
cd C:\Users\triba\OneDrive\Desktop\game
npm.cmd ci
npm.cmd run dev -- --port 5173
```

Đã cài dependencies trong lần làm này thì có thể bỏ qua `npm.cmd ci`. Mở **http://127.0.0.1:5173** sau khi lệnh dev báo sẵn sàng. Chọn kiếp mới → bối cảnh → gieo cuộc đời → bắt đầu câu chuyện → chọn và viết tiếp. Từ 18 tuổi dùng Nghề nghiệp/Tài chính để chủ động; đừng chỉ chờ sự kiện tự tìm việc. Nút lưu ở đầu trang mở ba slot và import/export. Chơi tới kết thúc để nhận hồi ký/thẻ SVG.

Máy chủ thử nghiệm do agent mở được dừng sau QA; không có dịch vụ tự khởi động nền. Ctrl+C dừng phiên dev do bạn chạy. Cổng 4173 chỉ dùng preview bản build và có vùng save riêng. Không có URL triển khai công khai.

## 9. Next Recommended Milestone

**Playtest và cân bằng local beta — Task Size: LARGE; reasoning khuyến nghị: HIGH.**

Phạm vi: ít nhất 8 người chơi thật, đủ ba cohort, ghi thời lượng, chỗ bỏ cuộc, lựa chọn không hiểu, độ nặng của nợ, tính lặp của arc và cảm nhận giọng văn. Kiểm tra Android Chrome/iOS Safari thật và một lượt bàn phím/screen reader. Không tự thu analytics hoặc đưa dữ liệu ra ngoài khi chưa có đồng ý.

Tiêu chí: có dữ liệu 8 lượt thật; ít nhất 80% người chơi tự đi đến kết thúc hợp lệ; median session trong 15–25 phút hoặc có thay đổi nhịp được kiểm tra lại; không còn blocker/critical; lưu/tải trên hai thiết bị thật đã qua; mọi sửa luật có regression, 1.000-seed check và phiên bản/replay được xử lý rõ. Remote CI và phát hành chỉ thực hiện khi có ủy quyền tiếp.

## Bổ sung: phát hành GitHub Pages, 30/10/2026

Giữ nguyên bàn giao local ở trên. Đã chuẩn bị public repository Johnathanjjnbao/mot-kiep-viet, Pages Actions, Vite base /mot-kiep-viet/, kiểm tra subpath desktop/mobile và workflow chặn deploy khi build/tests lỗi. Engine/content không đổi nên không chạy lại 1.000 seed. Remote deployment đang chờ xác minh; chưa gọi là live PASS.

### Kết quả online thay trạng thái đang chờ ở mục bổ sung

Repository https://github.com/Johnathanjjnbao/mot-kiep-viet và game https://johnathanjjnbao.github.io/mot-kiep-viet/ đã hoạt động. Commit ứng dụng 8245d8d5932567977b27e6059e3efecaccd1be29, workflow 40943722482 success (build và deploy). npm ci sạch, verify 22 test, scan file/history, 6 E2E Chromium, production smoke đều qua trên GitHub. Live Edge desktop/mobile đã kiểm tra asset/font, start, choice, advance, autosave reload và manual slot save/load: 0 lỗi trang/mạng, không tràn ngang. G5 PASS trong phạm vi beta online đầu tiên; human playtest và browser khác vẫn NOT RUN.

Đã thêm AGENTS, ROADMAP, RELEASE_SECURITY, PROJECT_STATUS, pages.yml, hai script scan/check; sửa Vite base theo VITE_BASE_PATH, smoke hỗ trợ subpath và HTTP readiness, Playwright hỗ trợ base và bản build tĩnh. Không sửa engine hoặc mở backlog. Một E2E dev-mode bị reload và lần CI đầu bị định dạng log có màu; kiểm thử chuyển sang bản build tĩnh và readiness HTTP đã qua, không bỏ gate.

Skills thực dùng: security-review, secret-scanning, webapp-testing. Không có gh CLI, dùng GCM/REST hiện có không lưu token. Bản public có metadata tác giả/đường dẫn môi trường trong lịch sử đã rà soát; không có credential được tìm thấy. Hướng dẫn cập nhật ở AGENTS và PROJECT_STATUS. Tiếp theo: thiết kế Character Creator, cấu trúc gia đình và tương thích save, chưa triển khai trong đợt này. HEAD tài liệu cuối và workflow cuối được xác minh trong chat bàn giao; lưu các kết quả ở docs/evidence/pages-*.json.

## Bàn giao beta v0.2 — 30/10/2026

Tiếp tục trên checkout hiện có, baseline main 3508765374d94b8150e852ff0aa74b9678cd8940. Đã triển khai Creator nâng cao, 216 lựa chọn bổ sung trên 72 mẫu, fallback 4 hướng, lịch sử hoàn tất riêng, lưu/xuất/nhập/dedup và save v1 chỉ đọc bằng luật đóng băng. Engine/content 2.0.0, schema 3; không xóa ba slot cũ.

Báo cáo 14 mục: [V02_REPORT.md](V02_REPORT.md). Luật mới 1.000 seed: 0 vi phạm, 72/72 mẫu, enabled 4–6 trên 35.045 sự kiện. Local/CI verify 49 test, E2E 10 luồng, production đúng base đều PASS. Secret scan working/history 0 findings; npm audit 0 advisory. Code a108d25036af58db8034369db06085a88e4e66fe đã push main. [Workflow 41007485656](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41007485656) completed/success cả build/deploy; clean npm ci, Chromium QA PASS. Live [GitHub Pages](https://johnathanjjnbao.github.io/mot-kiep-viet/) Edge desktop/mobile PASS cả random/custom/5 gia đình, ít nhất 4 lựa chọn, trọn đời, save/load, history xuất/nhập/dedup/giữ sau đổi kiếp/reload, font/assets và 0 lỗi page/network. JS/CSS live khớp hash build cục bộ. **G5 v0.2 VERIFIED PASS** cho phạm vi này. Giữ toàn bộ bàn giao cũ phía trên làm lịch sử; commit tài liệu/bằng chứng kế sau code không đổi dist, workflow HEAD cuối và SHA được kiểm tra/báo trong chat.

Tài khoản mời riêng cho vợ/đồng bộ Supabase và kỳ bí/trường thọ chưa làm; chỉ có CLOUD_ACCOUNTS_PLAN và ROADMAP. Không có credential hoặc tài khoản giả trong frontend.

## Checkpoint v0.3 — đang triển khai 30/10/2026

Baseline 479fa05, không sửa engine/content/replay. Có migration SQL/RLS/allowlist/CAS/receipt, cloud repositories, AuthProvider và account cache/sync riêng. 15 test mới cục bộ PASS; chưa tích hợp UI/session/cloud history outbox/guest migration/conflict UI. Chưa có Supabase project/config thực, đã để câu hỏi cho chủ dự án (chỉ public URL/publishable key). Production SQL/Auth/lời mời/đồng bộ thật NOT RUN; không tạo tài khoản cho vợ hay dịch vụ trả phí. Website v0.2 hiện giữ nguyên. Đọc V03_PROGRESS và SUPABASE_SETUP để tiếp tục; chưa ghi PASS cho cloud hoặc phát hành v0.3.

## v0.3 — triển khai cloud trên project thật, 30/10/2026

Tiếp tục từ 9bbffbc. CLI 2.122.0 link đúng kqnapcyceddwvrvkquvg. Người dùng đã duyệt riêng SQL 202610300001 (SHA-256 8BC4FD0A180416406137649F8342B3F684B0AD7F77D5BD92EEB96FFED83158B0) và bản sửa PT409 202610300002 (BF9464E459B8EF604B2AE630702F28B383A2596A52AE25EE7C3D72A5168DB8E8); cả hai đã áp dụng, local/remote khớp. Auth registration disabled, URLs đúng Pages/local, không đổi SMTP qua config push. Bản sửa giải quyết gateway 504 ở nhánh conflict; tests thực trả409/PT409.

Đã nối Auth/repositories/session/slots/history/outbox/conflict/guest migration và shell offline. Guest E2E 12/12, real backend 13 checks và real 2-browser/invite/recovery 23 checks PASS; generated links không chứng minh email delivery. Account screenshot/axe desktop/mobile không tràn ngang/vi phạm trong trạng thái quét. Tài khoản QA dọn hết, không credentials trong report. Full verify/production/secret scan và release CI/live cuối đang chốt, SHA kết quả sẽ ghi sau kiểm chứng.

Chủ dự án chọn SMTP, tự nhập credential trên Dashboard; email/vợ thật chưa vào repo và onboarding vẫn INCOMPLETE. Báo cáo 15 mục V03_REPORT, kiến trúc CLOUD_ARCHITECTURE, vận hành SUPABASE_SETUP. Engine/content/save không đổi, không chạy lặp1.000 seed. Giữ mọi bàn giao cũ phía trên.


## Resume theo chỉ thị unattended — 30/10/2026

Mục này thay yêu cầu SMTP/invitation của checkpoint v0.3 phía trên; giữ nguyên lịch sử. HEAD đầu 9bbffbc, uncommitted cloud code được bảo toàn. Chủ dự án đã tạo tài khoản confirmed/password; cấp quyền allowlist đúng tài khoản hiện có, không dùng credentials người chơi. SMTP/email invitation/recovery ngoài phạm vi. Owner tự đăng nhập live NOT RUN.

Thêm bounded storyAction dùng choose/advance cũ, action token + ref chặn stale/duplicate, focus/scroll vùng story và feedback/journal; không đổi engine/content2/schema3. Regression one-tap/replay/scheduled/ending/save/history. Thêm local CAS cho hai tab cùng cache, giữ nhánh stale vào recovery. Hai migration approved giữ nguyên hash và remote state. Không áp SQL mới/xóa production. QA identities mới chỉ disabled, dữ liệu giữ nguyên theo chỉ thị mới.

Gates local mới: 77 unit/integration, 16 E2E desktop/mobile, 1.000 seed/0 vi phạm. E2E ban đầu phát hiện accessible name và focus sau double-click mobile, đã sửa; preview QA từng thiếu base env, đã khởi động lại đúng subpath. Supabase/live/CI đang chốt; kết quả cuối tại V03_HANDOFF, V03_REPORT và evidence. MASTER_PLAN/ROADMAP chỉ thiết kế v0.4–v0.6, không triển khai kinh tế VNĐ/trường thọ/quốc tế.


### Kết quả phát hành resume v0.3

Code `4cafcbced975ba9b6b7b16b04331a2186aa65aa7`, main/origin. [CI41044765048](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41044765048) build/deploy completed/success, CI77/16/scan0/production PASS. Live guest1440/375 và 23 nhóm Auth/cloud thực VERIFIED PASS, bao gồm ba slot, mất mạng/reload/reconnect, conflict/chọn nhánh, local-tab CAS/recovery và history ở browser kia; zero uncaught app errors/broken public assets. JS/CSS/SW khớp SHA256 build. G5 release kỹ thuật VERIFIED PASS; owner self-login NOT RUN và nghiệm thu riêng INCOMPLETE. Không dùng password chủ dự án, không SMTP, không SQL migration mới/xóa production. QA identities của các lượt mới disabled, dữ liệu giữ nguyên. V03_HANDOFF/V03_REPORT/evidence ghi chi tiết; final docs commit và workflow được kiểm sau push.


## v0.3.1 — Persistent HUD và decision viewport (đang kiểm chứng)

HEAD đầu 53802c8a5bf3cf0fc7214dfa82c8197d1fc20bc8, main sạch. Giữ toàn bộ v0.3 Auth/cloud/history/save/SQL. Đã tái hiện live: mobile profile ngoài viewport; landscape first choice vượt mép màn hình dù card top16. Thay disclosure bằng HUD sáu chỉ số trực tiếp từ Run; desktop sticky trái, mobile compact, narrative/choices cạnh nhau ở landscape thấp. Card bỏ khoảng trang trí lớn, dùng phần cao còn lại cho một vùng choices cuộn tự nhiên. Không chặn wheel/touch/Tab hay contain overscroll, không ẩn narrative. Sửa tab và năm tràn khi chữ lớn làm innerWidth/Height báo sai so với device.

QA mới đo trước click/scroll, raw mouse/touch coordinates và hit test; không dùng Playwright auto-scroll làm bằng chứng. Sáu case1440x900,1366x768,390x844,375x667,667x375 và375x667 chữ lớn, mỗi case20 lần chọn đầu/giữa/cuối, đủ4/5/6 phương án. Kiểm số HUD từ persistedRun, action choice ID, exact replay, reload, axe. Regression16 cũ và Auth/cloud thực chạy thêm. Không engine/content/schema/SQL/account permission changes; không lặp simulation không cần thiết. Kết quả cuối tại V031_REPORT/evidence, commit/push/CI/live sau gates.


### Kết quả v0.3.1 đã xác minh

Code `3db40a426e59bb08c776acebb72446be3c16fc56` main, [CI41089793438](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41089793438) build/deploy completed/success. 77 unit/integration,22 E2E, smoke, scan0/audit0 PASS. Live6 viewport×20 choices/126 pre-input measurements PASS: persistent HUD,full narrative/first option, hit test, số HUD từ run, identity lựa chọn, label/value không chồng, không auto-zoom. Live guest/save/history và Auth/cloud23 PASS; assets SHA256 match. HUD chữ lớn đổi2 cột để100 không che nhãn; không chỉ kiểm khung bao. Kết quả/ảnh trong V031_REPORT và v031-live-*. G5 patch VERIFIED PASS; physical phone/Safari/Firefox/screen-reader software NOT RUN, owner account self-login giữ trạng thái cũ. Không SQL migration/engine/content/schema/quyền account hiện có changes, không xóa production. Final docs commit/workflow kiểm sau push.
