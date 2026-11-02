import type { Effect, EventDefinition, Stat, Condition } from '../domain/model';
import { event, choice, stat, flag } from './authoring';
type Path = [string, string, string, Partial<Record<Stat, number>>];
export type StableContext =
  'job-rejection' | 'known-parent' | 'shop-record' | 'work-record' | 'creative-record';
export const STABLE_SCENE_META: Record<
  string,
  { arc?: string; stage?: number; requires?: StableContext }
> = {};
function scene(
  id: string,
  title: string,
  text: string,
  minAge: number,
  paths: Path[],
  condition: Condition = {},
  meta: { arc?: string; stage?: number; requires?: StableContext } = {},
): EventDefinition {
  const full = 'stable-' + id;
  STABLE_SCENE_META[full] = meta;
  return event(
    full,
    meta.arc === 'application' || meta.arc === 'craft' || meta.arc === 'shop'
      ? 'career'
      : 'relationship',
    title,
    text,
    { minAge, ...condition },
    paths.map(([t, h, o, changes], i) => {
      const effects: Effect[] = Object.entries(changes).map(([key, n]) => stat(key as Stat, n!));
      if (meta.arc && meta.stage) {
        effects.push(flag(`stable-${meta.arc}-${meta.stage}-choice-${i}`));
        if (i === 3) effects.push(flag(`stable-${meta.arc}-closed`));
        else {
          effects.push(flag(`stable-${meta.arc}-${meta.stage}`));
          if (meta.stage === 4) effects.push(flag(`stable-${meta.arc}-complete`));
        }
      }
      return choice(['a', 'b', 'c', 'd'][i], t, h, o, effects);
    }),
    {
      version: 16,
      once: true,
      cooldown: 120,
      priority: 0,
      weight: meta.stage && meta.stage > 1 ? 40 : 12,
    },
  );
}
type Stage = [string, string, Path[]];
function arc(
  id: string,
  requires: StableContext | undefined,
  stages: Stage[],
  options: { ages?: number[]; minYear?: number } = {},
): EventDefinition[] {
  return stages.map(([title, text, paths], i) =>
    scene(
      `${id}-${i + 1}`,
      title,
      text,
      (options.ages ?? [20, 32, 50, 70])[i],
      paths,
      {
        ...(options.minYear ? { minYear: options.minYear } : {}),
        ...(i ? { flags: [`stable-${id}-${i}`] } : {}),
        absent: [`stable-${id}-closed`],
      },
      { arc: id, stage: i + 1, ...(i === 0 && requires ? { requires } : {}) },
    ),
  );
}
export const stableEvents: EventDefinition[] = [
  ...arc('learning', undefined, [
    [
      'Chỗ ngồi trong nhóm học',
      'Một nhóm tự học còn chỗ. Bạn muốn thử, nhưng lịch sinh hoạt cũng đã chật.',
      [
        [
          'Nhận một phần bài chuẩn bị',
          'Học sâu hơn; thêm áp lực',
          'Bạn nhận phần chuẩn bị nhỏ, ghi rõ điều mình chưa biết.',
          { knowledge: 2, stress: 2 },
        ],
        [
          'Học riêng rồi trao đổi ngắn',
          'Ít giao lưu; giữ được nhịp học',
          'Bạn giữ cuốn sổ riêng và hẹn trao đổi một câu mỗi tuần.',
          { knowledge: 2, social: -1 },
        ],
        [
          'Rủ nhóm học theo một việc cụ thể',
          'Thêm tay nghề; cần phối hợp',
          'Bạn đề nghị làm thử một việc để mọi người cùng xem kết quả.',
          { skill: 2, social: 1, stress: 1 },
        ],
        [
          'Chưa nhận thêm lịch',
          'Bớt áp lực; khép câu chuyện nhóm học',
          'Bạn từ chối chỗ ngồi lúc này và để dành sức cho việc đang theo.',
          { stress: -2, mood: 1 },
        ],
      ],
    ],
    [
      'Cuốn sổ còn một chỗ trống',
      'Bạn gặp lại ghi chép từ nhóm học. Có điều từng hiểu, có điều cần học lại.',
      [
        [
          'Kiểm lại phần mình từng chắc chắn',
          'Thêm tri thức; tốn công sửa',
          'Bạn tìm ra một chỗ ghi sai và viết lại cách hiểu của mình.',
          { knowledge: 3, stress: 1 },
        ],
        [
          'Làm thử một bản nhỏ',
          'Thêm tay nghề; dễ thấy chỗ hụt',
          'Bạn thử điều đã học bằng một việc vừa sức, thay vì chỉ đọc lại.',
          { skill: 2, mood: -1 },
        ],
        [
          'Trao đổi với một người mới học',
          'Thêm giao tiếp; cần kiên nhẫn',
          'Bạn nghe câu hỏi mới và nhận ra mình đã bỏ qua một bước.',
          { social: 2, knowledge: 1, stress: 1 },
        ],
        [
          'Cất sổ, giữ việc đang làm',
          'Tạm dừng học; giảm áp lực',
          'Bạn ghi nơi đã dừng rồi cất sổ, không hứa một lịch chưa thể giữ.',
          { stress: -2 },
        ],
      ],
    ],
    [
      'Một cách hiểu đã cũ',
      'Những điều trong sổ không còn khớp hết với việc hôm nay. Kinh nghiệm vẫn có ích nếu bạn chịu sửa.',
      [
        [
          'Học lại từ chỗ đã thay đổi',
          'Thêm tri thức; chấp nhận vất vả',
          'Bạn đánh dấu phần cần học lại và bỏ một cách làm đã lỗi thời.',
          { knowledge: 3, stress: 2 },
        ],
        [
          'Giữ nguyên tắc, thử công cụ khác',
          'Thêm tay nghề; có chút lúng túng',
          'Bạn giữ điều còn đúng và tập một cách thực hiện mới.',
          { skill: 3, mood: -1 },
        ],
        [
          'Nhờ người ít tuổi hơn góp ý',
          'Thêm giao tiếp; thêm góc nhìn',
          'Bạn đưa bản làm thử cho người khác xem và nghe hết lời góp ý.',
          { social: 2, knowledge: 1 },
        ],
        [
          'Dừng việc mở rộng phần này',
          'Tạm dừng học; giữ sức',
          'Bạn giữ phần hiểu biết còn dùng được và ngừng nhận thêm phần mới.',
          { stress: -3, skill: -1 },
        ],
      ],
    ],
    [
      'Trang cuối vẫn có thể viết',
      'Cuốn sổ theo bạn qua nhiều chặng. Bây giờ bạn muốn giữ kiến thức ấy theo cách nào?',
      [
        [
          'Viết lại cho người mới bắt đầu',
          'Thêm tri thức; thêm công soát',
          'Bạn bỏ những đoạn khó hiểu và viết một bản hướng dẫn ngắn.',
          { knowledge: 2, social: 1, stress: 1 },
        ],
        [
          'Giữ một việc tự học cho riêng mình',
          'Thêm tinh thần; vẫn cần tập',
          'Bạn chọn một câu hỏi nhỏ để tiếp tục học mà không nhận lịch dày.',
          { mood: 2, knowledge: 1 },
        ],
        [
          'Trao sổ và kể cả điều từng làm sai',
          'Thêm giao tiếp; khép một chặng',
          'Bạn chia sẻ cả phần đã sửa, để người sau biết kiến thức có thể đổi.',
          { social: 3, mood: 1 },
        ],
        [
          'Cất lại như một kỷ niệm',
          'Tạm dừng; nghỉ khỏi việc hướng dẫn',
          'Bạn ghi ngày cuối, giữ cuốn sổ như một dấu mốc của đời mình.',
          { stress: -2, mood: 1 },
        ],
      ],
    ],
  ]),
  ...arc('application', 'job-rejection', [
    [
      'Một hồ sơ chưa được nhận',
      'Một lần xin việc không thành vẫn làm bạn nghĩ ngợi. Bạn có thể sửa phần mình làm được.',
      [
        [
          'Đọc lại hồ sơ trước khi sửa',
          'Thêm tri thức; có áp lực',
          'Bạn tìm một chỗ mô tả chưa rõ, chưa gửi lại đơn hoặc nhận việc mới.',
          { knowledge: 2, stress: 1 },
        ],
        [
          'Luyện một phần việc còn yếu',
          'Thêm tay nghề; cần thời gian',
          'Bạn dành một nhịp luyện cho phần việc từng khiến mình lúng túng.',
          { skill: 3, mood: -1 },
        ],
        [
          'Nhờ xem giúp một trang hồ sơ',
          'Thêm giao tiếp; chịu lời góp ý',
          'Bạn xin góp ý cụ thể, không coi lời động viên là lời hứa tuyển dụng.',
          { social: 2, knowledge: 1, stress: 1 },
        ],
        [
          'Để hồ sơ sang một bên lúc này',
          'Tạm dừng; giảm áp lực',
          'Bạn ngừng soát hồ sơ hôm nay, giữ quyền tìm một hướng khác sau này.',
          { stress: -3 },
        ],
      ],
    ],
    [
      'Điều từng viết quá rộng',
      'Bạn nhìn lại phần hồ sơ đã sửa. Một câu nghe hay chưa chắc giúp người khác hiểu bạn làm được gì.',
      [
        [
          'Đổi lời hứa rộng thành một ví dụ',
          'Thêm tri thức; phải tự kiểm',
          'Bạn viết rõ một việc mình đã làm và bỏ lời hứa không có căn cứ.',
          { knowledge: 2, stress: 1 },
        ],
        [
          'Làm một mẫu việc để tự đối chiếu',
          'Thêm tay nghề; tốn công',
          'Bạn thử làm một mẫu việc rồi đánh dấu phần còn cần luyện.',
          { skill: 3, stress: 1 },
        ],
        [
          'Nói rõ phần mình còn cần học',
          'Thêm giao tiếp; bớt tự tin nhất thời',
          'Bạn tập cách trình bày một giới hạn mà không giấu nó đi.',
          { social: 2, mood: -1 },
        ],
        [
          'Không theo hồ sơ này nữa',
          'Tạm dừng; nhẹ gánh hơn',
          'Bạn giữ lại phần đã học và khép việc sửa hồ sơ cũ.',
          { stress: -2, mood: 1 },
        ],
      ],
    ],
    [
      'Khi được hỏi về một lần trượt',
      'Có người hỏi bạn đã vượt qua một lần xin việc không thành ra sao. Bạn nhớ cả việc đã sửa lẫn điều chưa đổi.',
      [
        [
          'Kể phần mình đã tập lại',
          'Thêm tay nghề; nhìn thẳng chỗ yếu',
          'Bạn kể về phần đã luyện và cả điều mình vẫn còn lúng túng.',
          { skill: 2, knowledge: 1 },
        ],
        [
          'Kể cả thời gian phải chờ',
          'Thêm giao tiếp; có chút nặng lòng',
          'Bạn nói về những ngày chờ, để câu chuyện không thành một lời hứa dễ dàng.',
          { social: 3, mood: -1 },
        ],
        [
          'Lắng nghe hoàn cảnh của người hỏi',
          'Thêm tinh thần; bớt phán xét',
          'Bạn nghe trước khi góp ý và nhận ra hai hoàn cảnh không giống nhau.',
          { social: 2, mood: 1 },
        ],
        [
          'Không nhận vai khuyên nhủ',
          'Tạm dừng; giữ khoảng riêng',
          'Bạn nói rõ mình chưa muốn kể chuyện ấy và giữ cuộc trao đổi ngắn.',
          { stress: -2, social: -1 },
        ],
      ],
    ],
    [
      'Giữ lại một con đường vòng',
      'Nhìn lại, lần từ chối ấy là một phần cuộc đời, dù những năm sau đã đi theo hướng nào.',
      [
        [
          'Ghi điều có ích cho mình',
          'Thêm tri thức; khép chặng',
          'Bạn giữ một bài học cụ thể, không biến mọi khó khăn thành điều may mắn.',
          { knowledge: 2, mood: 1 },
        ],
        [
          'Giúp người mới soát một phần việc',
          'Thêm giao tiếp; tốn công',
          'Bạn góp ý phần mình hiểu và tránh hứa rằng họ chắc chắn được nhận.',
          { social: 2, stress: 1 },
        ],
        [
          'Nhìn nhận công của người đã giúp',
          'Thêm tinh thần và kết nối',
          'Bạn nhớ cả những lần có người ngồi nghe mình kể chuyện khó.',
          { mood: 2, social: 1 },
        ],
        [
          'Để chuyện cũ dừng ở đây',
          'Tạm dừng; giảm áp lực',
          'Bạn chọn không kể lại thêm và dành thời gian cho hiện tại.',
          { stress: -2, mood: 1 },
        ],
      ],
    ],
  ]),
  ...arc('promise', 'known-parent', [
    [
      'Một lời hẹn trong gia đình',
      'Gia đình muốn biết bạn có thể dành thời gian vào lúc nào. Hứa dễ hơn giữ được một nhịp đều.',
      [
        [
          'Hẹn một khoảng ngắn có thể giữ',
          'Thêm kết nối; thêm trách nhiệm',
          'Bạn nhận một khoảng thời gian vừa sức, không nhận thay mọi việc.',
          { social: 2, stress: 1 },
        ],
        [
          'Nói rõ lịch đang vướng',
          'Thêm tri thức; có chút áy náy',
          'Bạn nói thật giới hạn của mình và cùng tìm một lịch khác.',
          { knowledge: 1, mood: -1, stress: -1 },
        ],
        [
          'Ghi lại việc cần cùng thu xếp',
          'Thêm tay nghề tổ chức; tốn công',
          'Bạn ghi phần cần phối hợp, thay vì hứa giải quyết ngay tất cả.',
          { skill: 2, stress: 1 },
        ],
        [
          'Chưa nhận lời hẹn này',
          'Tạm dừng; giữ quỹ thời gian',
          'Bạn từ chối lời hẹn cụ thể và nói rõ lý do, không cắt bỏ quan hệ cũ.',
          { stress: -2, social: -1 },
        ],
      ],
    ],
    [
      'Lịch cũ cần đổi',
      'Bạn đọc lại lời hẹn đã ghi. Cuộc sống đã khác, nên nhịp cũ cũng cần xem lại.',
      [
        [
          'Giữ phần mình vẫn làm được',
          'Thêm kết nối; còn trách nhiệm',
          'Bạn giữ một phần rõ ràng và nói lại phần không còn theo được.',
          { social: 2, stress: 1 },
        ],
        [
          'Thu gọn lịch trước khi quá sức',
          'Giảm áp lực; bớt việc chung',
          'Bạn đổi lịch thành một khoảng nhỏ, thay vì tiếp tục hứa dày.',
          { stress: -3, social: -1 },
        ],
        [
          'Nhìn lại ai đang gánh phần còn lại',
          'Thêm tri thức và giao tiếp',
          'Bạn nhận ra một phần công từng ít được nhắc tới.',
          { knowledge: 2, social: 1 },
        ],
        [
          'Khép cách thu xếp cũ',
          'Tạm dừng; nhẹ gánh hơn',
          'Bạn ghi lại nơi đã dừng và không coi một lịch cũ là món nợ vô hạn.',
          { stress: -2, mood: 1 },
        ],
      ],
    ],
    [
      'Công việc ít ai nhìn thấy',
      'Một trang ghi chép nhắc bạn về phần công chăm nom, chờ đợi và thu xếp từng có trong gia đình.',
      [
        [
          'Viết lại phần công bị bỏ sót',
          'Thêm tri thức; có chút xúc động',
          'Bạn ghi cả những việc nhỏ từng khiến một ngày bình thường đi qua được.',
          { knowledge: 2, mood: 1 },
        ],
        [
          'Xem lại cách mình chia thời gian',
          'Thêm tay nghề; cần đổi thói quen',
          'Bạn chọn một phần có thể thu xếp khác từ hôm nay.',
          { skill: 2, stress: 1 },
        ],
        [
          'Giữ chỗ cho một cách kể khác',
          'Thêm giao tiếp; bớt chắc chắn',
          'Bạn chừa lại những điều mình chưa biết đầy đủ về câu chuyện gia đình.',
          { social: 2, knowledge: 1 },
        ],
        [
          'Cất trang ghi chép lại',
          'Tạm dừng; giữ khoảng riêng',
          'Bạn cất lại trang giấy, không bắt mình phải giải quyết hết chuyện cũ.',
          { stress: -2 },
        ],
      ],
    ],
    [
      'Một lời hẹn đã theo nhiều năm',
      'Lời hẹn trong gia đình còn lại dưới dạng ký ức và những thói quen bạn đã giữ hoặc đổi.',
      [
        [
          'Ghi điều đã giữ được',
          'Thêm tinh thần; khép chặng',
          'Bạn ghi một điều nhỏ đã làm được, không xóa những lần đã lỡ.',
          { mood: 2, knowledge: 1 },
        ],
        [
          'Ghi cả điều cần xin lỗi',
          'Thêm giao tiếp; có áp lực',
          'Bạn viết rõ phần trách nhiệm của mình, không tự viết lời tha thứ thay người khác.',
          { social: 2, stress: 1 },
        ],
        [
          'Giữ một nhịp sống vừa sức hôm nay',
          'Giảm áp lực; còn việc phải chọn',
          'Bạn chọn lại cách dùng thời gian phù hợp với sức và hoàn cảnh hiện tại.',
          { stress: -2, health: 1 },
        ],
        [
          'Để ký ức được yên',
          'Tạm dừng; không nhận thêm việc',
          'Bạn giữ ký ức mà không nhận thêm một lời hứa chưa chắc theo được.',
          { mood: 1, stress: -2 },
        ],
      ],
    ],
  ]),
  ...arc('craft', 'work-record', [
    [
      'Một phần việc làm chưa gọn',
      'Nhìn lại công việc từng theo, bạn thấy có một bước cứ phải làm lại. Thói quen chưa chắc là cách tốt nhất.',
      [
        [
          'Soát lại bước hay bị lỗi',
          'Thêm tay nghề; tốn công',
          'Bạn chọn sửa một bước nhỏ thay vì hứa thay toàn bộ cách làm.',
          { skill: 3, stress: 1 },
        ],
        [
          'Viết ra điều mình đang giả định',
          'Thêm tri thức; chậm lại một nhịp',
          'Bạn nhận ra một giả định chưa được kiểm, rồi ghi cách kiểm lại.',
          { knowledge: 3, mood: -1 },
        ],
        [
          'Xin nghe một cách làm khác',
          'Thêm giao tiếp; cần kiên nhẫn',
          'Bạn nghe hết một cách khác trước khi nói nó không phù hợp.',
          { social: 2, knowledge: 1 },
        ],
        [
          'Chưa theo việc cải tiến này',
          'Tạm dừng; giữ sức',
          'Bạn ghi chỗ vướng và dừng việc mở rộng hôm nay.',
          { stress: -2 },
        ],
      ],
    ],
    [
      'Khi cách sửa gặp việc thật',
      'Bạn xem lại bước đã thử sửa. Một cách làm gọn hơn vẫn cần được kiểm trong hoàn cảnh thực tế.',
      [
        [
          'Thử trên một phần nhỏ',
          'Thêm tay nghề; thêm công kiểm',
          'Bạn thử trong phạm vi hẹp và ghi cả phần chưa hiệu quả.',
          { skill: 3, stress: 1 },
        ],
        [
          'Giữ bản cũ để so sánh',
          'Thêm tri thức; không đổi vội',
          'Bạn đối chiếu hai cách, không coi cái mới luôn tốt hơn.',
          { knowledge: 2, stress: -1 },
        ],
        [
          'Chia sẻ phần đã kiểm được',
          'Thêm giao tiếp; chịu trách nhiệm lời nói',
          'Bạn chỉ giới thiệu phần mình đã thử, để người khác tự xét hoàn cảnh.',
          { social: 2, stress: 1 },
        ],
        [
          'Dừng cách thử chưa phù hợp',
          'Tạm dừng; chấp nhận công đã bỏ',
          'Bạn dừng cách thử này và giữ bản ghi về lý do đã dừng.',
          { stress: -2, mood: -1 },
        ],
      ],
    ],
    [
      'Khi kinh nghiệm cần học lại',
      'Một phần cách làm từng hữu ích đã không còn hợp. Bạn vẫn có thể học lại mà không phủ nhận công cũ.',
      [
        [
          'Tập lại một thao tác mới',
          'Thêm tay nghề; có lúng túng',
          'Bạn bắt đầu từ một thao tác, chấp nhận làm chậm lúc đầu.',
          { skill: 3, mood: -1 },
        ],
        [
          'Tách nguyên tắc khỏi công cụ cũ',
          'Thêm tri thức; cần suy nghĩ',
          'Bạn giữ nguyên tắc còn đúng và bỏ phần phụ thuộc vào công cụ cũ.',
          { knowledge: 3, stress: 1 },
        ],
        [
          'Cùng người khác xem một bản thử',
          'Thêm giao tiếp và tay nghề',
          'Bạn đưa bản thử ra trao đổi, không lấy số năm làm nghề để kết thúc tranh luận.',
          { social: 2, skill: 1 },
        ],
        [
          'Không mở thêm phần việc này',
          'Tạm dừng; giảm áp lực',
          'Bạn giữ giới hạn hiện tại và không nhận thêm phần mình chưa sẵn sàng.',
          { stress: -3 },
        ],
      ],
    ],
    [
      'Một mẹo nghề và giới hạn của nó',
      'Bạn muốn giữ lại kinh nghiệm từng dùng. Người đọc sau cần biết cả lúc mẹo ấy không còn phù hợp.',
      [
        [
          'Viết kèm điều kiện áp dụng',
          'Thêm tri thức; thêm công soát',
          'Bạn ghi rõ điều kiện và tránh biến kinh nghiệm riêng thành quy tắc cho mọi người.',
          { knowledge: 3, stress: 1 },
        ],
        [
          'Làm một ví dụ thật gọn',
          'Thêm tay nghề; cần tập trung',
          'Bạn làm một ví dụ vừa sức, không mở lại một công việc đã khép.',
          { skill: 2, mood: 1 },
        ],
        [
          'Để người mới thử và sửa ghi chú',
          'Thêm giao tiếp; thêm góc nhìn',
          'Bạn lắng nghe chỗ người mới hiểu khác rồi sửa phần hướng dẫn.',
          { social: 2, knowledge: 1 },
        ],
        [
          'Giữ ghi chú cho riêng mình',
          'Tạm dừng; bớt trách nhiệm hướng dẫn',
          'Bạn cất phần ghi chú như một ký ức nghề nghiệp của mình.',
          { stress: -2, mood: 1 },
        ],
      ],
    ],
  ]),
  ...arc(
    'neighbor',
    undefined,
    [
      [
        'Một việc chung còn dang dở',
        'Một góc sinh hoạt chung cần được thu xếp. Mỗi người có thời gian và khả năng khác nhau.',
        [
          [
            'Nhận một việc vừa sức',
            'Thêm kết nối; thêm công',
            'Bạn nhận một phần rõ ràng, không nhận thay cả nhóm.',
            { social: 2, stress: 1 },
          ],
          [
            'Góp một cách chia việc',
            'Thêm tri thức; cần trao đổi',
            'Bạn đề nghị chia việc thành phần nhỏ để người bận vẫn có thể góp sức.',
            { knowledge: 2, social: 1 },
          ],
          [
            'Đến nghe trước khi nhận',
            'Thêm giao tiếp; chưa hứa làm',
            'Bạn nghe nhu cầu của nhóm rồi mới xét phần mình có thể theo.',
            { social: 2, mood: 1 },
          ],
          [
            'Không nhận đợt này',
            'Tạm dừng; giữ sức',
            'Bạn từ chối đợt thu xếp này, tránh để một chỗ trống mang tên mình.',
            { stress: -2 },
          ],
        ],
      ],
      [
        'Khi việc chung được chia chưa đều',
        'Bạn nhớ việc từng cùng thu xếp. Có phần dễ thấy, có phần lặng lẽ rơi vào vài người.',
        [
          [
            'Ghi rõ cả việc ít ai thấy',
            'Thêm tri thức; cần quan sát',
            'Bạn ghi cả việc chuẩn bị và dọn sau, không chỉ phần được khen.',
            { knowledge: 2, social: 1 },
          ],
          [
            'Đổi sang phần việc mình làm chắc',
            'Thêm tay nghề; bớt nhận rộng',
            'Bạn chọn một phần có thể theo tới cùng và nói rõ giới hạn.',
            { skill: 2, stress: -1 },
          ],
          [
            'Hỏi người đang gánh nhiều',
            'Thêm giao tiếp; có áp lực',
            'Bạn nghe phần họ muốn bớt đi trước khi đề nghị giúp.',
            { social: 3, stress: 1 },
          ],
          [
            'Rời nhóm sau khi nói rõ',
            'Tạm dừng; có chút tiếc',
            'Bạn nói rõ mình dừng ở đâu và không để người khác chờ thêm.',
            { stress: -2, mood: -1 },
          ],
        ],
      ],
      [
        'Một chỗ để người mới góp sức',
        'Một việc chung sắp có người mới tham gia. Cách chia việc cũ cần đủ rõ để họ không phải đoán.',
        [
          [
            'Viết hướng dẫn ngắn',
            'Thêm tri thức; thêm công soát',
            'Bạn viết từ bước đầu, bỏ những chỗ chỉ người cũ mới hiểu.',
            { knowledge: 2, stress: 1 },
          ],
          [
            'Làm cùng một lượt vừa sức',
            'Thêm tay nghề và giao tiếp',
            'Bạn cùng làm một phần nhỏ, để người mới có thể hỏi ngay.',
            { skill: 1, social: 2 },
          ],
          [
            'Chừa chỗ cho cách làm khác',
            'Thêm kết nối; bớt giữ quyền',
            'Bạn nghe cách người mới muốn thử thay vì giao lại nguyên một nếp cũ.',
            { social: 3, mood: 1 },
          ],
          [
            'Không nhận vai hướng dẫn',
            'Tạm dừng; giữ nhịp riêng',
            'Bạn giao lại phần mình đã biết và không nhận thêm lịch hướng dẫn.',
            { stress: -2 },
          ],
        ],
      ],
      [
        'Góc chung có thêm người ngồi',
        'Góc sinh hoạt từng cùng thu xếp vẫn có thể đổi. Bạn muốn giữ một chỗ trong đời sống cộng đồng ra sao?',
        [
          [
            'Tham gia một phần nhỏ',
            'Thêm tinh thần; có lịch phải giữ',
            'Bạn chọn một phần vừa sức, không lấy tuổi tác làm lý do nhận hoặc gánh hết.',
            { mood: 2, social: 1, stress: 1 },
          ],
          [
            'Kể lại cả những lần chia việc sai',
            'Thêm tri thức cho mình',
            'Bạn ghi cả những lần làm chưa công bằng để người sau có thể đổi cách.',
            { knowledge: 3 },
          ],
          [
            'Đến nghe và làm quen người mới',
            'Thêm giao tiếp; cần mở lòng',
            'Bạn dành một buổi ngắn để nghe những chuyện mình chưa biết.',
            { social: 3, mood: 1 },
          ],
          [
            'Giữ một khoảng riêng yên tĩnh',
            'Tạm dừng; giảm áp lực',
            'Bạn chọn nghỉ khỏi việc chung và giữ quyền quay về nhịp sống riêng.',
            { stress: -2, mood: 1 },
          ],
        ],
      ],
    ],
    { ages: [26, 41, 61, 82] },
  ),
  ...arc(
    'distance',
    undefined,
    [
      [
        'Tin nhắn để đến tối',
        'Tin nhắn đang chen vào nhiều khoảng trong ngày. Bạn muốn giữ kết nối mà vẫn có lúc tập trung.',
        [
          [
            'Chọn một giờ trả lời',
            'Thêm tập trung; có người phải chờ',
            'Bạn ghi một giờ trả lời vừa sức, không hứa có mặt suốt ngày.',
            { knowledge: 2, social: -1, stress: -1 },
          ],
          [
            'Trả lời ngắn điều cần nói rõ',
            'Thêm giao tiếp; tốn công',
            'Bạn trả lời phần quan trọng và nói rõ phần chưa thể nhận lời.',
            { social: 2, stress: 1 },
          ],
          [
            'Tắt bớt thông báo khi làm việc',
            'Thêm tay nghề; bớt phân tâm',
            'Bạn để dành một khoảng làm việc liền mạch, không đổi lịch của người khác.',
            { skill: 2, mood: 1 },
          ],
          [
            'Không theo cách thu xếp này nữa',
            'Tạm dừng; nhẹ đầu hơn',
            'Bạn dừng việc tự đặt thêm một lịch liên lạc phải giữ.',
            { stress: -2 },
          ],
        ],
      ],
      [
        'Một câu ngắn bị hiểu khác',
        'Bạn đọc lại cách mình liên lạc. Có câu quá ngắn khiến người nhận phải tự đoán phần còn lại.',
        [
          [
            'Viết rõ phần mình định nói',
            'Thêm giao tiếp; thêm công',
            'Bạn bổ sung ngữ cảnh và không đổ hết hiểu nhầm cho người đọc.',
            { social: 3, stress: 1 },
          ],
          [
            'Đọc lại trước khi gửi',
            'Thêm tri thức; chậm một nhịp',
            'Bạn kiểm lại lời mình viết, giữ phần cần nói và bỏ một lời nóng.',
            { knowledge: 2, stress: -1 },
          ],
          [
            'Chọn cuộc nói chuyện đúng lúc',
            'Thêm kết nối; cần thu xếp',
            'Bạn hẹn một lúc phù hợp, chưa coi cuộc hẹn là đã diễn ra.',
            { social: 2, mood: 1 },
          ],
          [
            'Dừng cuộc trao đổi này',
            'Tạm dừng; giữ khoảng cách',
            'Bạn nói rõ mình dừng cuộc trao đổi, không viết thêm trong lúc bực.',
            { stress: -2, social: -1 },
          ],
        ],
      ],
      [
        'Khi cách liên lạc đổi thêm lần nữa',
        'Thói quen liên lạc đã khác. Bạn có thể học thêm, chọn bớt hoặc giữ một cách phù hợp với mình.',
        [
          [
            'Học từng thao tác cần dùng',
            'Thêm tay nghề; có lúng túng',
            'Bạn tập phần thật sự cần, không nhận rằng mình đã hiểu mọi thứ.',
            { skill: 2, knowledge: 1, stress: 1 },
          ],
          [
            'Nói rõ cách mình muốn được liên hệ',
            'Thêm giao tiếp; bớt đoán ý',
            'Bạn nói rõ cách và lúc mình có thể tiếp nhận thông tin.',
            { social: 2, stress: -1 },
          ],
          [
            'Giảm số cuộc trao đổi đang theo',
            'Giảm áp lực; bớt kết nối',
            'Bạn giữ lại những cuộc trao đổi có thể chăm tới nơi.',
            { stress: -3, social: -1 },
          ],
          [
            'Khép cách liên lạc đã thử',
            'Tạm dừng; giữ nếp riêng',
            'Bạn dừng cách thử này và giữ một cách liên lạc mình hiểu.',
            { mood: 1, stress: -2 },
          ],
        ],
      ],
      [
        'Một lời nhắn vẫn cần người đọc',
        'Bạn muốn giữ lại vài lời đã từng định nói. Cách gửi có thể đổi, điều cần nói vẫn nên rõ ràng.',
        [
          [
            'Viết một lời thật cụ thể',
            'Thêm tri thức và tinh thần',
            'Bạn viết điều mình muốn giữ, không hứa thay cho những người sẽ đọc.',
            { knowledge: 2, mood: 1 },
          ],
          [
            'Giữ một giờ liên lạc vừa sức',
            'Thêm kết nối; còn lịch phải giữ',
            'Bạn chọn một nhịp có thể giữ, chừa cả khoảng yên tĩnh cho mình.',
            { social: 2, stress: 1 },
          ],
          [
            'Lưu riêng điều chưa muốn gửi',
            'Giảm áp lực; chưa có phản hồi',
            'Bạn lưu lời nhắn cho riêng mình, không coi nó đã tới người khác.',
            { stress: -2, mood: 1 },
          ],
          [
            'Để câu chuyện liên lạc khép lại',
            'Tạm dừng; bớt lịch phải theo',
            'Bạn thôi thu xếp thêm và dành thời gian cho ngày hiện tại.',
            { stress: -3 },
          ],
        ],
      ],
    ],
    { ages: [26, 41, 61, 82], minYear: 2005 },
  ),
  ...arc(
    'shop',
    'shop-record',
    [
      [
        'Một dòng trong sổ hàng',
        'Sổ tiệm nhắc bạn nhìn lại cách ghi hàng và chi phí. Một con số gọn chưa chắc đã đầy đủ.',
        [
          [
            'Soát một loại chi phí nhỏ',
            'Thêm tri thức; thêm công',
            'Bạn lần theo một khoản chi và nhận ra chỗ mình từng ghi thiếu.',
            { knowledge: 3, stress: 1 },
          ],
          [
            'Tập cách kiểm hàng dễ đối chiếu',
            'Thêm tay nghề; cần thời gian',
            'Bạn tập cách ghi để lần sau dễ đối chiếu với sổ thật.',
            { skill: 2, knowledge: 1 },
          ],
          [
            'Nghe điều người mua cần biết',
            'Thêm giao tiếp; có áp lực',
            'Bạn ghi câu hỏi cần trả lời rõ, chưa coi lời hỏi là một đơn hàng.',
            { social: 2, stress: 1 },
          ],
          [
            'Dừng phần xem lại này',
            'Tạm dừng; giữ sức',
            'Bạn ghi chỗ đã soát và dừng phần việc này, không xóa sổ tiệm.',
            { stress: -2 },
          ],
        ],
      ],
      [
        'Một lần làm sai cần được nhớ',
        'Bạn mở lại phần ghi chép của tiệm. Có việc chưa đúng nên được giữ lại để lần sau không lặp.',
        [
          [
            'Ghi rõ nguyên nhân mình biết',
            'Thêm tri thức; phải tự xét',
            'Bạn phân biệt điều đã kiểm với phần mình còn đang đoán.',
            { knowledge: 3, stress: 1 },
          ],
          [
            'Luyện một bước kiểm trước khi hứa',
            'Thêm tay nghề; thêm công',
            'Bạn tập một bước kiểm, không nhận rằng mọi đơn sau đều sẽ tốt.',
            { skill: 3, stress: 1 },
          ],
          [
            'Sửa cách diễn đạt với người mua',
            'Thêm giao tiếp; bớt lời hứa rộng',
            'Bạn nói rõ điều tiệm làm được, không đổi khoản hoàn hay doanh thu đã ghi.',
            { social: 2, knowledge: 1 },
          ],
          [
            'Khép việc tự soát lần này',
            'Tạm dừng; giữ bản ghi cũ',
            'Bạn giữ lại lỗi đã ghi và ngừng mở rộng phần tự soát.',
            { stress: -2, mood: -1 },
          ],
        ],
      ],
      [
        'Khi việc bán hàng đã đổi',
        'Cách bán và hoàn cảnh của bạn đều có thể đổi. Sổ cũ vẫn có ích nếu đọc cùng giới hạn của thời ấy.',
        [
          [
            'Soát nguyên tắc còn dùng được',
            'Thêm tri thức; cần đối chiếu',
            'Bạn giữ phần còn đúng và đánh dấu phần không nên áp lại máy móc.',
            { knowledge: 3 },
          ],
          [
            'Thử cách trình bày rõ hơn',
            'Thêm tay nghề; tốn công',
            'Bạn thử một cách mô tả gọn, chưa đăng hay thu tiền từ việc chưa thực hiện.',
            { skill: 2, stress: 1 },
          ],
          [
            'Trao đổi một kinh nghiệm có giới hạn',
            'Thêm giao tiếp; phải nói rõ phạm vi',
            'Bạn kể một việc đã trải qua và nói rõ nó không hợp với mọi tiệm.',
            { social: 2, knowledge: 1 },
          ],
          [
            'Không theo thêm phần này',
            'Tạm dừng; bớt áp lực',
            'Bạn giữ cuốn sổ và dừng phần thử mới để dành sức cho việc đang có.',
            { stress: -3 },
          ],
        ],
      ],
      [
        'Sổ tiệm còn những dấu sửa',
        'Cuốn sổ giữ cả phần thu được lẫn phần phải trả giá. Bạn muốn nhớ chặng bán hàng ấy như thế nào?',
        [
          [
            'Giữ cả những dòng bị sửa',
            'Thêm tri thức; khép chặng',
            'Bạn giữ dấu sửa để câu chuyện không chỉ còn những khoản thuận lợi.',
            { knowledge: 2, mood: 1 },
          ],
          [
            'Kể về một việc đã làm tử tế',
            'Thêm tinh thần; không đổi sổ tiền',
            'Bạn ghi một việc nhỏ mình muốn giữ, không viết lại lời/lỗ đã có.',
            { mood: 2, social: 1 },
          ],
          [
            'Chia sẻ một bài học thực tế',
            'Thêm giao tiếp; thêm công kể',
            'Bạn kể một tình huống cụ thể và chừa quyền chọn cho người nghe.',
            { social: 3, stress: 1 },
          ],
          [
            'Cất sổ, giữ thời gian riêng',
            'Tạm dừng; giảm áp lực',
            'Bạn cất cuốn sổ, để những trang giấy giữ lại một chặng đã qua.',
            { stress: -2, mood: 1 },
          ],
        ],
      ],
    ],
    { ages: [26, 40, 55, 75] },
  ),
  ...arc(
    'stage',
    'creative-record',
    [
      [
        'Một ý tưởng còn ở bản nháp',
        'Ghi chép từ đường sáng tạo của bạn còn một ý tưởng chưa làm. Không phải ý tưởng nào cũng cần thành lịch mới.',
        [
          [
            'Thử một phần nhỏ cho riêng mình',
            'Thêm tay nghề; tốn công',
            'Bạn tập thử một phần, chưa nhận thêm hợp đồng hoặc lịch biểu diễn.',
            { skill: 2, stress: 1 },
          ],
          [
            'Viết rõ điều mình muốn giữ',
            'Thêm tri thức; bớt làm rộng',
            'Bạn ghi trọng tâm của ý tưởng để nó không chỉ là một lời hứa mơ hồ.',
            { knowledge: 2, stress: -1 },
          ],
          [
            'Nghe một cách hiểu khác',
            'Thêm giao tiếp; cần mở lòng',
            'Bạn nghe góp ý về ý tưởng, không coi lời thích thú là hợp đồng.',
            { social: 2, mood: 1 },
          ],
          [
            'Để ý tưởng được nghỉ',
            'Tạm dừng; không thêm lịch',
            'Bạn cất bản nháp và không đổi lịch nghề đang có.',
            { stress: -2 },
          ],
        ],
      ],
      [
        'Khi bản nháp cần bỏ bớt',
        'Bạn nhìn lại ý tưởng đã giữ. Phần làm được có thể nhỏ hơn phần từng hình dung.',
        [
          [
            'Giữ một đoạn có thể làm rõ',
            'Thêm tay nghề; cần tập trung',
            'Bạn bỏ phần quá rộng và tập một đoạn có chủ đích.',
            { skill: 3, stress: 1 },
          ],
          [
            'Sửa phần mình chưa hiểu',
            'Thêm tri thức; có lúng túng',
            'Bạn ghi điều còn chưa rõ, thay vì che nó bằng một lời giới thiệu hay.',
            { knowledge: 3, mood: -1 },
          ],
          [
            'Nói rõ phần công người khác đã góp',
            'Thêm giao tiếp; thêm trách nhiệm',
            'Bạn ghi công và hỏi lại phần mình được phép kể trong ý tưởng chung.',
            { social: 2, stress: 1 },
          ],
          [
            'Dừng bản thử ở đây',
            'Tạm dừng; giữ chi phí cũ',
            'Bạn dừng bản thử và ghi lại điều mình đã bỏ công học được.',
            { stress: -2, mood: 1 },
          ],
        ],
      ],
      [
        'Nhịp sáng tạo vừa với hôm nay',
        'Bạn không còn cần giữ đúng nhịp của những năm trước. Một ý tưởng vẫn có thể được chăm theo cách nhỏ hơn.',
        [
          [
            'Tập một khoảng ngắn có giới hạn',
            'Thêm tay nghề; giữ sức',
            'Bạn chọn một khoảng tập ngắn và dừng khi thấy đã đủ cho hôm nay.',
            { skill: 2, health: 1 },
          ],
          [
            'Viết điều mình còn muốn hỏi',
            'Thêm tri thức; chưa có sản phẩm mới',
            'Bạn giữ một câu hỏi cho bản nháp, chưa hứa ngày ra mắt.',
            { knowledge: 2, mood: 1 },
          ],
          [
            'Chia sẻ phần đã hiểu với nhóm nhỏ',
            'Thêm giao tiếp; có công phải làm',
            'Bạn kể một điều đã học và nghe cách người trong nhóm hiểu nó.',
            { social: 3, stress: 1 },
          ],
          [
            'Giữ một khoảng nghỉ dài hơn',
            'Tạm dừng; giảm áp lực',
            'Bạn để bản nháp nghỉ, dành một khoảng yên khỏi việc sửa và thử.',
            { stress: -3 },
          ],
        ],
      ],
      [
        'Một bản nháp không cần lời hứa',
        'Ý tưởng ấy đã theo bạn qua nhiều chặng. Bạn muốn giữ điều gì, dù nó có thành một tác phẩm hay không?',
        [
          [
            'Ghi lại phần mình đã học',
            'Thêm tri thức; khép chặng',
            'Bạn ghi điều mình đã hiểu cùng câu hỏi vẫn còn để ngỏ.',
            { knowledge: 2, mood: 1 },
          ],
          [
            'Tập một chi tiết vì niềm vui',
            'Thêm tinh thần và tay nghề',
            'Bạn tập một chi tiết vì còn thích cách nó dần rõ ra sau mỗi lần thử.',
            { mood: 2, skill: 1 },
          ],
          [
            'Cảm ơn những người từng góp ý',
            'Thêm giao tiếp; giữ ký ức',
            'Bạn ghi phần góp ý mình muốn nhớ, không hứa thay người đã từng đồng hành.',
            { social: 2, mood: 1 },
          ],
          [
            'Cất bản nháp vào chỗ riêng',
            'Tạm dừng; không nhận thêm lịch',
            'Bạn để bản nháp ở lại như một phần đời, rồi trở về ngày hiện tại.',
            { stress: -2, mood: 1 },
          ],
        ],
      ],
    ],
    { ages: [45, 55, 70, 82] },
  ),
  scene(
    'first-boundary',
    'Một lời nhờ lúc đang bận',
    'Một người quen nhờ bạn góp sức. Bạn muốn giúp, nhưng chưa biết việc sẽ kéo dài bao lâu.',
    18,
    [
      [
        'Hỏi rõ phần việc trước',
        'Thêm tri thức; có chút áp lực',
        'Bạn hỏi phạm vi trước khi nhận, để cả hai không tự đoán ý nhau.',
        { knowledge: 2, stress: 1 },
      ],
      [
        'Chỉ nhận một phần nhỏ',
        'Thêm giao tiếp; vẫn phải làm',
        'Bạn nói rõ phần có thể giúp và phần không thể hứa.',
        { social: 2, stress: 1 },
      ],
      [
        'Hẹn khi việc riêng đã xong',
        'Giữ tinh thần; ít giao lưu',
        'Bạn giữ việc đang theo và hẹn một thời điểm cụ thể hơn.',
        { mood: 2, social: -1 },
      ],
      [
        'Từ chối lần này',
        'Giảm áp lực; có chút áy náy',
        'Bạn từ chối lời nhờ mà không bịa một lời hứa cho lần sau.',
        { stress: -2, mood: -1 },
      ],
    ],
    { maxAge: 25 },
  ),
  scene(
    'rented-corner',
    'Một góc của chỗ thuê',
    'Chỗ thuê có một góc bạn muốn sắp lại. Bạn xem việc gì tự làm được trước khi tính chuyện mua thêm.',
    18,
    [
      [
        'Sắp lại những thứ đang có',
        'Thêm tay nghề; tốn sức',
        'Bạn đổi cách xếp đồ sẵn có, chưa phát sinh món mua mới.',
        { skill: 2, stress: 1 },
      ],
      [
        'Viết nhu cầu rồi để đó',
        'Thêm tri thức; chưa tiện hơn',
        'Bạn tách điều cần khỏi điều chỉ muốn rồi để danh sách chờ thêm.',
        { knowledge: 2, mood: -1 },
      ],
      [
        'Hỏi quy định của chỗ thuê',
        'Thêm giao tiếp; cần kiên nhẫn',
        'Bạn hỏi phần được phép thay đổi trước khi sửa thứ không thuộc mình.',
        { social: 2, stress: 1 },
      ],
      [
        'Giữ góc ấy thêm một thời gian',
        'Bớt áp lực; chưa giải quyết chật',
        'Bạn giữ cách sắp cũ để dành sức cho việc khác.',
        { stress: -2, skill: -1 },
      ],
    ],
    { maxAge: 25, housing: 'rent' },
  ),
  scene(
    'new-acquaintance',
    'Ngồi cạnh một người chưa quen',
    'Trong một cuộc gặp nhỏ, bạn có thể bắt chuyện hoặc giữ khoảng riêng. Không ai biết trước cuộc nói chuyện sẽ đi tới đâu.',
    18,
    [
      [
        'Hỏi về một việc họ đang làm',
        'Thêm giao tiếp; phải mở lời',
        'Bạn bắt đầu bằng một câu hỏi, không coi sự thân thiện là quan hệ thân thiết.',
        { social: 3, stress: 1 },
      ],
      [
        'Kể một điều mình đang học',
        'Thêm tri thức; có chút ngượng',
        'Bạn thử nói rõ một điều vừa hiểu và nghe cách người khác nhìn nó.',
        { knowledge: 2, mood: -1 },
      ],
      [
        'Nghe rồi chào trước khi về',
        'Thêm giao tiếp; giữ sức',
        'Bạn nghe một đoạn và chào tử tế, không cần kéo dài cuộc gặp.',
        { social: 1, health: 1 },
      ],
      [
        'Giữ khoảng riêng hôm nay',
        'Giảm áp lực; ít kết nối',
        'Bạn chọn yên lặng, để quyền làm quen cho một dịp khác.',
        { stress: -2, social: -1 },
      ],
    ],
    { maxAge: 25 },
  ),
  scene(
    'unfinished-course',
    'Bài tự học còn dang dở',
    'Bạn mở lại một bài tự học và nhận ra mình đã quên đoạn đầu. Bắt đầu lại có thể cần ít hơn một kế hoạch lớn.',
    18,
    [
      [
        'Làm lại một bài ngắn',
        'Thêm tay nghề; thêm áp lực',
        'Bạn làm một bài nhỏ và ghi phần còn vướng.',
        { skill: 3, stress: 1 },
      ],
      [
        'Viết câu hỏi trước khi đọc',
        'Thêm tri thức; chậm hơn',
        'Bạn đọc để trả lời một câu hỏi thay vì cố đọc cho hết.',
        { knowledge: 3, mood: -1 },
      ],
      [
        'Giải thích thử cho người quen',
        'Thêm giao tiếp; lộ chỗ chưa hiểu',
        'Bạn nói rõ phần mình hiểu và nhận ra một chỗ cần xem lại.',
        { social: 2, knowledge: 1 },
      ],
      [
        'Ghi chỗ dừng rồi nghỉ',
        'Giảm áp lực; chưa tiến thêm',
        'Bạn đánh dấu trang và viết một dòng để lần sau biết mình dừng ở đâu.',
        { stress: -2, skill: -1 },
      ],
    ],
    { maxAge: 25 },
  ),
  scene(
    'calendar-space',
    'Một khoảng trống trên lịch',
    'Lịch sắp tới có một khoảng trống. Bạn cân nhắc để nó trống hay dành cho một việc vẫn thường hoãn.',
    26,
    [
      [
        'Dành khoảng ấy để nghỉ',
        'Giữ sức; ít giao lưu',
        'Bạn giữ một khoảng không phải giải thích hay hoàn thành thêm việc.',
        { health: 2, social: -1 },
      ],
      [
        'Làm một việc chưa biết rõ',
        'Thêm tay nghề; thêm áp lực',
        'Bạn thử một việc nhỏ, có điểm dừng thay vì lấp kín lịch.',
        { skill: 2, stress: 1 },
      ],
      [
        'Hẹn một cuộc trò chuyện ngắn',
        'Thêm giao tiếp; cần sắp xếp',
        'Bạn hẹn trong khoảng có thể giữ, không nhận thêm cả buổi.',
        { social: 2, stress: 1 },
      ],
      [
        'Để lịch trống thêm',
        'Bớt áp lực; chưa có trải nghiệm mới',
        'Bạn chưa quyết định và không biến khoảng nghỉ thành một món nợ.',
        { stress: -2, knowledge: -1 },
      ],
    ],
    { maxAge: 40 },
  ),
  scene(
    'shared-evening',
    'Một buổi tối để hỏi nhau',
    'Hai người có một lúc nói chuyện. Những việc nhỏ trong ngày đôi khi che mất điều người kia đang nghĩ.',
    26,
    [
      [
        'Hỏi điều họ muốn được nghe',
        'Thêm giao tiếp; cần kiên nhẫn',
        'Bạn nghe hết câu trước khi kể việc của mình.',
        { social: 3, stress: 1 },
      ],
      [
        'Nói rõ một điều mình đang mệt',
        'Giảm áp lực; khó mở lời',
        'Bạn kể một giới hạn của mình mà không quyết định thay người kia.',
        { stress: -2, mood: -1 },
      ],
      [
        'Cùng làm một việc đơn giản',
        'Giữ tinh thần; không giải quyết hết',
        'Bạn dành một khoảng cùng làm việc nhỏ, chưa coi đó là lời giải cho mọi điều.',
        { mood: 2, skill: 1 },
      ],
      [
        'Xin một tối yên tĩnh',
        'Giữ sức; ít trao đổi',
        'Bạn xin khoảng riêng và nói rõ mình cần nghỉ.',
        { health: 2, social: -1 },
      ],
    ],
    { maxAge: 40, partner: true },
  ),
  scene(
    'small-comparison',
    'Nhịp đời của người khác',
    'Một cuộc trò chuyện làm bạn so đời mình với người cùng tuổi. Những phần không được kể vẫn còn ở ngoài câu chuyện.',
    26,
    [
      [
        'Ghi điều mình thật sự muốn',
        'Thêm tri thức; cần tự xét',
        'Bạn tách mong muốn của mình khỏi một mốc tuổi vừa nghe.',
        { knowledge: 2, stress: 1 },
      ],
      [
        'Hỏi cả phần họ thấy khó',
        'Thêm giao tiếp; câu chuyện nặng hơn',
        'Bạn nghe thêm việc khó, không chỉ phần kết quả dễ kể.',
        { social: 2, mood: -1 },
      ],
      [
        'Quay về một việc đang làm',
        'Thêm tay nghề; bớt phân tâm',
        'Bạn tiếp tục một việc cụ thể, không đổi cả hướng đời sau một buổi nói chuyện.',
        { skill: 2, stress: -1 },
      ],
      [
        'Tạm rời cuộc so sánh',
        'Giảm áp lực; ít giao lưu',
        'Bạn ngừng hỏi về những cột mốc hôm nay để giữ nhịp riêng.',
        { stress: -3, social: -1 },
      ],
    ],
    { maxAge: 40 },
  ),
  scene(
    'useful-draft',
    'Một hướng dẫn còn thiếu bước',
    'Bạn xem một bản hướng dẫn việc quen thuộc và nhận ra người mới có thể vấp ở chỗ mình thường bỏ qua.',
    26,
    [
      [
        'Viết thêm bước còn thiếu',
        'Thêm tri thức; tốn công',
        'Bạn viết rõ điều mình từng cho là hiển nhiên.',
        { knowledge: 3, stress: 1 },
      ],
      [
        'Làm thử theo đúng bản cũ',
        'Thêm tay nghề; thấy chỗ khó',
        'Bạn thử lại từ đầu, không dựa vào trí nhớ để bỏ bước.',
        { skill: 3, mood: -1 },
      ],
      [
        'Nhờ một người đọc thử',
        'Thêm giao tiếp; nghe góp ý',
        'Bạn hỏi họ dừng ở đâu, thay vì hỏi bản hướng dẫn có hay không.',
        { social: 2, knowledge: 1 },
      ],
      [
        'Đánh dấu để sửa sau',
        'Giảm áp lực; việc còn dang dở',
        'Bạn ghi chỗ thiếu và chưa hứa một ngày hoàn thành.',
        { stress: -2, skill: -1 },
      ],
    ],
    { maxAge: 40 },
  ),
  scene(
    'changed-routine',
    'Một thói quen không còn vừa',
    'Cách sắp ngày từng giúp bạn nay lại làm mọi việc vướng nhau. Thay đổi nhỏ cũng có thể đủ để thử.',
    41,
    [
      [
        'Đổi một bước trước',
        'Thêm tay nghề; cần theo dõi',
        'Bạn đổi một bước và ghi điều xảy ra, chưa xáo lại cả ngày.',
        { skill: 2, stress: 1 },
      ],
      [
        'Giữ giờ nghỉ rõ hơn',
        'Thêm sức; bớt việc mở rộng',
        'Bạn giữ một khoảng nghỉ và chấp nhận chưa làm thêm mọi việc.',
        { health: 2, skill: -1 },
      ],
      [
        'Hỏi cách người khác sắp lịch',
        'Thêm giao tiếp; mở góc nhìn',
        'Bạn nghe một cách khác rồi chọn phần phù hợp với mình.',
        { social: 2, knowledge: 1 },
      ],
      [
        'Chưa đổi trong tuần này',
        'Giảm áp lực; giữ vướng mắc cũ',
        'Bạn ghi lại chỗ bất tiện để xem sau, không gọi nó là đã giải quyết.',
        { stress: -2, mood: -1 },
      ],
    ],
    { maxAge: 60 },
  ),
  scene(
    'adult-child-space',
    'Khi con muốn tự quyết',
    'Một người con đã trưởng thành muốn tự chọn cách làm. Bạn có thể quan tâm mà vẫn để phần quyết định thuộc về con.',
    41,
    [
      [
        'Hỏi con muốn mình giúp gì',
        'Thêm giao tiếp; phải chờ câu trả lời',
        'Bạn hỏi trước khi góp ý và để con nói phần cần hỗ trợ.',
        { social: 3, stress: 1 },
      ],
      [
        'Kể một lần mình từng chọn sai',
        'Thêm tri thức; chạm ký ức khó',
        'Bạn kể kinh nghiệm như một khả năng để cân nhắc, không thành mệnh lệnh.',
        { knowledge: 2, mood: -1 },
      ],
      [
        'Nói rõ giới hạn có thể giúp',
        'Giảm áp lực; cần thẳng thắn',
        'Bạn nói điều mình làm được và điều không thể nhận thay.',
        { stress: -2, social: 1 },
      ],
      [
        'Lùi lại và giữ lời hỏi thăm',
        'Giữ tinh thần; ít can thiệp',
        'Bạn để con thử và giữ cách liên lạc mà hai bên đã đồng ý.',
        { mood: 2, social: -1 },
      ],
    ],
    { maxAge: 60, npc: 'adult-child' },
  ),
  scene(
    'old-friend-time',
    'Một cuộc hẹn khó khớp giờ',
    'Người quen cũ vẫn muốn gặp, nhưng lịch mỗi người đã khác. Một lời hẹn vừa sức có thể dễ giữ hơn.',
    41,
    [
      [
        'Đề nghị một cuộc gặp ngắn',
        'Thêm giao tiếp; phải sắp lịch',
        'Bạn đưa một khoảng cụ thể và để họ chọn có nhận hay không.',
        { social: 2, stress: 1 },
      ],
      [
        'Viết một lời hỏi thăm đủ ý',
        'Thêm tinh thần; ít gặp trực tiếp',
        'Bạn gửi lời hỏi thăm không kèm yêu cầu phải trả lời ngay.',
        { mood: 2, social: 1 },
      ],
      [
        'Hỏi điều họ đang quan tâm',
        'Thêm tri thức; cần lắng nghe',
        'Bạn tìm hiểu cuộc sống hiện tại thay vì chỉ kể chuyện đã qua.',
        { knowledge: 2, stress: 1 },
      ],
      [
        'Hẹn lại khi lịch bớt chật',
        'Giảm áp lực; có thể xa nhau hơn',
        'Bạn nói thật lịch của mình và không hứa một buổi chưa thể giữ.',
        { stress: -2, social: -1 },
      ],
    ],
    { maxAge: 60 },
  ),
  scene(
    'uneven-energy',
    'Một ngày sức không đều',
    'Có việc bạn làm nhẹ hơn trước, có việc lại cần nghỉ giữa chừng. Bạn cân nhắc cách chia sức cho ngày bình thường.',
    41,
    [
      [
        'Chia việc thành đoạn ngắn',
        'Giữ sức; ít làm rộng',
        'Bạn chia một việc thành các đoạn và dừng đúng lúc đã định.',
        { health: 2, skill: -1 },
      ],
      [
        'Bỏ một bước không cần thiết',
        'Thêm tay nghề; phải tự kiểm',
        'Bạn soát lại cách làm để bớt một bước, không cố làm nhanh bằng mọi giá.',
        { skill: 2, stress: 1 },
      ],
      [
        'Nói rõ lúc cần nghỉ',
        'Thêm giao tiếp; có chút ngượng',
        'Bạn nói rõ khoảng nghỉ cần có thay vì im lặng chịu hết.',
        { social: 2, mood: -1 },
      ],
      [
        'Để việc chưa gấp sang ngày khác',
        'Giảm áp lực; chưa hoàn tất',
        'Bạn giữ phần cần làm hôm nay và ghi việc có thể chờ.',
        { stress: -2, knowledge: -1 },
      ],
    ],
    { maxAge: 60 },
  ),
  scene(
    'quiet-morning',
    'Buổi sáng không cần vội',
    'Buổi sáng có một khoảng yên. Bạn muốn dùng nó cho điều gì ngoài những việc vẫn thường phải làm?',
    61,
    [
      [
        'Đi một vòng vừa sức',
        'Thêm sức; ít thời gian học',
        'Bạn chọn một vòng ngắn theo sức hôm nay, không coi đó là cách chữa bệnh.',
        { health: 2, knowledge: -1 },
      ],
      [
        'Đọc kỹ một trang',
        'Thêm tri thức; có thể lúng túng',
        'Bạn đọc chậm và ghi câu chưa hiểu thay vì buộc mình phải nhớ hết.',
        { knowledge: 2, stress: 1 },
      ],
      [
        'Chào một người gần nhà',
        'Thêm giao tiếp; cần mở lời',
        'Bạn bắt chuyện ngắn, để cuộc gặp dừng ở mức cả hai thoải mái.',
        { social: 2, stress: 1 },
      ],
      [
        'Ngồi yên với khoảng sáng',
        'Bớt áp lực; chưa thêm việc mới',
        'Bạn để buổi sáng trôi chậm mà không buộc nó phải tạo ra kết quả.',
        { stress: -2, mood: 1 },
      ],
    ],
    { maxAge: 82 },
  ),
  scene(
    'repair-memory',
    'Món đồ và cách từng sửa',
    'Một món đồ quen gợi bạn nhớ cách từng sửa nó. Hôm nay bạn có thể xem lại, nhờ góp ý hoặc để nó nguyên.',
    61,
    [
      [
        'Thử kiểm một phần an toàn',
        'Thêm tay nghề; phải tập trung',
        'Bạn chỉ kiểm phần đơn giản, chưa mua hoặc thay bộ phận mới.',
        { skill: 2, stress: 1 },
      ],
      [
        'Ghi lại cách đã làm trước đây',
        'Thêm tri thức; có chút bồi hồi',
        'Bạn ghi cả điều nhớ lẫn điều không chắc, không biến ký ức thành chỉ dẫn chắc chắn.',
        { knowledge: 2, mood: -1 },
      ],
      [
        'Hỏi một cách làm khác',
        'Thêm giao tiếp; cần lắng nghe',
        'Bạn nghe cách khác và chấp nhận có phần mình cần học lại.',
        { social: 2, knowledge: 1 },
      ],
      [
        'Giữ món đồ như hiện tại',
        'Giảm áp lực; chưa dùng thuận hơn',
        'Bạn chưa sửa và để dành sức cho việc khác.',
        { stress: -2, skill: -1 },
      ],
    ],
    { maxAge: 82 },
  ),
  scene(
    'volunteer-limit',
    'Một phần việc cho buổi chung',
    'Có lời rủ góp sức cho một buổi sinh hoạt. Bạn có thể nhận phần vừa sức mà không phải gánh toàn bộ.',
    61,
    [
      [
        'Nhận một phần có giờ kết thúc',
        'Thêm giao tiếp; thêm trách nhiệm',
        'Bạn nói rõ giờ có thể góp mặt và phần không thể nhận.',
        { social: 3, stress: 1 },
      ],
      [
        'Giúp soát phần chuẩn bị',
        'Thêm tri thức; tốn công',
        'Bạn xem lại một danh sách nhỏ, không nhận thay cả khâu tổ chức.',
        { knowledge: 2, stress: 1 },
      ],
      [
        'Chỉ dự phần gặp gỡ',
        'Giữ tinh thần; ít phụ việc',
        'Bạn nhận lời tham dự mà nói rõ hôm nay không thể nhận việc.',
        { mood: 2, skill: -1 },
      ],
      [
        'Từ chối buổi này',
        'Giữ sức; ít kết nối',
        'Bạn gửi lời chúc và giữ khoảng nghỉ cần có.',
        { health: 2, social: -1 },
      ],
    ],
    { maxAge: 82 },
  ),
  scene(
    'different-household',
    'Nếp nhà đã đổi',
    'Bạn nhìn quanh nếp sinh hoạt của mình và nhận ra có việc không cần giữ y hệt những năm trước.',
    61,
    [
      [
        'Đổi một việc cho thuận sức',
        'Thêm sức; bỏ một nếp quen',
        'Bạn thử cách làm nhẹ hơn cho một việc thường ngày.',
        { health: 2, skill: -1 },
      ],
      [
        'Giữ một nghi thức mình quý',
        'Thêm tinh thần; cần chăm chút',
        'Bạn giữ một việc nhỏ vì nó có nghĩa với mình, không vì mọi thứ phải như cũ.',
        { mood: 2, stress: 1 },
      ],
      [
        'Hỏi cách người khác thích nghi',
        'Thêm giao tiếp; thêm góc nhìn',
        'Bạn nghe kinh nghiệm mà không coi nếp nhà người khác là khuôn mẫu.',
        { social: 2, knowledge: 1 },
      ],
      [
        'Quan sát thêm trước khi đổi',
        'Giảm áp lực; chưa thuận hơn',
        'Bạn ghi một chỗ bất tiện và cho mình thêm thời gian.',
        { stress: -2, skill: -1 },
      ],
    ],
    { maxAge: 82 },
  ),
  scene(
    'return-to-notebook',
    'Một câu hỏi vẫn còn hay',
    'Một câu hỏi cũ vẫn khiến bạn tò mò. Không cần một bằng mới để dành một khoảng tìm hiểu cho nó.',
    61,
    [
      [
        'Đọc lại từ chỗ chưa rõ',
        'Thêm tri thức; thêm công',
        'Bạn tìm một lời giải thích và ghi phần chưa kiểm được.',
        { knowledge: 3, stress: 1 },
      ],
      [
        'Thử một bài nhỏ',
        'Thêm tay nghề; chấp nhận sai',
        'Bạn thử rồi sửa, không tự đặt yêu cầu phải giỏi ngay.',
        { skill: 2, mood: -1 },
      ],
      [
        'Trao đổi với người đang học',
        'Thêm giao tiếp; cần kiên nhẫn',
        'Bạn hỏi điều họ thấy khó và chia sẻ phần mình còn nhớ.',
        { social: 2, knowledge: 1 },
      ],
      [
        'Giữ câu hỏi cho ngày khác',
        'Giảm áp lực; chưa có lời giải',
        'Bạn đánh dấu câu hỏi, chưa ép mình phải giải xong hôm nay.',
        { stress: -2, skill: -1 },
      ],
    ],
    { maxAge: 82 },
  ),
  scene(
    'separate-decisions',
    'Hai người muốn hai nhịp khác nhau',
    'Bạn và người bạn đời không muốn dùng một khoảng rảnh theo cùng cách. Hai mong muốn đều cần được nói rõ.',
    61,
    [
      [
        'Hỏi phần nào có thể cùng làm',
        'Thêm giao tiếp; cần sắp xếp',
        'Bạn tìm một khoảng chung mà không yêu cầu cả ngày phải giống nhau.',
        { social: 3, stress: 1 },
      ],
      [
        'Nói điều mình muốn giữ riêng',
        'Giảm áp lực; khó mở lời',
        'Bạn nói rõ một khoảng riêng và nghe giới hạn của người kia.',
        { stress: -2, mood: -1 },
      ],
      [
        'Thử luân phiên một việc nhỏ',
        'Thêm tay nghề; cần theo dõi',
        'Bạn đề nghị một lần thử, chưa coi đó là quy định cố định.',
        { skill: 2, stress: 1 },
      ],
      [
        'Mỗi người giữ nhịp hôm nay',
        'Giữ tinh thần; ít hoạt động chung',
        'Bạn tôn trọng khoảng riêng và để lời hẹn chung cho lúc khác.',
        { mood: 2, social: -1 },
      ],
    ],
    { maxAge: 82, partner: true },
  ),
  scene(
    'beyond-eighty-two',
    'Hôm nay vẫn có điều để chọn',
    'Qua tuổi tám mươi hai, ngày của bạn vẫn có việc muốn giữ, việc muốn đổi và quyền nói chưa muốn làm.',
    82,
    [
      [
        'Giữ một việc mình tự làm được',
        'Thêm tay nghề; cần tập trung',
        'Bạn chọn phần phù hợp với sức hôm nay, không tự nhận thêm một nghĩa vụ.',
        { skill: 2, stress: 1 },
      ],
      [
        'Dành lúc nghỉ cho sở thích',
        'Thêm tinh thần; ít giao lưu',
        'Bạn giữ một niềm thích riêng mà không phải giải thích nó có ích thế nào.',
        { mood: 2, social: -1 },
      ],
      [
        'Hỏi thăm theo cách mình thích',
        'Thêm giao tiếp; cần mở lời',
        'Bạn chọn cách liên lạc thuận với mình và để người khác có thời gian đáp lại.',
        { social: 2, stress: 1 },
      ],
      [
        'Chọn một ngày ít việc',
        'Giảm áp lực; chưa mở trải nghiệm',
        'Bạn để ngày hôm nay nhẹ hơn mà không coi đó là từ bỏ mọi việc.',
        { stress: -3, skill: -1 },
      ],
    ],
  ),
  scene(
    'memoir-gap',
    'Chỗ trống trong một ký ức',
    'Bạn muốn ghi lại một chuyện nhưng có đoạn không nhớ rõ. Chỗ trống cũng có thể được giữ nguyên.',
    82,
    [
      [
        'Viết phần mình còn chắc',
        'Thêm tri thức; phải tự soát',
        'Bạn ghi điều nhớ rõ và đánh dấu phần không chắc.',
        { knowledge: 2, stress: 1 },
      ],
      [
        'Giữ cảm giác thay vì ngày tháng',
        'Thêm tinh thần; bớt chi tiết',
        'Bạn kể một cảm giác còn ở lại mà không bịa thêm mốc thời gian.',
        { mood: 2, knowledge: -1 },
      ],
      [
        'Hỏi thêm một góc nhớ khác',
        'Thêm giao tiếp; có thể khác ý',
        'Bạn hỏi và giữ cả hai cách nhớ, chưa gộp thành một sự thật duy nhất.',
        { social: 2, stress: 1 },
      ],
      [
        'Để trang ấy trắng lúc này',
        'Giảm áp lực; chuyện còn dang dở',
        'Bạn giữ chỗ trống, không ép ký ức phải thành một câu chuyện tròn.',
        { stress: -2, skill: -1 },
      ],
    ],
  ),
  scene(
    'help-with-consent',
    'Một lời đề nghị giúp đỡ',
    'Có người đề nghị giúp việc nhỏ. Bạn muốn nói rõ phần cần giúp và phần mình vẫn muốn tự làm.',
    82,
    [
      [
        'Chỉ nhờ phần đang khó',
        'Thêm giao tiếp; cần nói rõ',
        'Bạn chỉ ra phần cần hỗ trợ, giữ lại phần tự làm được.',
        { social: 2, stress: 1 },
      ],
      [
        'Tự thử một lần có giới hạn',
        'Thêm tay nghề; tốn công',
        'Bạn thử trong khoảng vừa sức rồi mới quyết định có nhờ thêm.',
        { skill: 2, stress: 1 },
      ],
      [
        'Nói cách giúp mình thấy dễ chịu',
        'Giảm áp lực; cần mở lời',
        'Bạn nói rõ cách muốn được hỗ trợ, thay vì im lặng nhận mọi cách.',
        { stress: -2, social: 1 },
      ],
      [
        'Hẹn việc ấy sang lúc khác',
        'Giữ sức; chưa xong việc',
        'Bạn để việc chưa gấp chờ và không coi lời giúp là một khoản phải nhận ngay.',
        { health: 1, mood: -1 },
      ],
    ],
  ),
  scene(
    'weather-window',
    'Cửa sổ và một ngày đổi gió',
    'Thời tiết làm kế hoạch nhỏ của bạn không còn thuận. Vẫn có nhiều cách dùng ngày mà không phải cố giữ lịch cũ.',
    82,
    [
      [
        'Đổi sang việc nhẹ trong nhà',
        'Thêm tay nghề; ít ra ngoài',
        'Bạn chọn một việc đơn giản phù hợp với hôm nay.',
        { skill: 2, social: -1 },
      ],
      [
        'Nghe hoặc đọc điều mình tò mò',
        'Thêm tri thức; cần tập trung',
        'Bạn dành một lúc tìm hiểu và nghỉ khi thấy đủ.',
        { knowledge: 2, stress: 1 },
      ],
      [
        'Hỏi thăm qua một cuộc trò chuyện',
        'Thêm giao tiếp; cần mở lời',
        'Bạn giữ một cuộc trò chuyện ngắn thay cho buổi gặp chưa thuận.',
        { social: 2, stress: 1 },
      ],
      [
        'Cho kế hoạch được nghỉ',
        'Giảm áp lực; chưa có việc mới',
        'Bạn để kế hoạch chờ một ngày khác mà không cố bù kín hôm nay.',
        { stress: -2, mood: 1 },
      ],
    ],
  ),
  scene(
    'choose-what-to-keep',
    'Một ngăn đồ để tự chọn',
    'Bạn xem lại một ngăn đồ và muốn tự quyết thứ gì còn có nghĩa. Không cần xếp hết trong một lần.',
    82,
    [
      [
        'Chọn một món và ghi chuyện của nó',
        'Thêm tri thức; cần chăm chút',
        'Bạn ghi điều món đồ gợi nhớ, không biến nó thành tài sản có giá mới.',
        { knowledge: 2, stress: 1 },
      ],
      [
        'Sắp lại để dễ tự lấy',
        'Thêm tay nghề; tốn chút sức',
        'Bạn đổi vị trí vài món sẵn có cho thuận sinh hoạt.',
        { skill: 2, stress: 1 },
      ],
      [
        'Kể vì sao muốn giữ một món',
        'Thêm giao tiếp; có chút bồi hồi',
        'Bạn nói điều món đồ có nghĩa với mình, chưa hứa cho hoặc bỏ thứ gì.',
        { social: 2, mood: -1 },
      ],
      [
        'Đóng ngăn lại, để lần sau',
        'Giảm áp lực; chưa gọn hơn',
        'Bạn dừng ở chỗ muốn dừng và giữ quyền chọn cho lần khác.',
        { stress: -2, skill: -1 },
      ],
    ],
  ),
  scene(
    'ordinary-future',
    'Một lời hẹn nhỏ cho ngày tới',
    'Bạn nghĩ về một việc muốn làm trong những ngày tới. Lời hẹn có thể nhỏ và vẫn đáng chờ.',
    82,
    [
      [
        'Giữ một khoảng cho điều muốn học',
        'Thêm tri thức; cần chuẩn bị',
        'Bạn chọn một câu hỏi nhỏ, không biến nó thành một mục tiêu phải hoàn thành.',
        { knowledge: 2, stress: 1 },
      ],
      [
        'Hẹn một cuộc trò chuyện vừa sức',
        'Thêm giao tiếp; cần sắp xếp',
        'Bạn hẹn một khoảng ngắn và để cả hai có quyền đổi lịch.',
        { social: 2, stress: 1 },
      ],
      [
        'Tiếp tục một sở thích đang có',
        'Thêm tay nghề; có chút mệt',
        'Bạn chọn phần mình thích, dừng khi thấy đủ.',
        { skill: 2, mood: -1 },
      ],
      [
        'Để ngày tới còn khoảng trống',
        'Giảm áp lực; chưa có kế hoạch mới',
        'Bạn chưa nhận thêm lời hẹn, vẫn để ngỏ điều có thể muốn làm sau.',
        { stress: -2, mood: 1 },
      ],
    ],
  ),
];
