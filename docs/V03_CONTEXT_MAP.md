# Context map v0.3 — đã rà soát trước triển khai

Baseline main 479fa05fcaef005700919e0cfc3ee7dcad46cf9e, working tree sạch. Không có cấu hình/tool Supabase, Docker hay PostgreSQL CLI trên máy tại lúc kiểm tra. Đang hỏi chủ dự án về project thật; không chạy SQL production khi chưa xác nhận đích/quyền.

| File / vùng thay đổi                                        | Mục đích                                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------ |
| src/cloud/contracts.ts và repositories                      | Contract phiên guest/account, lưu theo user, validate cùng parser v2/v1        |
| src/cloud/auth.ts và SyncCoordinator                        | Auth SDK, callback subpath, queue/revision/conflict; engine không import cloud |
| src/persistence/account-cache.ts                            | Cache/queue theo UUID người dùng riêng, giữ database guest cũ                  |
| src/ui/Account.tsx, App.tsx                                 | Tài khoản/đồng bộ compact, feature gate mặc định tắt                           |
| src/application/useGameSession.ts, SaveManager, LifeHistory | Inject repository theo phiên; không chuyển guest tự động                       |
| supabase/migrations, tests/cloud-*                          | SQL/RLS, CAS/receipt, tests roles A/B/anon bằng PostgreSQL WASM                |
| docs và workflow                                            | Hướng dẫn setup/invite/recovery, cấu hình công khai khi được xác minh          |

## Dependencies và mẫu tái sử dụng

parseSave/snapshot/canonical là ranh giới tin cậy; không viết parser thứ hai. archiveLife/exportHistory/importHistory đang add-only theo UUID và giữ memoir, sẽ tái sử dụng validator. useGameSession điều phối autosave và archive; SaveManager ghi slot riêng. UI không dispatch vào engine v1. Luật/content/replay giữ engine/content 2.0.0, schema 3.

## Tests liên quan

49 test hiện hành, 10 E2E, production smoke và check-pages bảo vệ guest. Test mới phải gồm RLS deny bằng role không đặc quyền, receipt retry/concurrency, ownership, queue offline reload, session isolation, migration có xác nhận và mock Auth/UI. Live Auth/two-browser chỉ được PASS khi có project/session thật; mock không thay thế.

## Rủi ro và quyết định

- Không đổi ID/store guest, không upload khi vừa đăng nhập.
- Account cache/queue tách theo user, dừng worker/gỡ UI trước chuyển phiên.
- Cloud tắt nếu thiếu cấu hình hoặc chưa qua kiểm thử triển khai.
- Production SQL cần xác nhận project. PGlite chỉ là kiểm thử SQL/RLS cục bộ, không chứng minh Supabase Auth hoặc email thật.
- Các thay đổi simulation/content không thuộc phạm vi: không chạy lại 1.000 seed nếu không đổi luật.

Map đã được đối chiếu với imports, useGameSession, saves/history, UI và tests. Bắt đầu phần độc lập trong lúc chờ thông tin project.
