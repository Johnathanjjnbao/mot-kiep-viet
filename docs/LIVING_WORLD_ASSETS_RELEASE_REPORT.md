# Một Kiếp Việt 0.3.11-assets.1 — báo cáo phát hành

**Trạng thái: INCOMPLETE — chưa push hoặc deploy.**

Tiếp tục từ main `a3b7cad877bb58810ea7d34f61fab8a5c0afaab1`, trên nhánh `codex/living-world-assets-20261104`. Candidate E: `0e8a0b02e06e51fe91a04cf07f9334153d3f7fae`. Tag `pre-hiatus-v0.3.10-stable.1` và các bộ phục hồi được giữ nguyên. SHA phát hành và CI/live sẽ được bổ sung sau khi các gate cuối hoàn tất.

## Những gì người chơi có thể làm

Đời mới dùng selector bất biến `assets-v1`, kế thừa `stable-v1`, với engine/content 3.0.0 và save schema 4. Đời cũ giữ ruleset đã ghi; không tự chuyển luật hoặc phát lại bằng luật mới. 29 golden lịch sử giữ nguyên; tám golden tài sản khóa riêng.

- **Nhà ở:** ba loại thuê và bốn loại sở hữu; cọc phải thu, chuyển chỗ, gia hạn, phí mua, bảo trì, sửa chữa, vay và bán xử lý nợ. Khu vực và vùng ảnh hưởng giá; không phải mọi căn đều xuất hiện ở mọi môi trường.
- **Phương tiện:** bảy loại, gồm xe đạp, xe máy và ô tô. Mua xe và tập vận hành là hai bước riêng. Có chi phí duy trì, hao mòn, sửa, thay và bán; sở hữu xe không tự cấp việc làm hoặc lương.
- **Thiết bị:** năm điện thoại và ba laptop, có thời kỳ xuất hiện, tuổi, tình trạng, lợi ích nhỏ có trần, sửa và thay. Điện thoại chỉ mua tiền mặt.
- **PC Builder:** 41 linh kiện hư cấu thuộc chín nhóm. Kiểm socket, RAM, bo/vỏ, kích thước, lưu trữ, tản nhiệt và công suất nguồn; có cấu hình tiền mặt/trả góp, nâng linh kiện và thu hồi đúng giá trị phần được thay. Thay vỏ không trẻ hóa CPU hoặc các phần cũ.
- **Hệ quả cuộc đời:** 25 cảnh mới, 100 lựa chọn, ba chuỗi nhiều năm về phòng ở, PC và khoản vay. Tài sản hỗ trợ có giới hạn cho học tập, việc số, sáng tạo và đi lại; không bắt buộc phải mua để học hoặc làm việc. Các khoản chi đều đi qua sổ giao dịch.

Catalog có 22 mục nhà/xe/thiết bị, cộng 41 linh kiện. Đây là giá VND theo sức mua thiết kế năm 2026, không phải bảng giá thị trường hay giá danh nghĩa lịch sử. Tương lai được ghi là hư cấu. Không thêm dịch vụ giá, API hoặc dependency runtime.

## Kế toán và giới hạn

Vay nhà trả trước 30%, thời hạn 240 tháng, lãi tháng 35 bps. Tài sản khác đủ điều kiện vay trả trước 50%, 24 tháng, 60 bps. Khả năng trả xét thu nhập nghề/lương hưu và nghĩa vụ nợ; không có vòng tái cấp vốn vô hạn. Bán xử lý nợ có thể vẫn để lại khoản thiếu. Sáu kỳ thiếu liên tiếp có thể dẫn tới xử lý tài sản; nợ không tự biến mất khi nhân vật qua đời.

Giữ 512 hành động, 120 thao tác tùy chọn dùng chung và envelope 5 MiB. Tối đa tám tài sản đang giữ, 12 hồ sơ vay suốt đời; không tích lũy toàn bộ object tài sản đã bán. Dự trữ câu chuyện chỉ chặn thao tác tùy chọn khi cần; không chặn lựa chọn/tiến tuổi, cắt log, bỏ năm hoặc ép chết.

Trong 1.000 đời, tối đa 371 hành động, 109 thao tác tùy chọn, 1.169.112 byte. Forced combined có bằng, ba con, tám lượt nghề, cửa hàng/kênh, thay nhà/xe/điện thoại và PC trả góp/nâng cấp: 86 tuổi, 324 hành động, 107 thao tác, 1.033.032 byte. Biến thể chạm 120 thao tác kết thúc tự nhiên ở 85 tuổi; ca dài 112 tuổi và ca chết 107 tuổi còn 2.299.996 ₫ nợ PC đều replay đúng. Boundary churn chạm ngưỡng dự báo 512 rồi kết thúc 97 tuổi/348 hành động; không gọi đây là một đời thực tế có 511 hành động.

## Kiểm chứng

| Gate | Kết quả hiện tại |
|---|---|
| `npm.cmd run verify`, Pages base `/mot-kiep-viet/` | VERIFIED PASS: 468 test/47 file; 37 golden; content 365, không lỗi; lint/typecheck/build |
| 1.000 đời và canonical replay | VERIFIED PASS: 1.000/1.000, không invariant failure, mismatch, fallback hoặc tuổi thiếu |
| Forced paths | VERIFIED PASS: 11 fixture, gồm ngân sách, 12 khoản vay, đời dài và nợ sau death |
| 25 cảnh tài sản × sáu viewport | VERIFIED PASS; mỗi cấu hình thêm 20 lựa chọn đầu/giữa/cuối |
| Chromium/Firefox/WebKit × desktop/mobile | VERIFIED PASS: sáu tổ hợp, tạo đời/tài sản/vay/nâng PC/save-load/history |
| Toàn bộ 130 E2E trên dist | INCOMPLETE: lượt đầu có lỗi; chưa có full-suite PASS |
| `npm.cmd run test:production` trên Pages-base dist | VERIFIED PASS: tạo đời, chọn, tiến thời gian, autosave/reload đúng cảnh |
| Performance CPU 4× | MEASURED: ba lượt mỗi nhóm stable/candidate/assets; xem báo cáo riêng |
| Secret scan trước push | PASS: 2.170 text objects, 0 findings; sẽ quét cả checkpoint cuối |
| Dependency audit | Production: 0; toàn bộ: 12 moderate dev, 0 high/critical |
| Đúng SHA CI / Pages / live G5 | NOT RUN |
| Owner login / fresh live JWT A/B/anon | NOT RUN |

Lượt mô phỏng hoàn tất theo hai batch 999+1: giữ 999 đời đã hợp lệ, rồi chạy tiếp seed 955 sau sửa policy kiểm thử để xử lý một lần từ chối command của engine. Luật/content/parser không đổi giữa hai batch, được kiểm bằng git diff. Raw FAIL ban đầu vẫn giữ; không gọi lượt đầu là một lệnh 1.000 PASS. Không chạy lại mô phỏng nếu chỉ đổi UI, test hoặc tài liệu.

## Bằng chứng và rủi ro còn mở

- [Tiến trình và checkpoint](LIVING_WORLD_ASSETS_PROGRESS.md), [mô phỏng](evidence/assets-1000-lives.json), [lượt đầu bị từ chối](evidence/assets-1000-initial-guard-failure.json), [forced paths](evidence/assets-forced-paths.json), [cảnh](evidence/assets-scenes.json), [sáu trình duyệt](evidence/assets-browsers-local.json).
- [Security review và audit](LIVING_WORLD_ASSETS_SECURITY.md). Không đổi Auth/RLS/SQL/service worker. Kiểm thử guest/PGlite không thay cho JWT thật. Không có tài khoản synthetic sẵn để chạy lại fresh cloud deny QA.
- Bundle entry khoảng 1.337 KB, gzip 404 KB; panel tài sản tải riêng khoảng 22,62 KB, gzip 7,42 KB. Cảnh báo chunk 500 KB vẫn còn; chưa có bằng chứng để tuyên bố tăng tốc.
- [Profile CPU 4×](LIVING_WORLD_ASSETS_PERFORMANCE.md): nhập save tài sản lớn nhất trung vị 5,303 giây; reload đời dài 4,835 giây. Cùng save cũ, quyết định 175→179 ms và nhập save dài 4,529→4,804 giây. Heap tăng trong các chuỗi nhập lặp; chưa xác định retained objects/leak. Không có page error trong các lượt đo.
- Firefox mobile là viewport/touch mô phỏng; chưa kiểm trên thiết bị vật lý. Profile tổng hợp không đại diện hiệu năng người dùng thực.
- 12 moderate nằm ở toolchain dev ESLint/typescript-eslint/minimatch; chưa sửa bằng đổi major/downgrade cưỡng bức. Cần một thay đổi tương thích riêng cho toolchain.
- [Thiết kế đời dài tương lai](ASSET_LONG_LIFE_DESIGN.md) chỉ là đề xuất cho schema phân đoạn; chưa nới giới hạn bản này. Mốc v0.4 Supernatural Longevity vẫn giữ tên và phạm vi backlog.

[Repository](https://github.com/Johnathanjjnbao/mot-kiep-viet) · [Website](https://johnathanjjnbao.github.io/mot-kiep-viet/). Website chưa nhận candidate này tại thời điểm lập báo cáo.
