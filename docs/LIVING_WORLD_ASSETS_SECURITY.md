| Mức | Phát hiện còn mở |
|---|---:|
| Critical |0|
| High |0|
| Moderate |12gói dev do dependency audit|
| Low |0|
| Tổng |12gói, không đồng nghĩa12lỗ hổng độc lập|

# Security review — Living World & Assets

Ngày04/11/2026. Phạm vi: đường dữ liệu mới của assets-v1, từ UI command/import tới replay, quyền sở hữu, sổ tiền, lưu/khôi phục và lịch sử. Đây là review có phạm vi, kết hợp đọc luồng và kiểm thử động; không phải chứng nhận toàn bộ ứng dụng không có lỗ hổng.

## Runtime và dữ liệu

Không tìm thấy lỗ hổng khai thác còn mở trong các đường tài sản đã review. UI chỉ giữ draft và gửi command; `livingAssetActionSchema` strict cho từng operation, enum slot và expected sequence. Engine kiểm tuổi18+, thời kỳ, context, ownership, đủ tiền/điều kiện vay, cấu hình và ngân sách trước khi trả clone mới. Pending story không còn đủ4choice sau đổi tài sản sẽ từ chối toàn bộ clone; policy kiểm thử đã được sửa để trả lời story trước, không bỏ guard.

Số dư đi qua `transact`, kiểm số nguyên an toàn/không âm, ID giao dịch và đối ứng giá trị. Cọc phải thu, tài sản sở hữu, vốn cửa hàng, nợ sinh hoạt và gốc vay tài sản được đối soát riêng. Giá mua/tuổi linh kiện là chứng từ, không cộng thêm vào net worth. Khoản thu hồi dùng đúng linh kiện được thay.12loan records/8owned assets/120optional/512actions/5MiB vẫn được giữ; routine settlement không thêm user action. Không Math.random trong luật mới.

Parser vẫn phát lại toàn bộ rồi so canonical. Negative import thử đổi owner, tăng tiền và thêm command field lạ đều bị từ chối. Ca double command/bán lại/thiếu tiền/sai socket/RAM/nguồn/kích thước/tản nhiệt, vay không đủ thu nhập, mua trước18 và giới hạn hợp đồng đều được kiểm. Các test không tạo tài sản, số dư hoặc NPC giả để nhận PASS.

Chuỗi input mới không đi vào SQL, shell,eval hoặc HTML không escape trong runtime. Tên/nhãn được React trình bày như text. Không thêm API giá, nội dung tải từ xa hoặc credentials vào game. Các script Node QA chỉ chạy ngoài browser; không được nhập vào bundle ứng dụng.

## Persistence, account và service worker

Không đổi Auth/RLS/SQL, worker token source, ID database hoặc cache policy của service worker. Diff so baseline ở src/cloud,supabase,public/sw.js rỗng. Workflow chỉ nâng ngân sách job từ 40 lên 60 phút sau khi lượt local 130 E2E cần 34,4 phút; không bỏ gate hoặc đổi quyền. Migration003 hiện hành cho phép envelope schema4/actions512; không có allowlist action cũ cần nới. Điều này không thay cho kiểm Auth/JWT thật.

Archive giữ UUID ngoài RNG và kho history độc lập. Browser mới xác minh hai đời112/107tuổi, khoản nợ tài sản còn sau death, export canonical và mở autosave khác vẫn giữ hai hồi ký. UI refresh khi archive hoàn tất để tránh đọc danh sách rỗng cũ; không sửa hoặc xóa các record để che lỗi. Summary tính cả nợ tài sản.

Owner tự đăng nhập live: **NOT RUN**. Fresh A/B/anon deny với JWT thật: **NOT RUN**; không có bộ tài khoản synthetic được cung cấp trong cấu hình hiện tại. Không tạo Auth identity mới hoặc dùng credential người chơi. PGlite/unit/CAS không được gọi là bằng chứng live Auth.

## Dependency — Moderate, confidence High cho kết quả audit

[Audit production](evidence/assets-audit-production.json):0vulnerabilities. [Audit toàn bộ](evidence/assets-audit-all.json):12moderate,0high/critical; chuỗi ESLint/typescript-eslint/minimatch của dev tooling, đã có trước bản tài sản. Package lock chỉ đổi version ứng dụng, không thay cây dependency.

Advisory upstream [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) mô tả khuếch đại xử lý glob từ pattern do bên ngoài kiểm soát, có thể tiêu tốn CPU/bộ nhớ; mức moderate, bản vá minimatch11.0.1. Đây là vấn đề của đường xử lý glob, không phải một cơ chế tiền hoặc mạng mới của game. Không suy từ audit production0 thành bảo đảm mọi dev task an toàn với input không tin cậy.

Chưa sửa chuỗi dev trong phiên này: audit đề xuất đổi major/downgrade các công cụ, và không có fix tự động cho toàn cây. Không chạy `npm audit fix --force`. Bước tiếp là kiểm phiên bản tương thích của toolchain trong một thay đổi riêng, chạy đầy đủ lint/build/CI. Đây là rủi ro còn mở đã ghi nhận, không bị giấu bằng ignore hoặc nâng ngưỡng.

## Bằng chứng và giới hạn

- Fresh verify tại candidate:468tests/47files và37golden, gồm29golden lịch sử không đổi.
-1.000đời/1.000canonical replay hoàn tất, với báo cáo999+1 và raw FAIL ban đầu được giữ: [report](evidence/assets-1000-lives.json).
-25cảnh/100nhánh canonical, sáu viewport×20lựa chọn; [forced paths](evidence/assets-forced-paths.json) kiểm dự trữ,120optional,12loans và death còn nợ.
- [Sáu browser combinations local](evidence/assets-browsers-local.json) gồm tạo đời mới,tài sản,financing,nâng PC,save/load,history. Chromium là Edge; Firefox mobile là viewport/touch, không phải thiết bị thật.
- Secret scan checkpoint A:2036text objects/0findings, gồm working/publicdist/reachableGitblobs. Scan cuối trước push và CI sẽ được ghi riêng trong progress; không dùng mốc cũ làm kết quả scan cuối.
- Scan sau checkpoint `15372d4`: **2.191 text objects, 0 findings**, gồm working files, public dist và toàn bộ reachable history. [Raw report](evidence/assets-secret-scan-local.json). CI sẽ quét tiếp đúng commit được push.

Chưa có patch Critical/High cần phê duyệt. Review này không thay pentest backend hoặc fresh cloud deny QA. CI/live của release chỉ nhận VERIFIED PASS khi đúng SHA hoàn tất và được chơi trên URL thật; trạng thái ở LIVING_WORLD_ASSETS_PROGRESS.md.
