import { designMoney } from '../domain/currency';
import type { CareerDefinition, GameRun, Region, WorldState } from '../domain/model';
export const REGIONS: Region[] = [
  {
    id: 'southern-city',
    name: 'Một con hẻm phương Nam',
    short: 'Đô thị phía Nam',
    environment: 'urban',
    story:
      'Nhà nhỏ cuối hẻm, trước cửa có giàn hoa giấy. Tiếng người bán hàng gọi nhau lẫn vào mùi cơm mới. Gia đình bạn chắt chiu từ một sạp hàng nhỏ.',
  },
  {
    id: 'northern-village',
    name: 'Một làng quê Bắc Bộ',
    short: 'Nông thôn phía Bắc',
    environment: 'rural',
    story:
      'Sau mái nhà là khoảng vườn, xa hơn là cánh đồng. Mẹ giữ những quyển vở cũ của anh em họ, cha mong bạn có nhiều lựa chọn hơn thế hệ mình.',
  },
  {
    id: 'central-coast',
    name: 'Một xóm nhỏ ven biển',
    short: 'Duyên hải miền Trung',
    environment: 'coastal',
    story:
      'Gió biển đi qua từng khe cửa. Nhà có người làm nghề sửa máy và một khoảng sân phơi cá. Người lớn dạy bạn nhìn trời trước khi tính chuyện ngày mai.',
  },
];
export const COHORTS = [1975, 1995, 2005] as const;
export const ERAS = [
  {
    id: 'rebuilding',
    name: 'Những năm dựng lại',
    from: 1975,
    to: 1985,
    wage: 0.75,
    cost: 0.8,
    text: 'Đời sống còn nhiều thiếu thốn. Những lựa chọn nhỏ của gia đình để lại dấu vết dài lâu.',
  },
  {
    id: 'renovation',
    name: 'Làn gió Đổi Mới',
    from: 1986,
    to: 1999,
    wage: 0.88,
    cost: 0.9,
    text: 'Cơ hội buôn bán và đổi nghề mở ra, đi cùng những bấp bênh mới.',
  },
  {
    id: 'integration',
    name: 'Cánh cửa hội nhập',
    from: 2000,
    to: 2009,
    wage: 1,
    cost: 1,
    text: 'Việc học và công nghệ mở thêm những cánh cửa đến một đời sống khác.',
  },
  {
    id: 'connected',
    name: 'Những ngày kết nối',
    from: 2010,
    to: 2019,
    wage: 1.1,
    cost: 1.08,
    text: 'Phố thị lớn lên, Internet kết nối những người chưa từng gặp mặt.',
  },
  {
    id: 'digital',
    name: 'Biến động & chuyển mình',
    from: 2020,
    to: 2026,
    wage: 1.12,
    cost: 1.15,
    text: 'Dịch bệnh làm đứt những nhịp quen. Công việc và cách sống thay đổi.',
  },
  {
    id: 'future',
    name: 'Những trang chưa viết',
    from: 2027,
    to: 2200,
    wage: 1.16,
    cost: 1.18,
    text: 'Từ đây là tương lai giả định do trò chơi sáng tác, không phải dự báo hay lịch sử đã được kiểm chứng.',
  },
];
export function worldFor(year: number): WorldState {
  const era = ERAS.find((e) => year >= e.from && year <= e.to) ?? ERAS[ERAS.length - 1];
  return {
    year,
    eraId: era.id,
    eraName: era.name,
    fictional: year >= 2027,
    wageFactor: era.wage,
    costFactor: era.cost,
    technologies: [...(year >= 2000 ? ['internet'] : []), ...(year >= 2010 ? ['smartphone'] : [])],
  };
}
export const CAREERS: CareerDefinition[] = [
  {
    id: 'farm',
    name: 'Làm nông',
    from: 1975,
    minAge: 18,
    education: [],
    knowledge: 0,
    skill: 0,
    baseIncome: 15,
    stability: 0.85,
    progression: 'Tăng năng suất nhờ kinh nghiệm và tay nghề.',
    categories: ['career', 'history'],
    description: 'Chăm ruộng vườn, giữ nhịp mùa vụ.',
  },
  {
    id: 'labor',
    name: 'Lao động phổ thông',
    from: 1975,
    minAge: 18,
    education: [],
    knowledge: 0,
    skill: 0,
    baseIncome: 17,
    stability: 0.65,
    progression: 'Kinh nghiệm tăng lương; áp lực ảnh hưởng thu nhập.',
    categories: ['career'],
    description: 'Những ca làm đổi lấy đồng lương đầu tiên.',
  },
  {
    id: 'trade',
    name: 'Thợ lành nghề',
    from: 1975,
    minAge: 18,
    education: [],
    knowledge: 0,
    skill: 25,
    baseIncome: 23,
    stability: 0.88,
    progression: 'Tay nghề quyết định giá công.',
    categories: ['career', 'education'],
    description: 'Sửa chữa, gia công, làm ra thứ hữu ích.',
  },
  {
    id: 'retail',
    name: 'Bán hàng',
    from: 1975,
    minAge: 18,
    education: [],
    knowledge: 0,
    skill: 0,
    baseIncome: 18,
    stability: 0.72,
    progression: 'Kỹ năng xã hội giúp giữ khách.',
    categories: ['career', 'finance'],
    description: 'Nhớ tên khách, hiểu món hàng.',
  },
  {
    id: 'service',
    name: 'Dịch vụ & nhà hàng',
    from: 1975,
    minAge: 18,
    education: [],
    knowledge: 0,
    skill: 5,
    baseIncome: 19,
    stability: 0.6,
    progression: 'Kinh nghiệm và sự khéo léo tạo cơ hội.',
    categories: ['career', 'humor'],
    description: 'Một công việc luôn có người để gặp.',
  },
  {
    id: 'office',
    name: 'Nhân viên văn phòng',
    from: 1986,
    minAge: 18,
    education: ['general', 'vocational', 'university', 'self'],
    knowledge: 28,
    skill: 0,
    baseIncome: 25,
    stability: 0.8,
    progression: 'Tích lũy kinh nghiệm, lên bậc mỗi 6 năm.',
    categories: ['career'],
    description: 'Giấy tờ, kế hoạch và những buổi họp.',
  },
  {
    id: 'teacher',
    name: 'Người dạy học',
    from: 1975,
    minAge: 22,
    education: ['university'],
    knowledge: 45,
    skill: 0,
    baseIncome: 26,
    stability: 0.96,
    progression: 'Chuyên môn và thâm niên tạo bậc lương.',
    categories: ['career', 'relationship'],
    description: 'Mở cánh cửa tri thức cho người khác.',
  },
  {
    id: 'tech',
    name: 'Công nghệ thông tin',
    from: 2000,
    minAge: 20,
    education: ['vocational', 'university', 'self'],
    knowledge: 45,
    skill: 25,
    baseIncome: 35,
    stability: 0.74,
    progression: 'Học liên tục để theo kịp thay đổi.',
    categories: ['career', 'education'],
    description: 'Tìm lời giải trong những dòng mã.',
  },
  {
    id: 'freelance',
    name: 'Làm việc tự do',
    from: 2000,
    minAge: 18,
    education: [],
    knowledge: 25,
    skill: 20,
    baseIncome: 27,
    stability: 0.5,
    progression: 'Thu nhập dao động theo kỹ năng và kỳ nhận việc.',
    categories: ['career', 'finance'],
    description: 'Tự tìm việc, tự giữ lời hẹn.',
  },
  {
    id: 'business',
    name: 'Chủ tiệm nhỏ',
    from: 1986,
    minAge: 20,
    education: [],
    knowledge: 20,
    skill: 20,
    baseIncome: 30,
    stability: 0.55,
    progression: 'Kinh nghiệm và khách quen giúp tiệm lớn lên.',
    categories: ['career', 'finance', 'relationship'],
    description: 'Tự đứng tên một tiệm, tự gánh những ngày vắng khách.',
  },
];
export const currentCareer = (run: GameRun) => run.player.careers.find((c) => c.endMonth === null);
export const ageOf = (run: GameRun) => Math.floor(run.month / 12);
export function educationLevel(run: GameRun) {
  if (run.academics?.qualifications.length) return 'university';
  return run.player.education.filter((e) => e.endMonth <= run.month).at(-1)?.level ?? 'none';
}
export function careerReason(run: GameRun, id: string, ignoreApplications = false): string | null {
  const job = CAREERS.find((c) => c.id === id);
  if (!job) return 'Công việc không tồn tại.';
  if (run.status === 'ended') return 'Cuộc đời đã khép lại.';
  if (ageOf(run) < job.minAge) return `Cần đủ ${job.minAge} tuổi.`;
  if (ageOf(run) >= 65) return 'Đã đến tuổi nghỉ hưu trong game.';
  if (run.world.year < job.from) return 'Chưa có cơ hội này trong thời kỳ hiện tại.';
  if (run.academics?.studies.some((s) => s.status === 'studying'))
    return 'Bạn đang học toàn thời gian; có thể bảo lưu trước khi nhận việc.';
  if (
    run.academics &&
    id === 'teacher' &&
    !run.academics.qualifications.some((q) => q.programId === 'education')
  )
    return 'Hướng dạy học này cần hoàn tất ngành Sư phạm và Giáo dục trong mô phỏng.';
  if (run.player.education.some((e) => e.endMonth > run.month))
    return 'Hãy hoàn thành khóa học trước.';
  if (job.education.length && !job.education.includes(educationLevel(run)))
    return 'Chưa đáp ứng yêu cầu đào tạo.';
  if (run.player.stats.knowledge < job.knowledge) return `Cần ${job.knowledge} tri thức.`;
  if (run.player.stats.skill < job.skill) return `Cần ${job.skill} tay nghề.`;
  if (run.employment && !ignoreApplications) {
    if (currentCareer(run)?.id === id) return null;
    if (run.employment.applications.length >= 80)
      return 'Đã đạt giới hạn hồ sơ tự ứng tuyển; điểm hỗ trợ việc tạm vẫn có thể giúp.';
    if (run.employment.applications.some((a) => a.career === id && run.month - a.month < 6))
      return 'Cần đợi 6 tháng trước khi nộp lại cùng nghề.';
  }
  return null;
}
export function monthlyIncome(run: GameRun) {
  const record = currentCareer(run);
  if (!record) return 0;
  const job = CAREERS.find((c) => c.id === record.id)!;
  const performance =
    1 +
    run.player.stats.skill / 180 +
    (job.id === 'retail' ? run.player.stats.social / 200 : 0) -
    run.player.stats.stress / 250;
  return designMoney(
    run,
    Math.max(
      1,
      Math.round(
        job.baseIncome *
          run.world.wageFactor *
          (1 + record.level * 0.14) *
          performance *
          record.incomeFactor,
      ),
    ),
  );
}
export function monthlyExpense(run: GameRun) {
  const children = run.npcs.filter(
    (n) =>
      n.role === 'child' &&
      n.alive &&
      (run.family?.children.some((c) => c.npcId === n.id)
        ? run.month - run.family.children.find((c) => c.npcId === n.id)!.bornMonth < 216
        : run.world.year - n.birthYear < 18),
  ).length;
  return designMoney(
    run,
    Math.round(
      (ageOf(run) < 18
        ? 1
        : 10 +
          (run.setup.environment === 'urban' ? 2 : 0) +
          (run.household.housing === 'rent' ? 6 : 0) +
          (run.social?.people.some((p) => p.cohabiting) ? 3 : 0) +
          children * 3) * run.world.costFactor,
    ),
  );
}
