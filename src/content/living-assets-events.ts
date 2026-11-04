import type { Effect, EventDefinition, Stat } from '../domain/model';
import type { LivingStoryOperation } from '../domain/living-assets';
import { event, choice, stat, flag } from './authoring';

export type LivingSceneContext =
  | 'home-plan'
  | 'rent-damage'
  | 'rent-renew'
  | 'home-owned'
  | 'home-repair'
  | 'home-elderly'
  | 'vehicle-plan'
  | 'vehicle-owned'
  | 'vehicle-worn'
  | 'phone-worn'
  | 'phone-new'
  | 'device-elderly'
  | 'pc-plan'
  | 'pc-owned'
  | 'pc-upgraded'
  | 'stream-worn'
  | 'loan-active'
  | 'loan-pressure'
  | 'loan-history'
  | 'hardship'
  | 'long-held'
  | 'family-space'
  | 'relative'
  | 'power'
  | 'elderly-move';
type Path = [string, string, string, Partial<Record<Stat, number>>, LivingStoryOperation?];
export const LIVING_SCENE_META: Record<string, { context: LivingSceneContext; after?: string }> =
  {};
function scene(
  id: string,
  title: string,
  text: string,
  context: LivingSceneContext,
  paths: Path[],
  options: { minAge?: number; arc?: string; stage?: number; after?: string } = {},
): EventDefinition {
  const full = 'living-' + id;
  LIVING_SCENE_META[full] = {
    context,
    ...(options.after ? { after: 'living-' + options.after } : {}),
  };
  return event(
    full,
    'finance',
    title,
    text,
    {
      minAge: options.minAge ?? 18,
      ...(options.after ? { flags: ['living-' + options.after] } : {}),
      ...(options.arc ? { absent: ['living-' + options.arc + '-closed'] } : {}),
    },
    paths.map(([label, hint, outcome, changes, operation], i) => {
      const effects: Effect[] = Object.entries(changes).map(([s, n]) => stat(s as Stat, n!));
      if (operation) effects.push({ kind: 'living', operation });
      if (options.arc) effects.push(flag(i === 3 ? 'living-' + options.arc + '-closed' : full));
      return choice(['a', 'b', 'c', 'd'][i], label, hint, outcome, effects);
    }),
    {
      version: 17,
      once: true,
      cooldown: 48,
      priority: ['loan-active', 'loan-pressure', 'hardship'].includes(context)
        ? 11
        : context === 'family-space'
          ? 1
          : 0,
      weight: options.after ? 100 : 45,
    },
  );
}
export const livingAssetsEvents: EventDefinition[] = [
  scene(
    'room-1',
    'Một chỗ để đóng cửa lại',
    'Bạn tính lại chuyện ở cùng người nhà hay thu xếp một chỗ riêng. Ngoài tiền thuê còn có cọc, đường đi và những việc phải tự lo.',
    'home-plan',
    [
      [
        'Ghi đủ tiền cọc và tiền tháng',
        'Rõ ngân sách; cần thời gian',
        'Bạn cộng cả những khoản dễ quên trước khi xem chỗ ở.',
        { knowledge: 2, stress: 1 },
        'plan',
      ],
      [
        'Hỏi về nhịp sinh hoạt quanh đó',
        'Thêm giao tiếp; bớt thời gian riêng',
        'Bạn hỏi chuyện tiếng xe, giờ đóng cửa và người ở cạnh.',
        { social: 2, skill: 1 },
      ],
      [
        'Tính một phương án ở ghép',
        'Có thể chia không gian; cần thỏa thuận',
        'Bạn viết điều mình có thể chia sẻ và giới hạn cần giữ.',
        { social: 1, knowledge: 1, stress: 1 },
      ],
      [
        'Giữ cách ở hiện tại lúc này',
        'Nhẹ lịch; dừng kế hoạch đổi chỗ',
        'Bạn chưa nhận thêm một cam kết về nơi ở.',
        { mood: 1, stress: -2 },
      ],
    ],
    { arc: 'room', stage: 1 },
  ),
  scene(
    'room-2',
    'Vết hỏng lúc dọn đồ',
    'Trong chỗ thuê, một lần dọn đồ làm hỏng phần nội thất. Bạn cần thu xếp sửa hoặc chấp nhận khoản khấu trừ khi bàn giao.',
    'rent-damage',
    [
      [
        'Chọn cách sửa vừa số tiền đang có',
        'Dùng tiền nếu đủ; ghi hư hại nếu chưa đủ',
        'Bạn xem phần nào có thể xử lý ngay.',
        { stress: 1 },
        'rental-pay',
      ],
      [
        'Tự xử lý phần nhỏ mình làm được',
        'Tốn sức; vẫn còn hư hại',
        'Bạn nhận phần việc trong khả năng, không gọi đó là đã sửa hết.',
        { skill: 2, stress: 2 },
        'rental-diy',
      ],
      [
        'Ghi ảnh và hỏi rõ chi phí',
        'Thêm thông tin; chưa sửa',
        'Bạn ghi lại thiệt hại để khỏi tranh luận bằng trí nhớ.',
        { knowledge: 2, social: 1 },
        'rental-note',
      ],
      [
        'Giữ tiền sinh hoạt, nhận khấu trừ',
        'Giảm việc trước mắt; cọc còn ít hơn',
        'Bạn nhận phần thiệt hại trong biên bản và dừng kế hoạch sửa.',
        { stress: -1 },
        'rental-defer',
      ],
    ],
    { arc: 'room', stage: 2, after: 'room-1' },
  ),
  scene(
    'room-3',
    'Ở lại thêm một năm',
    'Chỗ thuê đã thành quen. Việc giữ chỗ hay chuyển đi giờ còn liên quan tới đường đi, những người ở cạnh và phần cọc đã ghi.',
    'rent-renew',
    [
      [
        'Để riêng tiền thuê trước các món mới',
        'Dễ theo dõi; bớt tiền tiêu linh hoạt',
        'Bạn ưu tiên khoản phải trả đều trước khi tính mua thêm.',
        { knowledge: 2, mood: -1 },
        'plan',
      ],
      [
        'Thống nhất lại giờ giấc với hàng xóm',
        'Thêm giao tiếp; có thể cần nhường nhau',
        'Bạn nói cụ thể những khung giờ cần yên tĩnh.',
        { social: 2, stress: 1 },
      ],
      [
        'Xem lại hư hại trước lúc gia hạn',
        'Chuẩn bị bàn giao; thêm việc kiểm tra',
        'Bạn giữ một bản ghi về tình trạng chỗ thuê.',
        { skill: 1, knowledge: 2 },
      ],
      [
        'Giữ những thỏa thuận thiết yếu',
        'Bớt việc theo dõi; chưa đổi chỗ',
        'Bạn giữ hợp đồng đang có và dành sức cho việc khác.',
        { mood: 2, stress: -1 },
      ],
    ],
    { arc: 'room', stage: 3, after: 'room-2' },
  ),
  scene(
    'home-price',
    'Sau ngày nhận nhà',
    'Căn nhà đã đứng tên bạn, nhưng danh sách chi vẫn còn: phần cần bảo trì, những đồ chưa có và khoản dự phòng cho tháng khó hơn.',
    'home-owned',
    [
      [
        'Chỉ mua thêm những thứ cần dùng',
        'Giữ nhịp tiền; nhà chưa đầy đủ',
        'Bạn chấp nhận một căn nhà chưa có đủ mọi món đồ.',
        { knowledge: 2, mood: -1 },
        'plan',
      ],
      [
        'Tự làm một góc sinh hoạt nhỏ',
        'Thêm tay nghề; mất cuối tuần',
        'Bạn bắt đầu bằng chỗ ngồi và chỗ đặt đồ dùng hằng ngày.',
        { skill: 2, stress: 1 },
      ],
      [
        'Hỏi kinh nghiệm của người gần đó',
        'Có kết nối; cần nghe nhiều ý kiến',
        'Bạn tìm hiểu cách người ở lâu thu xếp việc nhà.',
        { social: 2, knowledge: 1 },
      ],
      [
        'Dừng sắm sửa để nghỉ vài hôm',
        'Bớt áp lực; việc nhà còn đó',
        'Bạn để danh sách sang bên và giữ một khoảng nghỉ.',
        { mood: 2, stress: -2 },
      ],
    ],
  ),
  scene(
    'home-repair',
    'Phần nhà cần chăm lại',
    'Những chỗ xuống cấp đã nhìn thấy rõ hơn. Tiền bảo dưỡng thường kỳ không thay được mọi đợt sửa, nhưng bạn vẫn có quyền chọn mức xử lý vừa sức.',
    'home-repair',
    [
      [
        'Sửa một phần vừa khả năng',
        'Có phí nếu đủ tiền; cải thiện nhỏ',
        'Bạn thu xếp phần việc có thể làm ngay.',
        { stress: 1 },
        'care-home',
      ],
      [
        'Ghi mức độ hỏng rồi xếp thứ tự',
        'Hiểu rõ hơn; chưa hết hỏng',
        'Bạn phân biệt chỗ cần làm trước với chỗ có thể chờ.',
        { knowledge: 2, skill: 1 },
        'plan',
      ],
      [
        'Tập làm những việc nhỏ an toàn',
        'Thêm tay nghề; phải dành công',
        'Bạn chỉ nhận phần việc trong khả năng của mình.',
        { skill: 2, stress: 2 },
      ],
      [
        'Hoãn sửa để giữ tiền cho tháng này',
        'Giữ tiền; tình trạng giảm thêm',
        'Bạn chấp nhận để một phần hư hại ở lại.',
        { mood: 1 },
        'defer-home',
      ],
    ],
  ),
  scene(
    'home-elderly',
    'Một căn nhà dễ xoay xở',
    'Khi đã lớn tuổi, bạn để ý lối đi, chỗ cất đồ và công sức chăm nhà nhiều hơn diện tích. Căn nhà rộng chưa chắc là căn nhà dễ sống.',
    'home-elderly',
    [
      [
        'Thu gọn việc phải chăm mỗi ngày',
        'Bớt áp lực; cần bỏ vài thói quen',
        'Bạn chọn những phần nhà thực sự dùng tới.',
        { stress: -2, knowledge: 1 },
      ],
      [
        'Xem cách sửa trong khoản đang có',
        'Chăm chỗ ở; không làm trẻ lại ngôi nhà',
        'Bạn tính một phần sửa vừa với sức và tiền.',
        { mood: 1 },
        'care-home',
      ],
      [
        'Nói rõ điều mình muốn giữ',
        'Giữ quyền tự quyết; cần trò chuyện',
        'Bạn nói cụ thể nơi mình muốn sống và phần việc cần giúp.',
        { social: 2, mood: 1 },
      ],
      [
        'Chưa đổi nhà, dành thời gian suy nghĩ',
        'Giữ nếp quen; chưa giải quyết mọi bất tiện',
        'Bạn chưa chốt việc chuyển chỗ chỉ vì người khác thấy hợp.',
        { stress: -1, knowledge: 1 },
      ],
    ],
    { minAge: 65 },
  ),
  scene(
    'vehicle-budget',
    'Một quãng đường cần tính',
    'Bạn nghĩ tới phương tiện riêng. Tiền mua chỉ xuất hiện một lần trong bảng so sánh; nhiên liệu, chỗ để và lần sửa sau đó thì quay lại nhiều tháng.',
    'vehicle-plan',
    [
      [
        'So cả chi phí nuôi xe',
        'Thêm thông tin; chưa mua ngay',
        'Bạn ghi cả các khoản sau ngày nhận xe.',
        { knowledge: 2, stress: 1 },
        'plan',
      ],
      [
        'Xem phương án xe đạp và quãng ngắn',
        'Ít nhu cầu hơn; thêm công sức',
        'Bạn chia các chuyến đi theo khoảng cách thực sự cần.',
        { health: 1, skill: 1 },
      ],
      [
        'Hỏi cách đi chung khi phù hợp',
        'Thêm kết nối; cần phối hợp giờ',
        'Bạn tìm hiểu việc đi chung thay vì coi mua xe là cách duy nhất.',
        { social: 2, stress: 1 },
      ],
      [
        'Giữ cách đi lại đang dùng',
        'Giữ tiền; còn vài bất tiện',
        'Bạn chưa mua thêm phương tiện.',
        { mood: 1, stress: -1 },
      ],
    ],
  ),
  scene(
    'vehicle-route',
    'Đường đi đã bớt gấp',
    'Phương tiện bạn có và đủ điều kiện dùng đã giúp thu xếp một số quãng đường. Bạn muốn dùng khoảng thời gian đó cho việc gì?',
    'vehicle-owned',
    [
      [
        'Chừa thời gian dự phòng lúc đi làm',
        'Bớt áp lực; không tăng số việc',
        'Bạn giữ khoảng đệm thay vì lấp đầy lịch mới.',
        { stress: -2, knowledge: 1 },
      ],
      [
        'Thu xếp ghé thăm người quen',
        'Thêm giao tiếp; cần công sức',
        'Bạn dành một chuyến đi cho mối liên hệ đã có.',
        { social: 2, stress: 1 },
      ],
      [
        'Chăm xe trước chuyến dài',
        'Có phí vừa khả năng; tình trạng tốt hơn',
        'Bạn để ý đồ dùng trước lúc cần dựa vào nó.',
        { skill: 1 },
        'care-vehicle',
      ],
      [
        'Giảm số chuyến không cần thiết',
        'Nhẹ lịch; ít dịp gặp hơn',
        'Bạn chọn một nhịp đi lại ít hơn.',
        { mood: 1, social: -1, stress: -1 },
      ],
    ],
  ),
  scene(
    'vehicle-breakdown',
    'Một lần xe không còn ổn',
    'Chiếc xe đã xuống tình trạng thấp. Bạn cân nhắc sửa, giữ lại hay bán; quyết định nào cũng cần nhìn cả tiền tháng tới.',
    'vehicle-worn',
    [
      [
        'Xử lý phần có thể sửa ngay',
        'Chi trong khả năng; cải thiện một phần',
        'Bạn bắt đầu với một phần sửa vừa sức.',
        { skill: 1 },
        'care-vehicle',
      ],
      [
        'Tính lại phương án đi làm',
        'Có dự phòng; thêm việc thu xếp',
        'Bạn ghi một cách đi khác nếu xe phải nằm lại.',
        { knowledge: 2, stress: 1 },
        'plan',
      ],
      [
        'Hỏi thêm trước khi quyết định sửa lớn',
        'Thêm thông tin; chưa giải quyết xong',
        'Bạn chưa nhận một khoản sửa vượt mức mình hiểu.',
        { social: 1, knowledge: 2 },
      ],
      [
        'Hoãn sửa và chấp nhận tình trạng giảm',
        'Giữ tiền; độ tin cậy kém hơn',
        'Bạn giữ tiền tháng này và nhận phần bất tiện còn lại.',
        { mood: 1 },
        'defer-vehicle',
      ],
    ],
  ),
  scene(
    'phone-wear',
    'Chiếc điện thoại đã dùng lâu',
    'Pin và thao tác hằng ngày không còn thuận như lúc mới mua. Bạn không muốn đổi máy chỉ vì thói quen, nhưng việc liên lạc cũng cần tính tới.',
    'phone-worn',
    [
      [
        'Sửa một phần nếu khoản tiền cho phép',
        'Có chi phí; giữ được máy cũ thêm',
        'Bạn thu xếp sửa phần đang gây phiền nhất.',
        { skill: 1 },
        'care-phone',
      ],
      [
        'Để riêng ngân sách thay máy',
        'Có kế hoạch; vẫn dùng máy hiện tại',
        'Bạn xác định số tiền có thể dành mà không chạm chi phí thiết yếu.',
        { knowledge: 2, stress: 1 },
        'plan',
      ],
      [
        'Ghi lại các cách liên lạc dự phòng',
        'Bớt phụ thuộc; cần thêm phối hợp',
        'Bạn giữ lại những liên hệ quan trọng theo cách dễ tìm.',
        { social: 1, skill: 1 },
      ],
      [
        'Tiếp tục dùng, chấp nhận xuống cấp',
        'Giữ tiền; có thể bất tiện hơn',
        'Bạn chưa sửa hay thay máy trong tháng này.',
        { mood: 1 },
        'defer-phone',
      ],
    ],
  ),
  scene(
    'phone-new',
    'Chuyển sang chiếc máy khác',
    'Bạn đã thay điện thoại sau câu chuyện về chiếc máy cũ. Phần khó còn lại là thu xếp dữ liệu và giữ cách dùng hợp với nhịp sống.',
    'phone-new',
    [
      [
        'Sắp lại dữ liệu và liên hệ cần giữ',
        'Thêm kỹ năng; tốn thời gian',
        'Bạn kiểm lại những gì thực sự cần chuyển.',
        { skill: 2, stress: 1 },
      ],
      [
        'Giữ cách dùng đơn giản',
        'Nhẹ áp lực; ít thử chức năng mới',
        'Bạn chỉ thiết lập những việc thường làm.',
        { mood: 1, stress: -2 },
      ],
      [
        'Tìm hiểu một công cụ học phù hợp',
        'Thêm tri thức; cần đều đặn',
        'Bạn thử một việc học cụ thể thay vì mở mọi thứ cùng lúc.',
        { knowledge: 2, stress: 1 },
      ],
      [
        'Đặt lại giới hạn thời gian dùng',
        'Thêm khoảng nghỉ; ít tương tác hơn',
        'Bạn để một phần thời gian trong ngày không có màn hình.',
        { health: 1, social: -1, stress: -1 },
      ],
    ],
  ),
  scene(
    'device-elderly',
    'Đồ dùng theo cách của mình',
    'Các thiết bị vẫn có ích khi bạn lớn tuổi, nhưng thao tác quen và cách giữ liên lạc quan trọng hơn việc chạy theo mẫu mới.',
    'device-elderly',
    [
      [
        'Giữ những thao tác mình đã quen',
        'Dễ dùng; ít thử cái mới',
        'Bạn sắp lại cách dùng quanh những việc cần thiết.',
        { mood: 2, knowledge: -1 },
      ],
      [
        'Dành thời gian học từng việc nhỏ',
        'Thêm tri thức; cần kiên nhẫn',
        'Bạn chọn một thao tác và thử lại đến khi nhớ.',
        { knowledge: 2, stress: 1 },
      ],
      [
        'Hỏi giúp đúng phần còn vướng',
        'Thêm kết nối; vẫn tự chọn',
        'Bạn nói rõ chỗ cần giúp và giữ quyết định ở mình.',
        { social: 2, mood: 1 },
      ],
      [
        'Tạm bớt một công cụ đang gây mệt',
        'Nhẹ áp lực; cần cách liên lạc khác',
        'Bạn không buộc mình tiếp tục mọi công cụ từng dùng.',
        { stress: -2, social: -1 },
      ],
    ],
    { minAge: 65 },
  ),
  scene(
    'pc-1',
    'Chừa một góc cho chiếc máy',
    'Bạn cân nhắc một máy bàn cho việc học, làm hoặc giải trí. Một cấu hình vừa nhu cầu có thể đáng giá hơn danh sách linh kiện đắt nhất.',
    'pc-plan',
    [
      [
        'Ghi công việc cần máy giúp',
        'Rõ nhu cầu; chưa mua ngay',
        'Bạn bắt đầu từ việc muốn làm rồi mới đặt ngân sách.',
        { knowledge: 2, skill: 1 },
        'plan',
      ],
      [
        'Tìm hiểu cách ghép các linh kiện',
        'Thêm tay nghề; mất thời gian',
        'Bạn xem socket, nguồn và chỗ lắp trước khi chọn từng phần.',
        { skill: 2, stress: 1 },
      ],
      [
        'So máy bàn với công cụ đang có',
        'Giữ cân nhắc; có thể chọn khác',
        'Bạn không coi ráp máy là bước bắt buộc của mọi công việc.',
        { knowledge: 1, mood: 1 },
      ],
      [
        'Chưa dành chỗ cho máy riêng',
        'Giữ tiền; dừng kế hoạch này',
        'Bạn giữ cách học và làm hiện tại, chưa mua thêm máy.',
        { stress: -2, mood: 1 },
      ],
    ],
    { arc: 'pc', stage: 1 },
  ),
  scene(
    'pc-2',
    'Chiếc máy đã có việc để làm',
    'Chiếc máy tự ráp đã ở cùng bạn một thời gian. Bạn nhìn lại việc học, việc số hoặc thời gian giải trí mà nó đang phục vụ.',
    'pc-owned',
    [
      [
        'Tập trung vào một việc cụ thể',
        'Thêm tay nghề; cần duy trì',
        'Bạn chọn một việc để luyện đều trên chiếc máy đang có.',
        { skill: 2, stress: 1 },
      ],
      [
        'Thu xếp dữ liệu và cách bảo quản',
        'Thêm kiến thức; bớt thời gian làm việc khác',
        'Bạn dọn lại những tệp và phần việc quan trọng.',
        { knowledge: 2, skill: 1 },
      ],
      [
        'Kiểm tra phần máy cần chăm',
        'Sửa trong khả năng; không thay cả máy',
        'Bạn bắt đầu bằng việc giữ chiếc máy đang có hoạt động ổn hơn.',
        { mood: 1 },
        'care-pc',
      ],
      [
        'Giảm bớt thời gian trước màn hình',
        'Bớt áp lực; dừng mạch nâng cấp',
        'Bạn chưa theo thêm một kế hoạch nâng máy.',
        { health: 1, stress: -2 },
      ],
    ],
    { arc: 'pc', stage: 2, after: 'pc-1' },
  ),
  scene(
    'pc-3',
    'Sau lần thay linh kiện',
    'Chiếc máy đã qua một lần nâng cấp. Bạn cân nhắc dùng phần khả năng mới tới đâu, thay vì mặc định phải làm thêm nhiều việc.',
    'pc-upgraded',
    [
      [
        'Thử vào một phần việc đang theo',
        'Thêm tay nghề; thêm áp lực nhỏ',
        'Bạn thử cách dùng phần nâng cấp vào công việc cụ thể.',
        { skill: 2, stress: 1 },
      ],
      [
        'Giữ hiệu năng, bớt giờ sử dụng',
        'Giảm điện và phần hỗ trợ; giữ thời gian nghỉ',
        'Bạn ưu tiên một lịch sử dụng ít giờ hơn.',
        { health: 1 },
        'power-save',
      ],
      [
        'Dành thời gian học cách dùng tốt hơn',
        'Thêm tri thức; chưa nhận việc mới',
        'Bạn chọn học thêm thay vì nhận ngay một lời hứa mới.',
        { knowledge: 2, stress: 1 },
      ],
      [
        'Dừng nâng cấp ở đây',
        'Giữ nhịp hiện tại; chưa thay thêm',
        'Bạn để chiếc máy làm việc vừa nhu cầu đang có.',
        { mood: 2, stress: -1 },
      ],
    ],
    { arc: 'pc', stage: 3, after: 'pc-2' },
  ),
  scene(
    'loan-1',
    'Một khoản phải trả nhiều năm',
    'Bạn đã nhận một khoản vay mua tài sản. Kỳ trả đầu chỉ là một phần; thu nhập thay đổi và các chi phí khác vẫn cần chỗ trong kế hoạch.',
    'loan-active',
    [
      [
        'Để riêng khoản phải trả đều',
        'Rõ ngân sách; ít tiền linh hoạt hơn',
        'Bạn đặt khoản vay cạnh các chi phí sinh hoạt.',
        { knowledge: 2, stress: 1 },
        'plan',
      ],
      [
        'Trả thêm một phần nếu còn dư',
        'Giảm gốc trong khả năng; giữ phần sinh hoạt',
        'Bạn xem có khoản tiền nào có thể trả thêm.',
        { mood: 1 },
        'extra-payment',
      ],
      [
        'Ghi một phương án khi thu nhập giảm',
        'Thêm chuẩn bị; phải nhìn vào rủi ro',
        'Bạn giữ một phương án bán hoặc giảm đồ nếu cần.',
        { knowledge: 2, stress: 2 },
      ],
      [
        'Không nhận thêm nghĩa vụ mới',
        'Bớt áp lực; khép kế hoạch mở rộng',
        'Bạn giữ các khoản hiện tại và chưa vay để mua thêm.',
        { stress: -2, mood: 1 },
      ],
    ],
    { arc: 'loan', stage: 1 },
  ),
  scene(
    'loan-2',
    'Khi khoản trả trở nên khó',
    'Tiền sẵn có hoặc kỳ trả gần đây cho thấy kế hoạch đang căng. Bạn cần chọn việc có thể làm, không chỉ mong tháng sau sẽ tốt hơn.',
    'loan-pressure',
    [
      [
        'Trả thêm trong phần tiền thực sự dư',
        'Có thể giảm gốc; không lấy tiền chưa có',
        'Bạn kiểm lại số tiền có thể chuyển vào khoản vay.',
        { knowledge: 1 },
        'extra-payment',
      ],
      [
        'Ghi giá bán và phần nợ còn lại',
        'Hiểu đánh đổi; chưa bán tự động',
        'Bạn xem tiền bán có đủ tất toán hay còn cần bù.',
        { knowledge: 2, stress: 1 },
        'plan',
      ],
      [
        'Nói rõ phần chi cần phối hợp',
        'Thêm giao tiếp; cần đối diện việc khó',
        'Bạn nói về con số hiện có thay vì hứa một khoản chưa kiếm được.',
        { social: 2, stress: 1 },
      ],
      [
        'Giữ chi thiết yếu, ngừng mua thêm',
        'Bớt việc trước mắt; nợ vẫn còn',
        'Bạn nhận rằng các kỳ trả vẫn cần xử lý và dừng mở rộng.',
        { mood: 1, stress: -1 },
      ],
    ],
    { arc: 'loan', stage: 2, after: 'loan-1' },
  ),
  scene(
    'loan-3',
    'Nhìn lại một quyết định vay',
    'Hồ sơ vay đã đi qua một đoạn khó. Dù khoản nợ còn hay đã khép, bạn có thêm điều để cân nhắc trước lần mua lớn tiếp theo.',
    'loan-history',
    [
      [
        'Giữ lại cách theo dõi từng khoản',
        'Thêm kiến thức; cần đều đặn',
        'Bạn giữ riêng tiền gốc, lãi và chi phí sở hữu.',
        { knowledge: 2, skill: 1 },
      ],
      [
        'Ưu tiên giảm phần gốc còn lại nếu có',
        'Trả theo tiền thực có; giữ dự phòng nhỏ',
        'Bạn xem phần nợ nào còn có thể trả thêm.',
        { stress: 1 },
        'extra-payment',
      ],
      [
        'Chia sẻ bài học với người thân quen',
        'Thêm kết nối; cần kể cả phần khó',
        'Bạn kể cả những đoạn phải thu hẹp kế hoạch.',
        { social: 2, mood: 1 },
      ],
      [
        'Chọn một thời gian không mua lớn',
        'Bớt áp lực; dừng chuỗi kế hoạch này',
        'Bạn dành thời gian để nhịp sống ổn lại.',
        { stress: -2, health: 1 },
      ],
    ],
    { arc: 'loan', stage: 3, after: 'loan-2' },
  ),
  scene(
    'stream-failure',
    'Đồ dùng trục trặc trước giờ phát',
    'Bạn đang theo một kênh nội dung, còn thiết bị đã xuống tình trạng thấp. Một buổi phát hoặc phần việc sắp tới cần phương án vừa sức.',
    'stream-worn',
    [
      [
        'Chăm phần thiết bị có thể xử lý',
        'Có phí nếu đủ; cải thiện nhỏ',
        'Bạn ưu tiên phần có thể kiểm tra trước khi hứa thêm.',
        { stress: 1 },
        'care-pc',
      ],
      [
        'Thu hẹp nội dung để giữ lời hẹn',
        'Thêm tay nghề; bớt phạm vi',
        'Bạn chuẩn bị một phần nội dung nhỏ hơn để có thể làm tới nơi.',
        { skill: 2, mood: -1 },
      ],
      [
        'Báo trước giới hạn của buổi này',
        'Giữ giao tiếp; có thể ít hứng khởi',
        'Bạn nói rõ điều thiết bị hiện tại làm được.',
        { social: 2, stress: 1 },
      ],
      [
        'Nghỉ phần việc thêm, chưa sửa ngay',
        'Giữ tiền; tình trạng giảm tiếp',
        'Bạn chưa đặt thêm một khoản sửa hoặc buổi phát mới.',
        { health: 1 },
        'defer-pc',
      ],
    ],
  ),
  scene(
    'selling-hardship',
    'Giữ món đồ hay giữ tiền mặt',
    'Tiền mặt đang mỏng, trong khi đồ dùng vẫn có chi phí. Bạn cân nhắc phần nào thật sự cần giữ trong nhịp sống hiện tại.',
    'hardship',
    [
      [
        'So giá bán với khoản phải trả',
        'Rõ con số; chưa bán thay bạn',
        'Bạn xem cả chi phí giữ đồ lẫn phần nợ đi cùng.',
        { knowledge: 2, stress: 1 },
        'plan',
      ],
      [
        'Tìm cách dùng ít tốn điện hơn',
        'Giảm phần hỗ trợ; tiết kiệm điện máy bàn',
        'Bạn chọn giảm giờ dùng máy nếu đang có máy tự ráp.',
        { skill: 1 },
        'power-save',
      ],
      [
        'Bàn về việc dùng chung khi phù hợp',
        'Thêm kết nối; cần thỏa thuận',
        'Bạn hỏi một phương án chia sẻ thay vì tự coi đồ của người khác là của mình.',
        { social: 2, stress: 1 },
      ],
      [
        'Hoãn mua mới và nghỉ một nhịp',
        'Bớt áp lực; vấn đề tiền chưa tự hết',
        'Bạn dừng một quyết định mua trong lúc xem lại chi tiêu.',
        { mood: 1, stress: -2 },
      ],
    ],
  ),
  scene(
    'long-held',
    'Một món đồ đã ở lại lâu',
    'Bạn có món đồ đã đi cùng mình hơn hai mươi năm. Giá trị bán lại và phần ký ức gắn với nó không phải cùng một con số.',
    'long-held',
    [
      [
        'Ghi lại câu chuyện về món đồ',
        'Giữ ký ức; thêm thời gian',
        'Bạn giữ một đoạn kể về quãng đời đã dùng nó.',
        { mood: 2, stress: 1 },
      ],
      [
        'Xem lại chi phí để giữ tiếp',
        'Thêm hiểu biết; cần nhìn vào tình trạng thật',
        'Bạn so khoản duy trì với việc còn thực sự dùng tới.',
        { knowledge: 2, skill: 1 },
        'plan',
      ],
      [
        'Kể cho người thân quen nếu họ muốn nghe',
        'Thêm kết nối; cần sự lắng nghe hai chiều',
        'Bạn kể chuyện cũ mà không buộc người khác phải giữ cùng món đồ.',
        { social: 2, mood: 1 },
      ],
      [
        'Cho phép mình nghĩ tới lúc bán',
        'Nhẹ áp lực; chưa có tiền bán nào',
        'Bạn chưa bán ngay, nhưng không coi giữ mãi là nghĩa vụ.',
        { stress: -2, knowledge: 1 },
      ],
    ],
    { minAge: 40 },
  ),
  scene(
    'family-space',
    'Một chỗ cho nhiều nhịp sống',
    'Nhà đang chật so với số con nhỏ và người sống cùng. Chuyển nhà là một cách, nhưng lịch chăm sóc và cách chia không gian cũng cần được bàn.',
    'family-space',
    [
      [
        'Chia lại giờ học, ngủ và chơi',
        'Bớt va chạm; cần công sức',
        'Bạn thử một lịch sinh hoạt rõ hơn trong chỗ ở đang có.',
        { skill: 2, stress: 1 },
      ],
      [
        'Tính chi phí chuyển sang chỗ khác',
        'Rõ khả năng; chưa tự chuyển nhà',
        'Bạn ghi cả cọc, tiền thuê và công chuyển chỗ.',
        { knowledge: 2, mood: -1 },
        'plan',
      ],
      [
        'Hỏi người cùng chăm phần họ cần',
        'Thêm giao tiếp; phải phối hợp',
        'Bạn dành chỗ cho những nhu cầu khác nhau trong việc chăm con.',
        { social: 2, stress: 1 },
      ],
      [
        'Giữ một góc yên và bớt kế hoạch mới',
        'Thêm khoảng nghỉ; chưa hết chật',
        'Bạn chọn một thay đổi nhỏ thay vì hứa sẽ giải quyết mọi việc cùng lúc.',
        { mood: 1, stress: -2 },
      ],
    ],
  ),
  scene(
    'relatives-visit',
    'Một chuyến về gặp cha mẹ',
    'Bạn còn cha hoặc mẹ được ghi nhận đang sống, và có phương tiện đủ điều kiện dùng trong game. Bạn thu xếp một chuyến thăm sao cho không thành gánh nặng mới.',
    'relative',
    [
      [
        'Dành một chuyến riêng để trò chuyện',
        'Thêm kết nối; tốn thời gian',
        'Bạn chừa khoảng thời gian thật sự dành cho cuộc gặp.',
        { social: 2, stress: 1 },
      ],
      [
        'Gộp với một việc đi đường phù hợp',
        'Gọn lịch; ít thời gian ở lại',
        'Bạn chọn một chuyến đi vừa với lịch sinh hoạt.',
        { knowledge: 1, skill: 1 },
      ],
      [
        'Chăm xe trước khi đi',
        'Cải thiện nhỏ; có thể tốn phí',
        'Bạn kiểm tra phần phương tiện đang dựa vào.',
        { mood: 1 },
        'care-vehicle',
      ],
      [
        'Hẹn lại một dịp mình thu xếp được',
        'Bớt áp lực; cuộc gặp chưa diễn ra',
        'Bạn nói rõ mình chưa đi được lần này.',
        { stress: -2, social: -1 },
      ],
    ],
  ),
  scene(
    'electricity',
    'Giờ dùng máy và hóa đơn',
    'Máy tự ráp có chi phí điện theo lịch sử dụng mô phỏng. Bạn cân nhắc giữ nhịp làm việc hay bớt giờ để dành thời gian và tiền cho việc khác.',
    'power',
    [
      [
        'Giảm lịch xuống ba giờ mỗi ngày',
        'Ít tiền điện; phần hỗ trợ công việc giảm',
        'Bạn chọn một lịch dùng máy gọn hơn từ tháng sau.',
        { health: 1 },
        'power-save',
      ],
      [
        'Giữ lịch bốn giờ đang tính',
        'Giữ phần hỗ trợ; điện vẫn theo lịch này',
        'Bạn giữ một nhịp sử dụng có chủ đích.',
        { skill: 1, stress: 1 },
        'power-normal',
      ],
      [
        'Ghi chi phí máy cạnh các khoản nhà',
        'Thêm kiến thức; chưa đổi lịch dùng',
        'Bạn thấy rõ chi phí của máy trong ngân sách sinh hoạt.',
        { knowledge: 2, mood: -1 },
        'plan',
      ],
      [
        'Dành một khoảng nghỉ đều hơn',
        'Bớt áp lực; chưa thay cấu hình',
        'Bạn điều chỉnh cách chia thời gian quanh những việc đang làm.',
        { mood: 1, stress: -2 },
      ],
    ],
  ),
  scene(
    'elderly-move',
    'Chỗ ở cho quãng đời tiếp',
    'Bạn đang sống ở chỗ thuê hoặc nhà sở hữu. Ở tuổi này, đường đi dễ xoay xở và công sức chăm chỗ ở có thể đáng cân nhắc hơn việc giữ mọi thứ như cũ.',
    'elderly-move',
    [
      [
        'Tính một chỗ nhỏ và dễ chăm hơn',
        'Rõ kế hoạch; chưa bán hay chuyển tự động',
        'Bạn ghi điều mình cần ở một chỗ ở khác.',
        { knowledge: 2, stress: 1 },
        'plan',
      ],
      [
        'Nói rõ mong muốn trước khi quyết định',
        'Giữ quyền tự chọn; cần giao tiếp',
        'Bạn giữ tiếng nói của mình trong việc thu xếp nơi ở.',
        { social: 2, mood: 1 },
      ],
      [
        'Chăm phần nhà đang dùng nếu có thể',
        'Cải thiện nhỏ; không giải quyết mọi bất tiện',
        'Bạn chọn phần việc vừa sức trong hiện tại.',
        { skill: 1 },
        'care-home',
      ],
      [
        'Ở lại thêm và dành thời gian suy nghĩ',
        'Giữ nếp quen; chưa đổi chỗ',
        'Bạn chưa buộc mình nhận một quyết định lớn trong hôm nay.',
        { stress: -2, mood: 1 },
      ],
    ],
    { minAge: 75 },
  ),
];
