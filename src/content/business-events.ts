import { choice, event } from './authoring';
import type { BusinessOperation } from '../domain/enterprise-actions';
const paths: Record<BusinessOperation, [string, string, string]> = {
  listen: [
    'Lắng nghe người mua',
    'Gắn bó với khách hơn; thêm việc phải lo.',
    'Bạn dành thời gian trả lời từng người. Uy tín và giao tiếp tăng, nhưng công việc cũng chen thêm vào buổi tối.',
  ],
  review: [
    'Rà lại sổ và thu gọn hàng',
    'Giảm mức dự trữ về tối đa 10; tắt quảng bá.',
    'Bạn dò từng khoản, giữ ít hàng hơn và dừng quảng bá. Quỹ nhẹ gánh hơn; cơ hội bán cũng có thể ít đi.',
  ],
  balanced: [
    'Giữ giá cân bằng, làm vừa sức',
    'Giá cân bằng; không trả phí quảng bá.',
    'Bạn chọn nhịp bán vừa phải. Tiệm vẫn phải tự trang trải chi phí, không có lời hứa rằng tháng sau sẽ khá hơn.',
  ],
  promote: [
    'Thử quảng bá thêm',
    'Quảng bá có phí mỗi tháng; tăng việc và giao tiếp.',
    'Bạn kể rõ hơn về món hàng. Phí quảng bá sẽ vào sổ từ tháng tới; người xem chưa chắc thành người mua.',
  ],
  quality: [
    'Chăm cách làm, thử phân khúc cao hơn',
    'Giá cao, thường ít đơn; tay nghề và uy tín tăng.',
    'Bạn sửa cách làm và thử giá cao hơn. Mỗi đơn có thể để lại nhiều hơn, nhưng khách cũng có thể rời đi.',
  ],
  simplify: [
    'Giữ tiệm nhỏ, bán vừa túi tiền',
    'Giá tiết kiệm; tối đa 10 món dự trữ; bớt áp lực.',
    'Bạn thu nhỏ nhịp bán và hạ giá. Khoản lời trên từng món mỏng hơn, đổi lại bạn có thêm khoảng thở.',
  ],
  grow: [
    'Nâng mức hàng để thử sức',
    'Mức dự trữ tăng 20; nhập hàng vẫn cần đủ quỹ.',
    'Bạn muốn thử một bước lớn hơn. Hàng chỉ được nhập khi quỹ đủ tiền; mức hàng cao không bảo đảm có thêm khách.',
  ],
  pause: [
    'Tạm dừng nhận đơn',
    'Giữ vốn và hàng; dừng phí vận hành; dành lại thời gian.',
    'Bạn tắt thông báo nhận đơn một thời gian. Vốn và hàng còn nguyên trong tiệm; những người thân lại có thêm lúc ngồi cùng bạn.',
  ],
  close: [
    'Khép tiệm, nhận phần còn lại',
    'Thanh lý hàng bằng 50% giá vốn; giữ lịch sử lời lỗ.',
    'Bạn khép cửa hàng. Tiền quỹ và tiền thanh lý được trả về cá nhân; khoản hao hụt và những gì đã học vẫn ở lại trong sổ.',
  ],
};
const scene = (id: string, title: string, text: string, ops: BusinessOperation[]) =>
  event(
    id,
    'career',
    title,
    text,
    { minAge: 18, minYear: 2005, technology: 'internet' },
    ops.map((op) => choice(op, ...paths[op], [{ kind: 'enterprise', operation: op }])),
    {
      version: 10,
      weight: 60,
      cooldown: 12,
      once: true,
      priority: 0,
      provenance: {
        kind: 'designed',
        note: 'Tình huống hư cấu, gắn với sổ cửa hàng thật trong mô phỏng.',
      },
    },
  );
export const businessEvents = [
  scene(
    'biz-first-sale',
    'Gói hàng đầu tiên',
    'Tên một người mua xuất hiện trên đơn hàng. Bạn kiểm lại địa chỉ, gấp tờ giấy rồi nhìn món hàng đang chờ được gửi đi. Tiệm đã có doanh thu; cuối tháng còn phải trừ giá vốn và các khoản vận hành.',
    ['listen', 'review', 'balanced', 'promote'],
  ),
  scene(
    'biz-quiet-opening',
    'Tiệm sáng đèn, đơn còn thưa',
    'Bạn đã đăng hàng và chờ. Một vài người hỏi rồi im lặng. Vốn ban đầu không nói lên bạn giỏi hay kém; lúc này điều cần biết là quỹ còn chịu được nhịp bán này bao lâu.',
    ['review', 'promote', 'simplify', 'pause'],
  ),
  scene(
    'biz-supplier',
    'Một mối hàng chưa thuận',
    'Kỳ vừa rồi tiệm không nhập thêm hàng. Có thể quỹ chưa đủ, cũng có thể mức dự trữ đã chạm kế hoạch. Bạn mở sổ, cân nhắc cách giữ lời với khách mà vẫn giữ được vốn.',
    ['review', 'listen', 'grow', 'pause'],
  ),
  scene(
    'biz-complaint',
    'Một lời phàn nàn gửi về',
    'Trong sổ gần đây có đơn hoàn. Tin nhắn của khách khiến bạn ngồi lâu hơn trước màn hình. Hàng trả đã về kho, nhưng phần công giao hàng và thời gian thì không quay lại.',
    ['listen', 'quality', 'simplify', 'pause'],
  ),
  scene(
    'biz-popular',
    'Có lúc người hỏi đông hơn',
    'Một kỳ gần đây có nhiều đơn hơn thường lệ. Bạn vui, rồi chợt nghĩ tới hàng dự trữ và những buổi tối đóng gói. Có thêm khách cũng là có thêm việc phải giữ cho tròn.',
    ['grow', 'quality', 'balanced', 'listen'],
  ),
  scene(
    'biz-returning',
    'Một cái tên quen trong đơn mới',
    'Uy tín của tiệm đã khá hơn sau nhiều tháng. Có người nhắc lại cách bạn trả lời lần trước. Bạn nghĩ tới chuyện giữ mối lâu dài, thay vì chỉ nhìn số đơn của một kỳ.',
    ['listen', 'quality', 'simplify', 'review'],
  ),
  scene(
    'biz-marketing',
    'Bài quảng bá chưa thành tiền',
    'Tiệm có trả phí quảng bá nhưng vẫn có kỳ lỗ. Bạn nhìn số người hỏi rồi nhìn dòng chi phí. Hai con số kể hai chuyện khác nhau; bạn cần chọn cách thử tiếp hoặc dừng lại.',
    ['review', 'balanced', 'quality', 'pause'],
  ),
  scene(
    'biz-stockout',
    'Chiếc kệ vừa trống',
    'Tiệm đã bán được hàng, nhưng kho hiện không còn món nào. Bạn có thể nâng kế hoạch dự trữ, giữ nhịp nhỏ hoặc tạm dừng. Dù chọn cách nào, hàng mới vẫn cần tiền nhập thật.',
    ['grow', 'listen', 'balanced', 'pause'],
  ),
  scene(
    'biz-loss',
    'Một tháng trừ nhiều hơn cộng',
    'Doanh thu thuần của một kỳ không đủ bù giá vốn và chi phí. Bạn đọc chậm dòng lời lỗ. Thua một tháng không định nghĩa cả cuộc đời, nhưng quỹ tiệm cần một quyết định cụ thể.',
    ['review', 'quality', 'pause', 'close'],
  ),
  scene(
    'biz-family',
    'Điện thoại sáng giữa bữa cơm',
    'Áp lực đã cao, những tin nhắn về tiệm vẫn chen vào buổi tối. Bạn nhận ra mình đang nghe người nhà bằng nửa sự chú ý. Chuyện giữ tiệm và chuyện giữ một bữa cơm đều cần thời gian.',
    ['pause', 'simplify', 'review', 'listen'],
  ),
  scene(
    'biz-growth',
    'Có nên bước thêm một bước',
    'Sau hơn một năm rưỡi và ít nhất một kỳ có lời, bạn nghĩ tới chuyện nhận thêm hàng. Một kế hoạch lớn hơn cũng giữ nhiều tiền trong kho hơn. Tiệm hiện tại chưa bắt buộc bạn phải lớn lên ngay.',
    ['grow', 'quality', 'balanced', 'pause'],
  ),
  scene(
    'biz-close',
    'Tờ giấy tính chuyện khép tiệm',
    'Tiệm đã đi qua vài năm, có lúc phải dừng hoặc chịu lỗ. Bạn đặt cạnh nhau số vốn, hàng còn lại và thời gian của mình. Khép một cửa hàng có thể là một quyết định giữ sức cho đoạn đường sau.',
    ['close', 'review', 'simplify', 'pause'],
  ),
];
