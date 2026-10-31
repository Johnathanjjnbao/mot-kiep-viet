# M5 — Checkpoint A: Character Creator

Ngày 31/10/2026, Asia/Saigon. Phiên bản trung gian `0.3.6-creator.1`. Full Education & Career v0.3.6: **INCOMPLETE**. Không dùng bằng chứng v0.3.5 thay cho lượt này.

## Phạm vi thực sự đã nối

Creator cho phép chọn 1–3 trong sáu tính cách foundation: Hay tò mò, Kiên trì, Dễ gần, Ưa yên tĩnh, Thích giúp đỡ, Khéo tay. Gieo riêng player/mother/father với seed và counter độc lập, khóa từng tính cách, gieo tất cả chỉ thay phần chưa khóa, bỏ chọn chưa khóa và preview. Hai nhóm cha/mẹ dùng 10 tính cách sẵn có và validation chống mâu thuẫn. Người thiếu thông tin không có panel; nonresident vẫn tồn tại và không nhận annual caregiving. Đổi family sang thiếu cha/mẹ xóa cả draft và lock tương ứng, tránh lock mồ côi.

Các panel thu gọn giữ form có thể đọc được trên phone; avatar và preview dùng đúng seed/setup sẽ tạo đời. Bỏ trống player traits giữ một tính cách do engine chọn. Không thay tên/năm sinh/địa điểm/gia cảnh khi gieo tính cách. Keyboard Space chọn, Enter khóa; mỗi nút khóa có accessible name và aria-pressed, target 44px. Creator và preview đã xem ảnh trực tiếp ở1440/375; axe0, không tràn ngang trong6 journeys Chromium/Firefox/WebKit.

## Save và tác động gameplay

Engine/content3.0.0, save schema4; frozen v1/v2 nguyên trạng. `setup.playerTraits` optional và bất biến là opt-in riêng cho khởi tạo Creator. Trường vắng mặt không đổi setup shape, runID, RNG hoặc semantics; không tự nâng save cũ. Lượt random personality lịch sử vẫn được tiêu thụ khi override. Trait arrays không alias input/setup/player. Strict schema + invariant + canonical replay từ chối forge, duplicate và incompatible traits. Old app chưa hiểu trường mới sẽ từ chối save mới, không âm thầm diễn giải lại; đời cũ vẫn đọc đúng.

Tác động khởi đầu có giới hạn: tò mò +5tri thức, khéo tay +7kỹ năng, dễ gần +8giao tiếp; chỉ đời opt-in có kiên trì −2áp lực, yên tĩnh +3tâm trạng, giúp đỡ +3giao tiếp. Những luật hiện có đọc các chỉ số này; không thêm modifier tuyển sinh/xin việc hoặc bảo đảm thành công. Parent modifiers giữ đúng luật caregiver hiện hữu. Chưa có hệ phát triển tính cách dài hạn.

Không action hay tiền tệ mới, không trừ phí/giao dịch mới; ledger và budgets hiện hữu giữ nguyên. Autosave/3slots/UUID/history/guest database IDs/CAS/outbox không đổi. SQL001/002/003 không sửa/áp lại; không Auth setting, migration production, deletion hay credential người chơi. PGlite đã thử envelope có setup mới; không thay thế JWT thật.

## Bằng chứng kiểm thử mới

| Gate | Kết quả |
| --- | --- |
| `npm.cmd run verify` với VITE_BASE_PATH=/mot-kiep-viet/ và public cloud config như CI | VERIFIED PASS:133/133 unit/integration,16files; type/lint/content/build |
| Golden v1, v2, wardrobe, social, family | VERIFIED PASS trong full unit suite, frozen source không đổi |
| Targeted Creator | VERIFIED PASS16/16, gồm7foundation+9integration;150rerolls có từng trait khóa, forged locks/state, bounded effects và3ruleset full-life/4save keys |
| Content |115templates,7arcs,0errors; không template/arc mới |
| Simulation | VERIFIED PASS1000unique seeds/1000canonical replays/0violations;500opt-in +500old-style;96.710event checks có4–6enabled choices; max227actions/569.041bytes |
| Natural coverage |114/115template quan sát,2children/2adult children; không suy ra coverage rare path hoặc cân bằng từ mẫu này |
| Creator E2E desktop/mobile Edge | VERIFIED PASS2/2 sau sửa test disabled-clear;20choices mỗi journey, pre-input geometry,3slots/export/import/reload/replay |
| Creator Chromium/Firefox/WebKit desktop/mobile | VERIFIED PASS6/6;20choices mỗi journey; software viewport, không thiết bị thật |
| Full production E2E | VERIFIED PASS:38/38, bao gồm6viewport×20 quyết định, đo trước input và đối chiếu device viewport |
| Production subpath smoke | VERIFIED PASS: tạo đời, chọn/tiến thời gian, autosave/reload, asset/font license;0page errors |
| Dependency audit | VERIFIED PASS: `npm audit --omit=dev`,0advisories |
| Secret scan | VERIFIED PASS lượt đầu822text objects,0findings; sẽ chạy lại trước push cả publicdist/reachablehistory |
| Auth/cloud thật | BLOCKED: `test:cloud:live` exit1, CLI admin access unavailable; safe diagnostic xác nhận thiếu login, không phải thiếu binary/unknown flag;0QA identities được tạo |
| Owner tự nhập account live | NOT RUN, riêng với đăng nhập GitHub |
| CI / deploy / live G5 | INCOMPLETE, chờ commit/push và bằng chứng đúng SHA |

Failure history: Creator E2E đầu2timeouts do cố bấm disabled clear khi chỉ còn trait khóa; sửa test bằng kiểm tra enabled, chạy lại2/2 PASS. Full regression đầu phát hiện checkbox mẹ nằm trong details đóng; sửa test mở panel trước khi chọn. Không dùng các lần lỗi đó làm PASS. Chưa đổi engine/content sau simulation; không chạy lặp1000seed cho test/docs changes.

## Security review — phạm vi Creator/setup/replay/save

| Critical | High | Medium | Low | Tổng |
| --- | --- | --- | --- | --- |
|0|0|0|0|0|

Không tìm thấy lỗ hổng trong diff và đường dữ liệu được rà soát (confidence cao trong phạm vi này): draft UI → setupSchema → createRun → canonical replay → guest/cloud parser; React escape text, enum traits, không HTML/eval/Math.random trong luật, không tài chính hay quyền truy cập mới. Audit production0 và scan working/public/history0. Không phải pentest hay chứng nhận toàn bộ sản phẩm; real A/B/anon JWT mới chưa chạy, không có patch bảo mật đang chờ duyệt.

## Môi trường và Graft

Repo khởi đầu sạch `main`/`96e52aa859a498239779700253b9dcc36d856f5d`, remote main khớp; [repository](https://github.com/Johnathanjjnbao/mot-kiep-viet). Node mặc định của Codex24.22.1, npm cài tại Program Files11.20.0 dùng Node26.13.0 trong các lệnh shell này; Python3.15.2, dependencies đã tồn tại, không reinstall. GitHub dry-run push thành công; CI dùng Node24. 22 Global skills và5System skills thực tế đã kiểm kê, không cài thêm.

Graft CLI không có trên PATH; wrapper Trail tồn tại nhưng thiếu `@trailhq/trail-code/dist/bin/trail.js`. Hooks JSON có4event và dispatcher còn tồn tại; không có Graft MCP khả dụng trong phiên. Đã dùng `graft/INDEX.md` cùng per-file cards để điều hướng đúng source ranges; raw search chỉ cho source chưa được index như CSS/new files. `graft check/map/ask/build` qua CLI BLOCKED; graph cache cũ chưa đồng bộ changes mới. Không init/deep/ghi đèAGENTS/config hay tải skill hàng loạt.

Skills thực dùng: Frontend Design (panel Creator, palette/type sẵn có); Webapp Testing (Playwright journey/replay/save/viewport); Web Design Reviewer (ảnh1440/375, axe, overflow và target khóa); Security Review (input/replay/save boundary, audit); Secret Scanning (working/publicdist/history trước push). Graft-first là quy trình repo, không có sub-agent/Antigravity/globalskill mới. Không áp dụng các skill ứng viên khác.

## Handoff M5 còn lại

| Hạng mục yêu cầu | Trạng thái trong checkpoint này |
| --- | --- |
| Creator | Implemented/playable; local/guest PASS, cloud thật BLOCKED |
| Số ngành đại học mới |0 — INCOMPLETE; legacy university level chưa thành program/qualification records |
| Admission/scholarship/internship/switch/dropout/delayed graduation |INCOMPLETE, không event hay test mới cho các luật này |
| Xin việc có từ chối/cooldown/thất nghiệp/chuyển nghề |INCOMPLETE; luật cũ giữ nguyên cho mọi đời đã phát hành |
| Digital careers/platform eras/online business/stock/loss |INCOMPLETE, không triển khai thêm; không tự coi nghề freelance/business cũ là hệ mới |
| Military research/eligibility/periods/service |NOT READY / NOT RUN trong sliceA; không đưa luật suy đoán vào production |
| Tích hợp chuyên ngành/nghề với romance/children/wardrobe/history |INCOMPLETE; giữ dữ liệu, goldens và luật family/child career hiện hữu |
| New active events / arcs |0/0; tổng hiện hành115/7 |
| Future longevity/international/VND/assets |NOT RUN, giữ backlog |
| Owner approvals thiếu |Không SQL mới cần duyệt. Supabase CLI login còn thiếu cho realcloudQA; không xin token/password qua chat |

Bước tiếp: chốt đúngSHA CI/live củaCreator, sau đó thiết kế opt-in Education/Career bất biến trước đổi authoritative rules;12programs và record attempted/completed riêng; tuition/aid ledger; ngành/event có4choices; application có rejection/cooldown và phục hồi; era-gated business/creator; military nghiên cứu nguồn gốc trước luật. Những phần này chưa được đánh dấu hoàn tất chỉ vì Creator được phát hành.

Để khôi phục cloudQA: chủ dự án chạy `npx.cmd supabase login` cục bộ bằng trình duyệt, xác nhận đúngproject `kqnapcyceddwvrvkquvg`, rồi chạy runner với public config. Runner chỉ giữ privileged key trong bộ nhớ, dùng normal JWT để assertions, giữ dữ liệu và chỉ disable identities của lượt đó. Không áp SQL mới trong bước này.

## Local gate cuối trước push

Full regression sau sửa selectors:38/38 VERIFIED PASS. Hai bài five-family đều qua;6viewport ×20choices,126 pre-input samples, không clamp narrative/ẩn HUD/auto-scroll làm bằng chứng. Full verify133/16files chạy lại PASS; production smoke chạy trên Pages build mới PASS. Không đổi authoritative rules sau batch1000seed. Reports và ảnh generic cũ được giữ nguyên; kết quả mới sao chép có prefixm5-a/v036-creator1.

Ảnh đã xem: [Creator mobile](evidence/m5-a-local-mobile-edge-creator.png), [preview desktop](evidence/m5-a-local-desktop-edge-preview.png). Raw [browser38](evidence/m5-a-browser-results.json), [Creator6journeys](evidence/m5-a-local-creator-browsers.json), [simulation1000](evidence/m5-a-simulation.json), [viewport6](evidence/v036-creator1-local-viewport.json), [cloud blocker](evidence/m5-a-cloud-blocked.json).

Lệnh Trail build sau source changes đã thử và exit1 MODULE_NOT_FOUND; graph refresh BLOCKED, không init lại.

Secret scan cuối: 829 text objects,0findings (working/publicdist/reachablehistory); source/diff review và git diff --check PASS.
