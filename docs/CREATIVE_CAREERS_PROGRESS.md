# Nghề sáng tạo — tiến trình và checkpoint tạm dừng

Trạng thái: **PAUSED theo yêu cầu chủ dự án ngày 02/11/2026**. Không tiếp tục tự động; chờ prompt mới. Tiếp tục tại checkpoint này, không dựng lại A–E hoặc làm lại các nghề đã có.

## Mốc Git và bản công khai

- Workspace: `C:\Users\triba\OneDrive\Desktop\game`.
- Branch `main`, HEAD `5a30670d0d12c4b78c62678c1a770c0fd202e6ab`.
- [Repo](https://github.com/Johnathanjjnbao/mot-kiep-viet), [bản công khai](https://johnathanjjnbao.github.io/mot-kiep-viet/).
- Bản realism/tuổi thơ/ngoại hình/giao diện **0.3.9-realism.1 đã phát hành và xác minh**, nguồn `a2fc1b284a300fdfdbd0846b3cf5a68f283029b9`; commit tài liệu HEAD nêu trên có [CI41396228543](https://github.com/Johnathanjjnbao/mot-kiep-viet/actions/runs/41396228543) completed/success. Bằng chứng lịch sử giữ nguyên.
- **Toàn bộ phần F phía dưới còn ở working tree, chưa commit/push/deploy.** Không reset/clean hoặc ghi đè các thay đổi này.
- Selector mới `creative-v1` kế thừa realism; mặc định NewLife vẫn `realism-v1` (bốn chỗ trong `src/ui/NewLife.tsx`). Engine/content3.0.0, schema4; frozen v1/v2 và16 golden lịch sử không sửa. Chưa tạo golden riêng cho creative.

## Đã triển khai cục bộ

| Phần | Có thể chơi và lưu/phát lại |
| --- | --- |
| F1 freelancer | Sáu dịch vụ: lập trình, thiết kế, dịch thuật, viết nội dung, marketing, hỗ trợ kỹ thuật. Hỏi việc→báo giá→nhận/từ chối→thực hiện→giao→xét→sửa hoặc thỏa thuận phần phí→trả/không trả→khép. Có kỹ năng/bằng phù hợp/uy tín, deadline, phí thật, sổ chi phí và chống payout hai lần.12 cảnh v13. |
| F2 gaming | Gắn một kênh creator đang LIVE có thiết bị phù hợp; kỹ năng chơi, cộng đồng, giữ người xem, chi phí tập, mệt và thi đấu có thắng/thua/giải phụ. Dùng chung audience/platform payout của kênh, không tạo bộ đếm hoặc thu nền tảng thứ hai. YouTubeLIVE chỉ mở ở selector mới theo era game.8 cảnh gaming v14. |
| F4 hợp tác | Ba đối tác hư cấu, điều kiện chia công/quyền đăng, độ hợp chủ đề, khán giả trùng, báo giá/nhận lịch/chi phí/kết quả. Có tăng/zero/giảm theo dõi hoặc từ chối; dùng một audience, không tự trả thêm phí nền tảng. Tối đa6 cuộc hợp tác chi tiết cả đời.4 cảnh v14. |
| F3 biểu diễn/idol | Âm nhạc, vũ đạo, diễn xuất; học/tập có phí, tối đa4 audition có trượt/offer, chọn tự do hoặc tổ chức36 tháng với phần chia30%/45%, show có gross/share/net/cost/fans thật, có show không phí. Burnout/nghỉ/khép/trở lại một lần có phí và thời gian chuẩn bị. Lưu toàn bộ invoices, UI giữ12 báo cáo gần nhất.10 cảnh v15. |
| Tích hợp | Dispatch/CAS và Zodstrict, clock tháng, ledger, invariant, canonical save/replay, các panel nghề, HUD đọc run, hồi ký. Một book biểu diễn trong trần4 book dùng chung shop/channel/project/artist kể cả hồ sơ đã khép; gaming/collab nằm trong book kênh. Giữ512 actions/120 quản lý/5MiB; không thêm focus hoặc click advance bắt buộc. |

Đã sửa trong review: chặn comeback khi đang nhận lương khoán business/freelance; kiểm tra bằng ca có việc thật. Hồ sơ trẻ/đời cũ không nhận luật nghề mới. Không SQL/Auth/RLS, DB-ID hoặc production deletion; cloud owner login vẫn NOT RUN.

## Bằng chứng đã chạy

- **1.000 đời creative-stress-0…999 +1.000 replay: PASS**,0 vi phạm,0 fallback,0 tuổi thiếu/0 tuổi bỏ. Max437 actions,907668 bytes,5634 postings kể cả quỹ hộ; tuổi63–104. Max replay2863ms, heap sample117055040 bytes trên Node chạy QA; không phải phép đo browser memory leak.500 trai/500 gái.
- Batch có600 đời freelancer/800 hồ sơ (52 trả đủ,22 trả một phần,7 unpaid; còn lại thất bại/từ chối/dừng/quá hạn); đủ sáu dịch vụ.386 đời gaming; có338 giải chính,413 giải phụ,474 lần không giải.587 đời hợp tác có550 tăng,273 zero,93 giảm,699 từ chối,98 hủy.600 đời biểu diễn gồm đủ ba chuyên môn,9437 show/788 show không phí và422 lần comeback. Đây là kết quả QA, không phải tỷ lệ ngoài đời.
- Báo cáo đầy đủ: `docs/evidence/creative-1000-lives.json`; fingerprint source/policy ở `creative-paused-source-manifest.json`. Không chạy lại1.000 đời nếu engine/content/policy không đổi; kiểm manifest trước.
- Full `npm.cmd test` gần nhất: **320 tests/34 files PASS**, gồm16 golden cũ, trước một số sửa review/fixture/UI cuối. Không coi đây là full-suite PASS cho trạng thái tạm dừng hiện tại. Sau đó focused F3 **6/6 PASS**, forced portfolio **1/1 PASS**; F1 **11/11**, gaming/collab **4/4** đã qua ở mốc triển khai. Dự kiến tổng322 sau hai ca thêm, cần xác nhận lại bằng full verify.
- Ba hành trình Edge ×desktop/mobile đã PASS ở dev: F1 trả đủ/bị từ chối/rework→partial, F2 thi mất phí nhưng không giải +hợp tác, F3 tập→audition→offer→show trả tiền/agency share→từ chối→comeback. Replay/axe0 và reload; F1/F3 kiểm cả3 slot/export/import. **Đây chưa phải sáu browser combinations trên build/live mới.** Screenshot hiện có là mốc dev, một số copy đã sửa sau đó. Xem `creative-local-browser-checks.json`.
- Forced thật `university-1`: tốt nghiệp IT, ba con, việc tech, shop+channel+project+artist=4 book, gaming/collab; dùng đủ120 quản lý và kết thúc tự nhiên86 tuổi,356 actions,964357 bytes,5596 postings. Project paid,collab settled,48 show. Canonical/import PASS. **Không gọi ca ghép này là100+**; batch chung có đời104. Báo cáo `creative-forced-paths.json`.
- Probe100 ban đầu99 PASS/1 lỗi ở QA policy: thử nhận hợp tác khi kênh đang nghỉ. Đã sửa điều kiện policy và giữ nguyên guard game; final1000 nêu trên sạch. Không nhận probe ấy là100/100 PASS.

## Điểm đang dở lúc tạm dừng

**Chưa hoàn thành kiểm tra sáu viewport cho34 cảnh mới.**

- `scripts/creative-viewport-fixtures.ts` thu được33/34 cảnh từ lịch sử thật, rồi dừng với `Missing canonical creative scenes: ar-first-show`.
- `ar-first-show` có trong batch1000 (56 lần được trình bày); không được kết luận cảnh không thể xuất hiện. Cần tìm lịch sử thật ở giai đoạn showCount<6 và active; không forge activeEvent, RNG, tiền hoặc kỹ năng để tạo fixture. Selector ưu tiên event có priority dương; pending family có thể chiếm slot priority0, nên fixture đông con có thể bỏ qua cửa sổ first-show.
- Generator chưa ghi `tests/data/creative-viewport-replays.json` do còn thiếu cảnh này. Vì vậy **test mới `tests/e2e/creative-viewport.spec.ts` chưa thể PASS** và chưa chạy sáu viewport×34 cảnh +20 quyết định đầu/giữa/cuối. Không ghi nhận viewport acceptance của F.
- `scripts/qa-creative-viewport.ts` và E2E đã tạo; khi đủ fixtures sẽ đo toàn bộ HUD/narrative/first choice trước click/scroll, kiểm innerWidth/Height=device viewport, reduced-motion và font lớn.
- Trong quá trình tạo fixtures đã sửa riêng helper `advanceStudy` cho creative để tôn trọng grace6 tháng, đủ quỹ và không quit khi hồ sơ xin việc bị từ chối. Không đổi luật trường học/engine cũ. Cần kiểm typecheck/lint/full tests lại sau các sửa helper/generator cuối.
- Một số probe nhiều seed cho portfolio gặp tiền đề helper/nhánh lương khoán không phù hợp; chúng không phải các ca PASS. Xem `.local/native-family-probes.json`; không dùng để tuyên bố mọi seed chơi được combo giống nhau.

## Thứ tự tiếp tục khi có prompt mới

1. Đọc file này, PROJECT_STATUS/HANDOFF, git status/HEAD/remote/workflow; giữ nguyên working tree. Không dựng lại bản realism đã release hoặc F1/F2/F3/F4 đã có.
2. Theo scope prompt mới; nếu vẫn hoàn thiện F, giải quyết fixture thật `ar-first-show`, dọn typecheck/lint của generator và chạy sáu viewport×34 cảnh +20 quyết định. Không hạ tiêu chí/ẩn narrative/nâng512 để vượt gate.
3. Tạo golden creative riêng (opening/full-life/portfolio), giữ16 golden lịch sử; hoàn tất ca native100+ có bằng chứng rõ nếu yêu cầu combo dài, cloud envelope PGlite nếu payload bị ảnh hưởng. Không coi PGlite là JWT/A-B-anon thật.
4. Chỉ sau đường sinh→trưởng thành và đời dài ổn định mới đổi default NewLife sang creative-v1; cập nhật kỳ vọng E2E cho đời mới, giữ fixture đời cũ. Hiện CHƯA đổi default hoặc package version.
5. Final `npm.cmd run verify`, build Pages với `VITE_BASE_PATH=/mot-kiep-viet/`, production smoke trên đúng build, đầy đủ E2E (dự kiến108 nếu giữ các test mới), sáu browser native trên build, diff/audit/secret scan source+history+public files. Các gate này cho release F đều còn PENDING; không tự nhận PASS từ kết quả release cũ.
6. Sau khi release-ready và theo scope đã được user cho phép: commit/push main, exact-SHA Actions success, asset hash và G5 live desktop/mobile; cập nhật bằng chứng và handoff. Không push code/gates lỗi. Hiện chưa commit/push bất kỳ phần F nào.

## Files và môi trường cần giữ

- Core mới: `src/domain/{freelance,creative-careers,artistic}.ts`, `src/engine/{freelance,creative-careers,artistic}.ts`, content services/peers/events tương ứng, `src/diagnostics/creative-policy.ts`.
- UI: `FreelancePanel.tsx`, `ChannelCareers.tsx`, `ArtisticPanel.tsx`; wiring trong Panels/LifeScreens/CreatorEconomyPanel/EnterprisePanel/styles và summary.
- Tests/helpers/E2E mới đều đang untracked hoặc modified; dùng git status, không bỏ sót khi review sau này.
- Bằng chứng riêng: `.local/creative-1000-final.{json,log}`, `.local/{freelance,creative,artistic}-browser.{json,log}`, `.local/creative-fixtures.log`, `.local/native-full-tests.log`, `.local/artistic-review-tests.log`, `.local/creative-forced.log`, `.local/creative-paused-checkpoint.json`.
- Dev server5174 của lượt này đã dừng; các browser QA đã đóng. Preview session5173 lịch sử không còn trong phiên tool. Không kill process khác. Bản A–D lưu build riêng ở `.local/realism-release-dist`; giữ archive này.
- Node/npm: thêm `C:\Program Files\nodejs` vào PATH, dùng npm.cmd trên PowerShell. Graft: `C:\Users\triba\Documents\Codex\MKV_TOOLS\graft.cmd`. Graft-first, không Antigravity/cài lại môi trường. Không tạo agent phụ nếu user/AGENTS chưa yêu cầu.

Đã tạm dừng theo yêu cầu; checkpoint ghi lúc 2026-11-02T15:21:58+07:00.
