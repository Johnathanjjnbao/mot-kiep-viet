# Codex · Một Kiếp Việt

Vai trò: duy trì game và phát hành có bằng chứng. Luôn đọc PROJECT_STATUS, kiểm tra git status, branch, HEAD, remote và workflow trước sửa. Giữ công việc chưa commit của chủ dự án.

## Source

- src/domain: dữ liệu; src/engine: luật, RNG, lịch, sổ cái.
- src/content: era, vùng, nghề, sự kiện, story arc.
- src/application: phiên chơi; src/persistence: IndexedDB, schema, replay.
- src/ui: trình bày; tests và scripts: kiểm chứng.

## Bảo vệ engine

Bản hiện hành beta 0.2.0: engine/content 2.0.0, save schema 3. `src/legacy/v1` là luật/nội dung 1.0.0 đóng băng để kiểm chứng và đọc save schema 1/2; không sửa cùng luật mới, không phát lại save cũ dưới v2. Golden v1 giữ nguyên; golden v2 khóa riêng. Mỗi sự kiện hiển thị phải có ít nhất 4 lựa chọn khả dụng, kể cả fallback. Lịch sử `mot-kiep-viet-history` độc lập autosave/3 slot; UUID cuộc đời ngoài RNG, không dùng seed làm khóa. Không ghi đè/xóa hồi ký để lưu kiếp mới.

Không sửa state từ UI; không Math.random trong luật; mọi thay đổi tiền đi qua giao dịch. Không đổi engine/content/save nếu không có kế hoạch version và regression. Công việc deploy không thay gameplay. Không xóa save của người chơi. Save trên localhost không tự chuyển sang github.io: dùng export/import. Các game cùng origin có thể dùng chung IndexedDB, vì vậy giữ ID database hiện tại và không host bản game khác dùng cùng ID trên tài khoản này.

## Skills

Kiểm tra thực tế %USERPROFILE%/.agents/skills và .codex/skills, đọc SKILL.md phù hợp trước dùng; không cài thêm hoặc tải hàng loạt skill. Security Review cho audit, Secret Scanning cho kiểm tra trước push, Webapp Testing cho browser QA. Không dùng Antigravity. Không chạy lặp mô phỏng nếu engine/content không đổi.

## Gates và Git

Chạy npm.cmd run verify; build Pages với VITE_BASE_PATH=/mot-kiep-viet/; test:production phải chạy trên build ấy. Chạy scan-secrets.mjs trước push, kiểm tra cả history và nội dung công khai. Engine/content thay đổi mới cần simulate 1.000 seed. UI cần E2E. Chỉ stage file thuộc dự án; giữ lịch sử, không reset/clean/force push. Không đưa token vào log/file/repository.

Sau mỗi phiên triển khai tính năng có thay đổi mã nguồn và đã qua gates, Codex phải commit, push main và xác minh deployment GitHub Pages, trừ khi có lỗi hoặc rủi ro cần dừng. Không push build lỗi. Không thay repo khác. Pages là website công khai.

## Deploy

Workflow pages.yml: push main/manual → npm ci → verify/secret scan/browser/production smoke → artifact dist → deploy phụ thuộc build. Dùng quyền tối thiểu và Pages source GitHub Actions. Theo dõi đúng SHA tới completed/success, rồi mở URL thật, kiểm tra CSS/JS/font, tạo đời, chọn, tiến thời gian, save/load trên desktop/mobile. HTTP 200 chưa đủ.

## Tài liệu và bàn giao

Cập nhật PROJECT_STATUS và HANDOFF sau mỗi thay đổi; giữ phần bàn giao lịch sử. ROADMAP chỉ là backlog, không tự mở phạm vi. Commit/push tài liệu bổ sung và kiểm tra workflow cuối. Báo URL repo/live, SHA, lệnh/kết quả, CI, browser, lỗi và G5. Không tuyên bố PASS/deployed khi chưa có bằng chứng; nếu thiếu quyền, ghi BLOCKED và hướng dẫn đăng nhập, không xin token qua chat.
