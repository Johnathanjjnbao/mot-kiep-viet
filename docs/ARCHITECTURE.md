# Thiết kế triển khai · Một Kiếp Việt

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
