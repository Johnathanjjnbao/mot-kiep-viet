# Bộ luật v2 giữ nguyên

Nguồn commit403509669f237d410f40c6027bd80a030b0da39d: engine/content2, schema3. Không sửa luật/model/content/RNG ở đây. Hai import parser/summary đổi đường dẫn đến frozen v1. Diagnostics khóa golden4148875142.

Schema3 vẫn chơi qua adapter hiện hành, không tự nhận inventory/quan hệ mới. Chỉ dùng parser/engine/summary; không dùng các hàm IndexedDB bản copy để tạo database khác. v1 vẫn chỉ đọc.
