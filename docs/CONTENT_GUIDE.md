# Viết thêm một ngã rẽ

Nội dung trong `src/content` dùng TypeScript có kiểm tra schema. Hiện có 72 mẫu được viết riêng và một tình huống dự phòng không tính vào chỉ tiêu.

## Tạo sự kiện

Chọn tệp đúng nhóm: `growing-up.ts`, `work.ts`, `everyday.ts`, `world-events.ts`. Dùng các helper ở `authoring.ts` để khai báo ID, nhóm, tiêu đề, đoạn kể, điều kiện và ít nhất hai lựa chọn. Đưa sự kiện vào mảng tổng `EVENTS` qua nhóm tương ứng.

```ts
e(
  'repair-together',
  'relationship',
  'Sửa lại một góc nhà',
  'Cha giữ chiếc ghế, bạn thử đóng lại chân ghế đã lung lay từ lâu.',
  { minAge: 18, maxAge: 50, npc: 'father' },
  [
    c('learn', 'Cùng cha sửa', 'Tay nghề +5 · cha +6', 'Hai người thử đến khi ghế đứng vững.', [
      s('skill', 5),
      bond('father', 6),
    ]),
    c(
      'ask',
      'Nhờ người có kinh nghiệm',
      'Tri thức +4',
      'Bạn học cách nhận ra việc vượt tay mình.',
      [s('knowledge', 4)],
    ),
  ],
);
```

Các tên helper trong ví dụ là bí danh import của `event`, `choice`, `stat`, `bond`.

## Điều kiện và vòng đời

- `minAge/maxAge`, `minYear/maxYear`, region, housing, trạng thái nghề, trình độ đã hoàn thành, giới hạn chỉ số, flags, tiền mặt/nợ, công nghệ và NPC đều được xét trước chọn sự kiện.
- `npc` nhận ID hoặc vai trò (`mother`, `father`, `friend`, `child`); `adult-child` yêu cầu có con còn sống đủ 18 tuổi. `partner` yêu cầu bạn đời còn sống.
- `job: 'employed'` bắt buộc cho sự kiện mất việc. Nghề cụ thể có thể dùng `job: 'tech'`…
- Internet có ngưỡng thiết kế 2000, smartphone 2010; đây là thời điểm mở cơ chế trong game, không khẳng định mốc phát minh/phổ cập lịch sử.
- Sự kiện một lần mặc định `once: true`. Lặp lại phải đặt `once: false`, cooldown tính bằng tháng. Trọng số dương; priority cao được xét trước. Cơ hội mất việc còn chịu ảnh hưởng độ ổn định của nghề.
- Mọi sự kiện cần một lựa chọn luôn khả dụng trong điều kiện đã cho. Tránh chặn cả hai lựa chọn bằng tiền/học vấn.
- UI đọc cùng điều kiện và kiểm tra nghề/tiền từ engine. Không tính luật riêng trong nút giao diện.

## Hệ quả và câu chuyện dài

`stat`, `cash`, `flag`, `education`, `career`, `relationship`, `family`, `housing`, `habit` đều đi qua engine. `later(months, title, effects)` đặt hệ quả theo tháng; ID xuất phát từ lần chọn, không từ thời gian máy. Hiệu ứng được đánh dấu trước khi chạy, chỉ thực hiện một lần.

Chi phí tùy chọn phải hiện trong hint và có `requires.minCash`. Chi phí bất ngờ của kết quả ngẫu nhiên có thể phát sinh vay bù, nhưng phải được nói rõ trong đoạn kết quả. Không sửa `finance.cash` trực tiếp; mọi thay đổi phải đi qua sổ giao dịch.

Ba story arc khai báo ở `arcs.ts`. Mỗi chặng có `arc`, prerequisites và flags/delayed effects nối sang chặng sau. Từ chối tham gia hay thất bại đều là kết quả hợp lệ. Không viết đoạn hồi ký như thể thành tựu chưa xảy ra đã thành thật.

## Xuất xứ, nhạy cảm, phiên bản

Mặc định `provenance.kind = designed`. Bối cảnh lịch sử cần `historical-context`, nguồn gốc có URL và note phân biệt sự kiện lịch sử với hậu quả hư cấu. Tương lai từ 2027 luôn ghi giả định. Sự kiện thất nghiệp, chia tay, sức khỏe… cần sensitivity tương ứng.

Khi sửa nội dung đã phát hành, cập nhật content version và chính sách tương thích. Chỉ tăng `event.version` không đủ để giữ replay cũ. Không âm thầm tải save cũ bằng nội dung mới.

```powershell
npm.cmd run validate:content
npm.cmd test
npm.cmd run simulate
```

Validator hiện khóa tổng và phân bổ MVP. Khi chủ động mở rộng gói, cập nhật target cùng test và ghi rõ thay đổi. Các kiểm tra không thay thế đọc biên tập và chơi thử.
