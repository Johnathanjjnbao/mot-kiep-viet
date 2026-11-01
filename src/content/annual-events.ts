import type { EventDefinition, GameRun } from '../domain/model';
import { event, choice, stat, flag, later } from './authoring';
import { residentParents, birthplaceOf } from '../domain/creator';

// Authored situations, not age-number substitutions. Existing childhood/adult pools remain usable.
const infant = (
  id: string,
  title: string,
  text: string,
  options: [string, string, string, string],
  outcomes: [string, string, string, string],
  minAge = 0,
) =>
  event(
    id,
    'childhood',
    title,
    text,
    { minAge, maxAge: 2 },
    [
      choice('care', options[0], 'Sức khỏe +3', outcomes[0], [stat('health', 3)]),
      choice('explore', options[1], 'Tri thức +3, tay nghề +1', outcomes[1], [
        stat('knowledge', 3),
        stat('skill', 1),
      ]),
      choice('connect', options[2], 'Tâm trạng +3, giao tiếp +2', outcomes[2], [
        stat('mood', 3),
        stat('social', 2),
      ]),
      choice('rhythm', options[3], 'Áp lực −3, thói quen chăm sóc', outcomes[3], [
        stat('stress', -3),
        flag('annual-care-rhythm'),
      ]),
    ],
    { version: 9, once: false, cooldown: 36 },
  );

export const annualEvents: EventDefinition[] = [
  infant(
    'annual-sleep',
    'Một đêm nhiều lần thức',
    'Bạn thức giấc giữa những quãng ngủ ngắn. Người chăm sóc thử cách giúp bạn yên lòng, đồng thời tìm nhịp nghỉ cho chính mình.',
    [
      'Theo dõi cữ ăn và giấc ngủ',
      'Cho nghe những âm thanh nhẹ lúc thức',
      'Bế vỗ về và đáp lại tiếng khóc',
      'Chia việc chăm sóc thành những khoảng nghỉ',
    ],
    [
      'Nhu cầu của bạn được nhận ra sớm hơn.',
      'Những âm thanh quen dần gắn với lúc bình yên.',
      'Bạn nhận được sự đáp lại đều đặn.',
      'Người chăm sóc bớt quá tải; nhịp sinh hoạt dễ chịu hơn.',
    ],
  ),
  infant(
    'annual-room',
    'Một góc dành cho em bé',
    'Góc ngủ còn lẫn đồ dùng của người lớn. Người chăm sóc chọn việc cần làm trước để bạn có chỗ nghỉ và nhìn ngắm an toàn.',
    [
      'Dọn vật cứng khỏi chỗ ngủ',
      'Treo một vật tương phản để nhìn theo',
      'Đặt góc ngủ gần người chăm sóc',
      'Giữ góc ngủ yên và ít xáo trộn',
    ],
    [
      'Chỗ nghỉ được sắp xếp cẩn thận.',
      'Bạn tập hướng mắt theo hình khối.',
      'Những tín hiệu nhỏ của bạn dễ được nghe thấy.',
      'Một nhịp nghỉ quen thuộc bắt đầu hình thành.',
    ],
  ),
  infant(
    'annual-voices',
    'Giọng nói quen thuộc',
    'Bạn phản ứng với giọng nói và nét mặt. Người chăm sóc nhận thấy có những lúc bạn muốn giao tiếp, có lúc cần nghỉ.',
    [
      'Dừng lại khi em bé có dấu hiệu mệt',
      'Gọi tên những đồ vật xung quanh',
      'Đáp lời những tiếng ê a',
      'Giữ một câu hát trước giờ ngủ',
    ],
    [
      'Bạn có thời gian hồi sức giữa các lần chơi.',
      'Âm thanh dần đi cùng đồ vật quen.',
      'Tiếng ê a có người đáp lại.',
      'Câu hát thành dấu hiệu một ngày sắp khép lại.',
    ],
  ),
  infant(
    'annual-heat',
    'Buổi trưa oi',
    'Không khí trong nhà bí hơn thường lệ. Người chăm sóc cân nhắc cách đổi sinh hoạt để bạn bớt khó chịu.',
    [
      'Kiểm tra chỗ nằm và theo dõi biểu hiện',
      'Cho quan sát bóng cây lúc trời dịu',
      'Ngồi gần và trò chuyện thật khẽ',
      'Dời giờ chơi sang buổi mát',
    ],
    [
      'Bạn được chăm sóc theo phản ứng thực tế.',
      'Ánh sáng và bóng cây đem đến điều mới để nhìn.',
      'Sự hiện diện quen thuộc giúp bạn yên hơn.',
      'Nhịp ngày được điều chỉnh theo thời tiết.',
    ],
  ),
  infant(
    'annual-visit',
    'Một người ghé thăm',
    'Có người quen ghé nhà. Bạn nhìn gương mặt lạ rồi quay về phía người chăm sóc; cuộc gặp cần theo nhịp của bạn.',
    [
      'Giữ khoảng nghỉ khi em bé mệt',
      'Cho quan sát từ một khoảng gần an toàn',
      'Để khách chào bằng giọng nhẹ',
      'Giữ nguyên giờ ăn và ngủ',
    ],
    [
      'Cuộc gặp không lấy mất thời gian nghỉ.',
      'Bạn có thể nhìn điều mới mà vẫn thấy chỗ dựa.',
      'Một tương tác nhỏ diễn ra trong sự yên tâm.',
      'Nhịp sinh hoạt không bị xáo trộn vì buổi thăm.',
    ],
  ),
  infant(
    'annual-hands',
    'Bàn tay tìm đồ vật',
    'Bạn đưa tay về phía một món đồ vừa tầm. Người chăm sóc lựa cách hỗ trợ mà không làm thay mọi chuyển động.',
    [
      'Kiểm tra vật chơi không có phần nguy hiểm',
      'Để em bé tự thử với tay',
      'Chơi chuyền đồ cùng người chăm sóc',
      'Chơi ngắn rồi nghỉ khi mất hứng',
    ],
    [
      'Bạn có một vật chơi phù hợp hơn.',
      'Việc thử lại giúp phối hợp mắt và tay.',
      'Niềm vui có người cùng chia sẻ.',
      'Tín hiệu mệt và hứng thú được tôn trọng.',
    ],
  ),
  infant(
    'annual-steps',
    'Những bước còn chao',
    'Bạn muốn tới một góc khác trong nhà nhưng vẫn cần điểm tựa. Người chăm sóc cân nhắc lúc nào giúp và lúc nào chờ.',
    [
      'Dọn lối đi trước khi tập',
      'Cho tự tìm điểm tựa vừa tầm',
      'Cổ vũ từng lần thử',
      'Giữ buổi tập ngắn, đều đặn',
    ],
    [
      'Bạn có khoảng di chuyển an toàn hơn.',
      'Mỗi lần thử tạo thêm kinh nghiệm vận động.',
      'Sự động viên giúp bạn bớt ngại thử lại.',
      'Bạn nghỉ trước khi quá mệt.',
    ],
    1,
  ),
  infant(
    'annual-first-words',
    'Điều muốn nói',
    'Bạn chỉ vào một vật rồi phát ra vài tiếng chưa rõ. Người chăm sóc tìm cách đáp lại mà không biến cuộc trò chuyện thành bài kiểm tra.',
    [
      'Chờ khi em bé đã ăn nghỉ đủ',
      'Nói tên vật bằng câu ngắn',
      'Đáp lại cả cử chỉ và ánh mắt',
      'Đọc vài câu quen vào cùng giờ',
    ],
    [
      'Bạn thoải mái hơn khi giao tiếp.',
      'Một âm thanh bắt đầu có nghĩa.',
      'Mong muốn của bạn được lắng nghe.',
      'Những câu quen trở lại trong ngày.',
    ],
    1,
  ),
  infant(
    'annual-share-toy',
    'Hai bàn tay cùng muốn',
    'Trong một lần chơi gần bạn nhỏ khác, cả hai cùng giữ một món đồ. Người chăm sóc giúp cuộc chơi tiếp tục mà không gán lỗi cho trẻ.',
    [
      'Tách đồ chơi có cạnh cứng ra trước',
      'Làm mẫu cách đổi lượt',
      'Gọi tên cảm xúc và chờ trẻ bình tĩnh',
      'Chuyển sang trò chơi ngắn ít tranh giành',
    ],
    [
      'Cuộc chơi được giữ an toàn.',
      'Bạn nhìn thấy một cách cùng sử dụng đồ vật.',
      'Cảm xúc của bạn có người nhận ra.',
      'Nhịp chơi nhẹ hơn giúp cả hai nghỉ.',
    ],
    1,
  ),
  infant(
    'annual-leave-home',
    'Một quãng xa người quen',
    'Một việc cần làm khiến người chăm sóc quen thuộc phải rời đi một lúc. Việc chuyển tay chăm sóc được chuẩn bị theo người thật sự có mặt.',
    [
      'Trao đổi rõ nhu cầu ăn nghỉ',
      'Mang theo một đồ vật quen',
      'Chào và đón bằng một nghi thức ngắn',
      'Tập từng quãng ngắn rồi tăng dần',
    ],
    [
      'Người nhận chăm sóc nắm được nhu cầu của bạn.',
      'Đồ vật quen giúp nối hai không gian.',
      'Sự đi và về có dấu hiệu dễ nhận biết.',
      'Bạn có thời gian làm quen nhịp mới.',
    ],
    1,
  ),
  infant(
    'annual-questions',
    'Câu hỏi nối câu hỏi',
    'Bạn liên tục chỉ và hỏi về những thứ quanh mình. Người chăm sóc không có mọi câu trả lời, nhưng có thể cùng bạn tìm hiểu.',
    [
      'Chọn lúc đủ tỉnh táo để cùng chơi',
      'Cùng quan sát rồi thử giải thích',
      'Để bạn kể lại điều vừa thấy',
      'Chọn một câu hỏi cho buổi đi dạo',
    ],
    [
      'Cuộc chơi đi theo sức của bạn.',
      'Sự tò mò có chỗ để thử nghiệm.',
      'Điều bạn nhận thấy được coi trọng.',
      'Một câu hỏi được theo dõi đến cùng.',
    ],
    2,
  ),
  infant(
    'annual-boundary',
    'Muốn tự làm',
    'Bạn khăng khăng tự thử một việc trong sinh hoạt. Người chăm sóc tìm ranh giới giữa sự an toàn và mong muốn được làm lấy.',
    [
      'Giữ phần nguy hiểm cho người lớn',
      'Chia việc thành bước nhỏ để trẻ thử',
      'Cho chọn giữa hai cách phù hợp',
      'Giữ trình tự quen và đủ thời gian',
    ],
    [
      'Bạn vẫn được thử trong giới hạn an toàn.',
      'Một bước tự làm thành công đem lại kinh nghiệm.',
      'Bạn có tiếng nói trong việc vừa sức.',
      'Không bị thúc giục, bạn bớt căng thẳng.',
    ],
    2,
  ),
  event(
    'annual-neighbourhood',
    'relationship',
    'Một chỗ ngồi trong xóm',
    'Một khoảng sinh hoạt chung đang được sắp lại. Người đến đông hơn, nhưng có người ngại góp ý. Bạn cân nhắc phần mình có thể làm.',
    { minAge: 18 },
    [
      choice(
        'listen',
        'Nghe nhu cầu của những người ít lên tiếng',
        'Giao tiếp +3',
        'Bạn biết thêm một nhu cầu trước đây dễ bị bỏ qua.',
        [stat('social', 3)],
      ),
      choice(
        'repair',
        'Góp công sửa một vật dùng chung',
        'Tay nghề +3, áp lực +1',
        'Phần việc vừa sức được hoàn thành, dù mất một buổi rảnh.',
        [stat('skill', 3), stat('stress', 1)],
      ),
      choice(
        'walk',
        'Thử một lối đi thuận tiện hơn',
        'Sức khỏe +3',
        'Bạn chọn một lộ trình có thể tiếp tục trong sinh hoạt.',
        [stat('health', 3)],
      ),
      choice(
        'return',
        'Hẹn một buổi quay lại xem kết quả',
        'Niềm vui đến sau',
        'Bạn để lại một lời hẹn cụ thể.',
        [later(12, 'Trở lại khoảng sinh hoạt chung', [stat('mood', 4)])],
      ),
    ],
    { version: 9, once: false, cooldown: 36 },
  ),
];

export function contextualAnnual(r: GameRun, e: EventDefinition): EventDefinition {
  if (e.id === 'employment-search') {
    const period = r.employment?.periods.at(-1);
    const months = period?.endMonth === null ? r.month - period.startMonth : 0;
    const rejection = r.employment?.applications.at(-1)?.result === 'rejected';
    const dependent = r.npcs.some((n) => {
      const child = r.family?.children.find((c) => c.npcId === n.id);
      return (
        n.role === 'child' &&
        n.alive &&
        (child ? r.month - child.bornMonth < 216 : r.world.year - n.birthYear < 18)
      );
    });
    return {
      ...e,
      text: `Bạn đã ${months} tháng chưa có việc toàn thời gian.${rejection ? ' Hồ sơ gần nhất chưa được nhận.' : ''}${dependent ? ' Trong nhà còn con chưa trưởng thành cần chăm sóc.' : ''} Bạn cân nhắc tìm việc, nhận việc tạm, củng cố kỹ năng hoặc hồi sức trước khi thử tiếp.`,
    };
  }
  if (e.version !== 9) return e;
  const parents = residentParents(r);
  const care = parents.length ? parents.map((p) => p.name).join(' và ') : 'Người đang chăm sóc bạn';
  return {
    ...e,
    text: `${e.text}\n\n${r.month < 36 ? `${care} đang chăm sóc bạn. ` : ''}${birthplaceOf(r)}; ${r.household.background.toLowerCase()}.`,
  };
}
