import type { CollabPeer, CollabTerms } from '../domain/creative-careers';
import type { CreatorPolicy } from '../domain/creator-economy';
export const CREATIVE_PEERS: {
  id: CollabPeer;
  name: string;
  niche: CreatorPolicy['niche'];
  minReputation: number;
  description: string;
}[] = [
  {
    id: 'patient-teacher',
    name: 'Người chỉ dẫn kiên nhẫn',
    niche: 'education',
    minReputation: 35,
    description:
      'Cùng giải thích một chủ đề. Cần nguồn và chia công rõ ràng; lượt xem có thể không tăng.',
  },
  {
    id: 'club-host',
    name: 'Người dẫn câu lạc bộ',
    niche: 'gaming',
    minReputation: 40,
    description:
      'Một buổi chơi và trò chuyện chung. Cộng đồng trùng nhiều có thể chỉ gặp lại người quen.',
  },
  {
    id: 'stage-editor',
    name: 'Nhóm dựng tiết mục nhỏ',
    niche: 'performance',
    minReputation: 45,
    description: 'Cùng dựng một tiết mục. Nhịp làm khác nhau và quyền đăng có thể gây bất đồng.',
  },
];
export const COLLAB_CONDITIONS: Record<
  CollabTerms,
  { name: string; cost: number; acceptance: number; quality: number; risk: number }
> = {
  balanced: {
    name: 'Chia công và ghi nguồn ngang nhau',
    cost: 12,
    acceptance: 8,
    quality: 6,
    risk: 0,
  },
  flexible: {
    name: 'Phạm vi gọn, mỗi bên đăng phần riêng',
    cost: 8,
    acceptance: 14,
    quality: -4,
    risk: 5,
  },
  exclusive: {
    name: 'Bạn giữ quyền đăng đợt đầu',
    cost: 20,
    acceptance: -20,
    quality: 10,
    risk: 18,
  },
};
export const peerById = (id: CollabPeer) => CREATIVE_PEERS.find((p) => p.id === id)!;
