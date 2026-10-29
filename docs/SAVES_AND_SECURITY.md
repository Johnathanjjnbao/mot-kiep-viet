# Lưu game, tương thích và giới hạn an toàn

## Lưu trên máy

IndexedDB `mot-kiep-viet`, store `saves`: autosave riêng và `slot-1`, `slot-2`, `slot-3`. Autosave theo mỗi trạng thái mới; các lần ghi xếp hàng. Ba slot chỉ thay khi người chơi lưu vào đó; slot có dữ liệu cần thao tác “Thay bản lưu”. Nhập/tải slot sẽ thành cuộc đời hiện tại và được tự lưu. Bản cũ trong slot khác không bị sửa.

Dữ liệu gắn với trình duyệt và origin (giao thức, máy, cổng). `localhost` và `127.0.0.1`, cổng 5173 và 4173 có vùng lưu khác nhau. Xóa dữ liệu trình duyệt hoặc dùng cửa sổ riêng tư có thể mất tiến độ; xuất JSON để sao lưu. Không có đồng bộ đám mây hoặc bảo vệ xung đột nhiều tab. Không mở nhiều tab cùng chơi một bản tự lưu.

## Định dạng

Schema 2 gồm engine/content 1.0.0, savedAt ngoài mô phỏng và run đầy đủ. Run chứa seed, bối cảnh gốc, hai trạng thái RNG, action log, sự kiện đang chờ, lịch hệ quả, các thực thể và sổ tiền. Schema 1 nội bộ dùng `snapshot` thay `run`; có migration được test. Không có cam kết tương thích với định dạng chưa được hỗ trợ hay các bản thử trước khi gói nội dung hiện tại được chốt.

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
- Không backend, auth, khóa API, analytics, runtime AI hay yêu cầu mạng cho mô phỏng. Font được đóng gói cục bộ, tranh vector tự vẽ.
- Audit phụ thuộc và kiểm tra bản lưu sai định dạng, quá lớn, phiên bản lạ, chỉnh tiền, action không hợp lệ nằm trong test evidence.
- Chỉ hai liên kết tham khảo lịch sử được mở khi người chơi chọn đọc; dùng `rel=noreferrer` cho tab mới.

Đây là rà soát cục bộ ở mức MVP, không phải chứng nhận an toàn. Chưa có kiểm thử xâm nhập độc lập, quota của mọi trình duyệt, phục hồi khi máy mất điện giữa giao dịch, Safari/Firefox hay đồng thời nhiều tab.

## Nâng phiên bản và quay lại

Trước thay engine/content: xuất các save mẫu, giữ bản engine tương ứng, bổ sung migration có test hoặc báo không tương thích rõ ràng. Đừng đổi luật nhưng giữ nguyên version sau phát hành.

Mỗi mốc được giữ bằng commit cục bộ. Có thể tạo nhánh mới từ một commit đã kiểm chứng để so sánh; giữ công việc đang làm trước. Với nhánh đã chia sẻ sau này, dùng revert để bảo toàn lịch sử. Không cần xóa save, reset repository hay chạy clean để quay lại một phiên bản mã.
