import type { AssetCategory, Locality } from '../domain/living-assets';
import type { GameRun } from '../domain/model';

export interface LivingAssetDefinition {
  id: string;
  name: string;
  category: Exclude<AssetCategory, 'pc'>;
  mode: 'rent' | 'own';
  from: number;
  price: number;
  monthly: number;
  capacity: number;
  environment: 'any' | 'urban' | 'rural';
  transport: number;
  digital: number;
  computing: number;
  description: string;
}
const home = (
  id: string,
  name: string,
  mode: 'rent' | 'own',
  price: number,
  monthly: number,
  capacity: number,
  environment: LivingAssetDefinition['environment'],
  from = 1975,
): LivingAssetDefinition => ({
  id,
  name,
  category: 'home',
  mode,
  from,
  price,
  monthly,
  capacity,
  environment,
  transport: 0,
  digital: 0,
  computing: 0,
  description:
    mode === 'rent'
      ? 'Giữ tiền cọc riêng; tự thu tiền thuê mỗi tháng. Có thể đổi chỗ hoặc trở về nhà gia đình.'
      : 'Một chỗ ở lâu dài, vẫn cần tiền bảo trì và sửa chữa. Giá mua không bảo đảm gia đình hạnh phúc.',
});
const tool = (
  id: string,
  name: string,
  category: LivingAssetDefinition['category'],
  from: number,
  price: number,
  monthly: number,
  transport: number,
  digital: number,
  computing: number,
  description: string,
): LivingAssetDefinition => ({
  id,
  name,
  category,
  mode: 'own',
  from,
  price,
  monthly,
  capacity: 1,
  environment: 'any',
  transport,
  digital,
  computing,
  description,
});
/** Fictional categories; dates are simulation gates, prices are 2026 design purchasing power. */
export const LIVING_ASSET_CATALOG: LivingAssetDefinition[] = [
  home('rent-room', 'Phòng trọ vừa túi tiền', 'rent', 800_000, 150_000, 2, 'any'),
  home('rent-flat', 'Căn hộ nhỏ để thuê', 'rent', 2_100_000, 350_000, 3, 'urban', 2000),
  home('rent-house', 'Căn nhà thuê cho cả gia đình', 'rent', 3_200_000, 500_000, 6, 'any'),
  home('home-rural', 'Căn nhà nhỏ ngoài phố thị', 'own', 650_000_000, 450_000, 4, 'rural'),
  home('home-town', 'Nhà phố vừa phải', 'own', 1_300_000_000, 700_000, 5, 'urban'),
  home('home-flat', 'Căn hộ sở hữu', 'own', 1_800_000_000, 1_100_000, 4, 'urban', 2000),
  home('home-large', 'Nhà rộng cho nhiều thế hệ', 'own', 3_200_000_000, 1_600_000, 8, 'any', 1990),
  tool(
    'bicycle',
    'Xe đạp đi lại hằng ngày',
    'vehicle',
    1975,
    2_000_000,
    25_000,
    1,
    0,
    0,
    'Quãng ngắn thuận tiện, ít chi phí; không thay được mọi hành trình.',
  ),
  tool(
    'motorcycle-basic',
    'Xe máy phổ thông',
    'vehicle',
    1985,
    22_000_000,
    300_000,
    3,
    0,
    0,
    'Gọn cho việc đi làm và thăm người thân; vẫn tốn nhiên liệu và bảo dưỡng.',
  ),
  tool(
    'scooter',
    'Xe tay ga cân bằng',
    'vehicle',
    2000,
    42_000_000,
    420_000,
    3,
    0,
    0,
    'Tiện dùng trong phố; chi phí nuôi xe cao hơn xe phổ thông.',
  ),
  tool(
    'motorcycle-premium',
    'Xe máy phân khúc cao',
    'vehicle',
    2005,
    85_000_000,
    650_000,
    3,
    0,
    0,
    'Một sở thích đắt hơn; không tự tăng cơ hội việc làm hoặc tình cảm.',
  ),
  tool(
    'car-basic',
    'Ô tô nhỏ',
    'vehicle',
    1995,
    420_000_000,
    2_400_000,
    4,
    0,
    0,
    'Chở được gia đình, cần tính tiền nhiên liệu, chỗ đỗ và bảo trì.',
  ),
  tool(
    'car-family',
    'Ô tô gia đình',
    'vehicle',
    2000,
    720_000_000,
    3_500_000,
    5,
    0,
    0,
    'Thuận tiện khi đi cùng con nhỏ hoặc người thân; khoản chi cố định đáng kể.',
  ),
  tool(
    'car-premium',
    'Ô tô phân khúc cao',
    'vehicle',
    2010,
    1_500_000_000,
    6_000_000,
    5,
    0,
    0,
    'Không có phần thưởng thu nhập riêng cho xe đắt tiền.',
  ),
  tool(
    'phone-basic',
    'Điện thoại di động cơ bản',
    'phone',
    1995,
    900_000,
    45_000,
    0,
    1,
    0,
    'Gọi và nhắn tin; giúp giữ liên lạc, không thay máy tính.',
  ),
  tool(
    'phone-feature',
    'Điện thoại phổ thông có mạng',
    'phone',
    2000,
    1_500_000,
    65_000,
    0,
    2,
    0,
    'Liên lạc và các việc trực tuyến đơn giản trong mô phỏng.',
  ),
  tool(
    'phone-early-smart',
    'Điện thoại thông minh đời đầu',
    'phone',
    2008,
    3_000_000,
    90_000,
    0,
    3,
    0,
    'Một bước vào việc học và giao dịch trực tuyến; hiệu năng có giới hạn.',
  ),
  tool(
    'phone-balanced',
    'Điện thoại thông minh cân bằng',
    'phone',
    2014,
    6_000_000,
    120_000,
    0,
    4,
    0,
    'Đủ cho liên lạc, bán hàng và quay nội dung đơn giản.',
  ),
  tool(
    'phone-premium',
    'Điện thoại phân khúc cao',
    'phone',
    2018,
    20_000_000,
    180_000,
    0,
    5,
    0,
    'Có thêm khả năng sản xuất nội dung; lợi ích bị giới hạn, không tự sinh thu nhập.',
  ),
  tool(
    'laptop-basic',
    'Máy tính xách tay cơ bản',
    'laptop',
    2000,
    7_500_000,
    100_000,
    0,
    2,
    2,
    'Học, soạn tài liệu và lập trình cơ bản; phù hợp một ngân sách nhỏ.',
  ),
  tool(
    'laptop-balanced',
    'Máy tính xách tay đa dụng',
    'laptop',
    2010,
    15_000_000,
    150_000,
    0,
    3,
    4,
    'Học kỹ thuật, làm dự án và chỉnh sửa nội dung vừa phải.',
  ),
  tool(
    'laptop-creator',
    'Máy tính xách tay cho sáng tạo',
    'laptop',
    2020,
    30_000_000,
    250_000,
    0,
    4,
    5,
    'Tiết kiệm thời gian ở việc số phù hợp; vẫn cần kỹ năng và khách hàng.',
  ),
];
export const LOCALITIES: Record<Locality, { name: string; multiplier: number; note: string }> = {
  quiet: {
    name: 'Khu yên tĩnh, xa trung tâm',
    multiplier: 85,
    note: 'Giá mềm hơn, đi lại cần thu xếp.',
  },
  connected: {
    name: 'Khu dân cư có kết nối',
    multiplier: 100,
    note: 'Cân bằng chỗ ở và khoảng cách sinh hoạt.',
  },
  central: {
    name: 'Khu gần các tiện ích',
    multiplier: 130,
    note: 'Thuận tiện hơn, không phải lựa chọn rẻ nhất.',
  },
};
export const livingDefinition = (id: string) => LIVING_ASSET_CATALOG.find((d) => d.id === id);
export function livingPrice(
  run: GameRun,
  definition: LivingAssetDefinition,
  locality: Locality = 'connected',
) {
  if (definition.category !== 'home') return definition.price;
  const region =
    run.player.region === 'southern-city' ? 120 : run.player.region === 'central-coast' ? 100 : 90;
  return Math.round((definition.price * region * LOCALITIES[locality].multiplier) / 10_000);
}
