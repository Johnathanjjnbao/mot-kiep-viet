import { choice, event } from './authoring';
import type { CreatorOperation } from '../domain/creator-economy';
const paths: Record<CreatorOperation, [string, string, string]> = {
  craft: [
    'Chăm nội dung, học cách kể',
    'Chất lượng và kỹ năng tăng; thêm chút công sức.',
    'Bạn dựng lại một đoạn khó hiểu, nghe lại âm thanh và học thêm một cách kể. Chất lượng tốt hơn không hứa chắc sẽ có thêm người xem.',
  ],
  community: [
    'Ngồi lại với người xem',
    'Tương tác và uy tín tăng; dành sức xây cộng đồng.',
    'Bạn đọc kỹ bình luận, trả lời điều mình biết và nhận phần mình chưa hiểu. Kênh có thêm sự gắn bó, chứ chưa có một khoản thu chắc chắn.',
  ],
  reach: [
    'Thử nhịp đăng dày hơn',
    'Tập trung mở rộng; làm dày khiến kiệt sức nhanh hơn.',
    'Bạn muốn đưa nội dung tới nhiều người hơn. Lịch dày sẽ tốn thêm tiền và sức; khán giả vẫn có thể đi qua mà không ở lại.',
  ],
  rest: [
    'Nghỉ một chặng',
    'Dừng thu chi của kênh, giảm kiệt sức; khán giả có thể giảm.',
    'Bạn cất máy, trả lại một khoảng tối cho mình. Kênh vẫn còn đó, còn người xem có thể tìm thấy những nơi khác trong lúc bạn nghỉ.',
  ],
  apply: [
    'Gửi xét khả năng kiếm tiền',
    'Chờ ít nhất hai tháng; có thể bị từ chối.',
    'Bạn gửi lượt xét trong mô phỏng. Đủ số người theo dõi mới là một phần; chất lượng, uy tín và tương tác vẫn phải giữ qua thời gian chờ.',
  ],
  accept: [
    'Nhận một hợp tác có giới hạn',
    'Ba kỳ có nội dung, mỗi kỳ nhận phí; thêm áp lực.',
    'Bạn nhận một hợp tác nhỏ, có công việc phải làm và phí ghi rõ trong sổ. Kỳ không sản xuất không được trả; khoản này không phải quà của nền tảng.',
  ],
  decline: [
    'Từ chối điều chưa hợp mình',
    'Giữ uy tín và nhẹ lòng; không nhận phí hợp tác.',
    'Bạn trả lời lịch sự rằng nội dung ấy chưa hợp với kênh. Một khoản tiền không vào sổ, còn hướng đi của mình được giữ lại.',
  ],
  reflect: [
    'Làm thưa lại để nhìn rõ hơn',
    'Nhịp nhẹ, tập trung tay nghề; bớt kiệt sức.',
    'Bạn gỡ bớt lịch và ghi ra điều muốn học. Chậm hơn có thể khiến người xem ít đi, nhưng cho bạn một cách tiếp tục vừa sức.',
  ],
};
const scene = (id: string, title: string, text: string, ops: CreatorOperation[]) =>
  event(
    id,
    'career',
    title,
    text,
    { minAge: 18, minYear: 2014, technology: 'internet' },
    ops.map((op) => choice(op, ...paths[op], [{ kind: 'creator', operation: op }])),
    {
      version: 11,
      priority: 0,
      weight: 60,
      cooldown: 12,
      once: true,
      provenance: {
        kind: 'designed',
        note: 'Kênh hư cấu với số liệu, chi phí và xét điều kiện riêng của game; không phải tài khoản hoặc chính sách nền tảng thật.',
      },
    },
  );
export const creatorEvents = [
  scene(
    'cr-first',
    'Một góc nhỏ trên màn hình',
    'Bạn đã đăng những nội dung đầu tiên. Có người ghé xem rồi đi; có người để lại một câu ngắn. Tiền thiết bị và sản xuất đã chi thật, còn một cộng đồng thì cần nhiều thời gian hơn.',
    ['craft', 'community', 'reach', 'reflect'],
  ),
  scene(
    'cr-slow',
    'Đăng đều, người xem còn ít',
    'Một năm đã qua mà kênh vẫn nhỏ. Bạn nhìn những giờ làm phía sau mỗi đoạn hình. Sự chậm chạp không phải bản án về khả năng; cần xem cách làm này có còn vừa với tiền và sức của mình.',
    ['craft', 'community', 'reflect', 'rest'],
  ),
  scene(
    'cr-viral',
    'Một nội dung bỗng đi xa',
    'Một nội dung gần đây lan nhanh hơn những lần trước. Lượt theo dõi tăng khiến bạn vừa mừng vừa khó ngủ. Sự chú ý có thể qua nhanh; nó chưa tự biến thành một khoản thu.',
    ['community', 'craft', 'reach', 'reflect'],
  ),
  scene(
    'cr-criticism',
    'Một bình luận khó nghe',
    'Uy tín của kênh đang thấp hơn lúc khởi đầu. Trong những điều người xem nói, có điều đáng nghe và có điều khiến bạn mệt. Bạn cần chọn cách phản hồi thay vì để cả buổi tối trôi theo thông báo.',
    ['community', 'craft', 'reflect', 'rest'],
  ),
  scene(
    'cr-ready',
    'Nghĩ tới chuyện có thu nhập',
    'Kênh đã chạm điều kiện thiết kế để gửi xét kiếm tiền: có người theo dõi, nội dung đủ chất lượng và còn tương tác. Lượt xét vẫn có thể bị từ chối, và tháng được duyệt cũng có thể không có tiền.',
    ['apply', 'craft', 'community', 'reflect'],
  ),
  scene(
    'cr-sponsor',
    'Một lời mời đặt cạnh nội dung',
    'Có người đề nghị hợp tác trong ba kỳ làm nội dung, với mức phí được ghi rõ. Bạn cân nhắc tiền công, lời hứa với người xem và phần sức còn lại sau việc học, việc làm hay chuyện gia đình.',
    ['accept', 'decline', 'craft', 'rest'],
  ),
  scene(
    'cr-burnout',
    'Đèn máy quay chưa tắt',
    'Mức kiệt sức đã cao. Bạn lặp lại một câu nhiều lần mà vẫn thấy xa lạ với giọng mình. Đăng thêm không bảo đảm có thêm người xem; nghỉ cũng là một quyết định nghề nghiệp.',
    ['rest', 'reflect', 'community', 'craft'],
  ),
  scene(
    'cr-family',
    'Một bữa cơm cạnh thông báo',
    'Áp lực trong cuộc đời đã dâng cao. Trên bàn có một tin nhắn mới và một câu chuyện chưa kịp nghe hết. Bạn thử cân lại lịch nội dung với công việc và những người đang ở cạnh mình.',
    ['rest', 'reflect', 'community', 'decline'],
  ),
  scene(
    'cr-return',
    'Lại ngồi trước chiếc máy cũ',
    'Bạn đã nghỉ và mức kiệt sức đã giảm. Một phần khán giả có thể đã đi; những gì học được vẫn còn. Chưa cần mở lại ngay, bạn có thể sửa cách làm trước khi thử một chặng mới.',
    ['craft', 'community', 'reflect', 'rest'],
  ),
];
