# Kiểm tra trước công khai · 30/10/2026

| Mức                            | Số phát hiện đã xác minh |
| ------------------------------ | ------------------------ |
| Critical / High / Medium / Low | 0 / 0 / 0 / 0            |
| Info                           | 1                        |

Scope: source React/TypeScript, cấu hình, dependency lock, tài liệu và toàn bộ blob Git còn tham chiếu. npm audit: 0 lỗ hổng được biết. Script scan-secrets kiểm tra pattern token/private key/connection string trên file làm việc và history; không thấy credential. Đây là kiểm tra pattern cục bộ cộng đọc mã, không phải GitHub Advanced Security, plugin đó chưa có và không cài thêm.

Đã lần theo import file → giới hạn 5 MiB → Zod/version → replay → canonical comparison → state do engine dựng. UI React escape text; SVG escape ký tự dữ liệu; không có innerHTML/eval hay API backend. Script kiểm thử dùng argv cố định, không đưa input game vào shell. Workflow chỉ đọc mã, deploy chỉ ở main sau build/tests; token do Actions cấp, không ghi PAT.

Info (confidence high): tài liệu và history chứa đường dẫn checkout Windows/metadata tác giả Git. Không có tệp cá nhân ngoài dự án, game save thực, thông tin liên lạc hay khóa truy cập được tìm thấy. Các dấu vết môi trường là metadata dự án; không thay lịch sử 4 commit. Build chỉ xuất dist, không xuất source/tài liệu/metadata này vào website. Source repository theo yêu cầu là công khai.

Không đề xuất patch bảo mật vì chưa tìm thấy lỗ hổng được xác minh; chỉ cấu hình deploy/subpath trong phạm vi đã cho phép. Rà soát này không chứng minh không còn lỗ hổng. IndexedDB theo origin, không theo subpath: localhost và GitHub Pages dùng vùng lưu khác nhau; dùng export/import để chuyển. Không đổi database hoặc luật game trong phiên này.

## Rà soát v0.2 — creator, replay và history

| Mức                            | Phát hiện xác minh                                |
| ------------------------------ | ------------------------------------------------- |
| Critical / High / Medium / Low | 0 / 0 / 0 / 0                                     |
| Info                           | 1 (metadata dự án công khai, đã nêu ở báo cáo cũ) |

Scope đọc mã: creator → setupSchema → engine; SaveManager → parseSave → parser v1 hoặc replay v2 → canonical; LifeHistory → giới hạn tệp → record/schema/replay → immutable transaction; React/SVG output và workflow phát hành. npm audit tại lượt v0.2: 0 advisory (evidence/dependency-audit.json). Secret scan mới được chạy trước push, kết quả ghi trong V02_REPORT. Không có API Auth/cloud hay credential mới.

Không tìm thấy lỗ hổng đã xác minh trong phạm vi đọc mã này. Tên/địa danh NFC, giới hạn 80 ký tự, không điều khiển/dấu HTML; React vẫn render text. Save giới hạn 5 MiB/512 action, version route sang đúng engine đóng băng hoặc v2; run do replay tạo và so canonical, không thực thi effect trong tệp. History giới hạn 20 MiB/50 record, kiểm chứng tất cả trước insert; cùng UUID/nội dung khác abort transaction, không overwrite. Memoir phải khớp summary nguyên bản theo đúng version. IndexedDB chỉ append trong store lịch sử; autosave/slot có store riêng. SVG vẫn escape tên/seed. Không có input game đi vào shell, URL script test do người bảo trì cung cấp.

Confidence: high với đường đi nhập liệu/replay/ghi lịch sử đã đọc và regression; không phải chứng nhận an toàn toàn diện. Chưa thử quota trên mọi trình duyệt, nhiều tab đồng thời hoặc kiểm thử xâm nhập độc lập. UUID/checksum không bảo vệ chống sửa dữ liệu bằng DevTools. Không đề xuất patch bảo mật khi không có phát hiện cần sửa. Không dùng hoặc cài Advanced Security plugin; scanner cục bộ không thay thế dịch vụ đó.
