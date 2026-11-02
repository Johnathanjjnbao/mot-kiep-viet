import type { FreelanceService } from '../domain/freelance';
import type { ProgramId } from '../domain/academics';
export interface ClientService {
  id: FreelanceService;
  name: string;
  from: number;
  knowledge: number;
  skill: number;
  fee: number;
  monthlyCost: number;
  programs: ProgramId[];
  scope: string;
  client: string;
}
/** Designed annual project bundles, not market rates or offers from real clients. */
export const CLIENT_SERVICES: ClientService[] = [
  {
    id: 'programming',
    name: 'Lập trình',
    from: 2000,
    knowledge: 45,
    skill: 40,
    fee: 220,
    monthlyCost: 5,
    programs: ['it'],
    scope: 'Một công cụ quản lý nhỏ, có dữ liệu mẫu và kiểm thử trước khi bàn giao.',
    client: 'Nhóm vận hành Bình Minh',
  },
  {
    id: 'design',
    name: 'Thiết kế đồ họa',
    from: 1986,
    knowledge: 30,
    skill: 35,
    fee: 150,
    monthlyCost: 3,
    programs: ['design'],
    scope: 'Bộ hình và tài liệu nhận diện, thống nhất số bản sửa trước khi nhận.',
    client: 'Xưởng thủ công Mộc',
  },
  {
    id: 'translation',
    name: 'Dịch thuật',
    from: 1975,
    knowledge: 45,
    skill: 25,
    fee: 140,
    monthlyCost: 2,
    programs: ['english', 'korean'],
    scope: 'Một tập tài liệu giới thiệu thông thường, có đối chiếu và soát nghĩa.',
    client: 'Nhóm giao lưu Ngôn Ngữ',
  },
  {
    id: 'writing',
    name: 'Viết nội dung',
    from: 1975,
    knowledge: 30,
    skill: 18,
    fee: 100,
    monthlyCost: 2,
    programs: ['communications', 'english', 'korean'],
    scope: 'Loạt bài giới thiệu có nguồn và lịch duyệt; không cam kết lượt đọc.',
    client: 'Tiệm sách Góc Nhỏ',
  },
  {
    id: 'marketing',
    name: 'Marketing',
    from: 1986,
    knowledge: 30,
    skill: 25,
    fee: 180,
    monthlyCost: 4,
    programs: ['business', 'communications'],
    scope: 'Đợt khảo sát và nội dung truyền thông, phân biệt công việc với kết quả bán hàng.',
    client: 'Tổ sản xuất Gần Nhà',
  },
  {
    id: 'support',
    name: 'Hỗ trợ kỹ thuật',
    from: 2000,
    knowledge: 35,
    skill: 30,
    fee: 140,
    monthlyCost: 3,
    programs: ['it', 'engineering'],
    scope: 'Đợt hỗ trợ thiết bị và hướng dẫn sử dụng trong phạm vi đã nhận.',
    client: 'Văn phòng Đồng Hành',
  },
];
export const serviceById = (id: FreelanceService) => CLIENT_SERVICES.find((s) => s.id === id)!;
