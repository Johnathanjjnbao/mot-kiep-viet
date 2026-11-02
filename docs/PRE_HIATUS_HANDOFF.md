# Một Kiếp Việt — bàn giao trước kỳ nghỉ

Trạng thái03/11/2026: **LOCAL GATES — VERIFIED PASS; RELEASE — INCOMPLETE**. Source0.3.10-stable.1 đạt401tests/29golden/120E2E,6browser combinations và1.000+1.000replay. Website công khai vẫn là0.3.9-realism.1. Backup/restore, commit/push, CI/liveG5 còn phải hoàn tất; SHA/tag/CI/backup cuối ghi trong PRE_HIATUS_RELEASE_REPORT khi có bằng chứng. Tiếp tục từ checkout hiện tại, không dựng lại dự án.

Repo: https://github.com/Johnathanjjnbao/mot-kiep-viet. Live: https://johnathanjjnbao.github.io/mot-kiep-viet/. Thư mục làm việc: `C:\Users\triba\OneDrive\Desktop\game`. WIP nghề đã được giữ trong checkpoint66a961d7c2cedd668f0381a48758a56d602f4e1d và ZIP riêng, xem release report. Không xóa hoặc thay thư mục gốc khi thử khôi phục.

## Đọc trước khi tiếp tục

Đọc AGENTS.md, PROJECT_STATUS.md, PRE_HIATUS_RELEASE_REPORT.md, tài liệu này và phần đầu HANDOFF.md. CREATIVE_CAREERS_PROGRESS.md giữ checkpoint lịch sử; các đoạn PAUSED cũ không phải trạng thái mới nhất. LIFE_EXPANSION và các golden giữ lịch sử luật. ROADMAP là backlog, không tự mở thêm phạm vi.

## Bản đồ kỹ thuật

| Nơi | Trách nhiệm |
|---|---|
| src/domain | GameRun/RunSetup/RunAction, strict schemas, capability predicates, tiền tệ |
| src/engine/engine.ts | createRun, dispatch, choose, advance, replay; luật/RNG/lịch độc lập UI |
| src/content | EVENTS, era/vùng/nghề, template và điều kiện; stable-events có56cảnh/8arc |
| src/engine/finance.ts và settlement | Mọi khoản tiền qua transact; số nguyên VND thiết kế2026, doanh thu khác lợi nhuận |
| src/application | useGameSession, storyAction/decisionKey chống double dispatch; ngân sách còn lại |
| src/persistence | Parse/replay/canonical, IndexedDB, autosave/3slot và history độc lập; guest CAS qua GuestRepository |
| src/cloud; persistence/account-cache | Account riêng, JWT closure gắn từng user, queue/CAS/recovery của cloud |
| src/ui | Chỉ dispatch; HUD đọc GameRun. NewLife/SaveManager tải sẵn; bảng phụ tải khi mở, có quay lại nếu lỗi |
| src/legacy/v1,src/legacy/v2 | Luật/nội dung đóng băng; schema1/2 và3 không phát lại dưới luật mới |
| tests,scripts | Golden/unit/integration, mô phỏng, browser/viewport, production/asset/secret checks |
| .github/workflows/pages.yml | main/manual → npmci → verify/scan/E2E/production → dist artifact → deploy |

Engine/content3.0.0, schema4. stable-v1 kế thừa creative-v1 → realism-v1 → creator/enterprise/annual/employment/academic qua capability predicates. setup.lifeRules và setup.expansion bất biến. New lives dùng stable-v1; đời cũ giữ selector cũ.29golden độc lập gồm16historical,7creative,6stable. Không cập nhật expected cũ để chữa lỗi mới.

Giữ512actions/120lượt chủ động/5MiB. Bốn hồ sơ chi tiết trong cả đời gồm tiệm+kênh+dự án+nghệ sĩ, kể cả hồ sơ đã khép. Gaming và collaboration dùng kênh có sẵn; không nhân đôi audience/payout. Cảnh năm thay slot năm, không mở thêm clock/focus bắt buộc. Không tự chết vì hết chỗ lưu.

Guest CAS bảo vệ cả autosave và slot. Một tab ghi xung đột không ghi đè tab khác; nhánh hiện tại vẫn ở UI để xuất tệp. Thông báo này không có nghĩa đã tạo recovery branch trong tài khoản. Cùng IndexedDB ID/version1, không migration dữ liệu người chơi. History vẫn ở database riêng; UUID cuộc đời ngoài RNG, seed không phải khóa.

## Mở lại môi trường Windows

Máy kiểm tra: Node26.13.0, npm11.20.0, CodexCLI0.166.0. package yêu cầu Node>=24; CI dùng24. Dùng lockfile và npm.cmd. Không cần cài thêm editor hoặc thay công cụ.

```powershell
Set-Location -LiteralPath 'C:\Users\triba\OneDrive\Desktop\game'
git status --short
git branch --show-current
git rev-parse HEAD
git remote -v
npm.cmd ci
npm.cmd run dev
```

Codex CLI đã có tại `%APPDATA%\npm\codex.cmd`; `codex.cmd --version` và `--help` đã chạy được. Từ thư mục dự án, chạy `codex.cmd` để mở phiên làm việc; tham khảo [OpenAI Docs — Codex CLI](https://learn.chatgpt.com/docs/codex/cli). Không ghi credential vào prompt hoặc bàn giao. Tình trạng đăng nhập CLI sau nhiều tháng cần chủ máy tự kiểm tra; bản bàn giao không khẳng định phiên đăng nhập vẫn còn hiệu lực.

Graft chạy được tại `C:\Users\triba\Documents\Codex\MKV_TOOLS\graft.cmd`; graph là cache local bị git-ignore. Dùng map/ask/grep/callers theo đúng câu hỏi, build sau thay đổi lớn. Trail wrapper có trong môi trường; chức năng học/lưu skill của Trail **NOT RUN** trong phiên này. Không có thao tác lưu/update lesson khi chưa được người dùng đồng ý.

Skills đã đọc và áp dụng theo từng phần: Context Map, Humanizer, Frontend Design, UI UX Pro Max, Webapp Testing, Web Design Reviewer, Security Review, Secret Scanning, Documentation Writer, OpenAI Docs. Kiểm lại `%USERPROFILE%\.agents\skills` và `.codex\skills` khi mở lại; không cài hàng loạt.

## Kiểm tra và phát hành

```powershell
$env:VITE_BASE_PATH='/mot-kiep-viet/'
npm.cmd run verify
node scripts/scan-secrets.mjs
$env:E2E_PRODUCTION='1'
npm.cmd run test:e2e
npm.cmd run test:production
```

Build release dùng public cloud configuration đúng như workflow. Private env ở máy không nằm trong backup. Đổi engine/content chỉ sau kế hoạch ruleset/version và regression; chạy1.000seed khi các phần đó thay đổi. UI đổi cần E2E; đo HUD/narrative/toàn bộ lựa chọn đầu trước click/cuộn, không dùng auto-scroll làm bằng chứng fit. Giữ frozen goldens, không nâng giới hạn hoặc ngưỡng warning để che lỗi.

Trước push kiểm git status/branch/HEAD/remote/workflow, chỉ stage tệp dự án, secret scan cả source/public dist/history. Sau push theo đúng SHA đến CI build/deploy completed/success, so hash assets và chơi URL thật trên desktop/mobile. HTTP200 không thay gameplay. Chưa đủ bằng chứng thì ghi INCOMPLETE/FAIL/BLOCKED/NOT RUN; không ghi deployed/PASS.

## Hệ thống hiện có và giới hạn

Creator, avatar trai/gái/tóc/sáu tuổi đời;45cảnh tuổi nhỏ, quỹ hộ và tiền cá nhân; học12ngành, học phí/pause/resume; tuyển dụng và thất nghiệp; tình cảm/hôn nhân/nuôi con; shop/kênh video-LIVE; freelance6dịch vụ; gaming,collab,biểu diễn3chuyên môn; autosave/3slot/export/import/history đều thuộc source đang kiểm chứng.56cảnh stable ưu tiên trung niên/cao tuổi có quyền tiếp tục hoặc rút lui, không tự tạo tiền/job/NPC.

Giới hạn cần đọc cùng báo cáo cuối: bundle vẫn>500kB; tải/phát lại bản lưu dài nhiều sổ trên CPU chậm có độ trễ rõ. Phép đo bộ nhớ là mẫu thử, không chứng minh zero leak trên mọi thiết bị. npm audit có1advisory moderate ở công cụ dev/12dependency entries; production dependencies0. Xem PRE_HIATUS_SECURITY_REVIEW.md. Không dùng0finding security scanner để thay audit logic.

Owner tự đăng nhập Email/Password live: **NOT RUN** trong phiên. Fresh live A/B/anon cloud deny: **NOT RUN**; không đổi Auth/RLS/SQL. Không dùng tài khoản người chơi. SMTP/invitation mới ngoài phạm vi. Các migrations đã applied giữ nguyên; production SQL mới cần review/project approval riêng. Không xóa production, kể cả fixture.

Save localhost không tự chuyển sang github.io: xuất/nhập tệp. Các game cùng origin có thể dùng chung IndexedDB; giữ DB ID và không host game khác dùng ID này trên cùng origin. Khi bị conflict, xuất nhánh còn trên màn hình trước khi tải lại.

## Sau kỳ nghỉ

1. Mở đúng repository, kiểm status/branch/SHA/tag/remote trước sửa; giữ mọi WIP mới của chủ dự án.
2. Đối chiếu release report và manifest backup; thử khôi phục vào thư mục mới nếu cần, không chép đè checkout gốc.
3. Cài dependency từ lockfile, kiểm Node/npm, skills và Graft.
4. Chạy smoke/verify trên baseline; mở production và xác nhận phiên bản/asset/gameplay.
5. Đọc các P2 và NOT RUN; hỏi ưu tiên sản phẩm mới của chủ dự án khi phiên bản hiện tại đã rõ.
6. Tạo nhánh/checkpoint codex/ cho phần tiếp theo; lập kế hoạch version/capability trước đổi luật/save.

Ưu tiên bảo trì tiếp theo: dependency dev advisory, giảm chi phí replay bản dài bằng giải pháp có profile/regression, UI khám phá nghề và thêm tình huống có điều kiện. Các hệ thống nhà/xe/điện thoại-PC, du học/di cư, VND danh nghĩa lịch sử, nghĩa vụ quân sự sau nghiên cứu pháp lý/lịch sử, siêu nhiên hiếm và đời hàng trăm/nghìn năm ở backlog. Phiên này không triển khai chúng.
