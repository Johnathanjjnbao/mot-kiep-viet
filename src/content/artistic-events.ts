import type { Effect, EventDefinition } from '../domain/model';
import type { ArtStoryOperation } from '../domain/artistic';
import { event, choice, stat } from './authoring';
const art = (operation: ArtStoryOperation): Effect => ({ kind: 'artistic', operation });
type Path = [string, string, string, Effect[]];
function scene(
  id: string,
  title: string,
  text: string,
  paths: Path[],
  priority = 0,
): EventDefinition {
  return event(
    'ar-' + id,
    'career',
    title,
    text,
    { minAge: 18 },
    paths.map(([t, h, o, f], i) => choice(['a', 'b', 'c', 'd'][i], t, h, o, f)),
    { version: 15, once: false, cooldown: 12, weight: 14, priority },
  );
}
export const artisticEvents: EventDefinition[] = [
  scene(
    'music',
    'Một đoạn nhạc còn chênh',
    'Bạn đã thuộc giai điệu nhưng đoạn chuyển vẫn chưa vững. Có thể tập nền, tập cách đứng trước người xem hoặc để giọng nghỉ.',
    [
      [
        'Luyện chậm đoạn chuyển',
        'Thêm chuyên môn; tốn công tập',
        'Bạn quay về phần nền cần sửa.',
        [art('technique'), stat('stress', 1)],
      ],
      [
        'Tập một tiết mục ngắn trước nhóm nhỏ',
        'Thêm làm chủ sân khấu; tăng mệt',
        'Bạn tập cách giữ nhịp trước người xem.',
        [art('stage'), stat('social', 1)],
      ],
      [
        'Nghe góp ý rồi chọn phần sửa',
        'Chăm uy tín; cần thời gian',
        'Bạn nghe góp ý cho tiết mục.',
        [art('community'), stat('knowledge', 1)],
      ],
      [
        'Để cả tập và diễn nghỉ',
        'Hồi sức; không có phí show lúc nghỉ',
        'Bạn cho giọng và mình nghỉ.',
        [art('rest'), stat('health', 1)],
      ],
    ],
  ),
  scene(
    'dance',
    'Một động tác chưa thành nhịp',
    'Động tác đã đúng riêng lẻ nhưng ghép nhạc còn gấp. Tập nhiều hơn có thể tiến bộ, cũng có thể khiến bạn kiệt sức.',
    [
      [
        'Tập nền chậm và có giới hạn',
        'Thêm chuyên môn; vẫn có chi phí',
        'Bạn quay về nhịp căn bản.',
        [art('technique'), stat('knowledge', 1)],
      ],
      [
        'Ghép thử một đoạn biểu diễn',
        'Thêm bản lĩnh; tăng mệt',
        'Bạn tập cách nối động tác trên sân khấu.',
        [art('stage'), stat('stress', 1)],
      ],
      [
        'Soát cùng người dựng tiết mục',
        'Chăm uy tín và cách phối hợp',
        'Bạn nhận góp ý về nhịp chung.',
        [art('community'), stat('social', 1)],
      ],
      [
        'Dừng buổi tập để hồi sức',
        'Nghỉ cả show; không tự có fan',
        'Bạn để cơ thể hồi lại.',
        [art('rest'), stat('health', 1)],
      ],
    ],
  ),
  scene(
    'acting',
    'Một lời thoại chưa chạm',
    'Bạn thuộc lời nhưng cảnh diễn còn cứng. Làm nghề cần hiểu nhân vật và người cùng diễn, không chỉ được nhìn thấy trên sân khấu.',
    [
      [
        'Đọc lại bối cảnh rồi luyện nền',
        'Thêm chuyên môn; tốn thời gian',
        'Bạn tìm lý do của một câu nói.',
        [art('technique'), stat('knowledge', 1)],
      ],
      [
        'Tập cảnh ngắn trước nhóm xem thử',
        'Thêm bản lĩnh; có áp lực',
        'Bạn thử cảnh diễn trong một nhịp thật.',
        [art('stage'), stat('stress', 1)],
      ],
      [
        'Nghe người cùng dựng góp ý',
        'Chăm uy tín; ít tập nền hơn',
        'Bạn nói rõ phần chưa làm được.',
        [art('community'), stat('social', 1)],
      ],
      [
        'Nghỉ cả tập và lịch diễn',
        'Hồi sức; chưa có tiền show mới',
        'Bạn cho mình một nhịp nghỉ.',
        [art('rest'), stat('mood', 1)],
      ],
    ],
  ),
  scene(
    'audition',
    'Một lượt thử chưa phải lời mời',
    'Nhóm tổ chức đang xem tiết mục. Nếu đủ điều kiện, bạn có thể gửi một lượt thử; lượt đã gửi phải chờ và vẫn có thể bị từ chối.',
    [
      [
        'Gửi lịch vừa sức khi đã đủ điều kiện',
        'Có phí chuẩn bị; chia30% nếu nhận',
        'Bạn xét một lịch hợp tác vừa sức.',
        [art('audition-balanced'), stat('stress', 1)],
      ],
      [
        'Cân nhắc lịch dồn khi phù hợp',
        'Dễ được xét hơn; chia45%, mệt hơn',
        'Bạn nhìn kỹ điều kiện của lịch dồn.',
        [art('audition-fast-track'), stat('stress', 2)],
      ],
      [
        'Giữ lượt đang chờ, luyện phần nền',
        'Tăng chuyên môn; chưa có hợp đồng',
        'Bạn tiếp tục phần mình có thể chuẩn bị.',
        [art('technique'), stat('knowledge', 1)],
      ],
      [
        'Xét đường tự do khi không còn lượt chờ',
        'Tự lo sân khấu; không chắc có phí',
        'Bạn nhìn khả năng tự nhận tiết mục.',
        [art('independent'), stat('social', 1)],
      ],
    ],
    1,
  ),
  scene(
    'offer',
    'Lời mời có phần phải chia',
    'Nhóm tổ chức đã chọn tiết mục thử. Kỳ hợp tác có thời hạn và phần chia phí show; lời mời vẫn chưa phải thu nhập hay danh tiếng.',
    [
      [
        'Nhận lịch nếu quỹ đầu kỳ đủ',
        'Theo phần chia đã chọn; chưa có tiền ngay',
        'Bạn xét nhận lịch có thời hạn.',
        [art('accept'), stat('stress', 1)],
      ],
      [
        'Từ chối khi nhịp không phù hợp',
        'Giữ phí thử đã chi; không bị ép nhận',
        'Bạn không nhận lời mời này.',
        [art('decline'), stat('mood', 1)],
      ],
      [
        'Chọn làm tự do nếu đủ khả năng',
        'Tự chịu chi phí và kết quả',
        'Bạn xét đường tự nhận lịch.',
        [art('independent'), stat('social', 1)],
      ],
      [
        'Nghỉ tập để cân nhắc trước hạn trả lời',
        'Đề nghị vẫn có hạn; không có phí show',
        'Bạn dành một nhịp để nhìn lại.',
        [art('rest'), stat('stress', -1)],
      ],
    ],
    3,
  ),
  scene(
    'first-show',
    'Ánh đèn chưa nói hết kết quả',
    'Bạn đã bắt đầu nhận lịch. Một sân khấu nhỏ vẫn có chi phí, người xem có thể không ở lại và phí show có thể không bù phần đã chi.',
    [
      [
        'Soát nền trước tiết mục sau',
        'Thêm chuyên môn; có công tập',
        'Bạn trở lại phần nền.',
        [art('technique'), stat('knowledge', 1)],
      ],
      [
        'Tập cách bước ra sân khấu',
        'Thêm bản lĩnh; nhanh mệt hơn',
        'Bạn tập phần lên và xuống tiết mục.',
        [art('stage'), stat('stress', 1)],
      ],
      [
        'Nghe người xem góp ý cụ thể',
        'Chăm uy tín; không mua thêm fan',
        'Bạn lắng nghe phần người xem còn vướng.',
        [art('community'), stat('social', 1)],
      ],
      [
        'Nghỉ cả lịch tập và show',
        'Giảm mệt; không thu show khi nghỉ',
        'Bạn giữ sức cho chặng sau.',
        [art('rest'), stat('health', 1)],
      ],
    ],
  ),
  scene(
    'fans',
    'Có người chờ tiết mục kế tiếp',
    'Một nhóm nhỏ đã nhớ tiết mục của bạn. Người theo dõi không phải tiền, và giữ kết nối không có nghĩa hứa biểu diễn bằng mọi giá.',
    [
      [
        'Làm rõ điều mình có thể đáp ứng',
        'Chăm uy tín; thêm công giao tiếp',
        'Bạn nói rõ nhịp có thể giữ.',
        [art('community'), stat('social', 1)],
      ],
      [
        'Luyện một tiết mục có chiều sâu',
        'Thêm chuyên môn; ít thời gian giao lưu',
        'Bạn chọn chăm phần nghề trước.',
        [art('technique'), stat('stress', 1)],
      ],
      [
        'Tập một chương trình gọn hơn',
        'Thêm bản lĩnh; vẫn có chi phí',
        'Bạn thử nhịp diễn vừa với mình.',
        [art('stage'), stat('knowledge', 1)],
      ],
      [
        'Nghỉ và nói rõ lịch nghỉ',
        'Hồi sức; có thể có người rời đi',
        'Bạn cho lịch diễn nghỉ.',
        [art('rest'), stat('mood', 1)],
      ],
    ],
  ),
  scene(
    'incident',
    'Phần ghi công còn thiếu',
    'Bản giới thiệu tiết mục chưa ghi đủ người đã cùng dựng. Bạn cần sửa cách làm; giữ uy tín cũng có phần công và áp lực phải chịu.',
    [
      [
        'Bổ sung nguồn và phần ghi công',
        'Uy tín tăng nhẹ; thêm công',
        'Bạn rà lại phần ghi công chung.',
        [art('credit'), stat('knowledge', 1)],
      ],
      [
        'Nhận thiếu sót và nói rõ việc sửa',
        'Có người rời đi; thêm áp lực',
        'Bạn nhận phần trách nhiệm của mình.',
        [art('apologize'), stat('social', 1)],
      ],
      [
        'Rà cách làm cùng nhóm trước lịch sau',
        'Chăm uy tín; tiến nghề chậm hơn',
        'Bạn điều chỉnh cách phối hợp.',
        [art('community'), stat('stress', 1)],
      ],
      [
        'Cho lịch tập và diễn nghỉ để xử lý',
        'Không thu show lúc nghỉ; hồi sức',
        'Bạn giảm lịch để xử lý phần còn thiếu.',
        [art('rest'), stat('mood', -1)],
      ],
    ],
  ),
  scene(
    'burnout',
    'Cơ thể không theo kịp lịch',
    'Lịch tập, show và việc khác đã chồng lên nhau. Nghỉ có thể làm một số người chờ lâu hơn, nhưng không phải mọi cơ hội đều phải nhận.',
    [
      [
        'Nghỉ cả tập lẫn show',
        'Hồi sức; chưa có thu show mới',
        'Bạn để lịch nghỉ.',
        [art('rest'), stat('health', 1)],
      ],
      [
        'Trở về luyện nền vừa sức',
        'Tập tốn quỹ; có thể lại cần nghỉ',
        'Bạn chọn nhịp luyện nền.',
        [art('technique'), stat('knowledge', 1)],
      ],
      [
        'Giữ phần kết nối khi quỹ và sức phù hợp',
        'Uy tín có thể tốt hơn; vẫn tốn công',
        'Bạn nhìn lại nhịp với người xem.',
        [art('community'), stat('social', 1)],
      ],
      [
        'Khép lịch biểu diễn hiện tại',
        'Giữ sổ; có một lần xét trở lại',
        'Bạn cân nhắc kết thúc chặng diễn này.',
        [art('retire'), stat('stress', -2)],
      ],
    ],
    1,
  ),
  scene(
    'comeback',
    'Có nên trở lại một sân khấu?',
    'Lịch biểu diễn đã khép, những tiết mục và chi phí cũ vẫn còn trong hồ sơ. Trở lại cần quỹ riêng và tập lại, không tự lấy lại fan hay phí show.',
    [
      [
        'Tập lại một lần khi quỹ đủ',
        'Tốn quỹ; chờ ít nhất sáu tháng',
        'Bạn xét một lần trở lại.',
        [art('comeback'), stat('stress', 1)],
      ],
      [
        'Giữ hồ sơ, nhìn lại điều đã học',
        'Thêm tri thức; chưa mở lịch mới',
        'Bạn nhìn lại phần nghề đã có.',
        [art('reflect'), stat('knowledge', 1)],
      ],
      [
        'Trân trọng người từng đồng hành',
        'Thêm tinh thần; không cộng fan cũ',
        'Bạn giữ những kỷ niệm đã qua.',
        [art('reflect'), stat('mood', 1)],
      ],
      [
        'Tiếp tục dành thời gian cho cuộc sống khác',
        'Giảm áp lực; lịch vẫn nghỉ',
        'Bạn chọn nhịp sống hiện tại.',
        [art('reflect'), stat('stress', -2)],
      ],
    ],
  ),
];
