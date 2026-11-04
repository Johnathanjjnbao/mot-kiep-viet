# Hiệu năng v0.3.11-assets.1

**Trạng thái: MEASURED, ngày 04/11/2026.** Chưa có bằng chứng để tuyên bố bản tài sản tăng tốc. Đây là phép đo tổng hợp trên máy phát triển, không phải số liệu thiết bị người chơi.

Mỗi bản có ba lượt, mỗi lượt mở một tiến trình Edge mới, viewport 1440×1000, CPU chậm 4×, cache tắt, phục vụ bằng HTTP cục bộ. Các lượt chạy tuần tự sau khi E2E kết thúc; không sửa bản phục hồi stable. Thời gian bao gồm thao tác UI và quan sát IndexedDB, giữ nguyên strict replay/canonical validation.

## So sánh cùng save cũ

Baseline là dist đã thử phục hồi của stable `a3b7cad877bb58810ea7d34f61fab8a5c0afaab1`. Candidate là dist từ `0e8a0b02e06e51fe91a04cf07f9334153d3f7fae`. Cùng fixture creative, cùng 20 quyết định, cùng save dài 356 hành động. Trung vị ba lượt, đơn vị ms:

| Phép đo | Stable | Candidate |
|---|---:|---:|
| Trang chủ sẵn sàng |871|845|
| Mở tạo nhân vật |177|159|
| Nhập save ban đầu |716|756|
| Reload |969|966|
| Nhập save dài |4.529|4.804|
| Quyết định, trung vị 60 mẫu |175|179|

Độ trễ quyết định gần nhau; nhập save dài tăng khoảng 6% trong mẫu này. Ba lượt trên một máy không đủ để suy rộng thành chênh lệch cố định ngoài thực tế. Không ghi nhận page error trong các lượt.

[Raw stable](evidence/pre-hiatus-performance-assets-before.json) · [Raw candidate](evidence/pre-hiatus-performance-assets-after.json). Tái hiện bằng `npx.cmd tsx scripts/qa-pre-hiatus-performance.ts <URL> <label> <dist-directory>`; baseline trỏ tới dist phục hồi đã bảo vệ, candidate trỏ `dist`.

## Save tài sản và panel tải riêng

Ba tiến trình mới khác, cùng CPU/viewport/cache; dùng acquired, save lớn nhất của lượt 1.000 đời và prefix quyết định cuối của combined-life. Trung vị:

| Phép đo | ms |
|---|---:|
| Trang chủ sẵn sàng |880|
| Nhập acquired |1.526|
| Mở panel tài sản tải riêng |1.331|
| Nhập save lớn nhất, 1.169.112 byte |5.303|
| Nhập prefix đời dài |4.836|
| Reload prefix đời dài |4.835|

Không page error. Đây là thời gian toàn luồng; không tách riêng chi phí parser, render và autosave. Việc archive hồi ký có thể hoàn tất sau bước quan sát autosave. [Raw assets](evidence/assets-performance-local.json). Tái hiện bằng `npx.cmd tsx scripts/qa-assets-performance.ts <URL> <label> dist`, cùng `.local/assets-largest-save.json` do simulation tạo.

Panel riêng khoảng 22,62 KB, gzip 7,42 KB; entry vẫn khoảng 1.337 KB, gzip 404 KB. Giữ cảnh báo chunk 500 KB. Runtime catalog cần cho replay vẫn có thể nằm trong entry; lazy UI không đồng nghĩa toàn bộ luật/catalog tải sau.

## Bộ nhớ và bước tiếp

Sau 20 lần nhập lại save creative và yêu cầu GC, heap stable tăng từ khoảng 11,6 MB lên 16,5 MB; candidate từ khoảng 11,9 MB lên 16,8 MB. Sau năm lần nhập lại acquired, nhóm asset tăng từ khoảng 14,8 MB lên 17,4 MB. Các chuỗi đều tăng; phép đo này chưa phân biệt bộ nhớ được giữ có chủ ý, tác động automation và leak. Không nhận là đã chứng minh không rò rỉ.

Bước tiếp cần profile allocation/retained objects và phân rã chi phí đọc slot/history. Chỉ thay cache hoặc rendering khi có đo lường và regression; giữ kiểm canonical, toàn bộ lịch sử, database ID và giới hạn save. Không nới timeout, giảm fixture hoặc bỏ replay để trình bày thành tăng tốc.
