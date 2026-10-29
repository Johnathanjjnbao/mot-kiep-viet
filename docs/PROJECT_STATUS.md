# Một Kiếp Việt — trạng thái dự án và quy tắc làm việc

**Cập nhật:** 30/10/2026 (Asia/Saigon)  
**Phạm vi kiểm toán:** bản `game.rar` người dùng gửi; đối chiếu với checkout `C:\Users\triba\OneDrive\Desktop\game` cùng HEAD `872bf5fa80815cace7699457a1eac2a4f110e02f`.  
**Trạng thái:** beta cục bộ đã kiểm chứng; **chưa phát hành lên GitHub Pages**.

Tài liệu này là điểm bắt đầu cho Codex ở các lượt sau. Mã nguồn, bài test và cấu hình hiện hành là bằng chứng kỹ thuật; `docs/HANDOFF.md` là báo cáo lịch sử của bản beta. Khi thay đổi tính năng hay triển khai, cập nhật tài liệu này theo kết quả thực tế, ghi rõ ngày, commit và điều chưa xác minh. Không giữ một trạng thái “PASS” chỉ vì báo cáo cũ nói vậy.

## 1. Điều đã xác minh

| Mục                          | Kết quả tại HEAD `872bf5f`                                                                                                                                                                                                                                    | Bằng chứng                                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Kiến trúc                    | React + TypeScript + Vite, chạy trong trình duyệt; engine tách khỏi UI, nội dung và lưu trữ                                                                                                                                                                   | `package.json`, `src/domain/model.ts`, `src/engine/`, `src/content/`, `src/application/`, `src/persistence/`, `src/ui/`, `docs/ARCHITECTURE.md` |
| Chức năng beta               | 72 mẫu sự kiện, 3 tuyến truyện, 10 nghề, tài chính, quan hệ, sức khỏe, nhật ký và hồi ký                                                                                                                                                                      | `src/content/`, `src/engine/`, `src/ui/`, `npm run validate:content`                                                                            |
| Lưu game                     | IndexedDB, autosave + 3 ô, import/export JSON; kiểm tra schema và phát lại hành động                                                                                                                                                                          | `src/persistence/saves.ts`, `tests/saves.test.ts`                                                                                               |
| Kiểm thử chạy lại từ bản nén | `npm.cmd run verify`: 22/22 test, typecheck, lint, kiểm tra nội dung và build đều qua; `npm.cmd run simulate`: 1.000/1.000 lượt, 0 vi phạm, 72/72 sự kiện xuất hiện; `npm.cmd run test:e2e`: 6/6 luồng qua; `npm.cmd run test:production`: qua trên localhost | Các lệnh chạy ngày 30/10/2026; `tests/`, `scripts/`, `docs/evidence/`                                                                           |
| Git/triển khai               | `main` sạch, HEAD `872bf5f`; **không có Git remote**, chưa push; workflow hiện tại chỉ kiểm thử, chưa deploy                                                                                                                                                  | `git status`, `git remote -v`, `.github/workflows/ci.yml`, `vite.config.ts`                                                                     |

Giới hạn bằng chứng: các lệnh chạy lại với `node_modules` có sẵn trong bản nén, chưa kiểm chứng một lần `npm ci` sạch. E2E dùng Edge trên máy Windows với viewport desktop/mobile mô phỏng; chưa kiểm tra điện thoại thật, Safari/Firefox hoặc người chơi thật. Bài production smoke chạy ở `127.0.0.1:4173`, không chứng minh website công khai hoạt động. CI từ xa và GitHub Pages chưa chạy. Kết quả mô phỏng xác nhận các bất biến được mã hóa, không xác nhận độ hay, độ cân bằng hoặc tính đại diện đời sống Việt Nam.

## 2. Kiến trúc cần giữ khi mở rộng

`src/ui/` nhận lựa chọn → `src/application/useGameSession.ts` điều phối → `src/engine/engine.ts` chuyển trạng thái → `src/domain/model.ts` định nghĩa dữ liệu → `src/persistence/saves.ts` lưu/khôi phục. `src/content/` chứa quy tắc bối cảnh, nghề, sự kiện và tuyến truyện. `src/diagnostics/` cùng `scripts/` chạy mô phỏng và kiểm tra nội dung.

Game dùng seed và action log để phát lại. Thay đổi mô hình khởi tạo, luật tuổi thọ, cấu trúc NPC hoặc nội dung có thể làm bản lưu cũ không còn phát lại giống trước. Trước khi phát hành thay đổi như vậy, quyết định chính sách tương thích, tăng version phù hợp, có migration hoặc thông báo từ chối rõ ràng, và thêm test cho cả save cũ lẫn save mới. Không sửa trực tiếp trạng thái từ UI hay bỏ đối soát sổ cái để làm tính năng mới.

## 3. Khoảng cách với mong muốn của chủ dự án

| Mong muốn đã nêu                                                                                | Hiện trạng thực tế                                                                                                                               | Ưu tiên             |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- |
| Tự nhập tên nhân vật                                                                            | Tên đang chọn từ danh sách trong `src/engine/engine.ts`; màn tạo kiếp không có ô tên                                                             | P1                  |
| Tự chọn nơi và năm sinh                                                                         | Chỉ chọn 3 bối cảnh vùng và 3 năm 1975/1995/2005; `RunSetup` và schema save cũng giới hạn như vậy                                                | P1                  |
| Chọn điều kiện gia đình, có cả cha mẹ/chỉ cha/chỉ mẹ/sống riêng với một người, tính cách cha mẹ | Gia cảnh tạo ngẫu nhiên; cha và mẹ luôn được tạo, chưa có cấu hình tính cách                                                                     | P1                  |
| Sự kiện kỳ bí, cơ chế tăng tuổi thọ                                                             | Chưa có hệ thống này; game kết thúc muộn nhất ở 82 tuổi (`src/engine/engine.ts`)                                                                 | P2                  |
| Mỗi đợt có bản chơi trên `github.io` để quan sát                                                | Chưa có remote, chưa có deploy, chưa có URL                                                                                                      | P0                  |
| Chia sẻ game qua đường link, chưa kiếm tiền                                                     | Ứng dụng hiện không có thanh toán/đăng nhập; GitHub Pages công khai sẽ cho **bất kỳ ai biết URL** truy cập, không phải chế độ chỉ người được mời | Ràng buộc phát hành |

## 4. Backlog theo thứ tự

### P0 — Đưa beta hiện tại lên GitHub Pages, xác minh trên URL thật

1. Xác nhận tài khoản và tên repository đích; thiết lập remote cho checkout chính. Không tự đoán chủ sở hữu hoặc URL.
2. Chọn repo công khai phù hợp với mong muốn chia sẻ bằng link. Trước khi bật Pages, giải thích rõ trang công khai có thể được người khác tìm thấy; nếu cần hạn chế người xem thì phải chọn phương án truy cập khác.
3. Cấu hình Vite `base`: `/` cho `<user>.github.io` hoặc domain riêng; `/<repo>/` cho project Pages. Hiện `dist/index.html` dùng `/assets/...` và `/favicon.svg`, nên bản build hiện tại chưa phù hợp với đường dẫn con.
4. Thêm workflow build/deploy GitHub Pages, với quyền `contents: read`, `pages: write`, `id-token: write`, artifact `dist` và environment `github-pages`; chỉ deploy sau khi các kiểm tra đạt. Cấu hình Pages source là GitHub Actions.
5. Commit và push; theo dõi CI/deployment trên GitHub; mở URL thật để kiểm tra tải CSS/JS/font, tạo và chơi một đoạn, reload và autosave. Ghi commit SHA, URL, kết quả kiểm tra và lỗi nếu có. Kiểm tra save theo origin mới; dữ liệu ở localhost sẽ không tự chuyển sang Pages, cần export/import.

### P1 — Tạo nhân vật và gia đình theo lựa chọn

1. Thiết kế màn bắt đầu cho tên, năm/nơi sinh, điều kiện gia đình, cấu trúc người chăm sóc và tính cách cha mẹ. Giữ lựa chọn ngẫu nhiên như một chế độ.
2. Mở rộng `RunSetup`, mô hình NPC/household và logic tạo kiếp; đảm bảo lựa chọn thực sự ảnh hưởng sự kiện, quan hệ và kết quả. Không để UI nhận lựa chọn nhưng engine vẫn sinh cấu trúc mặc định.
3. Xử lý các sự kiện tham chiếu cha/mẹ khi nhân vật đó vắng mặt; thêm test cho từng kiểu gia đình, các năm/vùng được hỗ trợ và phát lại save. Chốt phạm vi năm/địa danh trước khi viết nội dung lịch sử tương ứng.

### P2 — Kỳ bí và trường thọ

1. Thiết kế mức độ hư cấu, cách kích hoạt và đánh đổi của sự kiện kỳ bí; phân biệt rõ với lịch sử thật trong nội dung.
2. Thay trần tuổi 82 bằng luật tuổi thọ có giới hạn và cân bằng; rà soát mốc tuổi, thế giới tương lai, NPC, sức khỏe, hồi ký, mô phỏng, invariant và save/replay.
3. Thêm test cho nhánh trường thọ, kết thúc hợp lệ, tương thích save và những cuộc đời dài hơn bình thường; chơi thử để kiểm tra nhịp chơi.

### P3 — Chơi thử và cân bằng

Thử trên điện thoại thật và nhiều trình duyệt; ghi thời lượng, chỗ bỏ cuộc, độ lặp tuyến gia đình, nợ và cảm giác lựa chọn. Hiện mô phỏng cho thấy tuyến gia đình hoàn tất 1.000/1.000 lượt và tài sản ròng thấp nhất −61.813 đSM; đây là tín hiệu cần xem bằng người chơi thật, chưa đủ để kết luận lỗi cân bằng.

## 5. Quy tắc cho mỗi lượt Codex tiếp theo

1. Bắt đầu bằng `git status`, HEAD, remote, workflow và tài liệu này. Đối chiếu với mã thật; không coi báo cáo cũ là kết quả kiểm thử mới.
2. Nêu phạm vi thay đổi và test liên quan. Dùng skill phù hợp với pha công việc nếu đang có trên máy; chỉ đọc skill cần dùng. Không làm lại phần đã được chứng minh là ổn nếu không có lý do.
3. Sau khi sửa, chạy ít nhất `npm.cmd run verify`; khi đổi engine/nội dung/save chạy thêm `npm.cmd run simulate`; khi đổi UI/luồng chơi chạy `npm.cmd run test:e2e`; khi đổi cấu hình build/deploy chạy `npm.cmd run test:production` và thử trên URL Pages thật. Sửa lỗi rồi chạy lại các kiểm tra liên quan.
4. Với **mỗi lượt giao việc triển khai sau này**, yêu cầu Codex tạo commit có nội dung rõ, push lên GitHub và cập nhật GitHub Pages sau khi kiểm thử đạt. Chỉ báo thành công khi đã xác nhận deployment và game chạy trên URL thật. Nếu thiếu remote, quyền hoặc Pages setup, ghi đúng blocker và bước cần chủ dự án thực hiện; không ghi “đã deploy” khi mới build cục bộ.
5. Bàn giao ngắn gọn: thay đổi, kết quả test, commit SHA, nhánh/remote, CI, deployment, URL live, các giới hạn còn lại. Cập nhật trạng thái ở file này cùng commit tương ứng.

**Tài liệu triển khai chính thức:** [Vite — Deploying a Static Site](https://vite.dev/guide/static-deploy.html); [GitHub — Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages); [GitHub — Pages site visibility](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site).

## Đợt phát hành GitHub Pages — 30/10/2026

Repository công khai đã tạo: https://github.com/Johnathanjjnbao/mot-kiep-viet. Pages source đã đặt workflow. Build base /mot-kiep-viet/, không đổi engine/content. Local verify 22/22 test, lint/typecheck/content/build PASS; production subpath smoke và browser desktop/mobile (chọn, tiến thời gian, autosave reload, manual slot load, font/assets) PASS. Audit 0 CVE được biết, quét file/history chưa thấy credential. Workflow và URL công khai đang chờ xác minh, G5 INCOMPLETE. Trạng thái đợt phát hành này thay phần mô tả chưa có remote ở báo cáo baseline phía trên; giữ baseline làm lịch sử.
