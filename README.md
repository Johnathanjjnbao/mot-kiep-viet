# Một Kiếp Việt

**Một đời người, vạn ngã rẽ.** Game mô phỏng cuộc đời bằng tiếng Việt, chạy hoàn toàn trong trình duyệt.

Yêu cầu Node.js 24+.

```powershell
npm.cmd ci
npm.cmd run dev
```

Mở địa chỉ cục bộ được in ra (mặc định http://127.0.0.1:5173). Không có dịch vụ trả phí hoặc backend.

```powershell
npm.cmd run verify
npm.cmd run simulate
npm.cmd run test:e2e
npm.cmd run test:production
```

Đã có vòng chơi từ chào đời đến kết thúc, 72 mẫu sự kiện, 3 tuyến truyện dài, 10 hướng nghề, tài chính có sổ giao dịch, quan hệ, sức khỏe và hồi ký. Giao diện hỗ trợ desktop/mobile, bàn phím, chữ lớn và giảm chuyển động.

## Chơi trên Windows

```powershell
cd C:\Users\triba\OneDrive\Desktop\game
npm.cmd ci
npm.cmd run dev -- --port 5173
```

Mở http://127.0.0.1:5173. Chọn “Bắt đầu một kiếp mới”, rồi để số phận chọn hoặc tự chọn bối cảnh. Sau 18 tuổi, các mục Nghề nghiệp và Tài chính cho phép chủ động tìm việc, quản lý tiền và chỗ ở. Nhật ký giữ mọi quyết định. Khi kết thúc, tải thẻ kỷ niệm SVG hoặc đọc lại hồi ký.

Đã cài dependencies thì chỉ cần `npm.cmd run dev`. Dừng bằng Ctrl+C. Muốn thử bản production cục bộ: `npm.cmd run build`, rồi `npm.cmd run preview -- --port 4173`. Mỗi origin có vùng save riêng; dùng export/import để chuyển giữa các cổng.

## Giữ tiến độ

Autosave và 3 slot nằm trong IndexedDB. Ô có dữ liệu cần chọn “Thay bản lưu” để ghi đè. Xuất JSON để sao lưu hay chuyển thiết bị; nhập giới hạn 5 MiB, có kiểm tra phiên bản và replay. Không có đồng bộ đám mây. Không dùng nhiều tab để chơi cùng một bản tự lưu.

## Kiểm chứng

`npm.cmd run verify`: typecheck, ESLint, unit/integration tests, kiểm tra nội dung và build. `npm.cmd run simulate`: 1.000 cuộc đời với seed `stress-0`–`stress-999`. `npm.cmd run test:e2e`: dùng Microsoft Edge có sẵn trên Windows; CI dùng Chromium. `npm.cmd run test:production` mở bản build trên cổng 4173, kiểm tra chơi/lưu/tải rồi tự đóng trình duyệt và máy chủ thử nghiệm. Workflow đã tạo, chưa đẩy lên GitHub nên remote CI chưa chạy.

## Tài liệu

- [Kiến trúc và quyền sở hữu dữ liệu](docs/ARCHITECTURE.md)
- [Hướng dẫn viết sự kiện](docs/CONTENT_GUIDE.md)
- [Lưu game, tương thích và rà soát an toàn](docs/SAVES_AND_SECURITY.md)
- [Nguồn lịch sử và mô hình cân bằng](docs/HISTORY_AND_BALANCE.md)
- [Báo cáo bàn giao và bằng chứng](docs/HANDOFF.md)

Nền kinh tế dùng đSM, đơn vị thiết kế, không phải số liệu VNĐ lịch sử. Từ 2027 là tương lai giả định. Chưa có playtest người thật để xác nhận thời lượng hoặc cân bằng. Dự án không có backend, tài khoản, runtime AI, hay triển khai công khai.
