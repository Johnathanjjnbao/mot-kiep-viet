# Cửa hàng và kinh tế người sáng tạo — triển khai tiếp

## Cửa hàng0.3.8-business.1 — kiểm chứng local, deployment PENDING (01/11/2026)

Tiếp tục7dc19a2 →927e734 →58b5cbd, không làm lại VND/Year-by-Year. Đời mới enterprise-v1 dùng VND nguyên; save annual/career/education/dynamic và thiếu currency giữ nguyên luật/đSM. Ba ngành hàng: quần áo, gia dụng, thủ công. Policy giá/quảng bá/tồn kho, góp/rút vốn, tạm dừng/mở lại, sổ12tháng, thanh lý50%, hồi ký và12cảnh mới đã nối thật. Mỗi cảnh có4lựa chọn khả dụng; chỉ dispatch ghi trạng thái/ledger. Chặn lương business/freelance hai chiều; học tập, lương thường và gia đình đi cùng tiệm có áp lực công việc. Tối đa4ID cả đời, chung120quản lý,512actions/5MiB giữ nguyên. KhôngSQL/Auth/RLS hoặc frozen changes.

**VERIFIED PASS:** verify274tests/28files;18testGameRun cửa hàng, ba nhóm hàng, đại học/việc làm/gia đình,30năm/bốnID/120quản lý/100+tuổi vàestate.9golden lịch sử +VND3126831863 giữ nguyên; business opening2481017761/full-life548030889 riêng. PGlite nhận envelope business thật theo migration003 đã duyệt, không thay Auth thật. Production Pages-subpath smoke và audit production0 PASS. Scan1484text objects gồm source/dist/reachable history,0findings; sẽ quét lại trước push sau khi chốt bằng chứng.

**1.000đời+1.000canonical replay VERIFIED PASS:**0vi phạm/0tuổi thiếu/0tuổi bỏ/0fallback; mọi cảnh4–5lựa chọn.1.600tiệm,800sổ lời/800sổ lỗ sau đóng,386.147tháng lời/32.324tháng lỗ/166.339tháng có hoàn hàng được quan sát duy nhất. Max438actions,728196bytes,4390transactions,14enterprise actions; tuổi kết thúc61–105 theo policy stress, không ép chết/nghỉ hưu. Đây là kết quả policy game, không phải tỷ lệ kinh doanh ngoài đời. Fixture khỏe còn sống100+ đã kiểm riêng. Báo cáo business-1000-lives.json ghi phạm vi, trạng thái và cách đếm; returnedOrders cuối đời chỉ tổng12kỳ gần nhất, suspended là số lần quan sát chứ không phải tỷ lệ thực.

**Browser:** Chromium/Firefox/WebKit ×desktop/mobile6/6 từ tạo nhân vật0→18, mở tiệm/lỗ/góp vốn/đổi policy/có tháng lời/rút/ba slot/reload/export-import/đóng/mởIDmới PASS, axe0. Ví dụ UI: vốn4triệu và không dự trữ dẫn tới lỗ/dừng; góp30triệu, cân bằng/khôngquảngbá/20món có kỳ lời2,8triệu và kỳ lỗ/hoàn hàng. Vốn chủ46,8triệu=34triệu góp−1triệu rút+13,8triệu lợi nhuận. Bốn suite sáu viewport×20quyết định cũ vẫn giữ; thêm sáu business cases. QA sửa kỳ vọng default selector, tôn trọng300ms touch duplicate guard, và phát hiện first choice chữ lớn hụt11px: chỉ thu khoảng cách, không cắt narrative/choice. Suite cuối đang chốt lại; không dùng lượt82/86 trước sửa làm PASS toàn bộ.

**C/D INCOMPLETE:** có nghiên cứu nguồn nền tảng tại CREATOR_PLATFORM_RESEARCH.md. Triển khai creator-v1 đang được giữ ở checkpoint chưa phát hành riêng; không nằm trong release cửa hàng. Chưa tuyên bố TikTokLIVE/YouTube/gaming/freelancer/idol hay monetization đã deployed. G5 guest live vàexact-SHA CI còn PENDING. Owner cloud login NOT RUN; không credential người chơi hoặc productionwrites.


## Cửa hàng0.3.8-business.1 — local release candidate (01/11/2026)

Tiếp tục checkpoint927e734, giữ toàn bộ VND và save cũ. Đời tạo mới dùng enterprise-v1; ba nhóm hàng, policy giá/quảng bá/tồn kho, sổ tháng, góp/rút vốn, tạm dừng/mở lại, thanh lý50% và12cảnh bốn lựa chọn đã nối UI/dispatch/ledger/save/replay. Hồi ký giữ lịch sử tiệm; salary abstraction bị chặn hai chiều, việc làm thông thường/học tập/gia đình vẫn đi cùng tiệm. Frozen v1/v2,9golden lịch sử vàVND3126831863 giữ nguyên; enterprise opening2481017761 vàfull-life548030889 riêng.

Local verify274tests/28files PASS;18testGameRun cửa hàng gồm30năm/bốnID/120quản lý/100+tuổi. Chromium/Firefox/WebKit ×desktop/mobile6/6 chơi từ0, mở/lỗ/góp vốn/phục hồi/rút/ba slot/reload/export-import/đóng/mởIDmới PASS, axe0. Production Pages-subpath smoke PASS; audit production0; secret scan1484text objects/0findings. PGlite nhận snapshot business thật trong envelope đã duyệt, không phải Auth/JWT/RLS thật. Lượt E2E đầu phát hiện kỳ vọng selector cũ và một request trùng lúc rebuild; đã sửa kỳ vọng QA, đang chạy lại86E2E gồm6business viewports×20quyết định. 1.000đời+canonical mới đang RUNNING; không coi pilot20đời là gate ấy.

Chưa push/deploy bản này. C/D creator vẫn INCOMPLETE; nguồn nền tảng đã đối chiếu tại CREATOR_PLATFORM_RESEARCH.md, chưa bật audience/monetization/TikTokLIVE/YouTube. G5 guest deployment PENDING; owner cloud login NOT RUN. Giữ512actions/5MiB và tối đa4sổ, chung120quản lý, khôngSQL/Auth/RLS mới.


Baseline `7dc19a29fce1d5da56dfe9e47f3f68f47cee6e76`, main sạch/đồng bộ. Trạng thái mới: **INCOMPLETE**, chưa thay mặc định người chơi hoặc phát hành shop.

## Context map và hợp đồng

| Ranh giới | File | Cách tiếp tục |
|---|---|---|
| Nhánh bất biến | domain/model.ts, creator.ts, rules.ts | enterprise-v1 kế thừa annual, academics, employment; currency độc lập |
| Sổ tiệm sẵn có | engine/enterprise.ts, domain/enterprise.ts | Giữ công thức; tách thao tác trên bản engine sở hữu để tick không clone cả đời mỗi tháng |
| Thao tác chính thức | domain/enterprise-actions.ts, engine/business.ts | Zod strict, expected/CAS, vốn/chiến lược/rút vốn/tạm dừng/đóng; tối đa4 ID không tái dùng |
| Clock và truyện | engine/engine.ts, annual.ts | Một clock tháng; không tick qua sự kiện; thanh lý tài sản khi kết thúc; không xóa truyện đang chờ |
| Bảo toàn dữ liệu | persistence/saves.ts, engine/invariants.ts | Actions tái dựng cả sổ, canonical comparison; schema4/512/5MiB giữ nguyên |
| Giao diện | ui/Panels.tsx, EnterprisePanel.tsx, NewLife.tsx | Khu cửa hàng trong Nghề nghiệp; giữ HUD/avatar/5 tab; chỉ dispatch |
| Kiểm chứng | tests/business*.test.ts, scripts/qa-business*, simulate.ts | Đời thật, replay, budget10/30năm và100+, browser6cấu hình, CI/live đúng SHA |

Tiền công việc và sinh hoạt vẫn qua settleMonth. Tiệm dùng posting/transact cho vốn, hàng, doanh thu thuần, COGS, chi phí, rút vốn và thanh lý; profit khác cash flow. Lợi nhuận giữ ở tiệm cho tới khi rút/đóng, không trả thêm salary abstraction business/freelance. Nghỉ hưu không tự xóa tiệm; kết thúc đời thanh lý toàn bộ book còn mở tại cùng tháng, giữ lịch sử. Giao dịch/thao tác thất bại hủy toàn bộ clone. Chỉ đời mới có nhánh mới; chín golden lịch sử và golden VND riêng giữ nguyên.

Ngân sách: tối đa120 thao tác tùy chọn chung cho nhánh mới, kể cả học/quan hệ/gia đình/tủ đồ/tiệm; vận hành tháng không thêm action. UI giữ dự trữ truyện hiện có. Không nâng512, không ép chết/nghỉ hưu để né ngân sách. SQL/Auth/RLS, database IDs và frozen v1/v2 không sửa.

Checkpoint A chỉ PASS khi actions/tick/save/import/replay/invariants nối thật. B chỉ phát hành khi có UI, truyện4lựa chọn, full gates và1.000đời/replay mới. Creator/platform nghiên cứu sau khi shop ổn định. Mọi kết quả VND trước đây là baseline, không dùng làm PASS cho thay đổi này.

## Checkpoint A

33tests liên quan PASS; includes8testGameRun thật,13testVND và12testreducer. Khởi tạo/clock10năm/terminal100+/mid-operation save/import/canonical replay, atomic rejection, stale action, forged state, đóng/mở ID kế tiếp và salary conflict đã kiểm. Golden khởi tạo enterprise2481017761 độc lập. Full hồi quy264tests/28files PASS; chưa UI/default activation/deploy.
