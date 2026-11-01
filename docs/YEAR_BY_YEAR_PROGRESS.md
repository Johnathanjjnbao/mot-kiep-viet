# Tiến từng tuổi và chiều sâu đại học

Ngày bắt đầu: 01/11/2026. Baseline `da55d281673396aa5d73cae628dd9b1731b4ddb6`, main sạch; production vẫn `0.3.6-employment.1`. Toàn bộ yêu cầu: **INCOMPLETE**.

## Context Map (đã tự rà trước khi sửa)

| File | Vai trò và thay đổi dự kiến |
|---|---|
| src/engine/engine.ts | createRun/advance/selectEvent/tick/choose; nhánh annual-v1, giữ các nhánh cũ |
| src/domain/model.ts, creator.ts | Selector bất biến, parser setup |
| src/engine/annual.ts | Mốc tuổi suy từ choices; kiểm tra không bỏ tuổi |
| src/content/annual-events.ts | Pool theo giai đoạn, nội dung tuổi 0–2 qua người chăm sóc |
| src/engine/academics.ts | Định nghĩa theo giai đoạn và bảo lưu thực sự chỉ dưới selector mới |
| src/content/academic-stages.ts | Nội dung riêng từng ngành/năm học |
| src/engine/invariants.ts | Annual coverage; giới hạn thời gian có điều kiện |
| src/persistence/saves.ts | Canonical replay, 512 actions/5 MiB không tăng toàn cục |
| src/engine/employment.ts | Cho annual-v1 kế thừa employment mà không đổi career-v1 |
| src/ui/NewLife.tsx | Chỉ đổi mặc định khi đầy đủ nội dung và gates |
| tests/annual-audit.test.ts | Tái hiện ba phát hiện trước sửa luật |
| tests/annual.test.ts | Tuổi hiển thị, ngân sách, gián đoạn, replay, tương thích |

Tham chiếu: selector education-v1/career-v1 và academic focus/resume hiện có. Phụ thuộc: story-flow, GameSession, save/cloud envelope, simulation, family/social queues. Golden frozen/wardrobe/social/family/dynamic/education/career giữ nguyên.

Rà rủi ro: API hành động cũ giữ nguyên; không SQL/Auth/RLS migration. Schema4 có thể giữ selector mới nếu canonical parser chấp nhận; không thêm trường authoritative khi suy được từ choices. Nút quản lý, focus và giới hạn 512 cần kiểm tra trước bật mặc định. Không tăng giới hạn toàn cục và không kết thúc đời để né giới hạn lưu.

## Thiết kế mốc tuổi

`annual-v1` chỉ cho đời mới. Một tuổi đã trải nghiệm khi `choices` chứa quyết định hợp lệ tại tuổi đó. Trước mỗi advance, nếu tuổi hiện tại chưa có quyết định thì chọn cảnh tại cùng tháng, không tick. Nếu đã có thì xử lý từng tháng tới sinh nhật kế tiếp hoặc interrupt đầu tiên. Focus hiện hữu phải giải quyết trước; focus mới có ưu tiên deterministic như hiện hành. Quyết định học tập/gia đình/công việc cũng là quyết định có ý nghĩa của tuổi đó. Không dùng log journal hoặc instance ID để đếm template đa dạng.

Tuổi 82 không phải điểm kết thúc của nhánh mới. Nhánh cũ vẫn có hồi ký tại82. Tuổi thọ mới phụ thuộc health; kế hoạch 500–1.000 năm cần định dạng lưu/replay phân đoạn và cloud review riêng, chưa thuộc checkpoint này.

## Kiểm chứng và bàn giao

Tái hiện audit: đang chạy test độc lập; chưa gọi PASS. Annual content, academic fix, E2E, 1.000 seed/replay, release và live QA mới: **NOT RUN**. Mặc định production chưa đổi. Không dùng kết quả191/66 cũ để chứng nhận mã mới.

## Checkpoint engine + học tập (local, chưa bật mặc định)

Đã tái hiện đủ3 lỗi bằng tests/annual-audit.test.ts. Selector annual-v1 suy mốc tuổi từ choices và chặn advance qua sinh nhật khi chưa quyết định; không thêm state trùng lặp, vẫn schema4/engine3/content3 và512actions/5MiB. Nội dung mới32 cảnh thường (12 chăm sóc tuổi0–2,20 trưởng thành/cộng đồng;19 ở file adult và1 ở file annual), cùng50 tình huống học tập được viết riêng theo năm/ngành. Tổng184 template tĩnh +50 academic stages; remediation là biến thể theo kết quả thật, không tính thành50 authored templates nữa.

1.000seed distinct/1.000canonical replay: **VERIFIED PASS**,0vi phạm,0fallback,0tuổi thiếu,0bước nhảy bỏ tuổi.122.721quyết định, tuổi kết thúc65–107, max420actions/629967bytes. Đây là policy stress, không phải phân bố tuổi thọ đời thực. Báo cáo yearly-simulation-1000.json. Mẫu trước sửa trần social81 có57fail/943complete và được giữ ở yearly-simulation-1000-failed-ceiling81.json, không tính PASS. Các mẫu30 lỗi resume trước6 tháng/thiếu pool sau82 được giữ riêng.

Fixture gia đình3con dùng hết120thao tác quản lý rồi sống đến122,405actions/652537bytes, canonical import PASS. Không nâng giới hạn lưu hoặc cố kết thúc đời để né giới hạn. UI hiện cần dự trữ thận trọng hơn84tuổi trước bật mặc định. Chưa chứng minh mọi tổ hợp4con + nhiều lần học lại/chuyển ngành + toàn bộ120quản lý cùng lúc; không tuyên bố hỗ trợ500/1000năm trong512actions. Hướng mở rộng: checkpoint state được ký theo ruleset + segment hash-chain, replay có giới hạn theo segment, schema/RPC/history/quota review riêng trước tăng sức chứa.

Mỗi ngành đã qua admission → các năm riêng → graduation/internship → canonical replay;50stage qua validator với5lựa chọn khác nhau. Bảo lưu mới không thêm paidTerms/attempt/results, không thu phí mới khi paused; tối thiểu6tháng rồi resume kỳ trả trước, kỳ tiếp thu đúng1lần. Rest vẫn ghi danh và có chi phí, nhãn phân biệt rõ. Old education/career labels và replays giữ nguyên vì chúng là lịch sử, đây là giới hạn tương thích được ghi rõ.

Diversity200same +200varied: annual có6authored opening templates tuổi0; first5=200/200 vàfirst10=200/200 ở mỗi nhóm,0fallback. Career baseline mở đầu tuổi3 nên không dùng tỷ lệ6/14 để tuyên bố cải thiện. Đo actual template IDs ở yearly-diversity-200.json; instance IDs academic không được tính thành authored stories.

verify local224tests trước thêm budget/golden; các tests mới sẽ chạy lại full gate. Browser đang QA: desktop/mobile0–82 và pause đã PASS; large-text20 còn lỗi first-choice bị clip2px, đang sửa khoảng cách mà không clamp narrative/HUD. Chưa gọi UI/production PASS. Real cloud CLI mới kiểm: **BLOCKED**, không authenticated/project proof, không productionwrites. Owner login **NOT RUN**. Audit production0/secret scan1179objects0findings tại thời điểm chạy; cần scan lại trước push.
