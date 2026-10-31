# Nghiên cứu nghĩa vụ quân sự — NOT READY

Đối chiếu nguồn chính thức ngày01/11/2026 để chuẩn bị thiết kế game. Chưa có luật quân sự mới nào được bật trong engine/content; không gắn điều kiện hiện hành lên mọi cuộc đời từ1975. Các dòng dưới phân biệt bản gốc, chuỗi sửa đổi và phần chưa kiểm chứng, không phải bảng eligibility đang áp dụng.

## Mốc đã tìm được và khoảng trống

| Mốc | Bằng chứng đọc được | Trạng thái cho triển khai |
| --- | --- | --- |
| 1975–trước luật1981 | Chưa xác minh đủ văn bản và phạm vi áp dụng sau1975. | NOT READY; không tự suy từ các mốc sau. |
| Luật1981 gốc | CSDL ghi hiệu lực10/01/1982. Điều12: nam18–27; Điều14: thời hạn thông thường3 năm, có nhóm2/4 năm. Điều29 tách hoãn do sức khỏe/học tập; Điều32/36 nói xuất ngũ và ổn định đời sống. [Bản gốc trên CSDL quốc gia](https://vbpl.vn/TW/Pages/vbpq-toanvan.aspx?ItemID=3871). | Đã đọc bản gốc; chưa được coi là quy tắc cho toàn bộ1982–2015. |
| Sửa đổi1990/1994 | Điều61 của luật2015 xác nhận chuỗi luật này. [Công báo luật2015, Điều61](https://vbpl.vn/FileData/TW/Lists/vbpq/Attachments/70817/VanBanGoc_78.2015.QH13.pdf). | Chưa đối chiếu từng thay đổi và ranh giới hiệu lực. |
| Sửa đổi2005 | Tìm được43/2005/QH11 và tệp gốcRTF. Công cụ đọc RTF thất bại, nên chưa lấy số tuổi/thời hạn từ tài liệu này. [Hồ sơ Chính phủ](https://vanban.chinhphu.vn/default.aspx?docid=14764&pageid=27160). | NOT READY; không đoán nội dung từ tên văn bản. |
| Luật2015 gốc | Điều30:18–25, trường hợp đã hoãn do đào tạo cao đẳng/đại học đến27; Điều21 thời bình24 tháng. Điều41 có hoãn vì sức khỏe/học tập với điều kiện, khác miễn; Điều43/50 có xuất ngũ, bảo lưu học tập và tiếp nhận việc làm theo từng trường hợp. Điều61 hiệu lực01/01/2016. [Bản Công báo, Điều21/30/41/43/50/61](https://vbpl.vn/FileData/TW/Lists/vbpq/Attachments/70817/VanBanGoc_78.2015.QH13.pdf). | Đã đọc bản gốc; chưa xác nhận đây là bản hợp nhất đến2026. |
| Sửa đổi2025 và các văn bản thực hiện | Hồ sơ98/2025/QH15 ghi hiệu lực01/07/2025. [Nguồn Chính phủ](https://vanban.chinhphu.vn/?docid=214587&pageid=27160&typegroupid=3). CSDL cũng có bản hợp nhất36/VBHN-BQP của quy định tuyển chọn, gồm148/2018 và68/2025. [Nguồn Bộ Quốc phòng/CSDL](https://vbpl.vn/TW/Pages/vbpq-thuoctinh-hopnhat.aspx?ItemID=181030&dvid=13). | Cần đọc đầy đủ sửa đổi, tiêu chuẩn sức khỏe và kiểm tra cập nhật đến2026; chưa có bảng điều kiện hiện hành hoàn chỉnh. |

## Hệ quả thiết kế và phần còn lại

Suy luận thiết kế: hai bản gốc đã đọc có tuổi và thời hạn khác nhau, vì vậy cần bảng luật theo thời điểm hiệu lực, không chỉ theo năm sinh. Phải phân biệt đăng ký, gọi nhập ngũ, hoãn, miễn, phục vụ, xuất ngũ và dự bị. Không đồng nhất tốt nghiệp với hết điều kiện hoãn; cần ghi căn cứ và diễn biến học tập đúng giai đoạn.

Trước khi triển khai còn cần:

- Đọc đầy đủ chuỗi trước1982, các sửa đổi1990/1994/2005 và bản hợp nhất/sửa đổi sau2015; kiểm cả văn bản thực hiện tại các ranh giới hiệu lực.
- Xác minh riêng tình trạng sức khỏe và thẩm quyền đánh giá; không tự chuyển chỉ số Health0–100 thành kết luận y khoa hay đủ điều kiện nhập ngũ.
- Mô hình hóa thông tin eligibility rõ ràng, không suy từ tên/avatar. Xác định cách biểu diễn nghĩa vụ, trường hợp tự nguyện và bối cảnh từng thời kỳ trước khi viết luật.
- Review vòng học tập/bảo lưu, dừng–trở lại việc làm, chăm sóc người phụ thuộc, ledger phụ cấp và hồi ký sau phục vụ. Không coi mọi người trở về đều tự động có cùng một công việc hoặc khoản tiền.
- Chọn selector bất biến mới, giữ nguyên career-v1 và các save cũ; cần tests tại biên tuổi/hiệu lực, các đường đủ/không đủ điều kiện, hoãn/miễn và replay trước khi bật.

Việc chưa đủ nguồn không chặn phát hành Education/Employment. Quân sự giữ **NOT READY**; tài liệu này chỉ chuẩn bị cho review tiếp theo.
