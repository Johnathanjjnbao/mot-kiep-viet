# Viết thêm một ngã rẽ

Nội dung trong `src/content` dùng TypeScript có kiểm tra schema. Hiện có 72 mẫu được viết riêng và một tình huống dự phòng không tính vào chỉ tiêu.

## Tạo sự kiện

Chọn tệp đúng nhóm: growing-up.ts, work.ts, everyday.ts, world-events.ts. Dùng helper ở authoring.ts khai báo ID, nhóm, tiêu đề, đoạn kể, điều kiện và 4–6 lựa chọn có hậu quả khác nhau. Đưa vào EVENTS. v0.2 có 361 lựa chọn trên 72 mẫu: 71 mẫu có 5, education-path có 6; fallback riêng có 4. 216 lựa chọn bổ sung được viết theo từng sự kiện trong choice-expansion.ts, không sinh văn bản chung lúc chạy.

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
    c(
      'sketch',
      'Vẽ lại kết cấu ghế',
      'Tri thức +3 · tay nghề +2',
      'Bạn đo từng thanh gỗ, vẽ trước khi sửa.',
      [s('knowledge', 3), s('skill', 2)],
    ),
    c(
      'pause',
      'Cất ghế và hẹn sửa cuối tuần',
      'Căng thẳng −4',
      'Bạn dọn chỗ an toàn, để cả hai nghỉ tay hôm nay.',
      [s('stress', -4)],
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
- Mọi sự kiện hiển thị cần ít nhất **4 lựa chọn khả dụng**. Lựa chọn thiếu tiền/cha mẹ/nghề không xuất hiện; engine đếm sau lọc, loại sự kiện còn dưới 4. Viết sẵn hướng ít nguồn lực phù hợp bối cảnh; fallback có 4 hướng hệ quả riêng. Không sinh câu vô nghĩa để đủ số. NPC không chấp nhận cha/mẹ unknown/deceased; nonresident còn sống vẫn có thể liên lạc.
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

Validator v0.2 kiểm tra 4–6 lựa chọn, ID trùng, effect/chance giống nhau, đường không có hệ quả, tuổi/năm/flag mâu thuẫn, schema hiệu ứng trễ, tham chiếu NPC/flag/arc và fixed-point reachability phát hiện chuỗi tự khóa. Invariant/mô phỏng kiểm tra số lựa chọn enabled. Reachability tĩnh chưa chứng minh mọi tổ hợp đạt được; cần regression tuyến truyện và chơi thử.

Nhánh có thật: education-path có ba hướng tự học/đi làm rồi học/học từ thợ, cùng cờ quyết định học nhưng mức kiến thức/kỹ năng/stress và hệ quả 24 tháng khác nhau. business-invitation có thử việc trước, mở business-started rồi đánh giá sau 24 tháng; career-collapse tái đào tạo nối cuộc trở lại; family-call nối thăm hỏi và hồi tưởng sau 24 tháng. Đóng/từ chối tuyến cũng cần cờ kết thúc hợp lệ. Không thay văn bản rồi giữ y hệt effects/chance.
