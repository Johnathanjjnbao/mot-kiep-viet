# Lưu game, tương thích và giới hạn an toàn

M4 live continuation:26real Auth/cloud groups VERIFIED PASS, including complex child/career/recorded-parent snapshot in an independent mobile context and completed-life history across browsers. Migrations001/002/003 unchanged, no production SQL/Auth changes. Existing owner personal login NOT RUN; see LIFE_EXPANSION for actual attempts, CI and limitations.

Life Expansion M4: engine/content3/schema4 retains immutable wardrobe/social/family rulesets and frozen v1/v2 routes. FamilyAction and per-child state are canonical-replayed; recorded parents never follow a changed spouse. Migrations001/002/003 already approved/applied, no production SQL in this continuation. Real A/B/anon and complex-family cloud26groups PASS locally; live pending. This is private-save isolation/integrity, not server anti-cheat against editing one's own JSON. Owner personal login stays NOT RUN.

Schema4/engine-content3: WardrobeAction có expected-sequence, inventory/equipment/outfits/memories được replay+canonical. Schema3 route frozen2 vẫn chơi tiếp, v1 chỉ đọc. Không đổi ID IndexedDB/UUID/CAS/archives. SQL003 mở tuple có phê duyệt; xem LIFE_EXPANSION.

v0.3 đã nối repository guest/account vào UI/session. Cache account theo project + UUID, giữ database guest gốc; Auth/RLS và hai browser context thật đã kiểm tra. Dùng tài khoản Email/Password được tạo thủ công; SMTP/invitation ngoài phạm vi, bước chủ dự án tự đăng nhập live NOT RUN. Hai migration production đã được review/phê duyệt riêng. Không service-role trong frontend. Xem CLOUD_ARCHITECTURE, V03_REPORT và SUPABASE_SETUP.

## Lưu trên máy

IndexedDB `mot-kiep-viet`, store `saves`: autosave riêng và `slot-1`, `slot-2`, `slot-3`. Autosave theo mỗi trạng thái mới; các lần ghi xếp hàng. Ba slot chỉ thay khi người chơi lưu vào đó; slot có dữ liệu cần thao tác “Thay bản lưu”. Nhập/tải slot sẽ thành cuộc đời hiện tại và được tự lưu. Bản cũ trong slot khác không bị sửa.

Dữ liệu gắn với trình duyệt và origin (giao thức, máy, cổng). `localhost` và `127.0.0.1`, cổng 5173 và 4173 có vùng lưu khác nhau. Xóa dữ liệu trình duyệt hoặc dùng cửa sổ riêng tư có thể mất tiến độ; xuất JSON để sao lưu. Guest không đồng bộ đám mây hay chống xung đột nhiều tab. Account dùng CAS/recovery theo CLOUD_ARCHITECTURE; không ghép action log.

## Định dạng

Beta 0.2.0: schema 3, engine/content 2.0.0, savedAt và identity UUID ở envelope ngoài mô phỏng. Run chứa seed, cấu hình đã chuẩn hóa (tên, năm/vùng/nhãn nơi sinh, môi trường, kinh tế, gia đình, tính cách), hai RNG, action log, sự kiện đang chờ, lịch hệ quả, thực thể và sổ tiền. UUID không tham gia replay, không suy từ seed: hai lần chơi cùng seed vẫn là hai cuộc đời. Tải slot/import giữ UUID đã có.

Schema 1/2, engine/content 1.0.0 được gửi tới parser và luật đóng băng ở `src/legacy/v1`; schema 1 đổi envelope snapshot thành run theo migration cũ. Bản hợp lệ mở **chỉ đọc** cùng nhật ký/tài chính/export, không tiếp tục bằng luật v2. Bản đã kết thúc có thể lưu vào lịch sử mới với hồi ký v1. Không tự xóa hay đổi nội dung ba slot. Phiên bản khác bị từ chối rõ ràng; không cam kết bản thử chưa phát hành.

Nhập tệp theo thứ tự:

1. Giới hạn 5 MiB trước khi đọc tệp; parse JSON trong xử lý lỗi.
2. Zod kiểm tra envelope, version, seed tối đa 100 ký tự, bối cảnh, action enum/ID và tối đa 512 hành động.
3. Engine dựng lại toàn bộ từ seed và hành động hợp lệ; kiểm tra invariants.
4. So sánh trạng thái tái dựng với trạng thái trong tệp theo thứ tự khóa chuẩn hóa; từ chối mọi sai lệch, trường thiếu/thừa hay thay số tiền.
5. Chỉ dùng trạng thái do engine vừa tạo. Không thực thi code, effect, HTML hay template từ tệp nhập.

Giới hạn thao tác quản lý 400/life để luôn nằm trong ngưỡng replay; các lựa chọn cốt truyện vẫn tiếp tục đến kết thúc. Tổng mốc đời hiện tại có tối đa 37 lần tiến và 36 lần quyết định sự kiện.

## Kiểm tra bảo mật cơ bản đã thực hiện

- Không `eval`, `dangerouslySetInnerHTML`, ghi `innerHTML` hay tải nội dung từ tệp nhập thành chương trình. React hiển thị tên/seed/văn bản như text.
- Thẻ SVG sinh bởi mẫu cố định, escape `& < > " '` cho dữ liệu người dùng. Chỉ tải xuống khi được bấm; không chia sẻ dữ liệu ra dịch vụ khác.
- Engine/guest không cần mạng sau khi app đã tải. Account có Auth/Supabase với publishable key công khai; không có privileged key/SMTP secret trong bundle, analytics hay runtime AI. Font đóng gói cục bộ.
- Audit phụ thuộc và kiểm tra bản lưu sai định dạng, quá lớn, phiên bản lạ, chỉnh tiền, action không hợp lệ nằm trong test evidence.
- Chỉ hai liên kết tham khảo lịch sử được mở khi người chơi chọn đọc; dùng `rel=noreferrer` cho tab mới.

Đây là rà soát cục bộ ở mức MVP, không phải chứng nhận an toàn. Chưa có kiểm thử xâm nhập độc lập, quota của mọi trình duyệt, phục hồi khi máy mất điện giữa giao dịch, Safari/Firefox hay đồng thời nhiều tab.

## Nâng phiên bản và quay lại

Golden v1 golden-1995 giữ fingerprint 2525264403. Golden v2 golden-v02 là 4148875142 (luật/gói 2.0.0), không thay golden cũ. Khác biệt có chủ đích: setup mở rộng, RNG tiêu thụ mặc định nhất quán khi override, gia đình/tính cách, trợ cấp, chi phí đô thị và nhánh lựa chọn. Trong phát triển trước phát hành đã sửa thứ tự khóa setup khi tính ID; replay của setup nhập một phần và setup chuẩn hóa nay khớp nhau.

## Lịch sử hoàn tất

Database riêng `mot-kiep-viet-history` version 1, store lives, key UUID. Record gồm thời điểm lưu, snapshot có version và hồi ký nguyên bản. Khi ended, hàng đợi autosave ghi trước, rồi thêm lịch sử bằng transaction. Cùng UUID/nội dung bỏ qua, giữ timestamp gốc; cùng UUID/nội dung khác từ chối. Không update bản cũ. Bắt đầu kiếp khác không chạm store này. Reload/resume giữ identity từ envelope nên không nhân đôi kiếp v0.2.

Định dạng export mot-kiep-viet-history, version 1. Xuất một/tất cả, import tối đa 20 MiB và 50 record; kiểm tra schema, UUID, thời điểm, save replay, ended và memoir khớp trước giao dịch. Trùng ID trong tệp bị từ chối. Xung đột/quá 50 bản hủy toàn bộ transaction, giữ bản cũ. Trùng bản đã có thì bỏ qua. UUID là định danh, không phải thông tin xác thực.

Lỗi quota/bộ nhớ được báo, cho xuất save/thử lại; không tự xóa lịch sử. Giới hạn 50 chưa có tăng dung lượng/phân trang. Lịch sử theo origin/trình duyệt, không tự đồng bộ hay chống người có DevTools sửa tại máy. Đọc danh sách có replay nên chậm hơn khi nhiều đời. [Tài khoản cloud v0.3](CLOUD_ARCHITECTURE.md) có cache/outbox và phân trang riêng; bước chủ dự án tự đăng nhập được theo dõi riêng.

Trước thay engine/content: xuất các save mẫu, giữ bản engine tương ứng, bổ sung migration có test hoặc báo không tương thích rõ ràng. Đừng đổi luật nhưng giữ nguyên version sau phát hành.

Mỗi mốc được giữ bằng commit cục bộ. Có thể tạo nhánh mới từ một commit đã kiểm chứng để so sánh; giữ công việc đang làm trước. Với nhánh đã chia sẻ sau này, dùng revert để bảo toàn lịch sử. Không cần xóa save, reset repository hay chạy clean để quay lại một phiên bản mã.
