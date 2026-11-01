# v0.3.8 — Digital Careers & Business

## v0.3.8-vnd.1 — local gates PASS, deployment pending (01/11/2026)

Tiếp tục checkpoint `54e1e0b`, giữ foundation retail ở trạng thái isolated. Đời tạo mới dùng `setup.currency = vnd-v1`, lưu số tiền nguyên VND; thiếu selector vẫn dsm-v1. Quy đổi tham số thiết kế một lần: 1 đơn vị cũ =200.000 VND theo sức mua thiết kế2026, không phải tỷ giá hay giá danh nghĩa lịch sử. Ledger giữ raw amounts; lãi tính trực tiếp trên số dư. Engine/content3.0.0, schema4, 512actions/5MiB, frozen v1/v2 và lưu/history giữ nguyên; không SQL/Auth/RLS changes.

Full verify256tests/27files PASS, gồm9golden lịch sử và golden VND3126831863 độc lập. 1.000 đời VND +1.000 canonical replay PASS,0vi phạm; max428actions/700545bytes;4–5 lựa chọn khả dụng;0tuổi thiếu/bỏ qua; kết thúc65–107. Production Pages subpath smoke PASS. E2E78/78 PASS, browser VND/DSM sáu contexts PASS, production smoke và secret scan PASS. Exact-SHA CI/deployment/live còn PENDING; không coi local PASS là deployed. Báo cáo và phạm vi tại `VND_MIGRATION_REPORT.md`. G5 guest chưa chốt cho VND; owner cloud login vẫn NOT RUN. Phần v0.3.8 digital/business bên dưới là lịch sử checkpoint, chưa trở thành shop chơi được.


Baseline `585a9a5346313e628722a8b5337ffc4f3dc19e26`, main, sạch và đồng bộ remote ngày01/11/2026. Production vẫn0.3.7-yearly.1. Toàn bộ v0.3.8: **INCOMPLETE**.

## Context Map — đã rà trước sửa

| File | Vai trò |
|---|---|
| src/domain/enterprise.ts (mới) | Bản ghi và policy kinh doanh có giới hạn |
| src/engine/enterprise.ts (mới) | Posting qua transact, vốn/stock/COGS/hoàn tiền/tháng/đóng |
| tests/enterprise.test.ts (mới) | Bảo toàn tiền/hàng, replay reducer, không double-settle |
| src/engine/finance.ts:transact/settleMonth | Tham chiếu, chưa đổi |
| src/engine/engine.ts:tick/dispatch | Điểm tích hợp sau; hiện chưa nối |
| src/engine/annual.ts, academics.ts, employment.ts | Phải kế thừa qua selector mới, không đổi annual-v1 |
| src/persistence/saves.ts, domain/creator.ts, model.ts | Parser/selector/actions mới chỉ được mở khi tích hợp hoàn chỉnh |

Không đổi API runtime cũ, schema/SQL/Auth/RLS hoặc workflow ở foundation. Không tự chuyển old business/freelance thành doanh nghiệp. Module mới chưa được gọi từ game/UI/save parser; không trình bày reducer tests như canonical game replay hay shop đã chơi được.

## Ngân sách hành động

Policy nhập hàng/giá/marketing giữ cố định và quyết toán theo tháng; không có click bắt buộc mỗi tháng.10năm: lập nghiệp1 +đổi policy mỗi3năm3 +đóng1 =5 quyết định.30năm:1+10+1=12. Policy quý liên tục sẽ tốn120 hành động/30năm, không an toàn với baseline420 và shared120 quản lý của family. Creator campaigns cũng cần policy và story choices, không thêm lệnh tháng bắt buộc. Job+shop/university+shop/family phải đo lại khi tích hợp; không cộng các sample maxima rồi gọi đó là bằng chứng an toàn.

512actions/5MiB giữ nguyên. Báo cáo tháng chỉ giữ12kỳ gần nhất, totals là số cộng dồn có invariant; full player ledger vẫn lưu các posting. Nhiều doanh nghiệp/30năm và đời100+ cần đo kích thước và thời gian replay thật trước mở UI.500/1000năm chưa được hỗ trợ; nếu cần segment/checkpoint mới phải version parser/RPC/history và review bảo mật, không nâng512 toàn cục.

## Mô hình tài chính foundation

Vốn góp chuyển cash người chơi sang asset doanh nghiệp, không tạo doanh thu. Nhập hàng chuyển working cash thành tồn kho theo giá vốn, chưa ghi chi phí. Khi giao hàng: revenue trừ refund, COGS chỉ cho hàng không trả; phí giao hàng tính cả đơn trả, tồn kho hàng trả về có thể bán lại. Lợi nhuận=doanh thu thuần−COGS−vận hành−write-off. Dòng tiền còn chịu nhập hàng; do đó profit khác cash. Hết vốn vận hành thì suspended, không tự vay. Đóng thanh lý tồn kho50% giá vốn và ghi write-off, trả tiền còn lại; không biến thanh lý thành doanh thu khách hàng.

Mọi thay đổi tiền qua posting gọi transact, business equity bằng cash+stock×unitCost và đối chiếu vốn góp−rút vốn+lợi nhuận. Max stock200, policy giá hữu hạn, tối đa4ID; tiền và totals có giới hạn integer. RNG riêng hash(seed,id,month) không dùng Math.random hoặc tiêu thụ stream của đời cũ. Không thêm salary business/freelance; foundation từ chối mở chồng hai nghề abstraction ấy.

## Còn phải làm

CheckpointA chỉ hoàn thành khi selector enterprise-v1 được nối vào monthly tick/dispatch/parser/invariants và replay chính thức. Sau đó shop UI/4-choice stories, employment/education/family workload, 1.000 đời mới+replay,76E2E+business journeys, browser6cấu hình vàCI/live. Creator/platform dates cần nghiên cứu nguồn chính thức trước triển khai. Không TikTok/YouTube/streamer/freelance/AI/idol mới trong foundation này. Không đổi mặc định NewLife trước khi gates hoàn chỉnh.

## Checkpoint nội bộ đã kiểm (chưa phát hành)

`npm.cmd run verify` với VITE_BASE_PATH=/mot-kiep-viet/:243tests/26files, typecheck/lint/content/build PASS.13test mới: vốn góp/tồn kho/COGS/hoàn hàng/phí/lãi-lỗ, ba giá đều có thể lời hoặc lỗ, thiếu tiền, suspended/fund/resume, đóng/thanh lý và mở ID kế tiếp, dữ liệu giả mạo, settlement trùng/tháng bị bỏ, policy30năm.9goldens lịch sử vẫn qua.

1.000seed sổ cái10năm +1.000lần dựng lại reducer:0vi phạm;248lời/752lỗ/755có tháng suspended trong policy stress, không phải tỷ lệ doanh nghiệp ngoài đời. Max serialized fixture26468bytes, recent chỉ12kỳ. Đây **không phải**1.000đời mới/canonical GameRun replay: fixture đặt clock riêng, không chạy monthly living costs/age progression. Bằng chứng enterprise-foundation-stress.json nêu rõ scope.

Chưa đăng ký setup.enterprise-v1, chưa gắn book vào GameRun, chưa thêm RunAction/strict parser, chưa gọi settleRetail trong tick, chưa UI/story/life summary, chưa dispatch action/CAS. Vì vậy CheckpointA vẫn **INCOMPLETE**, B/C/D/E **NOT RUN**; không có online shop/creator mới đã deploy. DefaultNewLife và mọi luật cũ không sửa. Có build mới nhưng chưa E2E/browser/production smoke cho checkpoint này; không đưa module tài chính chưa tích hợp lên main remote như một release v0.3.8.

Bước kế tiếp: (1) router enterprise-v1 kế thừa annual/academics/employment mà không đổi selector cũ; (2) actions chiến lược với CAS và canonical parser, state chứa tối đa4venture, (3) monthly hook chỉ xử lý book đang hoạt động/suspended và đóng đúng khi đời kết thúc; (4) guard careerReason/startCareer cả hai chiều để không nhận salary abstraction business/freelance đồng thời; (5) policy phân phối lợi nhuận/rút vốn và workload; (6) UIshop +events4choices, sau đó1.000đời/replay thật,76E2E +6browser/budget/cloud gates. Không tuyên bố parser bảo mật đã hoàn tất chỉ vì assertEnterprise bắt được vài trường giả.

Cloud probe mới:BLOCKED, CLIauthenticated=false/projectFound=false,0productionwrites, ownerloginNOTRUN. Không SQL/Auth/RLS thay đổi. Skills đã dùng:Context Map (tự rà map), Security Review (luồng tiền và atomicity), Secret Scanning (trước checkpoint). Graft đang hoạt động; Trail wrapper lỗi đã biết từ phiên trước, không sửa/cài lại tool. Không có scheduler hay chạy nền sau khi kết thúc phiên.

Secret scan cuối:1324text objects working/public/all reachable history,0findings. Commit nền nội bộ được giữ local; không push vì chưa có version routing, canonical GameRun integration và browser proof cho shop. Final SHA xem git log và báo cáo phiên; production vẫn585a9a5/0.3.7-yearly.1.
