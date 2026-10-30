# Bàn giao beta v0.2 — 30/10/2026

## 1. Kết quả chính

Beta v0.2 đã triển khai và xác minh trên [GitHub Pages](https://johnathanjjnbao.github.io/mot-kiep-viet/): **G5 VERIFIED PASS**. Tiếp tục checkout C:\Users\triba\OneDrive\Desktop\game, không dựng lại game. Baseline main 3508765374d94b8150e852ff0aa74b9678cd8940 và mọi commit trước được giữ. Ba nhóm tính năng, gates cục bộ, CI sạch và live desktop/mobile đều đã qua trong phạm vi bên dưới.

## 2. Tính năng thực tế

Tạo tên Unicode/gợi ý ngẫu nhiên, năm sinh 1975–2026, 3 hồ sơ vùng + nhãn địa danh riêng, đô thị/nông thôn, 5 nền kinh tế, 5 gia đình, 10 tính cách cha/mẹ tối đa 3 tổ hợp tương thích. Có xem trước/sửa, điều kiện cha/mẹ phù hợp, lưu cấu hình qua journal/save/reload/ending. Tên tỉnh tự nhập không tạo thống kê địa phương.

Gia cảnh thay tiền khởi đầu/trợ cấp; tính cách ảnh hưởng kiến thức, kỹ năng, tâm trạng, stress, quan hệ hoặc hỗ trợ. Nonresident còn sống khác unknown (alive=null) và deceased. Tác động nuôi dưỡng hằng năm chỉ từ phụ huynh cùng chăm sóc còn sống.

## 3. Ma trận kiểm chứng

| Kiểm tra                             | Kết quả hiện tại                                       | Bằng chứng                                     |
| ------------------------------------ | ------------------------------------------------------ | ---------------------------------------------- |
| verify: type/lint/unit/content/build | VERIFIED PASS, 49/49 test, type/lint/content/build     | .local/verify-v02-final.log; tests/            |
| 1.000 seed luật mới                  | VERIFIED PASS, 0 vi phạm, 0 failures                   | evidence/simulation.json                       |
| E2E cuối desktop/mobile              | VERIFIED PASS, 10/10 luồng, 0 flaky                    | tests/e2e/game.spec.ts                         |
| Production base /mot-kiep-viet/      | VERIFIED PASS trên build base đúng                     | evidence/production-smoke.json                 |
| Audit phụ thuộc                      | VERIFIED PASS, 0 advisory theo npm audit tại phiên này | evidence/dependency-audit.json                 |
| Secret scan working files/history    | VERIFIED PASS, working files/history, 0 findings       | scripts/scan-secrets.mjs                       |
| CI và live v0.2                      | VERIFIED PASS, build/deploy và live hai viewport       | evidence/pages-workflows.json, pages-live.json |

Một lượt verify có 48 PASS/1 FAIL do batch hoàn tất + replay 52 năm mất 33,9 giây vượt timeout 30 giây. Đặt riêng batch hữu hạn này 120 giây, giữ nguyên mọi assertion; lượt cuối đã qua 49/49 trong tổng 24,92 giây. Không đổi engine để xử lý timeout.

## 4. Nội dung được nâng cấp

Giữ đủ 72 mẫu sự kiện, 3 arc và 10 nghề. Bổ sung 216 lựa chọn viết riêng vào gói cũ và 2 cho fallback. 71 mẫu có 5 lựa chọn, education-path có 6: tổng 361, cộng fallback 4. Số định nghĩa khác số enabled: engine lọc theo bối cảnh và chỉ chọn sự kiện có ít nhất 4 hướng khả dụng; UI hiển thị hướng đã qua lọc. Không thêm lựa chọn chung lúc chạy.

## 5. Phân nhánh và phân bố

Mô phỏng kiểm tra 35.045 lần sự kiện: enabled min 4, max 6; quan sát 72/72 mẫu. Trong 361 lựa chọn định nghĩa, 77 chứa schedule trong effects (không tính nhánh chance). Kết thúc sức khỏe/hồi ký 282/718; tuổi min/mean/max 64/79,45/82; tài sản ròng −52.047/11.112/40.025 đSM. Arc làm ăn/gia đình/hồi phục hoàn tất 500/800/219; làm ăn có lãi/lỗ/rút vốn 137/125/61. Đây là phân bố chính sách test, không đo tính đại diện Việt Nam hoặc độ cân bằng.

Ví dụ thực: education-path có hướng đi làm rồi học (kỹ năng/stress và kiến thức trễ), học từ thợ (kỹ năng tức thời), tự học có lịch (kiến thức/stress). business-invitation thử việc rồi mở nhánh đánh giá 24 tháng; career-collapse có đào tạo lại nối trở lại; family-call nối thăm hỏi/hồi tưởng sau 24 tháng. Lựa chọn mới nối hoặc đóng arc bằng flag/schedule, không để nhánh mới mất dấu.

## 6. Phạm vi Creator

Unit chạy trọn đời và replay cả 52 năm 1975–2026; 3 vùng, 5 gia cảnh, 5 gia đình và từng tính cách có regression. Tập 1.000 seed có 200 đời mỗi gia đình, các lớp kinh tế/môi trường/tính cách; mẫu năm của script hiện phủ 41 năm, không phải 52. E2E kiểm tra cả 5 form trên hai viewport, preview/edit, nhãn Unicode/nơi sinh, reload và không tràn ngang. Chế độ ngẫu nhiên giữ nguyên; tính cách phụ huynh chỉ tùy chỉnh thủ công ở bản này.

## 7. Save và replay

Engine/content 2.0.0, schema 3. Luật v1.0.0 đóng băng riêng; schema 1/2 được kiểm chứng và mở chỉ đọc, không đổi kết quả dưới v2. Giữ ba slot. UUID cuộc đời ngoài RNG; replay setup được chuẩn hóa cố định. Golden v1 2525264403 giữ nguyên; golden v2 4148875142 khóa riêng. Chưa có chuyển cuộc đời đang chơi v0.1 sang tiếp tục v0.2.

## 8. Life History

IndexedDB riêng, tự lưu immutable khi ended, dedup UUID/nội dung; hai đời cùng seed có ID riêng. Xem memoir nguyên bản, summary, toàn nhật ký, người thân/công việc, xuất một/tất cả, nhập kiểm chứng trước transaction. Regression kiểm tra timestamp giữ nguyên, xung đột không ghi đè, không mất khi tạo đời khác, tệp sai/phiên bản lạ/quá lớn và lịch sử v1 đã kết thúc. Giới hạn 50 kiếp/20 MiB import; lỗi không tự xóa bản cũ.

## 9. Skills thực dùng

Kiểm kê 22 thư mục global và 5 system ở đầu phiên. Dùng Frontend Design, Humanizer, Security Review, Secret Scanning, Webapp Testing và Documentation Writer theo pha. Không cài thêm skill, không dùng Antigravity hay thêm thư viện animation. Rà an toàn tập trung vào creator, import/replay, lịch sử và đầu ra React/SVG; xem RELEASE_SECURITY.

## 10. Git và trạng thái bàn giao

Nhánh main; remote https://github.com/Johnathanjjnbao/mot-kiep-viet. Code phát hành a108d25036af58db8034369db06085a88e4e66fe đã push. Giữ toàn bộ 7 commit trước baseline. Tài liệu/bằng chứng live sẽ được bổ sung bằng commit riêng; HEAD bàn giao báo trong chat/git log, tránh ghi SHA của chính commit vào nội dung nó.

## 11. GitHub Actions

[Workflow 41007485656](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41007485656) cho a108d25 completed/success cả build và deploy. Log: npm ci sạch, verify 49/49 test (19,06 giây), secret scan 0 findings, 10/10 E2E Chromium, production smoke, upload artifact đều success. Bằng chứng evidence/ci-v02.json và pages-workflows.json. Commit tài liệu kế sau không đổi mã/bundle; workflow HEAD cuối được kiểm tra trước trả lời bàn giao.

## 12. URL thực

[Repo](https://github.com/Johnathanjjnbao/mot-kiep-viet), [game](https://johnathanjjnbao.github.io/mot-kiep-viet/). VERIFIED PASS ở 1440×1000 và 375×812 trên Edge: footer 0.2, random/custom/5 gia đình và preview/edit, trọn đời với ≥4 lựa chọn, autosave/reload và manual slot load, lịch sử xuất/nhập dedup/đọc hồi ký/giữ sau đổi kiếp và reload, font/assets, không tràn ngang, 0 lỗi page/network. evidence/pages-live.json ghi từng kiểm tra. SHA-256 JS/CSS live khớp build cục bộ (pages-assets-v02.json); không chỉ dựa HTTP 200.

## 13. Giới hạn

Chưa điện thoại thật/Safari/Firefox/playtest người thật; E2E dùng viewport mô phỏng. Chưa có cloud/Auth/tài khoản vợ, offline sync hay chống xung đột autosave nhiều tab. Không dùng v0.2 tiếp tục save v0.1. Lịch sử 50 bản, replay khi đọc có thể chậm; lỗi quota vẫn cần xuất sao lưu. Bundle JS khoảng 575 kB có cảnh báo Vite 500 kB do giữ engine v1; chưa tách tải. Nhập liệu có giới hạn nhưng không phải hệ thống chống gian lận tại máy.

## 14. Ưu tiên kế tiếp

Personal Cloud Account theo CLOUD_ACCOUNTS_PLAN, sau đó Supernatural Longevity: ít nhất 20 sự kiện/5 arc, sống 100–1.000+ năm hiếm gặp, tách tuổi sinh học/lịch và bước nhảy hữu hạn. Cả hai OUT OF SCOPE v0.2, NOT RUN. Chơi thử và tối ưu được ghi trong ROADMAP.
