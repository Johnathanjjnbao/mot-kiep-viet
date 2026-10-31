# Thiết kế triển khai · Một Kiếp Việt

## Employment: career-v1

`career-v1` kế thừa University và tuổi thơ; education-v1/dynamic-v1/missing flag giữ nguyên. EmploymentState lưu hồ sơ tuyển dụng, khoảng thất nghiệp, thời điểm học kỹ năng và hỗ trợ việc tạm. CareerRecord chỉ ở đời mới có field/ending/contractEndMonth; dữ liệu cũ không tự thêm trường. Parser giữ schema4/tuple3 và enum action strict; canonical replay xác minh toàn bộ state, không migration.

`engine/employment.ts` sở hữu xác suất theo skill/knowledge/social/stress, ngành liên quan, kinh nghiệm trước đây, ảnh hưởng tính cách nhỏ và RNG event. Từ chối không trừ phí, không trả lương, không đóng công việc cũ; cùng nghề chờ6 tháng, hồ sơ có giới hạn. Chỉ được nhận mới đóng một record cũ và mở record mới. Câu chuyện nhắc lại nghề hiện tại giữ record/kinh nghiệm/hợp đồng; không tuyển lại hoặc trả thêm. Lương vẫn qua settleMonth mỗi tháng. Hợp đồng lao động tạm đóng sau đúng6 kỳ lương. Annual seeded layoffs dùng world RNG chỉ ở ruleset mới; một khoản hỗ trợ chuyển tiếp có khóa giao dịch theo record (tham số trò chơi, không phải quyền lợi pháp luật). Không có thêm tiền khi tự nghỉ/hết hợp đồng.

Khoảng thất nghiệp đóng khi có việc/học toàn thời gian/nghỉ hưu/kết thúc đời; định kỳ6 tháng có áp lực và cơ hội phục hồi, tính thêm resident minor dependents, không áp giới. Lớp20đSM qua ledger/cooldown chỉ tăng kỹ năng, không cấp bằng. Hỗ trợ việc tạm là đường phục hồi giả định có giới hạn40 lần/cách6 tháng; không phải bảo đảm tuyển dụng ở các nghề thông thường. Shared120 family management và save512 giữ nguyên. Advance dừng để trình bày cảnh tìm việc; bốn lựa chọn luôn có đường khả dụng. UI chỉ dispatch, chặn đổi việc khi academic/social/family focus đang chờ. Academic transition đồng bộ khoảng thất nghiệp; không tính sinh viên toàn thời gian là thất nghiệp, không đồng thời học/làm toàn thời gian. Golden C3510531914 độc lập. Diagnostic budget riêng C dùng512 để bao quát thêm cảnh hằng năm; không đổi ngân sách replay/save hoặc simulator cũ.

Mức thu nhập của farm/freelance/shop vẫn là mô hình nghề có sẵn; chưa có business capital/revenue/profit mới. PGlite chỉ kiểm envelope, không thay Auth/JWT/RLS thật.

## Dynamic Life và University, luật đời mới

`RunSetup.lifeRules` bất biến: vắng mặt giữ selector và học tập cũ; `dynamic-v1` thêm nội dung tuổi thơ và trọng số chống lặp; `education-v1` kế thừa tuổi thơ và dùng hồ sơ đại học riêng. Strict setup/action parsing cùng canonical replay không cho gắn luật mới lên đời đang chơi. Engine/content 3.0.0, save schema 4, frozen v1/v2 và các golden độc lập không đổi. Không tự migration; ID database, UUID cuộc đời, autosave, ba ô lưu và history độc lập giữ nguyên.

`content/programs.ts` chứa 12 chương trình và 12 tình huống đánh giá riêng; `domain/academics.ts` ghi hồ sơ, quá trình học, kết quả từng năm và văn bằng. `engine/academics.ts` sở hữu tuyển sinh, tiến độ và ledger. Tuyển sinh dùng RNG event đã lưu, từ chối không thu học phí, chờ 6 tháng cho cùng ngành. Mỗi năm có khóa giao dịch học phí/học bổng/hỗ trợ riêng; bảo lưu rồi trở lại không thu lại kỳ đã đóng. Chỉ số, độ khó, phương pháp và RNG quyết định đạt năm; dự án có thể ghi thực tập, làm thêm có thu nhập riêng, nghỉ phục hồi lùi tiến độ. Đủ năm đạt mới cấp bằng; hết ngân sách học lại khép chương trình không có bằng.

Academic focus giữ/resume sự kiện, không lồng social/family; advance dừng ở kỳ đánh giá. UI chỉ dispatch hành động với expected sequence, không sửa GameRun. Shared120 quản lý của family bao gồm academic; 40 thao tác học tập, 24 hồ sơ và 12 quá trình giới hạn dung lượng. Invariants đối chiếu tiến độ, số lần đóng học phí, văn bằng, focus và không đồng thời học/làm toàn thời gian. SQL003 nhận envelope cùng tuple trong test PGlite; đây không phải bằng chứng Auth/JWT/RLS thật. Giá đSM, niên đại mở chương trình và điểm tuyển sinh là tham số mô phỏng, không cam kết của trường thật; bằng sức khỏe/luật không tự cấp giấy phép hành nghề.

## Creator opt-in v0.3.6-creator.1

`RunSetup.playerTraits?: PlayerPersonality[]` là cấu hình bất biến, chỉ tồn tại khi người chơi chọn1–3 tính cách tương thích cho một đời mới. Bỏ chọn hết bỏ trường này; engine giữ lượt gieo mặc định và semantics cũ khi trường vắng mặt. Không tự thêm trường vào save cũ. Engine/content3.0.0/schema4 và expansion wardrobe/social/family giữ nguyên; frozen v1/v2 không sửa. Đây là opt-in khởi tạo Creator, không phải bật ruleset đại học/nghề mới.

Creator dùng foundation `application/creatorRandom.ts`, namespace theo seed/subject/counter; tham số retained giữ từng tính cách đã khóa, RNG giao diện không tiêu thụ RNG engine. UI chỉ lưu draft RunSetup và gọi createRun/onStart. Counter/lock không authoritative, không cần lưu vào GameRun. Preview dựng đúng seed/setup như start. Cha/mẹ không có thông tin bị ẩn và xóa draft/lock; nonresident vẫn được hiển thị đúng, không trở thành caregiver.

Engine vẫn tiêu thụ lượt personality lịch sử rồi mới áp override. Hay tò mò +5knowledge, Khéo tay +7skill, Dễ gần +8social như trước; riêng đời opt-in, Kiên trì −2stress, Ưa yên tĩnh +3mood, Thích giúp đỡ +3social. Tác động giới hạn ở chỉ số khởi đầu và những luật hiện có đọc chúng; không bảo đảm kết quả học tập/xin việc, không phạt tính cách yên tĩnh. Validator từ chối rỗng/trùng/tổ hợp mâu thuẫn; invariants và canonical replay kiểm tra traits đúng setup. Không action mới, không giao dịch mới, không thay lịch sử/ID database/slots/cloud/CAS/RLS. SQL003 hiện nhận cùng envelope; test PGlite đã kiểm payload setup mới. Auth/JWT live mới BLOCKED do CLI thiếu login, không dùng kết quả PGlite thay thế.

v0.3.3: domain/engine/content3/schema4, setup.expansion=wardrobe. Legacy/v2 giữ nguyên engine/content/parser/summary/simulation để save3 vẫn chơi đúng luật cũ. Wardrobe qua dispatch/ownership/age/expected/ledger; UI thử đồ chỉ trình bày. Fashion5scene dùng context capped -4..5. Giữ golden trước thêm ruleset.

## Life Expansion: lớp trình bày v0.3.2

`ui/appearance.ts` là hàm thuần hash seed có namespace, tách identity (màu da/tóc, preset mặt/vóc dáng) khỏi tuổi và biểu cảm. `Avatar.tsx` vẽ SVG lớp body/top/bottom/head/face/hair; biologicalAge tùy chọn để không buộc rendering vào tuổi lịch về sau. Không tiêu thụ RNG engine, không ghi thêm save field. Creator tạo seed UI trước preview và gửi lại đúng seed ấy. HUD responsive dùng cùng artwork với crop portrait. Xem [LIFE_EXPANSION](LIFE_EXPANSION.md) cho version plan và bằng chứng từng mốc.


Beta v0.3, React + TypeScript strict + Vite, GitHub Pages công khai. Guest lưu trên máy; tài khoản được mời dùng Supabase Auth/PostgreSQL qua cache/outbox riêng. Xem CLOUD_ARCHITECTURE.md. Phát triển tiếp từ bản v0.1 đã phát hành; không thay ứng dụng. Node 24.20.0, npm 11.19.0, Git 2.55.0 trên Windows; dependencies khóa trong package-lock.json.

## Trách nhiệm và quyền sở hữu

- `src/domain/model.ts`: GameRun sở hữu Player, WorldState, Household, NPC/Relationship, EducationRecord, CareerRecord, FinancialAccount, Transaction, Asset/Liability, HealthState, EventInstance, ChoiceRecord, ScheduledEffect, LifeJournal. Dữ liệu thuần JSON, không Date/function/class.
- `src/engine`: chỉ các hành động createRun, advance, choose, manage mới tạo trạng thái mới; UI không sửa luật. RNG Mulberry32 dùng số nguyên 32 bit, hai luồng world/event. Seed + scenario + phiên bản + danh sách hành động tái dựng được run.
- `src/content`: Region, Era, CareerDefinition, EventDefinition và StoryArc; điều kiện được xét trước khi chọn bằng trọng số. Không thực thi mã từ save.
- `src/application`: điều phối phiên chơi và hàng đợi lưu.
- `src/persistence`: IndexedDB (autosave độc lập + 3 slot), schema và kiểm chứng bằng replay. Mỗi slot chỉ ghi khi người chơi chọn lưu; không tự thay thế slot.
- `src/ui`: các màn hình, trình bày kết quả; setting về chữ và chuyển động chỉ thuộc UI.
- `tests`, `scripts`: unit, tích hợp, replay, đối soát sổ cái, mô phỏng 1.000 seed và trình duyệt.

## Lịch và sự kiện

Tháng 0 là thời điểm chào đời (0 tuổi). Tuổi = floor(month/12), năm = birthYear + tuổi. Mỗi bước đi tới mốc tuổi; trong khoảng đó xử lý từng tháng theo thứ tự: cập nhật thế giới/NPC → sổ cái → lão hóa → hiệu ứng đến hạn → kết thúc nếu cần. Nhân vật dừng ở tuổi 82 bằng hồi ký nếu chưa mất. Chọn xong hiển thị kết quả; nút tiếp tục mới đi đến mốc kế. Không có tháng rỗng cần click. Sự kiện chỉ đang chờ một lần, lựa chọn sai/hành động khi đã kết thúc bị từ chối. DelayedEffect có ID ổn định, đánh dấu thực hiện; không chạy lại sau tải.

## Kinh tế thiết kế

Đơn vị `đSM` = đồng sức mua trong game, không phải VNĐ, số liệu lương/giá thực. Một năm sinh hoạt cơ bản tương đương khoảng 120–200 đSM. Era thay đổi hệ số thiết kế. Ghi sổ theo tháng, mọi thay đổi tiền mặt/tiết kiệm/nợ/tài sản qua transaction có ID duy nhất. Thu nhập nghề, trợ cấp gia đình khi còn nhỏ, lương hưu thiết kế, chi phí sinh hoạt, lãi vay và tiết kiệm đều có nguồn/nhãn. Chi phí bắt buộc thiếu tiền tạo khoản vay sinh hoạt có sổ cái; chi tùy chọn bị chặn nếu không đủ tiền. Vay chủ động tối đa 300 đSM, lãi vay 0,4%/tháng; lãi tiết kiệm 0,15%/tháng. Trả nợ không vượt số dư nợ/tiền. Tài sản nhà ở tạo bút toán mua, giảm phí thuê; không tự sinh tài sản.

## Đời sống

NPC có ID cố định và birthYear, alive. Quan hệ tham chiếu NPC, tối đa một partner, ex chỉ hình thành sau chia tay, không có con trước tuổi trưởng thành. Cha mẹ già và qua đời theo ngưỡng thiết kế; sức mạnh quan hệ ảnh hưởng áp lực. Giáo dục, kỹ năng, era, tuổi ảnh hưởng điều kiện nghề; thu nhập gắn kinh nghiệm/kỹ năng/stress. Thất nghiệp không nhận lương. Sức khỏe chịu ảnh hưởng tuổi, nợ, stress, thói quen; không dùng như dự đoán y khoa.

## Lưu và tương thích

Beta 0.2.0 dùng engine/content 2.0.0, schema 3; giới hạn save 5 MiB. `creator.ts` kiểm tra tên/năm 1975–2026/vùng/địa danh/môi trường/kinh tế/gia đình/tính cách. Địa danh tự nhập chỉ là nhãn, không tạo thống kê địa phương. Setup được chuẩn hóa theo thứ tự cố định; lượt RNG mặc định vẫn tiêu thụ khi có override để replay giống khởi tạo.

`src/legacy/v1` đóng băng engine/content 1.0.0 và parser cũ. Schema 1/2 được kiểm chứng bằng luật cũ, mở ở màn chỉ đọc: nhật ký, tài chính, export; không chọn/tiến thời gian bằng v2. Không di trú một cuộc đời cũ thành kết quả mới. Ba ô lưu gốc giữ nguyên. Golden v1/v2 độc lập.

`mot-kiep-viet-history` v1/store `lives` tách khỏi `mot-kiep-viet`/`saves`. UUID theo phiên đời nằm trong envelope save, ngoài mô phỏng. Tự lưu khi ended, transaction add-only: cùng ID/nội dung bỏ qua, khác nội dung từ chối. Tối đa 50 bản/import 20 MiB. Xem [SAVES_AND_SECURITY.md](SAVES_AND_SECURITY.md).

NPC v2 có presence resident/nonresident/unknown/deceased; unknown dùng alive=null, không quan hệ hay thông báo mất. Cha/mẹ không cùng nhà còn sống không bị coi là đã mất. Tính cách tác động hằng năm cho cha/mẹ cùng chăm sóc còn sống. Sự kiện phải còn ít nhất 4 lựa chọn hợp lệ, nếu không sẽ không được chọn. Lựa chọn bổ sung viết riêng trong `choice-expansion.ts`; fallback có 4 cách xử sự cố định.

## Giới hạn chủ ý

Không mô phỏng chính xác dân số/kinh tế Việt Nam, không AI runtime, multiplayer, y khoa, thị trường thật hay lịch sử tương lai. Ba bối cảnh là hư cấu có chủ đích, không đại diện toàn vùng. Địa danh dùng vùng rộng tránh giả định tên tỉnh qua các lần thay đổi. Mốc Đổi Mới và COVID có nguồn; nghề, công nghệ, biến cố cá nhân đều là xấp xỉ thiết kế được gắn metadata. Không có playtest con người xác nhận thời lượng 15–25 phút.
