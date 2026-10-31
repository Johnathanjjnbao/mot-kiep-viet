import { event, choice } from './authoring';
export const employmentEvents = [
  event(
    'employment-search',
    'career',
    'Một khoảng giữa hai việc',
    'Chưa có việc, bạn vẫn phải lo những khoản thường ngày. Một điểm hỗ trợ có ca làm tạm; những hồ sơ khác cũng có thể thử tiếp.',
    { minAge: 18, maxAge: 64, job: 'unemployed' },
    [
      choice(
        'search',
        'Nộp hồ sơ ở một nơi khác',
        'Có thể được nhận hoặc từ chối',
        'Bạn tìm một cơ hội phù hợp điều kiện hiện tại.',
        [{ kind: 'employment', operation: 'search' }],
      ),
      choice(
        'temporary',
        'Nhận ca làm tạm được giới thiệu',
        'Hợp đồng sáu tháng, có lương theo tháng',
        'Bạn chọn một bước đệm để ổn định thu nhập.',
        [{ kind: 'employment', operation: 'temporary' }],
      ),
      choice(
        'train',
        'Luyện hồ sơ và một kỹ năng',
        'Buổi hướng dẫn miễn phí',
        'Bạn chuẩn bị cho lần ứng tuyển sau.',
        [{ kind: 'employment', operation: 'train' }],
      ),
      choice(
        'rest',
        'Giữ nhịp sinh hoạt để hồi sức',
        'Áp lực giảm, chưa có thu nhập mới',
        'Bạn dành thời gian chăm lại mình.',
        [{ kind: 'employment', operation: 'rest' }],
      ),
    ],
    { version: 8, once: false, cooldown: 12, priority: 10 },
  ),
];
