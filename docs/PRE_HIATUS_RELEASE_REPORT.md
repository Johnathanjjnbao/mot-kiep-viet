# Pre-hiatus — release report đang thực hiện

Trạng thái03/11/2026: **LOCAL GATES — VERIFIED PASS; RELEASE — INCOMPLETE**. Ứng viên0.3.10-stable.1 đạt401tests/40files,29golden,120E2E một lệnh/17,8phút,6/6browser combinations, production smoke và1.000+1.000replay. Chưa commit/push/deploy ứng viên; bản công khai vẫn0.3.9-realism.1 tại main5a30670. Backup/restore, CI đúng SHA và liveG5 là các bước tiếp theo. Các mốc triển khai bên dưới giữ làm lịch sử.

## Bảo toàn WIP — VERIFIED PASS

- Checkpoint local `66a961d7c2cedd668f0381a48758a56d602f4e1d` trên `codex/pre-hiatus-wip-20261102-1534`,85 files thay đổi được giữ; chưa push checkpoint.
- Source ZIP `C:\Users\triba\Downloads\MKV_PRE_HIATUS\wip-20261102-153446\mkv-uncommitted-wip.zip`;1606 files,172647783 bytes; SHA-256 `9d801a0da52fafafdb709f2c2a1e939d3788821cd94fb7d54cb55f0a5655ba85`. Đã mở ZIP, kiểm CRC, extract an toàn và so từng file với manifest. Không chỉ dựa exit code.
- Loại trừ env riêng, node_modules, dist, .local, traces và save riêng. Backup giữ local. Scan source/public dist/history1827 text objects,0 findings. Git history bundle và restore install/build cuối release vẫn PENDING.

## Context map và review đầu phiên

| Tệp | Việc tiếp tục |
|---|---|
| scripts/creative-viewport-fixtures.ts | Fixture hiện33/34, sửa cách tái hiện ar-first-show bằng prefix canonical thật |
| engine/artistic.ts, engine/engine.ts | Chỉ đối chiếu eligibility/priority/selectEvent; chưa có bằng chứng cần đổi luật |
| qa-creative-viewport.ts, E2E creative-viewport | Đo34cảnh×6viewports,20first/middle/last, giữ narrative/HUD/firstchoice trước input |
| tests/artistic/creative/freelance, golden | Giữ16golden cũ, thêm golden native sau review |
| content/events/validation, content catalog | Inventory rồi chọn phần trưởng thành/cao tuổi thiếu nội dung; thay đổi sau capability mới |
| application/persistence/UI | Audit state→ledger→save/replay và profile hiệu năng trước tối ưu |

Đã tự review map theo Context Map: thay đổi fixture chưa đổi runtime/schema/DB; strict parser và replay kiểm prefix. Skills đã đọc: Context Map, Secret Scanning, Webapp Testing; Graft tìm actual generator và callers eligibility. Các skill khác đọc khi đến đúng giai đoạn.

Các kết quả creative1000 và browser trước phiên này là baseline, không nhận lại là final regression. Xem CREATIVE_CAREERS_PROGRESS.md cho lịch sử.

## Mốc A — kiểm chứng mới trong phiên

- Native fixtures34/34 đã canonical; ar-first-show tái hiện bằng creative-stress-68, tuổi20,53actions, active/showCount0. Nguyên nhân thiếu là đường fixture nghỉ/đợi đã bỏ qua cửa sổ đầu nghề và bị cảnh priority/family ưu tiên; không đổi engine/priority để ép case.
- Sáu viewport×34cảnh +20first/middle/last mỗi viewport PASS; đã xem ảnh chữ lớn/landscape. Chữ lớn worst first-choice bottom605.734/667.
- Full tests330/36files PASS;16golden lịch sử +7creative riêng giữ độc lập. Long-life native tới123 tuổi/251actions; combo bốn book vẫn86tuổi/356actions.
- JS trước tối ưu1419602 bytes/gzip423129, CSS74890; sourcemap cho thấy Supabase và engine/content đồng bộ là phần lớn, không có diagnostic-only module trong bundle. Chưa nhận cải thiện hiệu năng.

## Context map C/F — đã tự review trước sửa

Nội dung284 authored entries hiện có gồm34 creative WIP. Các định nghĩa bắt đầu riêng ở41–60 chỉ6,61–82 chỉ7,beyond82 là0; tổng potential overlap không phải số cảnh thực gặp. Giữ toàn bộ45cảnh tuổi nhỏ và tập trung56cảnh trưởng thành/cao tuổi mới:8arc×4chặng +24cảnh độc lập,224lựa chọn có tradeoff thật. Không tăng tiền/giá/thu nhập; không thêm hệ thống roadmap.

| Tệp | Sửa |
|---|---|
| domain/model,creator,rules | stable-v1 kế thừa creative-v1; giữ creative và các golden đã khóa |
| content/stable-events.ts mới |56cảnh v16, flag namespace stable-,8arc có tiếp nối/rút lui/khép; min18,6cảnh82+ |
| engine/stable-stories.ts mới | Gate context từ GameRun thật cho rejection/parent/shop/career, không focus/clock/ledger mới |
| content/events,validation; engine/engine | Registry và gate v16 riêng; chỉ stat/flag/habit/relationship có kiểm context, không cash/schedule tùy tiện |
| scripts/content-inventory; tests/stable-stories | Inventory phân biệt authored/generated/historical/focused; regression inheritance, NPC/budget/replay và rare paths |
| ui/App và các panel | Chỉ lazy UI sau profile; giữ engine/save/replay đồng bộ, không chạm Auth/RLS để giảm bundle |

Review rủi ro: thêm selector bất biến để56cảnh không chèn vào đời creative/realism cũ; không nâng512/120/5MiB; metadata/flags gọn, cảnh thay slot năm chứ không thêm choose/advance; final1000 mới và golden stable riêng cần chạy sau khi chốt nội dung. Default vẫn giữ realism tới khi đường sinh/đời dài stable mới được kiểm. Không SQL hoặc migrations.

## Mốc nội dung và regression — candidate

56/56 cảnh stable đã có prefix canonical thật,8arc×4chặng +24cảnh độc lập. Default tạo đời mới đã chuyển sang stable-v1 sau kiểm tra inheritance/strict save và đời dài. Registry340, gồm34creative và56stable mới; không nhân số lượng bằng các instance được sinh. Sáu golden stable riêng khóa opening,118tuổi, combo86tuổi/120lượt, hoàn tất/rút khỏi nhóm học, quyền tự quyết86tuổi. Tổng29golden =16historical +7creative +6stable; không đổi expected cũ.

`npm run verify` với base Pages/cloud public configuration PASS394tests/38files trước bản vá guest CAS bên dưới. Chưa nhận lượt này là final source gates. Năm viewport stable đã chạy; lượt chữ lớn bị vô hiệu bằng chứng vì dev server nhận thay đổi nội dung giữa lượt. Final production E2E phải chạy trên build cố định, không dùng lại lượt dev bị gián đoạn.

## Context map — xung đột hai tab guest

Audit phát hiện guestRepository trước đây dùng writeSave trực tiếp, khác account local CAS. Tái hiện bằng hai lượt đọc cùng autosave rồi hai lựa chọn thật: lần ghi sau xóa nhánh đã lưu trước. Đây là P1 bảo toàn tiến độ cần sửa trong phạm vi finalization.

| Tệp | Trách nhiệm bản vá |
|---|---|
| persistence/saves | Dùng cùng hàng đợi cũ; readSaveEntry trả đúng cell đã đọc, compareAndWriteSave so và ghi trong một readwrite transaction; bỏ qua no-op thật sự giống nhau |
| persistence/guest-repository mới; repository | Mỗi tab giữ tối đa4 cell đã quan sát; adapter guest dùng CAS; slots/history/API cũ giữ tương thích |
| application/useGameSession | Hiển thị lỗi guest thật, không hứa đã có recovery branch trong tài khoản; nhánh chưa ghi vẫn ở UI để xuất tệp |
| guest-cas unit/E2E | Ghi đồng thời, stale new-life, queue/read, slots độc lập; hai tab thật và export nhánh bị từ chối |

Review: không đổi engine/action/RNG/save schema hoặc IndexedDB ID/version1. Không thay Auth/cloud/RLS. Không replay trong transaction ghi. Hàng đợi raw readSave vẫn chờ đúng writer để guest preview/cloud migration không đọc trước lần ghi đang chờ. Không tự rebase nhánh cũ lên lựa chọn của tab khác.25tests trong3files guest/saves/cloud-sync PASS; browser hai tab và final verify PENDING tại thời điểm ghi đoạn này.

## Final canonical batch — VERIFIED PASS

1.000seed khác nhau stable-stress-0..999,1.000canonical replay,0invariant violations,0engine fallback,0tuổi thiếu/bỏ. Tuổi kết thúc63–98, trung bình78,49;116.926 lượt quan sát quyết định (có focus/quan sát chủ động, không phải số cảnh authored). Peak461/512actions,888138serialized bytes,5489total postings. Max replay2509ms, heap sample118962512bytes trên Node; đây không phải số đo leak trong browser.

Native careers trong batch:600đời có freelance/800dự án;54paid,26partial,5unpaid,325rejected,355failed,35declined.390gaming;590collab, gồm tăng/0/giảm audience;600artist đủ3chuyên môn,8964shows/802show không phí,385comeback. Không dùng số lượt hoặc generated instances để tăng số authored scenes.

54/56cảnh stable đã xuất hiện ngẫu nhiên. `stable-rented-corner` và `stable-adult-child-space` không xuất hiện trong batch này; cả hai có prefix canonical/strict-parse và đã qua UI cùng54cảnh còn lại. Không suy diễn random1.000 bao phủ mọi rare path. Forced stable: đời118tuổi; combo3con+degree+job+shop+channel+project+artist+gaming+collab,120lượt quản lý,86tuổi/356actions/964941bytes; người83tuổi mở tiệm, có2,4triệu doanh thu/2,8triệu chi phí vận hành rồi tiệm tạm ngưng ở85, không kết thúc đời ở82. Native shared reducers còn có các fixture rejected/rework/partial/unpaid/audition/collab/burnout và các golden riêng.

Runtime freeze `21399a3a8207718bac4aefeef8ad84ee0cc0ebf398525b19e3f28c5054138bfd` lưu tại evidence/pre-hiatus-runtime-freeze.json. Sau batch chỉ sửa UI địa danh mặc định và nhãn phiên bản đọc từ package;145tệp engine/content/domain/persistence/frozen còn byte-identical. Xem evidence/pre-hiatus-source-compatibility.json. Không chạy lại1.000 chỉ vì metadata/UI đổi; final browser/build/CI kiểm các thay đổi UI đó.

## Browser và playtest — các mốc có bằng chứng

- Full candidate118E2E PASS một lệnh,18,5phút. Sau sửa địa danh, full release120E2E trên build0.3.10-stable.1 PASS một lệnh/17,8phút, không skip; evidence/pre-hiatus-browser-results-release.json. Không dùng targeted rerun thay cho fullcommandPASS.
- 34/34creative và56/56stable×6viewports, mỗi viewport20first/middle/last, đo trước input/cuộn. Stable worst chữ lớn585,484/667; landscape275,703/375. Đã xem trực tiếp ảnh chữ lớn/landscape; narrative đầy đủ và toàn bộ lựa chọn đầu nằm trong viewport. Chỉ choice list cuộn.
- Chromium/Firefox/WebKit×desktop/mobile PASS6/6 trên build0.3.10-stable.1, mỗi tổ hợp gồm creator,freelance,gaming/collab,artistic và56cảnh stable; evidence/pre-hiatus-release-browsers.json. Firefox mobile là responsive viewport+touch, không tuyên bố máy điện thoại thật. Không có privileged/cloud player credentials.
- Ba đời từ creator đến memoir, không import/fast-forward: nghèo nông thôn98tuổi/203actions; khá giả đô thị84/169; mẹ đơn thân106/219. Rerun sau sửa địa danh đã giữ đúng vùng ven biển trong narrative. Nghèo không đồng nghĩa ngõ cụt, giàu không bảo đảm sống lâu hoặc thành công. Xem evidence/pre-hiatus-local-personas.json và ảnh theo tuổi.
- Browser hai tab thật bảo vệ nhánh đã lưu; nhánh conflict xuất/parse/replay đúng. Fault một chunk bảng phụ vẫn quay lại story và giữ run.4targeted desktop/mobile PASS. Khi test cũ đọc entry trước lazy panel hiện ra đã sửa wait đúng trạng thái; không nới assertion để bỏ case. Lượt full đầu bị dừng vì fixture readiness không được gọi là full PASS.

## Hiệu năng — đo và giới hạn

Trước tối ưu: entry1419602bytes/gzip423129; build cuối1376037bytes/gzip412843 dù có thêm56cảnh và guest CAS. Giữ warning>500kB. NewLife/SaveManager tải sẵn sau khi đo cho thấy deferred toàn bộ làm thao tác mở chậm; chỉ bảng phụ/history/account/legacy tải khi cần. Auth/provider/parser/replay không chuyển sang lazy hoặc worker.

Ba process Edge mới cho mỗi phía,1440×1000,CPU4×,HTTP local/cache disabled;20quyết định và nhập run356actions/964357bytes. Median before→final-build: home1195,2→924,1ms; creator173,7→180,1; import950,6→835,6; reload2344,6→1192,3; import lớn12393,5→5761,3; choice+kèm autosave390,5→241,0. Xem evidence/pre-hiatus-performance-summary.json và hai raw reports cold-before/cold-after. Đây là mẫu lab có overhead automation/IndexedDB và dao động JIT, không phải INP thực địa hoặc lời hứa tăng tốc cho mọi máy. Các thử nghiệm chia cả màn quan trọng ra chunk đã được loại khỏi kết luận cải thiện.

CPU profile cold import ở hai phía khoảng11giây vớiCPU4×, phần kiểm toán kênh/settlement chiếm nhiều thời gian. Đây là P2 còn lại; giữ tính đúng và các golden, không viết lại replay trong lượt ổn định này.20lần import lặp có heap tăng khoảng5MB trong context thử; đóng context đưa mẫu mới về mức tương tự. Không kết luận zero leak hoặc đã sửa leak từ số liệu này. Sau lần mở online, worker cache public shell/assets đã dùng; bảng phụ chưa từng mở có thể cần mạng. Không hứa toàn bộ game offline-first.

Spot measurement build cuối: lưu thủ công ô1 cho run356actions mất4773ms trên EdgeCPU4×, gồm việc refresh/kiểm lại ô lưu trước thông báo thành công. Đây là một quan sát, không phải paired median; evidence/pre-hiatus-performance-manual-save.json. Số đo không chỉ là thời gian ghi IndexedDB.

## Đánh giá sản phẩm

| Khía cạnh | Bằng chứng và hạn chế |
|---|---|
| Chơi lại | Seed/trait/gia đình/nghề đổi đường đi;90cảnh mới độc lập với đời cũ. Vẫn còn các cảnh đời thường và hồi sức có nhịp tương tự; không phải340cảnh đều thuộc cùng một pool của đời mới |
| Mạch kể |45cảnh tuổi nhỏ, context NPC,8arc rút/tiếp/khép và hai lỗi fixture/địa danh đã tái hiện/sửa. Nhiều cảnh stable tác động stat/flag, chưa là mô phỏng xã hội sâu |
| Tiến triển | Degree/skill/cash/workload ảnh hưởng điều kiện và chi phí; native nghề có trả chậm, thất bại/lỗ/nghỉ. Mô hình dùng VND sức mua thiết kế2026 và era tương lai hư cấu |
| Dễ dùng | HUD/đọc/chọn/save có bằng chứng6viewports; hai tab conflict không ghi đè. Nhiều bảng quản lý và giới hạn4book/120lượt vẫn cần người chơi khám phá; bản lưu dài có độ trễ |
| Ổn định |29golden,1.000+1.000 và regression/browser mạnh. Các số đo không chứng minh mọi seed/thiết bị và cloud owner login vẫn NOT RUN; phát hành chỉ nhận PASS sau CI/live/restore |
