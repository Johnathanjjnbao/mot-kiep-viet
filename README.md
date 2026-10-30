# Một Kiếp Việt

**Một đời người, vạn ngã rẽ.** Game mô phỏng cuộc đời bằng tiếng Việt, chạy hoàn toàn trong trình duyệt.

Yêu cầu Node.js 24+.

```powershell
npm.cmd ci
npm.cmd run dev
```

Mở địa chỉ cục bộ được in ra (mặc định http://127.0.0.1:5173). Guest chạy cục bộ; tài khoản tùy chọn dùng Supabase đã cấu hình.

```powershell
npm.cmd run verify
npm.cmd run simulate
npm.cmd run test:e2e
npm.cmd run test:production
```

Beta 0.3 có tạo nhân vật (1975–2026, tên/nơi sinh/gia đình/tính cách), 72 mẫu sự kiện với ít nhất 4 lựa chọn khả dụng, 3 tuyến truyện, 10 nghề, sổ tiền, quan hệ, sức khỏe và hồi ký. Lịch sử hoàn tất riêng với autosave/3 slot, có xuất/nhập. Chạm một lựa chọn để thực thi và đến quyết định kế tiếp; kết quả vẫn hiện và được ghi vào nhật ký. Giao diện hỗ trợ desktop/mobile, bàn phím, chữ lớn và giảm chuyển động.

## Chơi trên Windows

```powershell
cd C:\Users\triba\OneDrive\Desktop\game
npm.cmd ci
npm.cmd run dev -- --port 5173
```

Mở http://127.0.0.1:5173. Chọn “Bắt đầu một kiếp mới”, rồi để số phận chọn hoặc tự chọn bối cảnh. Sau 18 tuổi, các mục Nghề nghiệp và Tài chính cho phép chủ động tìm việc, quản lý tiền và chỗ ở. Nhật ký giữ mọi quyết định. Khi kết thúc, tải thẻ kỷ niệm SVG hoặc đọc lại hồi ký.

Đã cài dependencies thì chỉ cần `npm.cmd run dev`. Dừng bằng Ctrl+C. Muốn thử bản production cục bộ: `npm.cmd run build`, rồi `npm.cmd run preview -- --port 4173`. Mỗi origin có vùng save riêng; dùng export/import để chuyển giữa các cổng.

## Giữ tiến độ

Autosave và 3 slot nằm trong IndexedDB. Ô có dữ liệu cần chọn “Thay bản lưu” để ghi đè. Xuất JSON để sao lưu/chuyển thiết bị; save nhập tối đa 5 MiB, kiểm tra phiên bản/replay. Lịch sử riêng tối đa 50 kiếp, import 20 MiB. Save v0.1 mở chỉ đọc bằng luật cũ, không bị mô phỏng lại bằng v0.2. Tài khoản được chủ dự án tạo/cấp quyền dùng Supabase để đồng bộ và giữ lịch sử riêng; guest vẫn lưu cục bộ. Xem docs/SUPABASE_SETUP.md.

## Kiểm chứng

`npm.cmd run verify`: typecheck, ESLint, unit/integration, nội dung và build. `npm.cmd run simulate`: 1.000 đời seed stress-0–stress-999. E2E dùng Edge trên Windows, Chromium trên CI. test:production mở build cổng 4173, kiểm tra chơi/lưu/tải và tự đóng. Kết quả hiện hành ở [V03_REPORT](docs/V03_REPORT.md); không dùng số liệu beta cũ để chứng minh luật mới.

## Tài liệu

- [Kiến trúc và quyền sở hữu dữ liệu](docs/ARCHITECTURE.md)
- [Hướng dẫn viết sự kiện](docs/CONTENT_GUIDE.md)
- [Lưu game, tương thích và rà soát an toàn](docs/SAVES_AND_SECURITY.md)
- [Nguồn lịch sử và mô hình cân bằng](docs/HISTORY_AND_BALANCE.md)
- [Báo cáo bàn giao và bằng chứng](docs/HANDOFF.md)

Nền kinh tế dùng đSM, đơn vị thiết kế, không phải số liệu VNĐ lịch sử. Từ 2027 là tương lai giả định. Chưa có playtest người thật xác nhận thời lượng/cân bằng. Account dùng Supabase Auth/PostgreSQL; không có runtime AI. [Cloud v0.3](docs/CLOUD_ARCHITECTURE.md) đã tích hợp; không cần SMTP/invitation. Chủ dự án tự nhập tài khoản đã có để nghiệm thu. [Roadmap](docs/ROADMAP.md) giữ các tính năng tương lai.

## Chơi online

Bản beta công khai: https://johnathanjjnbao.github.io/mot-kiep-viet/ . Repository: https://github.com/Johnathanjjnbao/mot-kiep-viet . Mỗi push main qua toàn bộ gates sẽ tự phát hành Pages; đọc AGENTS.md trước cập nhật. Dữ liệu localhost không tự chuyển sang Pages, dùng export/import.

Build đúng Pages trên PowerShell: đặt $env:VITE_BASE_PATH='/mot-kiep-viet/' rồi npm.cmd run build; giữ biến này khi preview. Local dev mặc định base /. node scripts/check-pages.mjs kiểm tra URL thật trên desktop/mobile. v0.3 giữ engine/content/replay; chỉ chạy lại 1.000 seed khi đổi luật hoặc có lý do kiểm thử cụ thể.
