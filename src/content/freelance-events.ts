import type { Effect, EventDefinition } from '../domain/model';
import type { FreelanceStoryOperation } from '../domain/freelance';
import { event, choice, stat } from './authoring';
const work = (operation: FreelanceStoryOperation): Effect => ({ kind: 'freelance', operation });
type Path = [string, string, string, Effect[]];
function scene(
  id: string,
  title: string,
  text: string,
  paths: Path[],
  priority = 2,
): EventDefinition {
  return event(
    'fl-' + id,
    'career',
    title,
    text,
    { minAge: 18 },
    paths.map(([t, h, o, f], i) => choice(['a', 'b', 'c', 'd'][i], t, h, o, f)),
    { version: 13, once: false, cooldown: 12, weight: 15, priority },
  );
}
export const freelanceEvents: EventDefinition[] = [
  scene(
    'inquiry',
    'Lời hỏi chưa phải hợp đồng',
    'Khách đã mô tả phần việc. Bạn còn phải thống nhất phạm vi, số bản sửa và phí; một đề nghị cao chưa chắc được chọn.',
    [
      [
        'Đề nghị phạm vi gọn, phí thấp hơn',
        'Dễ được cân nhắc; tiền công thấp',
        'Bạn gửi đề nghị gọn và chờ khách trả lời.',
        [work('quote-modest'), stat('stress', -1)],
      ],
      [
        'Giữ phạm vi và phí tiêu chuẩn',
        'Cân bằng; vẫn có thể bị từ chối',
        'Bạn làm rõ phần giao và khoản phí.',
        [work('quote-standard'), stat('knowledge', 1)],
      ],
      [
        'Đề nghị gói cao hơn với phần soát kỹ',
        'Khó được chọn; phí đề nghị cao',
        'Bạn gửi gói có phạm vi và mức phí cao hơn.',
        [work('quote-premium'), stat('stress', 2)],
      ],
      [
        'Từ chối khi yêu cầu chưa phù hợp',
        'Không có phí; giữ thời gian',
        'Bạn khép lời hỏi và giữ lại bài học từ bước chuẩn bị.',
        [work('close'), stat('mood', 2)],
      ],
    ],
  ),
  scene(
    'offered',
    'Một lời đồng ý có điều kiện',
    'Khách đã chọn đề nghị. Bạn cần tự nhìn quỹ và thời gian trước khi nhận; số tiền hứa trả vẫn chưa thuộc ví của bạn.',
    [
      [
        'Nhận theo nhịp đều khi quỹ đủ',
        'Cần tiền tháng đầu; chi phí đi theo tiến độ',
        'Bạn cân nhắc nhịp tiêu chuẩn.',
        [work('accept'), stat('skill', 1)],
      ],
      [
        'Nhận với nhịp kiểm tra kỹ',
        'Tốn phí hơn; ưu tiên chất lượng',
        'Bạn dự kiến một nhịp kiểm tra cẩn thận.',
        [work('accept-careful'), stat('knowledge', 1)],
      ],
      [
        'Nhận và rút ngắn tiến độ',
        'Nhanh hơn; rủi ro bản giao tăng',
        'Bạn dự kiến làm nhanh trong phần đã nhận.',
        [work('accept-rush'), stat('stress', 2)],
      ],
      [
        'Dừng trước khi hứa nhận việc',
        'Bỏ cơ hội; giữ quỹ và lịch',
        'Bạn không nhận khoản việc mình chưa sẵn sàng theo.',
        [work('close'), stat('stress', -3)],
      ],
    ],
  ),
  scene(
    'service-programming',
    'Công cụ chạy khác ở máy khách',
    'Bản thử chạy ở máy bạn nhưng có lỗi với dữ liệu mẫu của khách. Tiến độ và lượt kiểm tra đều ảnh hưởng bản giao.',
    [
      [
        'Tái hiện lỗi bằng dữ liệu mẫu',
        'Soát kỹ hơn; phí thực hiện cao',
        'Bạn dành thời gian thử lại trường hợp gây lỗi.',
        [work('careful'), stat('knowledge', 2)],
      ],
      [
        'Giữ phần lõi, ghi rõ giới hạn',
        'Nhịp đều; chưa thêm tính năng',
        'Bạn giữ đúng phần đã nhận trước khi mở rộng.',
        [work('steady'), stat('skill', 2)],
      ],
      [
        'Vá nhanh để rút thời gian',
        'Tiến nhanh; dễ còn lỗi sót',
        'Bạn chấp nhận một nhịp giao nhanh hơn.',
        [work('rush'), stat('stress', 2)],
      ],
      [
        'Nghỉ một chặng rồi xem lại',
        'Giữ sức; deadline vẫn tới',
        'Bạn tạm ngừng trước khi tiếp tục quyết định.',
        [work('rest'), stat('health', 2)],
      ],
    ],
    0,
  ),
  scene(
    'service-design',
    'Màu mới ngoài bản yêu cầu',
    'Khách hỏi thêm một cách phối màu. Bạn cần phân biệt điều đã nhận với ý tưởng đang được gợi thêm.',
    [
      [
        'Soát lại bản yêu cầu và bản màu',
        'Tốn công soát; giảm sai khác',
        'Bạn đối chiếu bản màu với phạm vi ban đầu.',
        [work('careful'), stat('knowledge', 2)],
      ],
      [
        'Hoàn thiện bộ đã thống nhất trước',
        'Giữ nhịp; chưa nhận phần thêm',
        'Bạn làm chắc bộ đã cam kết.',
        [work('steady'), stat('skill', 2)],
      ],
      [
        'Thử nhanh nhiều bản để chọn',
        'Nhanh hơn; ít thời gian rà',
        'Bạn thử nhịp làm nhanh và chấp nhận phần phải soát lại.',
        [work('rush'), stat('stress', 2)],
      ],
      [
        'Tạm dừng để hồi sức mắt và đầu',
        'Có khoảng nghỉ; tiến độ chậm',
        'Bạn giữ sức trước chặng thiết kế tiếp.',
        [work('rest'), stat('mood', 2)],
      ],
    ],
    0,
  ),
  scene(
    'service-translation',
    'Một từ có hai cách hiểu',
    'Cùng một từ xuất hiện trong hai đoạn với ngữ cảnh khác nhau. Bản dịch cần truyền đúng nghĩa, không chỉ thay từng chữ.',
    [
      [
        'Đối chiếu ngữ cảnh và soát nghĩa',
        'Soát kỹ; tốn phí thực hiện',
        'Bạn dành thêm một vòng đối chiếu.',
        [work('careful'), stat('knowledge', 2)],
      ],
      [
        'Giữ thuật ngữ đã thống nhất',
        'Nhịp đều; không đoán thêm',
        'Bạn giữ phạm vi và cách dùng đã được bàn.',
        [work('steady'), stat('social', 1)],
      ],
      [
        'Làm bản nháp nhanh trước',
        'Tiến nhanh; dễ sót nghĩa',
        'Bạn dành ít thời gian hơn cho mỗi vòng.',
        [work('rush'), stat('stress', 2)],
      ],
      [
        'Nghỉ để quay lại với đầu tỉnh hơn',
        'Giữ sức; deadline không dừng',
        'Bạn tạm dừng nhịp dịch.',
        [work('rest'), stat('health', 2)],
      ],
    ],
    0,
  ),
  scene(
    'service-writing',
    'Nguồn cho một câu khẳng định',
    'Một câu trong bài nghe hấp dẫn nhưng nguồn chưa rõ. Bài giao cần chính xác và đúng điều khách yêu cầu.',
    [
      [
        'Kiểm nguồn và viết rõ giới hạn',
        'Soát kỹ; thêm công và phí',
        'Bạn quay lại kiểm các căn cứ.',
        [work('careful'), stat('knowledge', 2)],
      ],
      [
        'Viết chắc phần đã có căn cứ',
        'Nhịp đều; bớt câu giật chú ý',
        'Bạn giữ phần mình có thể chứng minh.',
        [work('steady'), stat('skill', 2)],
      ],
      [
        'Chạy bản nháp nhanh để kịp tiến độ',
        'Nhanh; vòng rà mỏng hơn',
        'Bạn chọn nhịp nhanh cho phần đang làm.',
        [work('rush'), stat('stress', 2)],
      ],
      [
        'Tạm nghỉ khỏi bản thảo',
        'Giảm căng; chậm lịch giao',
        'Bạn rời bản thảo để hồi sức.',
        [work('rest'), stat('mood', 2)],
      ],
    ],
    0,
  ),
  scene(
    'service-marketing',
    'Lượt xem và điều khách cần',
    'Báo cáo có những con số đẹp nhưng chưa trả lời rõ khách muốn biết gì. Phí của bạn trả cho phần việc, không bảo đảm doanh số của khách.',
    [
      [
        'Đối chiếu mục tiêu và dữ liệu',
        'Soát kỹ; thêm công đo',
        'Bạn kiểm tra con số theo câu hỏi ban đầu.',
        [work('careful'), stat('knowledge', 2)],
      ],
      [
        'Giữ đợt thử nhỏ có thể giải thích',
        'Nhịp đều; ít phô trương',
        'Bạn làm chắc phần thử có giới hạn.',
        [work('steady'), stat('social', 2)],
      ],
      [
        'Ra bản thử nhanh để lấy phản hồi',
        'Tiến nhanh; dễ thiếu kiểm tra',
        'Bạn chọn một nhịp triển khai ngắn.',
        [work('rush'), stat('stress', 2)],
      ],
      [
        'Nghỉ một chặng để giảm quá tải',
        'Giữ sức; lịch vẫn chạy',
        'Bạn tạm rút khỏi nhịp chạy số.',
        [work('rest'), stat('health', 2)],
      ],
    ],
    0,
  ),
  scene(
    'service-support',
    'Lỗi lúc có lúc không',
    'Thiết bị trong đợt hỗ trợ có lỗi không xuất hiện mỗi lần. Bạn cần ghi rõ điều đã kiểm tra và phần chưa xác định.',
    [
      [
        'Lặp phép thử và ghi điều kiện lỗi',
        'Soát kỹ; chi phí cao hơn',
        'Bạn kiểm lại điều kiện làm lỗi xuất hiện.',
        [work('careful'), stat('knowledge', 2)],
      ],
      [
        'Giữ hướng dẫn và phạm vi đã nhận',
        'Nhịp đều; không hứa sửa mọi thứ',
        'Bạn tập trung vào phần hỗ trợ đã thống nhất.',
        [work('steady'), stat('skill', 2)],
      ],
      [
        'Xử lý nhanh các lỗi dễ thấy',
        'Nhanh hơn; dễ bỏ trường hợp khó',
        'Bạn chọn nhịp xử lý nhanh.',
        [work('rush'), stat('stress', 2)],
      ],
      [
        'Tạm nghỉ rồi quay lại kiểm tra',
        'Bớt mệt; tiến độ chậm',
        'Bạn chừa thời gian hồi sức.',
        [work('rest'), stat('health', 2)],
      ],
    ],
    0,
  ),
  scene(
    'ready',
    'Bản giao đang chờ gửi',
    'Phần thực hiện đã đủ tiến độ. Giao bản không đồng nghĩa tiền đã về; khách còn phải soát và thanh toán.',
    [
      [
        'Gửi phần đã làm theo thỏa thuận',
        'Bắt đầu xét; có thể bị yêu cầu sửa',
        'Bạn chuẩn bị bàn giao phần việc.',
        [work('deliver'), stat('social', 1)],
      ],
      [
        'Dùng lượt sửa để tự kiểm thêm',
        'Tốn thêm6 tháng; dùng hết lượt sửa',
        'Bạn dành lượt làm lại cho kiểm tra trước khi giao.',
        [work('polish'), stat('knowledge', 2)],
      ],
      [
        'Xem lại phạm vi trước khi gửi',
        'Chưa gửi; deadline tiếp tục',
        'Bạn đọc lại các phần đã cam kết.',
        [work('wait'), stat('knowledge', 1), stat('stress', -1)],
      ],
      [
        'Dừng lỗ và khép hồ sơ',
        'Không nhận phí; dừng công tiếp',
        'Bạn cân nhắc kết thúc hồ sơ.',
        [work('close'), stat('stress', -3)],
      ],
    ],
  ),
  scene(
    'rework',
    'Khách yêu cầu một vòng sửa',
    'Bản giao chưa đạt điều đã thống nhất. Bạn còn có thể bỏ thêm công, nhận phần phí cho phần dùng được hoặc chấp nhận dừng.',
    [
      [
        'Nhận một lượt sửa có giới hạn',
        'Thêm6 tháng và phí; vẫn có thể trượt',
        'Bạn cân nhắc vòng sửa cuối.',
        [work('revise'), stat('skill', 1)],
      ],
      [
        'Thỏa thuận60% phí cho phần dùng được',
        'Giảm phí; vẫn chờ trả tiền',
        'Bạn cân nhắc một mức thanh toán nhỏ hơn.',
        [work('settle'), stat('social', 1)],
      ],
      [
        'Đối chiếu yêu cầu trước khi đáp',
        'Chưa sửa; thời hạn không dừng',
        'Bạn xem điều khách đang yêu cầu.',
        [work('wait'), stat('knowledge', 2)],
      ],
      [
        'Khép hồ sơ và ghi khoản lỗ',
        'Không có tiền công; giữ sức',
        'Bạn cân nhắc dừng phần việc này.',
        [work('close'), stat('health', 2)],
      ],
    ],
  ),
  scene(
    'review',
    'Chưa có kết quả nghiệm thu',
    'Khách đang xem bản đã giao. Khoản hứa trả còn nằm trong hồ sơ, chưa được cộng vào tiền cá nhân.',
    [
      [
        'Đối chiếu danh mục đã giao',
        'Hiểu hồ sơ; không tạo tiền',
        'Bạn kiểm phần mình đã nộp.',
        [work('wait'), stat('knowledge', 2)],
      ],
      [
        'Giữ liên lạc ngắn và rõ',
        'Giữ giao tiếp; không hứa thêm',
        'Bạn chuẩn bị câu hỏi rõ ràng.',
        [work('wait'), stat('social', 2)],
      ],
      [
        'Dành khoảng trống để nghỉ',
        'Giữ sức; chưa biết kết quả',
        'Bạn nghỉ trong thời gian đợi.',
        [work('wait'), stat('health', 2), stat('stress', -1)],
      ],
      [
        'Bỏ yêu cầu thu và khép hồ sơ',
        'Mất cơ hội tiền công; kết thúc chờ',
        'Bạn cân nhắc chấm dứt hồ sơ.',
        [work('close'), stat('stress', -3)],
      ],
    ],
  ),
  scene(
    'payment',
    'Phí được hẹn và tiền đã về',
    'Bản giao đã có thỏa thuận thanh toán nhưng khách chưa trả. Bạn cần giữ khoản dự kiến tách khỏi số dư thực có.',
    [
      [
        'Ghi rõ kỳ hẹn trong sổ riêng',
        'Rõ dòng tiền; chưa có thu mới',
        'Bạn đối chiếu lịch trong hồ sơ.',
        [work('wait'), stat('knowledge', 2)],
      ],
      [
        'Giữ lời nhắc thanh toán vừa đủ',
        'Cần giao tiếp; chưa bảo đảm thu',
        'Bạn chuẩn bị một lời nhắc ngắn.',
        [work('wait'), stat('social', 2)],
      ],
      [
        'Sắp lại phần tiền mặt đang có',
        'Giữ nhịp; không chi tiền chưa nhận',
        'Bạn tính từ số tiền thực có.',
        [work('wait'), stat('stress', -2)],
      ],
      [
        'Chấp nhận không thu để khép việc',
        'Không có khoản công này; dừng chờ',
        'Bạn cân nhắc ghi khoản chưa thu và kết thúc.',
        [work('close'), stat('mood', 2)],
      ],
    ],
  ),
];
