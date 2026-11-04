# Lưu cuộc đời 500–1.000 năm — thiết kế tương lai, chưa triển khai

Phạm vi hiện tại vẫn là schema4,512actions,120thao tác chủ động và5MiB. Mốc160tuổi dùng để dự trữ chỗ cho câu chuyện trong đời assets-v1; đây không phải bảo đảm hỗ trợ160tuổi, trần tuổi engine hoặc cơ chế ép kết thúc. Không quảng cáo bản tài sản hiện tại hỗ trợ1.000năm.

## Định dạng cần version riêng

Đề xuất schema5 và selector ruleset mới, chỉ tạo cho đời mới. Một manifest UUID cuộc đời liên kết các segment bất biến, mỗi segment giữ khoảng tháng, phiên bản engine/content, hash segment trước, seed/RNG đầu, action log và hash trạng thái cuối. Mỗi segment tiếp tục có giới hạn hữu hạn; chuyển segment phải nguyên tử cùng autosave/CAS. Không tự đổi một save schema4 thành segment hoặc sửa golden lịch sử.

Một checkpoint được kiểm bằng cách phát lại từ checkpoint đã tin cậy trước đó. Hash tự khai từ tệp nhập không chứng minh tính đúng: nhập từ bên ngoài phải kiểm đủ chuỗi từ genesis hoặc từ checkpoint do bên có thẩm quyền ký/xác minh theo thiết kế được duyệt. Không chấp nhận snapshot cuối chỉ vì có checksum. Luật gắn với từng segment, không dùng engine mới để diễn giải lại segment cũ.

## Những gì cần giữ qua ranh giới

- Tiền mặt, tiết kiệm, tài sản hiện có và gốc từng khoản vay có đối ứng đầu/cuối rõ ràng; không tạo opening income giả.
- Lịch sự kiện, action đang chờ, focus/resume, RNG, cooldown, luật gia đình và chủ sở hữu giữ nguyên. Không cắt giữa giao dịch hoặc lựa chọn chưa giải quyết.
- Lịch sử mua/bán/sinh/tử/nghề và quan hệ nằm trong kho lưu trữ phân trang riêng. Tài sản đã bán không cần object hoạt động đầy đủ, nhưng chứng từ và hành động dẫn tới nó vẫn kiểm được.
- UUID đời độc lập seed; lịch sử hồi ký và slot không bị ghi đè khi tạo segment hay tạo đời khác.
- Đối soát tháng phải liên tục: không bỏ tuổi, tháng chi phí, kỳ vay, milestone con hoặc hàng đợi hệ quả để giảm dung lượng.

## Điều kiện trước khi triển khai

Cần thiết kế transaction IndexedDB, CAS hai tab, khôi phục khi mất điện, export/import toàn chuỗi và lưu đám mây có version. SQL/RLS mới phải được review và phê duyệt riêng; bản tài sản này không áp dụng migration. Cần benchmark weak CPU/mobile, giới hạn tổng byte, chống chuỗi giả/nhánh trùng/đứt hash,1.000năm phát lại so với tháng tham chiếu, boundary golden và kiểm bất biến tài chính qua từng segment. Thử nghiệm không được nâng cap hoặc cắt history của schema4.

Đây là backlog kỹ thuật cho mốc v0.4 Supernatural Longevity hiện có; chưa đổi tên hoặc đánh số lại mốc ấy.
