import { designMoney } from '../domain/currency';
import type { GameRun, EventDefinition } from '../domain/model';
import type { SocialAction, SocialOperation, SocialPerson, SocialStatus } from '../domain/social';
import { hashSeed } from './random';
import { presentationScore } from '../content/clothing';
import { romanceEvents } from '../content/romance-events';
import { mandatoryCost, transact } from './finance';
const cap = (n: number) => Math.max(0, Math.min(100, n));
const adult = (r: GameRun, p: SocialPerson) =>
  r.month >= 216 && r.world.year - r.npcs.find((n) => n.id === p.npcId)!.birthYear >= 18;
export function initSocial(r: GameRun) {
  const people = ['friend', 'social:linh', 'social:bao'].map((npcId, i): SocialPerson => {
    const h = hashSeed(r.seed + ':social:' + npcId),
      pref = (['learning', 'creativity', 'security'] as const)[i];
    if (i) {
      r.npcs.push({
        id: npcId,
        name: i === 1 ? 'Linh' : 'Bảo',
        role: 'friend',
        birthYear: r.player.birthYear - (i === 1 ? 3 : 10),
        alive: true,
      });
      r.relationships.push({ npcId, type: 'friend', strength: 35, history: [] });
    }
    return {
      npcId,
      known: false,
      status: 'acquaintance',
      preference: pref,
      personality: [['Điềm đạm', 'Tự chủ', 'Thận trọng'][i]],
      values: [['Ham học', 'Tự do sáng tạo', 'Giữ lời'][i]],
      interests: [['Sách và ý tưởng', 'Nghệ thuật và trải nghiệm', 'Gia đình và sự bền vững'][i]],
      romanticOpen: h % 5 !== 0,
      exclusivityOpen: h % 7 !== 0,
      marriageOpen: h % 6 !== 0,
      secretWilling: h % 3 !== 0,
      wantsChildren: h % 4 !== 0,
      reconciliationOpen: h % 3 !== 1,
      trust: 35,
      affection: 25,
      attraction: 0,
      compatibility: 0,
      interest: 'none',
      emotionalState: 'steady',
      memories: [],
      metMonth: null,
      datingMonth: null,
      marriedMonth: null,
      separatedMonth: null,
      separatedFrom: null,
      cohabiting: false,
      studyingUntil: 0,
      lastContact: 0,
    };
  });
  r.social = {
    people,
    empathy: 40,
    regulation: 40,
    reputation: 50,
    primaryId: null,
    secretId: null,
    breach: null,
    discoveryMonth: null,
    discoveryPending: false,
    childrenPlanned: false,
    lossPending: null,
    focus: null,
    encounters: {},
    lastNaturalMonth: -24,
  };
}
export function refreshSocial(r: GameRun) {
  const s = r.social;
  if (!s) return;
  for (const p of s.people) {
    const taste =
      p.preference === 'learning'
        ? r.player.stats.knowledge
        : p.preference === 'creativity'
          ? r.player.stats.skill
          : s.reputation;
    p.compatibility = cap(
      Math.round(25 + taste * 0.45 + s.empathy * 0.2 - Math.min(15, r.player.stats.stress * 0.15)),
    );
    const attire = presentationScore(
      r,
      p.preference === 'security'
        ? 'thrifty'
        : p.preference === 'learning'
          ? 'interview'
          : 'creative',
    );
    p.attraction = cap(
      Math.round(
        8 +
          p.compatibility * 0.35 +
          p.trust * 0.25 +
          p.affection * 0.25 +
          attire -
          r.player.stats.stress * 0.1,
      ),
    );
    p.interest =
      p.known && adult(r, p) && r.npcs.find((n) => n.id === p.npcId)?.alive && p.romanticOpen
        ? p.attraction >= 50
          ? 'crush'
          : p.attraction >= 30
            ? 'admiration'
            : 'none'
        : 'none';
  }
}
const partnered = (p: SocialPerson) => ['exclusive', 'cohabiting', 'married'].includes(p.status);
export function socialEligible(r: GameRun, id: string, npcId: string, manual = false): boolean {
  if (r.academics?.focus) return false;
  const s = r.social,
    p = s?.people.find((p) => p.npcId === npcId);
  if (!s || !p || !adult(r, p) || r.status === 'ended') return false;
  const alive = !!r.npcs.find((n) => n.id === npcId)?.alive,
    primary = s.primaryId === npcId;
  if (id === 'soc-loss') return s.lossPending === npcId && !alive;
  if (!alive) return false;
  if (!manual && (r.month - s.lastNaturalMonth < 24 || r.seen[id] !== undefined)) return false;
  if (manual && r.month - (s.encounters[id + ':' + npcId] ?? -999) < 12) return false;
  switch (id) {
    case 'soc-meet':
      return !p.known;
    case 'soc-listen':
    case 'soc-book':
    case 'soc-boundary':
      return p.known;
    case 'soc-flirt':
    case 'soc-date':
      return p.known && !s.primaryId && !['married', 'exclusive', 'secret'].includes(p.status);
    case 'soc-exclusive':
      return p.status === 'dating' && !s.primaryId;
    case 'soc-cohabit':
      return primary && p.status === 'exclusive' && r.month - (p.datingMonth ?? r.month) >= 12;
    case 'soc-proposal':
      return (
        primary &&
        ['exclusive', 'cohabiting'].includes(p.status) &&
        r.month - (p.datingMonth ?? r.month) >= 12
      );
    case 'soc-budget':
    case 'soc-study':
    case 'soc-child-plan':
      return primary && ['cohabiting', 'married'].includes(p.status);
    case 'soc-old-friend':
      return ['former', 'divorced'].includes(p.status);
    case 'soc-new-start':
      return p.known && !s.primaryId && s.people.some((x) => x.status === 'divorced');
    case 'soc-temptation':
      return (
        !!s.primaryId &&
        !primary &&
        p.known &&
        s.people.some((x) => x.npcId === s.primaryId && partnered(x)) &&
        !s.breach
      );
    case 'soc-secret':
      return s.secretId === npcId;
    case 'soc-discovery':
      return s.breach?.primaryId === npcId && s.discoveryPending;
    case 'soc-confession':
      return s.breach?.primaryId === npcId && !s.breach.revealed;
    case 'soc-repair':
      return primary && (p.status === 'separated' || p.trust < 55);
    case 'soc-separate':
      return primary && partnered(p);
    case 'soc-divorce':
      return primary && p.status === 'separated' && p.marriedMonth !== null;
    default:
      return false;
  }
}
export function socialTarget(r: GameRun, id: string) {
  return r.social?.people.find((p) => socialEligible(r, id, p.npcId))?.npcId;
}
export function socialDefinition(r: GameRun): EventDefinition | undefined {
  const f = r.social?.focus;
  if (!f || f.instanceId !== r.activeEvent?.id) return;
  const e = romanceEvents.find((e) => e.id === f.templateId),
    npc = r.npcs.find((n) => n.id === f.npcId);
  if (!e || !npc) return;
  return { ...e, id: f.instanceId, text: e.text.replaceAll('{name}', npc.name) };
}
export function focusSocial(r: GameRun, id: string, npcId: string, manual = false) {
  if (
    !romanceEvents.some((e) => e.id === id) ||
    !socialEligible(r, id, npcId, manual) ||
    r.social!.focus
  )
    throw Error('Cuộc trò chuyện chưa phù hợp hoặc đã có một câu chuyện đang chờ.');
  const s = r.social!,
    instanceId = `${id}@${npcId}@${r.actions.length}`;
  s.focus = {
    templateId: id,
    npcId,
    instanceId,
    resume: manual ? structuredClone(r.activeEvent) : null,
  };
  s.encounters[id + ':' + npcId] = r.month;
  if (!manual) s.lastNaturalMonth = r.month;
  r.activeEvent = { id: instanceId, month: r.month };
  if (id === 'soc-discovery') reveal(r);
}
export function requestSocial(input: GameRun, a: SocialAction) {
  if (
    input.engineVersion !== '3.0.0' ||
    !input.social ||
    !!input.family?.focus ||
    !!input.academics?.focus ||
    a.expected !== input.actions.length ||
    input.status !== 'playing'
  )
    throw Error('Yêu cầu trò chuyện không còn hợp lệ.');
  if (
    input.actions.filter((a) => a.type === 'social').length >= (input.family ? 40 : 80) ||
    input.actions.filter((a) =>
      ['manage', 'wardrobe', 'social', 'family-talk', 'academic', 'enterprise'].includes(a.type),
    ).length >= (input.family ? 120 : 250)
  )
    throw Error('Đã đạt giới hạn quản lý; hãy tiếp tục câu chuyện.');
  const r = structuredClone(input);
  focusSocial(r, a.templateId, a.npcId, true);
  r.actions.push(a);
  return r;
}
function memory(r: GameRun, p: SocialPerson, text: string) {
  p.memories.push({ month: r.month, title: 'Một lần đối thoại', text });
  p.lastContact = r.month;
  r.relationships.find((x) => x.npcId === p.npcId)!.strength = cap((p.trust + p.affection) / 2);
}
function bridge(r: GameRun, p: SocialPerson, live: boolean) {
  const rel = r.relationships.find((x) => x.npcId === p.npcId)!;
  rel.type = live ? 'partner' : 'ex';
  if (live) r.npcs.find((n) => n.id === p.npcId)!.role = 'partner';
  rel.history.push(`${r.world.year}: ${p.status}`);
}
function separate(r: GameRun, p: SocialPerson) {
  if (p.status === 'separated') return;
  p.separatedFrom =
    p.status === 'married' ? 'married' : p.status === 'cohabiting' ? 'cohabiting' : 'exclusive';
  p.status = 'separated';
  p.separatedMonth = r.month;
  p.cohabiting = false;
  bridge(r, p, false);
}
function reveal(r: GameRun) {
  const s = r.social!,
    b = s.breach;
  if (!b || b.revealed) return;
  b.revealed = true;
  s.discoveryPending = false;
  s.discoveryMonth = null;
  const p = s.people.find((p) => p.npcId === b.primaryId)!;
  p.trust = cap(p.trust - (p.preference === 'security' ? 40 : 28));
  p.affection = cap(p.affection - 15);
  p.emotionalState = 'hurt';
  s.reputation = cap(s.reputation - 8);
  r.player.stats.stress = cap(r.player.stats.stress + 12);
  if (p.trust < 25 && partnered(p)) separate(r, p);
  if (s.secretId) {
    s.people.find((p) => p.npcId === s.secretId)!.status = 'former';
    s.secretId = null;
  }
  memory(r, p, 'Lời hứa bị vi phạm đã được biết đến.');
}
export function applySocial(r: GameRun, op: SocialOperation): string {
  const s = r.social,
    f = s?.focus,
    p = s?.people.find((p) => p.npcId === f?.npcId);
  if (!s || !f || !p || !adult(r, p)) throw Error('Thiếu người đối thoại trưởng thành.');
  refreshSocial(r);
  const name = r.npcs.find((n) => n.id === p.npcId)!.name,
    alive = !!r.npcs.find((n) => n.id === p.npcId)?.alive;
  if (!alive && !['grieve', 'share', 'respect', 'listen'].includes(op))
    throw Error('Người này đã qua đời.');
  if (!p.known) {
    p.known = true;
    p.metMonth = r.month;
  }
  let text = '';
  const accept = () => p.romanticOpen && p.attraction >= 42 && p.trust >= 38;
  switch (op) {
    case 'meet':
      p.trust = cap(p.trust + 5);
      p.status = 'friend';
      text = `Bạn và ${name} bắt đầu biết nhau.`;
      break;
    case 'listen':
      s.empathy = cap(s.empathy + 4);
      p.trust = cap(p.trust + 8);
      p.affection = cap(p.affection + 5);
      text = `${name} có thêm chỗ để nói điều mình cần.`;
      break;
    case 'learn':
      p.trust = cap(p.trust + 4);
      p.affection = cap(p.affection + (p.preference === 'learning' ? 7 : 2));
      text = `Hai người hiểu thêm một góc nhìn khác.`;
      break;
    case 'share':
      p.affection = cap(p.affection + 5);
      p.trust = cap(p.trust + 3);
      text = 'Một trải nghiệm được giữ trong ký ức chung.';
      break;
    case 'respect':
      s.regulation = cap(s.regulation + 4);
      p.trust = cap(p.trust + 4);
      text = `Giới hạn của ${name} được tôn trọng.`;
      break;
    case 'flirt':
    case 'date':
      if (s.primaryId && s.primaryId !== p.npcId) {
        text = 'Bạn cần giải quyết cam kết hiện tại trước.';
        break;
      }
      if (accept()) {
        p.status = op === 'date' ? 'dating' : 'flirting';
        if (op === 'date') p.datingMonth = r.month;
        p.affection = cap(p.affection + 8);
        text = `${name} đồng ý ${op === 'date' ? 'bắt đầu hẹn hò' : 'tìm hiểu tình cảm này'}.`;
      } else {
        text = `${name} muốn giữ khoảng cách hoặc cần thêm thời gian. Lời từ chối được giữ nguyên.`;
        p.emotionalState = 'steady';
      }
      break;
    case 'exclusive':
      if (p.status !== 'dating' || s.primaryId) throw Error('Chưa thể lập cam kết mới.');
      if (p.exclusivityOpen && p.trust >= 50) {
        s.primaryId = p.npcId;
        p.status = 'exclusive';
        text = 'Hai người cùng đồng ý hẹn hò độc quyền.';
      } else text = `${name} chưa muốn cam kết độc quyền; hẹn hò vẫn chưa độc quyền.`;
      break;
    case 'cohabit':
      if (s.primaryId !== p.npcId || p.status !== 'exclusive')
        throw Error('Chưa có thỏa thuận sống chung.');
      if (p.trust >= 55) {
        p.status = 'cohabiting';
        p.cohabiting = true;
        bridge(r, p, true);
        r.household.housing = 'rent';
        r.household.moved = true;
        text = 'Hai người thuê phòng sống chung; chi phí sinh hoạt hằng tháng thay đổi.';
      } else text = `${name} chưa thấy đủ an tâm để chuyển nhà.`;
      break;
    case 'propose':
      if (s.primaryId !== p.npcId || !['exclusive', 'cohabiting'].includes(p.status))
        throw Error('Chưa phù hợp để cầu hôn.');
      if (p.marriageOpen && p.trust >= 65 && p.affection >= 50) {
        p.status = 'married';
        p.marriedMonth = r.month;
        p.cohabiting = true;
        bridge(r, p, true);
        text = `${name} đồng ý kết hôn. Trách nhiệm và chi phí chung tiếp tục được ghi trong đời sống.`;
      } else text = `${name} chưa đồng ý kết hôn. Hai người giữ nguyên thỏa thuận trước đó.`;
      break;
    case 'secret': {
      const primary = s.people.find((x) => x.npcId === s.primaryId);
      if (!primary || primary === p || !partnered(primary) || s.breach)
        throw Error('Không có thỏa thuận độc quyền để phát sinh nhánh này.');
      if (p.secretWilling && accept()) {
        s.secretId = p.npcId;
        p.status = 'secret';
        s.breach = { primaryId: primary.npcId, otherId: p.npcId, month: r.month, revealed: false };
        s.discoveryMonth = r.month + 12 + (hashSeed(r.seed + ':discovery:' + p.npcId) % 13);
        text =
          'Quan hệ kín bắt đầu và vi phạm thỏa thuận hiện có. Bí mật vẫn có thể được biết sau khi cuộc hẹn đã dừng.';
      } else text = `${name} không chấp nhận mối quan hệ kín này.`;
      break;
    }
    case 'confess':
      reveal(r);
      text = 'Sự thật đã được nói ra; niềm tin và trách nhiệm không tự phục hồi.';
      break;
    case 'separate':
      if (s.primaryId !== p.npcId) throw Error('Không có cam kết với người này.');
      separate(r, p);
      text = 'Hai người sống riêng. Người cũ và lịch sử gia đình vẫn được giữ.';
      break;
    case 'divorce':
      if (p.status !== 'separated' || p.marriedMonth === null)
        throw Error('Chưa có hôn nhân đang ly thân.');
      mandatoryCost(
        r,
        `social:divorce:${r.actions.length}`,
        'Thu xếp đời sống sau ly hôn',
        designMoney(r, 20),
      );
      p.status = 'divorced';
      s.primaryId = null;
      p.cohabiting = false;
      bridge(r, p, false);
      text = 'Hôn nhân kết thúc; chi phí thu xếp được ghi sổ. Tham chiếu gia đình không bị xóa.';
      break;
    case 'repair':
      if (
        p.reconciliationOpen &&
        p.trust >= 30 &&
        s.empathy >= 45 &&
        (p.separatedMonth === null || r.month - p.separatedMonth >= 12)
      ) {
        p.status = p.separatedFrom ?? p.status;
        p.cohabiting = ['married', 'cohabiting'].includes(p.status);
        p.trust = cap(p.trust + 5);
        if (p.cohabiting) bridge(r, p, true);
        text = 'Hai người đồng ý thử từng bước. Niềm tin cần tiếp tục được xây qua thời gian.';
      } else text = `${name} chưa đồng ý quay lại. Một lời xin lỗi chưa đủ để thay đổi quyết định.`;
      break;
    case 'leave':
      if (s.primaryId === p.npcId) separate(r, p);
      else {
        p.status = 'former';
        if (s.secretId === p.npcId) s.secretId = null;
      }
      text = 'Quan hệ này dừng lại; những gì đã xảy ra vẫn được giữ trong lịch sử.';
      break;
    case 'support':
      p.trust = cap(p.trust + 8);
      if (f.templateId === 'soc-study') {
        p.studyingUntil = r.month + 24;
        text = `${name} bắt đầu học thêm; phần đóng góp sinh hoạt tạm dừng hai năm.`;
      } else text = 'Hai người cùng chia lại trách nhiệm, không tạo thêm thu nhập vô hạn.';
      break;
    case 'blame':
      p.trust = cap(p.trust - 14);
      p.affection = cap(p.affection - 8);
      s.regulation = cap(s.regulation - 3);
      p.emotionalState = 'hurt';
      if (f.templateId === 'soc-study' && p.preference === 'learning')
        p.studyingUntil = r.month + 24;
      if (p.trust < 22 && s.primaryId === p.npcId) {
        separate(r, p);
        text = `${name} chủ động sống riêng vì không còn thấy đủ an toàn trong đối thoại.`;
      } else text = `${name} lùi lại sau lời trách móc.`;
      break;
    case 'plan-child':
      if (s.primaryId !== p.npcId || !['married', 'cohabiting'].includes(p.status))
        throw Error('Cần bàn cùng người đồng hành.');
      s.childrenPlanned = p.wantsChildren && p.trust >= 60;
      text = s.childrenPlanned
        ? 'Hai người cùng muốn chuẩn bị đón con.'
        : `${name} chưa muốn hoặc chưa sẵn sàng có con.`;
      break;
    case 'wait':
      text = 'Hai người chưa thay đổi thỏa thuận. Điều còn giấu vẫn có thể để lại hệ quả.';
      break;
    case 'decline':
      text = 'Bạn chọn không đi tiếp theo đề nghị này.';
      break;
    case 'grieve':
      s.lossPending = null;
      p.emotionalState = 'grieving';
      text = 'Những ký ức về người đã mất vẫn được giữ.';
      break;
  }
  memory(r, p, text);
  refreshSocial(r);
  return text;
}
export function tickSocial(r: GameRun) {
  const s = r.social;
  if (!s) return;
  for (const p of s.people) {
    if (
      !r.npcs.find((n) => n.id === p.npcId)?.alive &&
      ['exclusive', 'cohabiting', 'married', 'separated', 'dating', 'secret'].includes(p.status)
    ) {
      if (s.primaryId === p.npcId) {
        s.primaryId = null;
        s.lossPending = p.npcId;
      }
      if (s.secretId === p.npcId) s.secretId = null;
      p.status = 'widowed';
      p.cohabiting = false;
      bridge(r, p, false);
      memory(r, p, 'Người này đã qua đời; kỷ niệm không bị xóa.');
    }
    if (r.month % 12 === 0 && p.known && r.month - p.lastContact >= 36) {
      p.affection = cap(p.affection - 2);
      p.trust = cap(p.trust - 1);
    }
    if (p.cohabiting && r.npcs.find((n) => n.id === p.npcId)?.alive && r.month >= p.studyingUntil)
      transact(r, `social:household:${r.month}`, 'Phần đóng góp sinh hoạt của người đồng hành', {
        cash: designMoney(r, 2),
      });
  }
  if (s.breach && !r.npcs.find((n) => n.id === s.breach!.primaryId)?.alive) {
    s.discoveryMonth = null;
    s.discoveryPending = false;
  }
  if (s.discoveryMonth !== null && r.month >= s.discoveryMonth && !s.breach?.revealed)
    s.discoveryPending = true;
  if (r.month % 12 === 0) refreshSocial(r);
}
export function socialInterrupt(r: GameRun) {
  return !!r.social && (r.social.discoveryPending || r.social.lossPending !== null);
}
export function assertSocial(r: GameRun) {
  const s = r.social;
  if (!s) {
    if (r.setup.expansion === 'social') throw Error('Invariant: missing social state');
    return;
  }
  const ids = new Set(r.npcs.map((n) => n.id));
  if ([s.empathy, s.regulation, s.reputation].some((n) => !Number.isFinite(n) || n < 0 || n > 100))
    throw Error('Invariant: emotional dimensions');
  if (s.people.filter((p) => partnered(p)).length > 1)
    throw Error('Invariant: multiple commitments');
  if (
    s.primaryId &&
    !s.people.some(
      (p) =>
        p.npcId === s.primaryId &&
        ['exclusive', 'cohabiting', 'married', 'separated'].includes(p.status),
    )
  )
    throw Error('Invariant: primary agreement');
  if (
    s.breach &&
    (!s.people.some((p) => p.npcId === s.breach!.primaryId) ||
      !s.people.some((p) => p.npcId === s.breach!.otherId) ||
      s.breach.primaryId === s.breach.otherId)
  )
    throw Error('Invariant: breach references');
  if (
    r.setup.expansion === 'wardrobe' ||
    new Set(s.people.map((p) => p.npcId)).size !== s.people.length
  )
    throw Error('Invariant: social ruleset');
  for (const p of s.people) {
    if (
      !ids.has(p.npcId) ||
      [p.trust, p.affection, p.attraction, p.compatibility].some(
        (n) => !Number.isFinite(n) || n < 0 || n > 100,
      )
    )
      throw Error('Invariant: social person');
    if (
      ['dating', 'exclusive', 'cohabiting', 'married', 'secret'].includes(p.status) &&
      !adult(r, p)
    )
      throw Error('Invariant: adult relationships');
  }
  for (const id of [s.primaryId, s.secretId])
    if (id && !s.people.some((p) => p.npcId === id)) throw Error('Invariant: social references');
  if (s.primaryId && s.primaryId === s.secretId) throw Error('Invariant: agreement breach target');
  if (s.focus && (!ids.has(s.focus.npcId) || s.focus.instanceId !== r.activeEvent?.id))
    throw Error('Invariant: social focus');
}
export const SOCIAL_LABELS: Record<SocialStatus, string> = {
  acquaintance: 'Người quen',
  friend: 'Bạn bè',
  flirting: 'Có lời bày tỏ',
  dating: 'Hẹn hò chưa độc quyền',
  exclusive: 'Hẹn hò độc quyền',
  cohabiting: 'Cam kết sống chung',
  married: 'Đã kết hôn',
  separated: 'Ly thân',
  divorced: 'Đã ly hôn',
  former: 'Người cũ',
  secret: 'Quan hệ kín',
  widowed: 'Người đã mất',
};
