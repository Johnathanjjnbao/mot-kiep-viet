import { parentingEvents } from './parenting-events';
import { diverseChildhood } from './childhood-diversity';
import { academicTemplates, educationDirection } from './programs';
import { romanceEvents } from './romance-events';
import { fashionEvents } from './fashion-events';
import type { EventDefinition } from '../domain/model';
import { choice, event, stat } from './authoring';
import { childhood, education } from './growing-up';
import { careerEvents } from './work';
import { relationshipEvents, financeEvents } from './everyday';
import { historyEvents, humorEvents } from './world-events';
// The original eight-event vertical slice is retained, with the verified content expansion below.
export const EVENTS: EventDefinition[] = [
  ...academicTemplates,
  educationDirection,
  ...diverseChildhood,
  ...parentingEvents,
  ...romanceEvents,
  ...fashionEvents,
  event(
    'first-rain',
    'childhood',
    'Cơn mưa đầu đời',
    'Mưa rơi lộp bộp trên mái. Mẹ kéo ghế ngồi bên cửa, kể cho bạn nghe chuyện hồi còn bé.',
    { minAge: 3, maxAge: 5 },
    [
      choice(
        'listen',
        'Ngồi nghe mẹ kể',
        'Gần gũi gia đình',
        'Bạn nhớ bàn tay ấm của mẹ hơn cả câu chuyện.',
        [stat('mood', 6), { kind: 'relationship', target: 'mother', amount: 8 }],
      ),
      choice(
        'explore',
        'Ra hiên nhìn mưa',
        'Khám phá thế giới',
        'Bạn phát hiện vũng nước có thể giữ cả bầu trời.',
        [stat('knowledge', 5), stat('mood', 3)],
      ),
    ],
  ),
  event(
    'first-school',
    'education',
    'Ngày đầu đến lớp',
    'Một chiếc cặp hơi rộng, một căn phòng đầy gương mặt lạ. Cô giáo mời bạn tự giới thiệu.',
    { minAge: 6, maxAge: 8 },
    [
      choice(
        'speak',
        'Nói tên mình thật rõ',
        'Xã hội +8',
        'Giọng còn run, nhưng bạn đã nói được.',
        [stat('social', 8), stat('knowledge', 4)],
      ),
      choice(
        'draw',
        'Vẽ một bức tranh thay lời chào',
        'Tri thức +7',
        'Bức tranh kéo một bạn cùng bàn đến làm quen.',
        [stat('knowledge', 7), stat('mood', 3)],
      ),
    ],
    { priority: 30 },
  ),
  event(
    'old-book',
    'education',
    'Cuốn sách chuyền tay',
    'Người bạn đưa bạn một cuốn sách đã sờn gáy. Giữa trang còn kẹp chiếc lá khô.',
    { minAge: 9, maxAge: 17 },
    [
      choice(
        'read',
        'Đọc rồi kể lại cho bạn',
        'Tri thức +10',
        'Bạn bắt đầu thấy ngoài con đường quen còn nhiều ngả khác.',
        [stat('knowledge', 10)],
      ),
      choice(
        'play',
        'Rủ bạn ra sân chơi',
        'Sức khỏe +5, xã hội +6',
        'Một buổi chiều đầy tiếng cười cũng là thứ đáng giữ.',
        [stat('health', 5), stat('social', 6)],
      ),
    ],
  ),
  event(
    'education-path',
    'education',
    'Qua ngưỡng cửa mười tám',
    'Tấm bằng phổ thông nằm trên bàn. Gia đình hỏi bạn muốn đi học tiếp hay bắt đầu đi làm.',
    { minAge: 18, maxAge: 24, absent: ['education-decided'] },
    [
      choice(
        'university',
        'Theo học đại học',
        '180 đSM · 4 năm · tri thức +18',
        'Bạn bắt đầu bốn năm học; cơ hội vẫn cần tự tìm.',
        [
          { kind: 'cash', amount: -180, label: 'Học phí đại học' },
          { kind: 'education', level: 'university', years: 4 },
          stat('knowledge', 18),
          { kind: 'flag', flag: 'education-decided', value: true },
        ],
        { requires: { minCash: 180 } },
      ),
      choice(
        'vocational',
        'Học một nghề thực tế',
        '70 đSM · 2 năm · tay nghề +22',
        'Bạn chọn học từ những công cụ cầm được trong tay.',
        [
          { kind: 'cash', amount: -70, label: 'Học phí nghề' },
          { kind: 'education', level: 'vocational', years: 2 },
          stat('skill', 22),
          { kind: 'flag', flag: 'education-decided', value: true },
        ],
        { requires: { minCash: 70 } },
      ),
      choice(
        'work',
        'Đi làm và tự học',
        'Tay nghề +8 · tự lập sớm',
        'Bạn giữ lại sách vở, nhưng ngày mai bắt đầu tìm việc.',
        [
          { kind: 'education', level: 'self', years: 0 },
          stat('skill', 8),
          { kind: 'flag', flag: 'education-decided', value: true },
        ],
      ),
    ],
    { priority: 100 },
  ),
  event(
    'first-offer',
    'career',
    'Một công việc đầu tiên',
    'Có người giới thiệu một chỗ đang cần lao động. Đồng lương vừa phải, nhưng bạn có thể bắt đầu ngay.',
    { minAge: 18, maxAge: 64, job: 'unemployed' },
    [
      choice('accept', 'Nhận việc', 'Có thu nhập hằng tháng', 'Bạn có tên trong ca làm đầu tiên.', [
        { kind: 'career', career: 'labor' },
        stat('skill', 5),
      ]),
      choice(
        'prepare',
        'Dành thời gian học thêm',
        'Tri thức +6 · chưa có lương',
        'Bạn chọn chuẩn bị thêm và theo dõi chi phí sinh hoạt.',
        [stat('knowledge', 6), stat('skill', 3)],
      ),
    ],
    { priority: 10 },
  ),
  event(
    'work-rhythm',
    'career',
    'Ngày làm việc dài',
    'Công việc dồn lại vào cuối tuần. Bạn cân nhắc giữa cố thêm một chút và giữ sức cho đường dài.',
    { minAge: 18, maxAge: 64, job: 'employed' },
    [
      choice(
        'extra',
        'Nhận thêm phần việc',
        '+24 đSM · áp lực +8',
        'Bạn được trả công cho phần việc thêm.',
        [{ kind: 'cash', amount: 24, label: 'Làm thêm' }, stat('stress', 8), stat('skill', 4)],
      ),
      choice(
        'rest',
        'Xin nghỉ đúng giờ',
        'Sức khỏe +4 · áp lực −6',
        'Buổi tối còn đủ dài cho một bữa cơm tử tế.',
        [stat('health', 4), stat('stress', -6)],
      ),
    ],
    { once: false, cooldown: 36 },
  ),
  event(
    'old-friend',
    'relationship',
    'Một lời hỏi thăm',
    'Bạn cũ ghé chơi, mang theo một câu chuyện nhỏ và nhiều thời gian để nghe.',
    { minAge: 18, npc: 'friend' },
    [
      choice(
        'tea',
        'Pha ấm trà, ngồi lại',
        'Tình bạn +10',
        'Có người nhớ bạn của ngày xưa là một điều dễ chịu.',
        [{ kind: 'relationship', target: 'friend', amount: 10 }, stat('mood', 5)],
      ),
      choice('walk', 'Cùng đi dạo', 'Sức khỏe +4', 'Hai người đi bộ đến khi câu chuyện hết dài.', [
        stat('health', 4),
        stat('stress', -5),
      ]),
    ],
    { once: false, cooldown: 48 },
  ),
  event(
    'slow-morning',
    'finance',
    'Buổi sáng không vội',
    'Bạn nhìn lại nhịp sống của mình. Những việc nhỏ lặp lại có thể đổi cả một quãng đời.',
    { minAge: 25 },
    [
      choice(
        'exercise',
        'Tập thói quen vận động',
        'Sức khỏe +5 · thói quen tốt',
        'Bạn bắt đầu từ mười phút mỗi sáng.',
        [{ kind: 'habit', amount: 1 }, stat('health', 5)],
      ),
      choice('learn', 'Học một điều chưa biết', 'Tri thức +6', 'Một cuốn sổ mới lại được mở ra.', [
        stat('knowledge', 6),
        stat('mood', 3),
      ]),
    ],
    { once: false, cooldown: 48 },
  ),
  ...childhood,
  ...education,
  ...careerEvents,
  ...relationshipEvents,
  ...financeEvents,
  ...historyEvents,
  ...humorEvents,
];
export const FALLBACK = event(
  'ordinary-days',
  'humor',
  'Những ngày bình thường',
  'Có những năm không có bước ngoặt lớn. Một bữa cơm ngon, một lời hỏi thăm vẫn đủ làm đời sống có hình hài.',
  { minAge: 0 },
  [
    choice(
      'care',
      'Chăm sóc bản thân',
      'Sức khỏe +3 · áp lực −4',
      'Bạn giữ lại một khoảng thở cho mình.',
      [stat('health', 3), stat('stress', -4)],
    ),
    choice(
      'practice',
      'Luyện một kỹ năng',
      'Tay nghề +4',
      'Việc nhỏ làm đều rồi cũng thành thạo.',
      [stat('skill', 4), stat('knowledge', 2)],
    ),
  ],
  { once: false, cooldown: 0 },
);
export const allEvents = () => [...EVENTS, FALLBACK];
