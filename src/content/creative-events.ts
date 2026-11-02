import type { Effect, EventDefinition } from '../domain/model';
import type { CreativeStoryOperation } from '../domain/creative-careers';
import { event, choice, stat } from './authoring';
const act = (operation: CreativeStoryOperation): Effect => ({ kind: 'creative', operation });
type Path = [string, string, string, Effect[]];
function scene(
  id: string,
  title: string,
  text: string,
  paths: Path[],
  priority = 0,
): EventDefinition {
  return event(
    id,
    'career',
    title,
    text,
    { minAge: 18 },
    paths.map(([t, h, o, f], i) => choice(['a', 'b', 'c', 'd'][i], t, h, o, f)),
    { version: 14, once: false, cooldown: 12, weight: 14, priority },
  );
}
export const creativeEvents: EventDefinition[] = [
  scene(
    'gm-sound',
    'Một buổi phát nghe rõ nhau',
    'Thiết bị đã đủ để phát, nhưng tiếng trò chơi đang lấn lời bạn. Người xem cần nghe rõ trước khi muốn ở lại.',
    [
      [
        'Tập nói và thao tác chậm lại',
        'Tăng kỹ năng; cần công tập',
        'Bạn chọn tập lại nhịp thao tác.',
        [act('gaming-practice'), stat('stress', 1)],
      ],
      [
        'Hỏi nhóm xem thử chỗ khó nghe',
        'Chăm cộng đồng; tốn thời gian',
        'Bạn nghe phản hồi của nhóm xem thử.',
        [act('gaming-community'), stat('social', 1)],
      ],
      [
        'Dựng buổi phát có khoảng nghỉ',
        'Giữ người xem; tăng mệt tập',
        'Bạn tập cách dẫn có khoảng thở.',
        [act('gaming-retention'), stat('skill', 1)],
      ],
      [
        'Dừng lịch tập để hồi sức',
        'Không tiến kỹ năng; kênh có lịch riêng',
        'Bạn để lịch luyện nghỉ.',
        [act('gaming-rest'), stat('mood', 1)],
      ],
    ],
  ),
  scene(
    'gm-training',
    'Thắng một ván chưa thành nghề',
    'Một thao tác khó cứ hỏng khi phát. Tập kỹ có ích nhưng lấy thời gian vốn dành cho nội dung và cuộc sống khác.',
    [
      [
        'Luyện một thao tác cho vững',
        'Kỹ năng tăng; thêm áp lực',
        'Bạn ưu tiên một việc cần sửa.',
        [act('gaming-practice'), stat('stress', 2)],
      ],
      [
        'Mời người mới cùng tập',
        'Cộng đồng tăng; tiến kỹ năng chậm',
        'Bạn dành buổi chơi cho người mới.',
        [act('gaming-community'), stat('social', 1)],
      ],
      [
        'Xem lại đoạn người xem rời đi',
        'Giữ người xem; lịch tập nặng hơn',
        'Bạn tìm điểm buổi phát bị đứt nhịp.',
        [act('gaming-retention'), stat('knowledge', 1)],
      ],
      [
        'Chấp nhận nghỉ một nhịp',
        'Hồi sức; chưa sửa thao tác',
        'Bạn cho mình thời gian hồi lại.',
        [act('gaming-rest'), stat('stress', -1)],
      ],
    ],
  ),
  scene(
    'gm-community',
    'Phòng chat có người mới',
    'Người quen đùa với nhau khiến người mới khó tham gia. Cộng đồng đông lên cũng cần cách cùng ở lại.',
    [
      [
        'Cùng nhóm viết quy ước trò chuyện',
        'Gắn kết tăng; cần theo sát',
        'Bạn dành thời gian cho quy ước chung.',
        [act('gaming-community'), stat('stress', 1)],
      ],
      [
        'Dẫn thử một buổi dễ theo dõi',
        'Giữ người xem; thêm mệt tập',
        'Bạn tập cách giải thích rõ đầu đuôi.',
        [act('gaming-retention'), stat('social', 1)],
      ],
      [
        'Giảm lời dẫn để luyện chuyên môn',
        'Tăng kỹ năng; ít chăm nhóm hơn',
        'Bạn chọn phần chuyên môn trước.',
        [act('gaming-practice'), stat('social', -1)],
      ],
      [
        'Nghỉ tập, hẹn nhóm dịp khác',
        'Hồi sức; không hứa tăng người xem',
        'Bạn nói rõ lịch nghỉ với nhóm.',
        [act('gaming-rest'), stat('mood', 1)],
      ],
    ],
  ),
  scene(
    'gm-retention',
    'Buổi phát dài, người ở lại ít',
    'Số theo dõi không cho biết ai muốn xem hết buổi. Bạn phải chọn giữa tập chơi, chăm người xem và giữ sức.',
    [
      [
        'Tập một nhịp dẫn gọn hơn',
        'Giữ người xem tốt hơn; thêm mệt',
        'Bạn soát phần dẫn vào và phần kết.',
        [act('gaming-retention'), stat('stress', 1)],
      ],
      [
        'Làm buổi hỏi đáp với nhóm nhỏ',
        'Gắn kết tăng; lớn lên chậm',
        'Bạn ưu tiên người đang ở lại.',
        [act('gaming-community'), stat('social', 1)],
      ],
      [
        'Tập nội dung khó có chiều sâu',
        'Kỹ năng tăng; cần thời gian',
        'Bạn chuẩn bị phần chơi có chủ đích.',
        [act('gaming-practice'), stat('knowledge', 1)],
      ],
      [
        'Để lịch tập nghỉ',
        'Giảm mệt; kênh vẫn có lịch riêng',
        'Bạn dừng phần luyện để hồi lại.',
        [act('gaming-rest'), stat('mood', 1)],
      ],
    ],
  ),
  scene(
    'gm-setback',
    'Một chuỗi ván chơi không thuận',
    'Bạn chơi kém hơn lúc tập và đọc bình luận quá lâu. Một chuỗi thua không cần biến thành lời hứa gỡ lại bằng mọi giá.',
    [
      [
        'Xem lỗi, tập lại trong giới hạn',
        'Tăng kỹ năng; thêm công',
        'Bạn quay về một lỗi cụ thể.',
        [act('gaming-practice'), stat('mood', -1)],
      ],
      [
        'Nói thật với nhóm về một ngày khó',
        'Gắn kết tăng; giữ kỳ vọng vừa sức',
        'Bạn chọn cách nói rõ tình hình.',
        [act('gaming-community'), stat('social', 1)],
      ],
      [
        'Đổi nhịp dẫn để buổi phát dễ theo',
        'Giữ người xem; vẫn tốn sức',
        'Bạn thử dẫn buổi chơi có khoảng nghỉ.',
        [act('gaming-retention'), stat('stress', 1)],
      ],
      [
        'Dừng lịch tập trước khi quá mệt',
        'Hồi sức; không gỡ kết quả cũ',
        'Bạn dừng vòng cố gỡ của mình.',
        [act('gaming-rest'), stat('stress', -2)],
      ],
    ],
  ),
  scene(
    'gm-round',
    'Một kỳ thi có phí dự giải',
    'Câu lạc bộ có một kỳ thi đấu. Kỹ năng và cộng đồng giúp bạn chuẩn bị, còn phí dự giải vẫn mất dù không có giải thưởng.',
    [
      [
        'Đăng ký nếu kỹ năng và quỹ đủ',
        'Phí dự giải; kết quả chưa chắc',
        'Bạn xét điều kiện trước khi nhận lịch.',
        [act('gaming-contest'), stat('stress', 1)],
      ],
      [
        'Tập thêm thay vì nhận lịch mới',
        'Kỹ năng tăng; chưa mất phí giải',
        'Bạn chọn chuẩn bị trước.',
        [act('gaming-practice'), stat('mood', -1)],
      ],
      [
        'Theo dõi cùng nhóm nhỏ',
        'Chăm cộng đồng; không có giải tự sinh',
        'Bạn cùng nhóm học từ kỳ thi.',
        [act('gaming-community'), stat('knowledge', 1)],
      ],
      [
        'Nghỉ lịch tập để giữ sức',
        'Hồi sức; kỳ đã nhận vẫn quyết toán',
        'Bạn để lịch luyện nghỉ.',
        [act('gaming-rest'), stat('stress', -1)],
      ],
    ],
    1,
  ),
  scene(
    'gm-burnout',
    'Không phải buổi nào cũng phải lên sóng',
    'Lịch tập và việc khác đã chồng lên nhau. Nghỉ tập không tự dừng lịch sản xuất kênh; bạn cần nhìn cả hai phần chi phí.',
    [
      [
        'Cho lịch tập nghỉ thêm',
        'Hồi sức rõ rệt; chưa tăng kỹ năng',
        'Bạn để phần luyện nghỉ.',
        [act('gaming-rest'), stat('health', 1)],
      ],
      [
        'Chọn nhịp chăm nhóm khi kênh phù hợp',
        'Cần kênh đang phát; ít phí tập hơn',
        'Bạn cân nhắc nhịp nhẹ với cộng đồng.',
        [act('gaming-community'), stat('social', 1)],
      ],
      [
        'Ghi việc cần tập rồi kiểm lại điều kiện',
        'Chưa chắc trở lại ngay; thêm tri thức',
        'Bạn xem điều kiện trước khi tập lại.',
        [act('gaming-practice'), stat('knowledge', 1)],
      ],
      [
        'Khép lịch gaming độc lập',
        'Giữ hồ sơ; kênh có thể đi tiếp',
        'Bạn cân nhắc dừng đường gaming.',
        [act('gaming-retire'), stat('stress', -2)],
      ],
    ],
    1,
  ),
  scene(
    'gm-long-path',
    'Một đường nghề đã đi lâu',
    'Những người xem đầu tiên đã đổi thói quen. Bạn có thể tiếp tục, chăm một nhóm nhỏ hơn hoặc khép lịch gaming mà giữ lại kênh.',
    [
      [
        'Luyện một hướng chơi mới',
        'Tăng kỹ năng; vẫn có phí tập',
        'Bạn chọn học một hướng mới.',
        [act('gaming-practice'), stat('knowledge', 1)],
      ],
      [
        'Giữ một nhóm cùng chơi lâu năm',
        'Chăm cộng đồng; tăng trưởng chậm',
        'Bạn ưu tiên người đang đồng hành.',
        [act('gaming-community'), stat('mood', 1)],
      ],
      [
        'Nghỉ tập để nghĩ lại nhịp sống',
        'Hồi sức; chưa khép hồ sơ',
        'Bạn dành thời gian nhìn lại.',
        [act('gaming-rest'), stat('stress', -1)],
      ],
      [
        'Khép lịch thi đấu và tập luyện',
        'Giữ thành tích; không nhận lại tiền cũ',
        'Bạn khép một chặng gaming.',
        [act('gaming-retire'), stat('mood', 2)],
      ],
    ],
  ),
  scene(
    'co-proposal',
    'Ai làm gì trong lần hợp tác?',
    'Lời mời đã gửi. Trước khi nhận lịch, hai bên còn phải nói rõ phần việc, nguồn và quyền đăng; có thể không đạt thỏa thuận.',
    [
      [
        'Chia công và ghi nguồn ngang nhau',
        'Phí vừa; vẫn có thể bị từ chối',
        'Bạn gửi điều kiện chia công cân bằng.',
        [act('collab-balanced'), stat('social', 1)],
      ],
      [
        'Thu gọn, mỗi bên giữ phần riêng',
        'Dễ trao đổi; chất lượng có giới hạn',
        'Bạn đề nghị một phạm vi gọn.',
        [act('collab-flexible'), stat('stress', -1)],
      ],
      [
        'Xin quyền đăng đợt đầu cho bạn',
        'Khó được chọn; tốn phí hơn',
        'Bạn gửi điều kiện quyền đăng ưu tiên.',
        [act('collab-exclusive'), stat('stress', 2)],
      ],
      [
        'Dừng trước khi hứa quá phần mình',
        'Giữ phí đã chi; không tăng khán giả',
        'Bạn khép lời mời chưa phù hợp.',
        [act('collab-cancel'), stat('mood', 1)],
      ],
    ],
    1,
  ),
  scene(
    'co-offered',
    'Một lời hẹn cần có quỹ',
    'Hai bên đã đồng ý phạm vi. Chi phí sản xuất chung đi trước kết quả; lượt xem có thể trùng hoặc giảm sau khi đăng.',
    [
      [
        'Nhận lịch khi kênh và quỹ đủ',
        'Chi phí thật; chờ kỳ kết quả',
        'Bạn nhìn quỹ trước khi nhận lịch.',
        [act('collab-accept'), stat('stress', 1)],
      ],
      [
        'Giữ lời hẹn, chưa nhận sản xuất',
        'Chưa chi thêm; lời hẹn có thời hạn',
        'Bạn kiểm lịch và trao đổi thêm.',
        [act('collab-wait'), stat('knowledge', 1)],
      ],
      [
        'Rà lại phần mình phải chuẩn bị',
        'Chưa tăng người xem hoặc thu nhập',
        'Bạn xem lại yêu cầu của lời hẹn.',
        [act('collab-wait'), stat('skill', 1)],
      ],
      [
        'Khép khi chưa đủ thời gian',
        'Giữ phí chuẩn bị; không vay để nhận',
        'Bạn dừng trước khi nhận thêm việc.',
        [act('collab-cancel'), stat('stress', -1)],
      ],
    ],
    1,
  ),
  scene(
    'co-working',
    'Bản dựng có hai nhịp làm',
    'Một bên muốn đăng sớm, bên kia muốn soát thêm. Nội dung chung cần ghi công rõ và không lấy người theo dõi làm lời hứa chắc chắn.',
    [
      [
        'Chi thêm một lượt soát bản dựng',
        'Tốn quỹ; tăng chất lượng nếu đủ tiền',
        'Bạn xem quỹ cho phần dựng thêm.',
        [act('collab-polish'), stat('stress', 1)],
      ],
      [
        'Rà nguồn và phần ghi công',
        'Tăng nhẹ chất lượng; tốn công',
        'Bạn làm rõ phần ghi công chung.',
        [act('collab-protect'), stat('knowledge', 1)],
      ],
      [
        'Giữ bản và kỳ hẹn đã thống nhất',
        'Không chi thêm; chờ kết quả',
        'Bạn giữ phạm vi hai bên đã chọn.',
        [act('collab-wait'), stat('mood', 1)],
      ],
      [
        'Dừng nếu không còn cùng cách làm',
        'Mất phí đã làm; không cộng người xem',
        'Bạn khép phần hợp tác đang dở.',
        [act('collab-cancel'), stat('stress', -2)],
      ],
    ],
    1,
  ),
  scene(
    'co-result',
    'Sau nội dung chung',
    'Lời hẹn đã khép với kết quả trong sổ kênh. Một cuộc hợp tác không tạo ra bộ khán giả hay nguồn tiền nền tảng thứ hai.',
    [
      [
        'Ghi lại điều giúp hai bên phối hợp',
        'Thêm tri thức; không cộng lại hiệu quả',
        'Bạn giữ bài học cho lời hẹn sau.',
        [act('collab-wait'), stat('knowledge', 2)],
      ],
      [
        'Xem phần người xem chưa thấy phù hợp',
        'Thêm tay nghề; có chút áp lực',
        'Bạn nhìn lại bản dựng đã đăng.',
        [act('collab-wait'), stat('skill', 1), stat('stress', 1)],
      ],
      [
        'Cảm ơn phần công đã cùng làm',
        'Thêm giao tiếp; kết quả cũ giữ nguyên',
        'Bạn khép lời cảm ơn với đối tác.',
        [act('collab-wait'), stat('social', 1)],
      ],
      [
        'Dành thời gian nghỉ trước lời hẹn mới',
        'Giảm áp lực; chưa mở cơ hội mới',
        'Bạn để mình nghỉ một nhịp.',
        [act('collab-wait'), stat('stress', -2)],
      ],
    ],
  ),
];
