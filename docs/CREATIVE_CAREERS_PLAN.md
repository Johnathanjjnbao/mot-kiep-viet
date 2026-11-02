# Phần F — thiết kế để tiếp tục sau release realism

Trạng thái: PAUSED theo yêu cầu chủ dự án; F1/F2/F4/F3 đã triển khai cục bộ, chưa phát hành. Tiến trình và điểm tiếp tục chính xác ở CREATIVE_CAREERS_PROGRESS.md; phần bên dưới giữ thiết kế gốc và lịch sử review. Thứ tự: freelancer → gaming streamer độc lập → collaboration → idol/biểu diễn. Không dùng niche gaming/performance hiện có để gọi phần F hoàn thành.

## Ranh giới tương thích

Dự kiến selector mới `creative-v1` kế thừa realism-v1 qua capability predicates; giữ nguyên16 golden hiện có và mọi đời đã sinh. Không nâng tự động một đời realism thành creative. Giữ engine/content3.0.0/schema4 theo selector canonical, không SQL/Auth/RLS mới. Chỉ đổi mặc định khi đường sinh→trưởng thành và đời dài mới ổn định.

Context đã có: domain/model.ts và creator.ts định nghĩa setup/actions; rules.ts giữ capability và đếm120 discretionary; engine.ts có createRun/tick/dispatch/eventEligible/activeDefinition; finance.ts là nguồn transact; business/creator-economy là mẫu sổ thật, strict CAS và chống thu nhập abstraction trùng. persistence/saves.ts là Zod actions + canonical replay. LifeScreens/Panels/EnterprisePanel/CreatorEconomyPanel là UI đọc run và dispatch. Cần gọi graft callers tại đúng entrypoint trước sửa, không chạm frozen.

Tệp mới dự kiến: domain/creative-careers.ts, engine/creative-careers.ts, content/creative-events.ts, ui/CreativeCareersPanel.tsx; nối capability, save schema action, invariant, lịch tháng và regression/fixtures. Chủ dự án không cần thao tác tài khoản nền tảng thật.

## Giữ ngân sách thao tác

Batch realism trước fallback đo max462/512, còn50 thao tác; batch cuối sau fallback phải xác minh lại. Không lấy số dư mẫu này làm quyền tăng cap.

Các lifecycle quản lý dự án là actions optional có CAS, cùng ngân sách120 đang có. Tiến độ, chi phí, deadline, xét và trả tiền quyết toán tự động theo tick tháng; không yêu cầu click từng tháng. Các cảnh nghề mới thay cảnh thường ở một tuổi đang hiển thị, không tạo một lớp focus/advance bắt buộc khác. Như vậy không thêm nghĩa vụ choose/advance ngoài lịch năm. Family/social/academic focus và resume hiện tại giữ nguyên.

Dự kiến vẫn có4 hồ sơ hoạt động suốt đời dùng chung shop/channel/hợp đồng/đường biểu diễn, gồm hồ sơ đã khép. Bắt đầu hoạt động mới phải kiểm cap ở mọi lối vào; không chỉ ẩn nút UI. Một hợp đồng đang hoạt động tại một thời điểm, một lần sửa lại, terminal settlement duy nhất. Đây là giới hạn thiết kế cần được ghi rõ trong UI theo cơ hội chi tiết, không giả định đã mô phỏng vô hạn khách hàng.

## Freelancer trước

Sáu dịch vụ: lập trình, thiết kế đồ họa, dịch thuật, viết nội dung, marketing, hỗ trợ kỹ thuật. Điều kiện và xác suất nhận dùng kỹ năng, tri thức, qualifications, kinh nghiệm và uy tín thật; có era gates. Giá/phí là sức mua thiết kế, không quảng cáo tỷ lệ thành công hoặc giá ngoài đời.

Một hồ sơ có inquiry → negotiation → acceptance/rejection → execution → ready/delivery → review → payment hoặc rework/failure → closure. Thời gian theo đợt dự án đủ để người chơi xử lý ở lịch năm; công việc và phí vẫn ghi từng tháng trong sổ, không bắt click tháng. Không đủ quỹ thì dừng hoặc thất bại có lý do; không tự vay cho hoạt động tùy chọn. Tiền chỉ qua transact, mỗi khoản payout có ID duy nhất. Tách fee/cost/profit/paid, dùng quyền sở hữu đúng. Chặn lương freelance abstraction trong selector mới; job thực khác có thể cùng tồn tại với áp lực và chất lượng bị ảnh hưởng.

UI cần playable inquiry/đề nghị/nhận hoặc từ chối/giao/sửa/đóng, hồ sơ và sổ chi phí, kết quả review không chắc thắng, save/reload/export/import/canonical. Ít nhất một vòng thắng, một vòng bị từ chối và một vòng lỗ/sửa trong browser. Cảnh riêng theo dịch vụ và thất bại có4 lựa chọn hợp lệ.

## Các lát cắt sau

Gaming career tham chiếu một kênh creator hiện có, thêm luyện kỹ năng/quality/community/retention/competition/growth và setback; không thêm bộ follower hoặc payout nền tảng trùng. Collaboration dựa compatibility/reputation/overlap/skills/điều kiện hợp đồng, có chi phí, kết quả âm/zero/dương và tăng audience có trần. Idol/biểu diễn có đào tạo/audition/từ chối/offer/show/fans/reputation/burnout/nghỉ và trở lại; fame không chắc chắn. Mỗi đường dùng ledger thật, lịch năm và ngân sách chung.

### Context map F3, đã tự review trước triển khai

| Tệp | Vai trò và thay đổi |
| --- | --- |
| `domain/artistic.ts`, `engine/artistic.ts` mới | Hồ sơ âm nhạc/vũ đạo/diễn xuất, strict actions/CAS, luyện tập, tối đa4 audition, hợp đồng agency36 tháng hoặc tự do, show tự quyết toán, nghỉ/comeback một lần, invariant |
| `domain/creative-careers.ts`, `domain/model.ts`, `domain/rules.ts` | Một hồ sơ biểu diễn bất biến trong creative; tính một lifetime book dù đã nghỉ; action/effect riêng |
| `content/artistic-events.ts`, `content/events.ts`, `content/validation.ts` | Cảnh v15 tuổi18+, không ghi tiền trực tiếp; dùng lịch năm thay cảnh thường |
| `engine/engine.ts`, `engine/invariants.ts`, `persistence/saves.ts` | Init rỗng, một clock tháng, dispatch/rebase chính cảnh biểu diễn, life-end closure, canonical strict |
| `ui/ArtisticPanel.tsx`, `ui/Panels.tsx`, `styles.css` | Chọn chuyên môn, luyện, audition/nhận hoặc từ chối, làm tự do, phí/gross/agency/net tách rõ, nghỉ/comeback, luôn đọc run/dispatch |
| `scripts/artistic-fixture.ts`, `tests/artistic.test.ts`, `scripts/qa-artistic.ts` | Lịch sử thật qua reject/offer/show lỗ/thành công/burnout/comeback, save roundtrip và browser |

Mẫu tham chiếu: freelance và creator hiện có. Phụ thuộc: `detailedBooks` có callers trong business/creator/freelance và ba panel; mọi đường phải dùng cùng trần4. Gaming/collab không chiếm thêm book vì là nội dung trong một kênh. Agency lấy phần chia từ phí show, chỉ khoản net thực nhận vào ví; chưa nhận offer không có fans/tiền show. Fans biểu diễn là một cộng đồng khác, không sao chép audience kênh hoặc tự trả thêm platform income. Show có invoice duy nhất và giữ12 báo cáo gần nhất; toàn bộ ledger/replay giữ nguyên. Nghỉ nghề không xóa hồ sơ, không bị ép ở65 tuổi; trở lại một lần bằng quỹ thật, trở lại luyện rồi phải nhận hướng làm hợp lệ. Native focus không lồng social/family/academic. Tự review rủi ro: cần gate book ở domain/engine/UI, không SQL/config mới, giới hạn512/120/5MiB không đổi,16 golden lịch sử không đổi. Chưa nhận test hoặc release PASS cho F3.

## Gates trước release F

16 golden cũ không đổi; golden mới riêng; strict forged/stale/duplicate/negative tests; full lifecycle và closure/death. Forced family3 con +university +job/shop/channel +freelance/biểu diễn,120 optional và100+; không ép chết/nghỉ hưu.1000 đời mới +1000 replay sau authoritative engine/content cuối, đo actions/bytes/postings/time/memory. Verify, build Pages, production smoke, E2E/sáu viewport, sáu browser, audit/secret scan, commit/push main, exact CI/deploy và G5 live. Nếu không thể giữ512/5MiB thì giữ release A–D an toàn và đưa thiết kế scaling ra review; không tăng512, cắt log hay đổi replay cũ.
