# Một Kiếp Việt

**Một đời người, vạn ngã rẽ.** Game mô phỏng cuộc đời bằng tiếng Việt, chạy hoàn toàn trong trình duyệt.

Source hiện tại: **0.3.10-stable.1**. [Chơi trên GitHub Pages](https://johnathanjjnbao.github.io/mot-kiep-viet/). Trạng thái phát hành và bằng chứng mới nhất ở [báo cáo trước kỳ nghỉ](docs/PRE_HIATUS_RELEASE_REPORT.md); cách tiếp tục dự án ở [bàn giao](docs/PRE_HIATUS_HANDOFF.md).

Yêu cầu Node.js 24+.

```powershell
npm.cmd ci
npm.cmd run dev
```

Mở địa chỉ cục bộ được in ra (mặc định http://127.0.0.1:5173). Guest chạy cục bộ; tài khoản tùy chọn dùng Supabase đã cấu hình.

```powershell
npm.cmd run verify
npm.cmd run simulate -- 1000 --stable --vnd --creator --employment
npm.cmd run test:e2e
npm.cmd run test:production
```

Bản hiện tại có tạo nhân vật1975–2026, ngoại hình/tóc/tính cách/gia đình; trải nghiệm từng tuổi; học12ngành, việc làm và thất nghiệp; tình cảm/nuôi con; tiệm online, kênh video/LIVE, dự án khách hàng6dịch vụ, gaming, hợp tác creator và biểu diễn3chuyên môn. Catalog340định nghĩa gồm các template/luật lịch sử và90cảnh mới của creative/stable; không phải340cảnh đều thuộc cùng một pool của một đời. Mỗi cảnh hiển thị có ít nhất4lựa chọn khả dụng. Tiền mới dùng VND sức mua thiết kế2026; tương lai từ2027 là hư cấu.

Chạm một lựa chọn để thực thi và đến quyết định kế tiếp; kết quả vẫn hiện và được ghi vào nhật ký. HUD giữ sáu chỉ số; narrative không bị ẩn, danh sách lựa chọn cuộn khi cần. Có desktop/mobile, bàn phím, chữ lớn và giảm chuyển động. Lịch sử hoàn tất riêng với autosave/3slot, có xuất/nhập.

## Chơi trên Windows

```powershell
cd C:\Users\triba\OneDrive\Desktop\game
npm.cmd ci
npm.cmd run dev -- --port 5173
```

Mở http://127.0.0.1:5173. Chọn “Bắt đầu một kiếp mới”, rồi để số phận chọn hoặc tự chọn bối cảnh. Sau 18 tuổi, các mục Nghề nghiệp và Tài chính cho phép chủ động tìm việc, quản lý tiền và chỗ ở. Nhật ký giữ mọi quyết định. Khi kết thúc, tải thẻ kỷ niệm SVG hoặc đọc lại hồi ký.

Đã cài dependencies thì chỉ cần `npm.cmd run dev`. Dừng bằng Ctrl+C. Muốn thử bản production cục bộ: `npm.cmd run build`, rồi `npm.cmd run preview -- --port 4173`. Mỗi origin có vùng save riêng; dùng export/import để chuyển giữa các cổng.

## Giữ tiến độ

Autosave và3slot nằm trong IndexedDB. Ô có dữ liệu cần chọn “Thay bản lưu” để ghi đè. Guest hai tab có kiểm tra xung đột: tab ghi sau không ghi đè tiến độ khác; xuất nhánh còn trên màn hình trước khi tải lại. Xuất JSON để sao lưu/chuyển thiết bị; save nhập tối đa5MiB, kiểm strict parser/replay. Lịch sử riêng tối đa50kiếp, import20MiB. Save schema1/2 mở bằng luật v1 đóng băng; schema3 dùng frozen v2; schema4 giữ selector bất biến, không tự đổi luật đời cũ. Tài khoản Email/Password được chủ dự án tạo/confirmed/allowlist dùng Supabase để đồng bộ; guest vẫn lưu cục bộ. Xem docs/SUPABASE_SETUP.md. Owner tự đăng nhập live chưa được coi là PASS nếu báo cáo ghi NOT RUN.

## Kiểm chứng

`npm.cmd run verify`: typecheck, ESLint, unit/integration, nội dung và build. Lệnh simulate có flags ở trên kiểm1.000đời stable-v1 mới; đọc số liệu đúng ruleset. E2E dùng Edge trên Windows, Chromium trên CI; kiểm chéo thêm Chromium/Firefox/WebKit×desktop/mobile. Build Pages cần `VITE_BASE_PATH=/mot-kiep-viet/`; test:production phải chạy trên build ấy. Kết quả hiện hành ở [PRE_HIATUS_RELEASE_REPORT](docs/PRE_HIATUS_RELEASE_REPORT.md); [V03_REPORT](docs/V03_REPORT.md) là lịch sử. Giữ512actions/120lượt chủ động/5MiB; không nâng ngưỡng để che lỗi. Source ZIP/Git bundle và restore test nằm trong bộ backup local theo bàn giao, không tự upload history backup công khai.

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
