import type { CareerId, Stat } from '../domain/model';
import type { ProgramId } from '../domain/academics';
import { event, choice, flag, stat } from './authoring';
export interface Program {
  id: ProgramId;
  name: string;
  years: number;
  tuition: number;
  knowledge: number;
  difficulty: number;
  from: number;
  skills: [Stat, Stat];
  careers: CareerId[];
  description: string;
  incident: string;
  prompt: string;
  decisions: [string, string, string, string];
}
// Availability and đSM fees are game design parameters, not real university admissions/prices.
export const PROGRAMS: Program[] = [
  {
    id: 'it',
    name: 'Công nghệ thông tin',
    years: 4,
    tuition: 60,
    knowledge: 35,
    difficulty: 54,
    from: 2000,
    skills: ['knowledge', 'skill'],
    careers: ['tech', 'freelance'],
    description:
      'Lập trình, hệ thống và kiểm thử. Có thể đi làm kỹ thuật, làm dự án hoặc chuyển hướng khi đủ kỹ năng.',
    incident: 'Đồ án gặp lỗi',
    prompt:
      'Đồ án chạy trên một máy nhưng lỗi ở máy khác. Cả nhóm còn thời gian thử lại, trong lúc những học phần khác cũng cần được chuẩn bị.',
    decisions: [
      'Tái hiện lỗi, thử lại',
      'Làm bản mẫu cùng nhóm thực tập',
      'Nhận việc hỗ trợ để trang trải',
      'Xin chậm một năm để hồi phục',
    ],
  },
  {
    id: 'engineering',
    name: 'Kỹ thuật',
    years: 4,
    tuition: 55,
    knowledge: 32,
    difficulty: 52,
    from: 1975,
    skills: ['skill', 'knowledge'],
    careers: ['trade', 'office'],
    description:
      'Thiết kế, đo đạc và thực hành kỹ thuật. Bằng học không thay cho giấy phép chuyên môn ở những công việc có điều kiện.',
    incident: 'Mô hình bị cong',
    prompt:
      'Mô hình bị cong khi tăng tải. Bạn còn một lượt thử để tìm giới hạn và ghi lại kết quả, kể cả những phần chưa đạt.',
    decisions: [
      'Đo lại và ghi giới hạn',
      'Cùng nhóm chế tạo mẫu mới',
      'Làm việc phụ ở xưởng đúng phạm vi',
      'Bảo lưu để giải quyết sức khỏe',
    ],
  },
  {
    id: 'health',
    name: 'Khoa học sức khỏe',
    years: 6,
    tuition: 85,
    knowledge: 45,
    difficulty: 64,
    from: 1975,
    skills: ['knowledge', 'skill'],
    careers: ['office', 'service'],
    description:
      'Chương trình khoa học sức khỏe mô phỏng. Tốt nghiệp không tự cấp phép hành nghề bác sĩ, dược sĩ hay điều trị độc lập.',
    incident: 'Thực hành có giám sát',
    prompt:
      'Có một bước thực hành bạn chưa hiểu rõ. Người hướng dẫn đang ở gần; bạn cần giữ đúng phạm vi người học.',
    decisions: [
      'Hỏi và ôn quy trình',
      'Theo nhóm thực tập có giám sát',
      'Làm việc hỗ trợ ngoài giờ học',
      'Bảo lưu để giảm quá tải',
    ],
  },
  {
    id: 'business',
    name: 'Quản trị kinh doanh',
    years: 4,
    tuition: 45,
    knowledge: 25,
    difficulty: 44,
    from: 1975,
    skills: ['social', 'skill'],
    careers: ['business', 'retail', 'office'],
    description:
      'Tổ chức công việc, vận hành và làm việc với khách hàng. Dự án học tập có thể thất bại và không tự tạo doanh nghiệp.',
    incident: 'Kế hoạch thiếu khách',
    prompt:
      'Buổi thử bán hàng có rất ít người hỏi. Nhóm cần kiểm tra lại nhu cầu trước khi bỏ thêm công sức vào bản kế hoạch.',
    decisions: [
      'Hỏi khách, sửa kế hoạch',
      'Thử một dự án nhỏ cùng nhóm',
      'Đi làm thêm để hiểu vận hành',
      'Nghỉ một năm, xem lại mục tiêu',
    ],
  },
  {
    id: 'accounting',
    name: 'Kế toán và Kiểm toán',
    years: 4,
    tuition: 45,
    knowledge: 30,
    difficulty: 50,
    from: 1975,
    skills: ['knowledge', 'skill'],
    careers: ['office', 'business'],
    description:
      'Sổ sách, đối chiếu và trách nhiệm báo cáo. Kết quả học tập và kinh nghiệm vẫn cần tích lũy sau khi có bằng.',
    incident: 'Sổ sách chưa khớp',
    prompt:
      'Hai bảng số cuối kỳ không khớp. Hạn nộp đang gần; bạn cần tìm sai ở bước nhập liệu hay ở cách phân loại khoản chi.',
    decisions: [
      'Đối chiếu bút toán',
      'Làm hồ sơ thực tập cùng người hướng dẫn',
      'Nhận việc nhập liệu vừa sức',
      'Bảo lưu để hồi phục trước kỳ sau',
    ],
  },
  {
    id: 'finance',
    name: 'Tài chính và Ngân hàng',
    years: 4,
    tuition: 60,
    knowledge: 35,
    difficulty: 56,
    from: 1975,
    skills: ['knowledge', 'social'],
    careers: ['office', 'business'],
    description:
      'Phân tích, quản trị rủi ro và hoạt động tài chính. Bài học không phải lời khuyên đầu tư hay cơ hội sinh lời được bảo đảm.',
    incident: 'Giả định cần kiểm tra',
    prompt:
      'Đổi một giả định, kết luận của bài phân tích thay hẳn. Nhóm cần biết rủi ro nằm ở đâu trước buổi trình bày.',
    decisions: [
      'Thử kịch bản xấu',
      'Đem mô hình vào bài thực tập',
      'Làm công việc hỗ trợ để tự trang trải',
      'Tạm nghỉ để ổn định việc riêng',
    ],
  },
  {
    id: 'law',
    name: 'Luật',
    years: 4,
    tuition: 65,
    knowledge: 38,
    difficulty: 60,
    from: 1975,
    skills: ['knowledge', 'social'],
    careers: ['office', 'freelance'],
    description:
      'Đọc hồ sơ, lập luận và tìm nguồn. Văn bằng mô phỏng không tự trao tư cách luật sư hay quyền hành nghề có điều kiện.',
    incident: 'Hồ sơ còn mâu thuẫn',
    prompt:
      'Hai lời trình bày trong hồ sơ đều có điểm thuyết phục. Bạn cần dựa vào dữ kiện và nguồn để chuẩn bị phần lập luận.',
    decisions: [
      'Lập bảng chứng cứ',
      'Thực hành trao đổi hồ sơ có hướng dẫn',
      'Làm việc hành chính ngoài giờ',
      'Bảo lưu để xử lý áp lực',
    ],
  },
  {
    id: 'education',
    name: 'Sư phạm và Giáo dục',
    years: 4,
    tuition: 40,
    knowledge: 35,
    difficulty: 54,
    from: 1975,
    skills: ['knowledge', 'social'],
    careers: ['teacher', 'office'],
    description:
      'Phương pháp dạy, quan sát người học và thực tập. Cần hoàn tất đúng ngành để mở hướng dạy học trong ruleset này.',
    incident: 'Một bài giảng khó',
    prompt:
      'Có người theo bài giảng rất nhanh, có người chưa hiểu bước đầu. Bạn còn thời gian sửa cách giải thích trước lượt tập sau.',
    decisions: [
      'Chia bài thành bước nhỏ',
      'Thực tập lớp học cùng người hướng dẫn',
      'Làm trợ giảng vừa sức ngoài giờ',
      'Bảo lưu để chăm sóc bản thân',
    ],
  },
  {
    id: 'korean',
    name: 'Ngôn ngữ Hàn Quốc',
    years: 4,
    tuition: 55,
    knowledge: 28,
    difficulty: 50,
    from: 1995,
    skills: ['social', 'knowledge'],
    careers: ['office', 'freelance', 'retail'],
    description:
      'Ngôn ngữ, văn hóa và thực hành biên phiên dịch. Có thể làm việc doanh nghiệp, dịch vụ, kinh doanh hoặc học thêm để chuyển hướng.',
    incident: 'Câu dịch sai ngữ cảnh',
    prompt:
      'Câu dịch sát từng chữ khiến người nghe hiểu khác. Bạn cần tìm lại ngữ cảnh và nhận ra lúc nào nên hỏi thêm.',
    decisions: [
      'So lại ngữ cảnh',
      'Thực tập phiên dịch có người kiểm tra',
      'Làm công việc giao tiếp ngoài giờ',
      'Nghỉ một năm để sắp xếp lại',
    ],
  },
  {
    id: 'english',
    name: 'Ngôn ngữ Anh',
    years: 4,
    tuition: 50,
    knowledge: 28,
    difficulty: 48,
    from: 1975,
    skills: ['social', 'knowledge'],
    careers: ['service', 'office', 'freelance'],
    description:
      'Đọc, viết, giao tiếp và dịch trong ngữ cảnh. Năng lực thực hành và chuyên môn khác vẫn ảnh hưởng việc làm.',
    incident: 'Đổi người nghe',
    prompt:
      'Người nghe bài nói vừa đổi. Họ không quen vài thuật ngữ bạn đã chuẩn bị; bạn còn một lượt để điều chỉnh.',
    decisions: [
      'Đổi ví dụ cho người nghe',
      'Làm một dự án giao tiếp cùng nhóm',
      'Nhận việc dịch vụ để tự trang trải',
      'Bảo lưu và luyện lại theo nhịp riêng',
    ],
  },
  {
    id: 'design',
    name: 'Thiết kế và Nghệ thuật',
    years: 4,
    tuition: 60,
    knowledge: 25,
    difficulty: 50,
    from: 1975,
    skills: ['skill', 'social'],
    careers: ['freelance', 'business', 'service'],
    description:
      'Hồ sơ tác phẩm, thực hành tạo hình và làm việc với yêu cầu. Một phong cách riêng vẫn cần đi cùng kỹ năng và khả năng nhận phản hồi.',
    incident: 'Bản thiết kế cần sửa',
    prompt:
      'Bạn thích bản thiết kế, nhưng người phản biện thấy khó dùng. Bạn cần quyết định cách thử và nhận lại phản hồi.',
    decisions: [
      'Thử với người dùng',
      'Làm tác phẩm chung cho kỳ thực tập',
      'Nhận việc sáng tạo nhỏ ngoài giờ',
      'Nghỉ một năm để phục hồi cảm hứng',
    ],
  },
  {
    id: 'communications',
    name: 'Truyền thông và Marketing',
    years: 4,
    tuition: 55,
    knowledge: 27,
    difficulty: 48,
    from: 1995,
    skills: ['social', 'skill'],
    careers: ['office', 'freelance', 'business'],
    description:
      'Sản xuất nội dung, nghiên cứu công chúng và làm việc theo chiến dịch. Lượt xem và doanh thu không phải cùng một thứ.',
    incident: 'Thông điệp bị hiểu lệch',
    prompt:
      'Nội dung nhận phản hồi khác hẳn dự tính. Nhóm còn thời gian kiểm tra cách người xem hiểu thông điệp trước khi sửa.',
    decisions: [
      'Thử lại thông điệp',
      'Làm chiến dịch thực tập có người hướng dẫn',
      'Nhận việc hỗ trợ nội dung ngoài giờ',
      'Bảo lưu để giảm quá tải',
    ],
  },
];
export const programById = (id: string) => PROGRAMS.find((p) => p.id === id);
export const academicTemplates = PROGRAMS.map((p) =>
  event(
    'edu-' + p.id,
    'education',
    p.incident,
    p.prompt,
    { minAge: 18 },
    [
      choice(
        'steady',
        p.decisions[0],
        'Củng cố kiến thức',
        'Bạn điều chỉnh cách học và dự phần đánh giá.',
        [{ kind: 'academic', method: 'steady' }],
      ),
      choice(
        'project',
        p.decisions[1],
        'Thực hành, áp lực tăng',
        'Bạn dành thêm thời gian cho phần thực hành.',
        [{ kind: 'academic', method: 'project' }],
      ),
      choice(
        'work',
        p.decisions[2],
        'Làm thêm, bớt ôn tập',
        'Bạn chia thời gian giữa việc học và việc làm thêm.',
        [{ kind: 'academic', method: 'work' }],
      ),
      choice(
        'rest',
        p.decisions[3],
        'Hồi phục, chậm một năm',
        'Bạn dành năm này để hồi phục thay vì dự đánh giá.',
        [{ kind: 'academic', method: 'rest' }],
      ),
    ],
    { version: 7 },
  ),
);
export const educationDirection = event(
  'edu-direction',
  'education',
  'Đường học tiếp',
  'Đại học, học nghề hay đi làm trước? Bạn cân nhắc điều muốn học và khoản cần chuẩn bị. Hướng đi sau này vẫn có thể đổi.',
  { minAge: 18, maxAge: 24, absent: ['edu-direction-chosen'] },
  [
    choice(
      'university',
      'Tìm ngành đại học',
      'Xem mục Nghề nghiệp',
      'Bạn bắt đầu tìm chương trình và điều kiện tuyển sinh.',
      [flag('edu-direction-chosen'), flag('academic-interest'), stat('knowledge', 3)],
    ),
    choice(
      'vocational',
      'Chọn học nghề trước',
      'Khóa học hai năm, chưa cấp bằng ngay',
      'Bạn chọn học một nghề thực hành trước khi tính bước tiếp.',
      [
        flag('edu-direction-chosen'),
        { kind: 'education', level: 'vocational', years: 2 },
        stat('skill', 5),
      ],
    ),
    choice(
      'work',
      'Đi làm và để ngỏ việc học',
      'Có thể quay lại nộp hồ sơ khi đủ điều kiện',
      'Bạn chuẩn bị đi làm, vẫn giữ quyền học tiếp sau này.',
      [flag('edu-direction-chosen'), stat('skill', 4), stat('social', 3)],
    ),
    choice(
      'self',
      'Tự học trong khi tìm hướng',
      'Tập trung kiến thức, chưa có bằng đại học',
      'Bạn chọn một nhịp tự học và hẹn ngày xem lại kế hoạch.',
      [
        flag('edu-direction-chosen'),
        { kind: 'education', level: 'self', years: 1 },
        stat('knowledge', 5),
      ],
    ),
  ],
  { version: 7, priority: 30 },
);
