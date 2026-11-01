import { formatMoney, currencyOf } from '../domain/currency';
import { SOCIAL_LABELS } from '../engine/social';
import { lifeSummary as v2Summary } from '../legacy/v2/application/summary';
import { lifeSummary as legacySummary } from '../legacy/v1/application/summary';
import { birthplaceOf, familyText } from '../domain/creator';
import type { GameRun } from '../domain/model';
import { CAREERS, ageOf } from '../content/world';
import { netWorth } from '../engine/finance';
import { programById } from '../content/programs';
export function lifeSummary(run: GameRun) {
  if (run.engineVersion === '2.0.0') return v2Summary(run as Parameters<typeof v2Summary>[0]);
  if (run.engineVersion === '1.0.0')
    return legacySummary(run as Parameters<typeof legacySummary>[0]);
  const jobs = [
    ...new Set(run.player.careers.map((c) => CAREERS.find((j) => j.id === c.id)!.name)),
  ];
  const children = run.npcs.filter((n) => n.role === 'child').length;
  const titles = run.choices.filter((c) =>
    [
      'business-crossroads',
      'family-legacy',
      'career-comeback',
      'education-path',
      'meet-partner',
      'welcome-child',
    ].includes(c.eventId),
  );
  const biography = `${run.player.name} sinh năm ${run.player.birthYear}, tại ${birthplaceOf(run)}, gia cảnh ${run.household.background.toLowerCase()}. ${familyText(run)}. ${jobs.length ? `Đã đi qua ${jobs.length} hướng nghề: ${jobs.join(', ')}.` : 'Chưa có công việc chính thức được ghi nhận trong mô phỏng.'} ${children ? `Đã đón ${children} người con.` : 'Không có người con được ghi nhận.'} ${run.wardrobe?.memories.length ? `Tủ đồ giữ ${run.wardrobe.memories.length} dấu mốc mua sắm.` : ''} ${run.ending === 'death' ? `Cuộc đời khép lại ở tuổi ${ageOf(run)}.` : `Trang hồi ký dừng ở tuổi ${ageOf(run)}.`}`;
  const socialText = run.social
    ? ` Những người đã đi cùng: ${
        run.social.people
          .filter((p) => p.known)
          .map(
            (p) =>
              run.npcs.find((n) => n.id === p.npcId)!.name +
              ' (' +
              SOCIAL_LABELS[p.status] +
              ', ' +
              p.memories.length +
              ' ký ức)',
          )
          .join(', ') || 'chưa có đối thoại riêng'
      }.`
    : '';
  return {
    biography:
      biography +
      socialText +
      (run.creator?.channels.length
        ? ' Làm nội dung: ' +
          run.creator.channels
            .map(
              (c) =>
                `${c.platform === 'youtube' ? 'YouTube' : 'TikTok'} (${c.status === 'closed' ? 'đã khép kênh' : c.status === 'paused' ? 'đang nghỉ' : 'đang sản xuất'}, ${c.audience} người theo dõi, thu ${formatMoney(c.totals.platformIncome + c.totals.sponsorIncome, run)}, chi ${formatMoney(c.totals.cost, run)})`,
            )
            .join('; ') +
          '.'
        : '') +
      (run.enterprise?.ventures.length
        ? ' Tự mở tiệm: ' +
          run.enterprise.ventures
            .map(
              (e) =>
                `${{ clothing: 'quần áo', household: 'đồ gia dụng', handmade: 'đồ thủ công' }[e.category]} (${e.status === 'closed' ? 'đã đóng' : e.status === 'suspended' ? 'đang tạm dừng' : 'đang bán'}, vốn đã góp ${formatMoney(e.totals.contributed, run)}, đã rút ${formatMoney(e.totals.withdrawn, run)}, lãi/lỗ cộng dồn ${formatMoney(e.totals.revenue - e.totals.cogs - e.totals.operating - e.totals.writeOff, run)})`,
            )
            .join('; ') +
          '.'
        : '') +
      (run.employment
        ? ` Mưu sinh: ${run.employment.applications.filter((a) => a.result === 'rejected').length} hồ sơ chưa được nhận; tổng cộng ${run.employment.periods.reduce((n, p) => n + (p.endMonth ?? run.month) - p.startMonth, 0)} tháng chưa có việc. ${run.player.careers.filter((c) => c.field === 'outside').length} chặng việc ngoài hướng ngành đã học, ${run.player.careers.filter((c) => c.ending === 'layoff').length} lần mất việc do cắt giảm.`
        : '') +
      (run.academics?.studies.length
        ? ' Việc học: ' +
          run.academics.studies
            .map(
              (s) =>
                `${programById(s.programId)!.name} (${s.status === 'graduated' ? 'đã tốt nghiệp' : s.status === 'failed' ? 'chưa hoàn thành' : s.status === 'switched' ? 'đã chuyển ngành' : s.status === 'dropped' ? 'đã nghỉ học' : s.status === 'paused' ? 'đang bảo lưu' : 'đang học'}, ${s.completedYears} năm đạt)`,
            )
            .join('; ') +
          '.'
        : '') +
      (run.family?.children.length
        ? ' Những chặng đường của con: ' +
          run.family.children
            .map(
              (c) =>
                run.npcs.find((n) => n.id === c.npcId)!.name +
                ' — ' +
                (c.occupation ?? c.education),
            )
            .join('; ') +
          '.'
        : ''),
    jobs,
    children,
    important: titles,
    humor: run.journal.filter((j) => j.category === 'humor'),
    netWorth: netWorth(run),
    careerYears: Math.floor(
      run.player.careers.reduce((n, c) => n + (c.endMonth ?? run.month) - c.startMonth, 0) / 12,
    ),
  };
}
export function summaryCardSvg(run: GameRun) {
  const escape = (s: string) =>
    s.replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!,
    );
  const summary = lifeSummary(run);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600"><rect width="900" height="600" fill="#f5f1e8"/><rect x="28" y="28" width="844" height="544" rx="4" fill="none" stroke="#9e4837"/><text x="64" y="91" font-family="serif" font-size="26" fill="#9e4837">MỘT KIẾP VIỆT · MỘT ĐỜI NGƯỜI, VẠN NGÃ RẼ</text><path d="M64 120H836" stroke="#c8c1b2"/><text x="64" y="216" font-family="serif" font-size="52" fill="#292d29">${escape(run.player.name)}</text><text x="64" y="268" font-family="sans-serif" font-size="25" fill="#555d52">${run.player.birthYear} — ${run.world.year} · ${ageOf(run)} tuổi</text><text x="64" y="340" font-family="sans-serif" font-size="23" fill="#292d29">${run.choices.length} ngã rẽ · ${summary.careerYears} năm đi làm · ${summary.children} người con</text><text x="64" y="392" font-family="sans-serif" font-size="23" fill="#292d29">Tài sản ròng: ${currencyOf(run) === 'vnd-v1' ? formatMoney(summary.netWorth, run) + ' (sức mua thiết kế 2026)' : summary.netWorth + ' đSM (đơn vị thiết kế)'}</text><text x="64" y="463" font-family="serif" font-style="italic" font-size="30" fill="#9e4837">Mỗi điều bình thường, một lần thành ký ức.</text><text x="64" y="528" font-family="sans-serif" font-size="17" fill="#555d52">Hồi ký từ dữ liệu đã chơi · Hạt giống: ${escape(run.seed.slice(0, 50))}</text></svg>`;
}
