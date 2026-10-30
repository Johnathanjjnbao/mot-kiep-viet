import type { ParentingStyle } from '../domain/family';
import { event, choice } from './authoring';
type Option = [string, string, ParentingStyle];
const hints: Record<ParentingStyle, string> = {
  support: 'Lắng nghe · tăng nâng đỡ',
  discipline: 'Nề nếp · có thể tăng áp lực',
  achievement: 'Thành tích · tham vọng và áp lực',
  explore: 'Tự chủ · trải nghiệm',
  protect: 'Bảo vệ · có thể giảm tự tin',
  distant: 'Ít hiện diện · con tự xoay xở',
  inconsistent: 'Thay đổi thất thường · giảm an tâm',
  balanced: 'Trao đổi · giới hạn nhất quán',
};
const scene = (id: string, title: string, text: string, options: Option[], arc: string) =>
  event(
    id,
    'relationship',
    title,
    text,
    { minAge: 18, maxAge: 81 },
    options.map(([label, outcome, style], i) =>
      choice(`p${i}`, label, hints[style], outcome, [{ kind: 'parenting', style }]),
    ),
    { version: 5, weight: 1, arc },
  );
export const parentingEvents = [
  scene(
    'family-birth',
    'Một tiếng khóc trong nhà',
    '{child} đã đến với gia đình. Những dự định từng nói giờ có giờ thức, giờ ngủ và một người bé nhỏ cần được chăm sóc.',
    [
      [
        'Chia việc chăm con và nói rõ lúc mình cần giúp',
        'Một lịch chăm sóc bắt đầu từ khả năng thật của từng người.',
        'balanced',
      ],
      [
        'Dành thời gian gần con, học tín hiệu của con',
        'Bạn bắt đầu nhận ra những điều không thể ghi hết trong một cuốn sổ.',
        'support',
      ],
      [
        'Muốn tự giữ mọi việc chăm con trong tay',
        'Bạn cố bảo vệ con, đồng thời tự nhận phần việc rất lớn.',
        'protect',
      ],
      [
        'Để người khác lo phần lớn, ít hỏi han',
        'Con vẫn được chăm sóc, nhưng thời gian gần bạn ít đi.',
        'distant',
      ],
    ],
    'care-bridges',
  ),
  scene(
    'family-sleep',
    'Đêm chưa ngủ trọn',
    '{child} đã lớn hơn một chút, nhưng một đêm thức vẫn làm cả nhà mệt. Bạn cần chọn cách đi qua những ngày này mà không coi ai là người có lỗi.',
    [
      [
        'Nhờ thay ca và nghỉ một lúc cho bình tĩnh',
        'Nhu cầu nghỉ ngơi được nói ra trước khi thành lời cáu gắt.',
        'balanced',
      ],
      [
        'Ôm con, thử hiểu điều đang làm con khó chịu',
        'Bạn dành thêm một khoảng thời gian để quan sát.',
        'support',
      ],
      [
        'Giữ giờ giấc thật chặt dù có hôm chưa phù hợp',
        'Nề nếp có ích, nhưng con vẫn có những ngày khác thường.',
        'discipline',
      ],
      [
        'Hôm dỗ dành, hôm nổi nóng vì quá mệt',
        'Nhịp chăm sóc trở nên khó đoán; gia đình có thể cần thêm hỗ trợ.',
        'inconsistent',
      ],
    ],
    'care-bridges',
  ),
  scene(
    'family-sibling',
    'Nhà có thêm một người nhỏ',
    'Từ ngày có em, {child} ít được ngồi riêng với bạn. Con vừa tò mò vừa muốn biết mình còn được chú ý như trước không.',
    [
      [
        'Giữ một khoảng thời gian riêng với con',
        'Bạn để con có chỗ nói cả những điều không đẹp đẽ về việc làm anh chị.',
        'support',
      ],
      [
        'Mời con giúp một việc nhỏ rồi để con tự chọn',
        'Việc làm anh chị không trở thành trách nhiệm thay người lớn.',
        'explore',
      ],
      [
        'Yêu cầu con phải nhường mọi thứ vì đã lớn',
        'Con học cách nhường, nhưng có thể khó nói về nhu cầu của mình.',
        'discipline',
      ],
      [
        'Lúc hứa bù, lúc quên vì việc nhà dồn lại',
        'Khoảng chờ được bù đắp cũng trở thành một trải nghiệm của con.',
        'inconsistent',
      ],
    ],
    'care-bridges',
  ),
  scene(
    'family-class',
    'Bàn tay trước cửa lớp',
    'Ở tuổi lên năm, {child} níu tay bạn trước cửa một lớp mới. Cô giáo đứng đợi, còn con nhìn những gương mặt chưa quen.',
    [
      [
        'Ngồi cùng một lúc rồi hẹn giờ quay lại',
        'Một lời hẹn cụ thể giúp con thử bước vào căn phòng.',
        'support',
      ],
      [
        'Thỏa thuận mỗi ngày thử xa tay thêm một chút',
        'Con được tập tự chủ theo từng bước mình chịu được.',
        'explore',
      ],
      [
        'Trao đổi với cô để cùng giữ một nhịp nhất quán',
        'Bạn và người dạy con cùng hiểu việc đang khó ở đâu.',
        'balanced',
      ],
      [
        'Bảo con phải tự vào ngay vì các bạn đều làm được',
        'Con có thể làm theo mà nỗi sợ vẫn chưa được hiểu.',
        'discipline',
      ],
    ],
    'growing-own-way',
  ),
  scene(
    'family-curiosity',
    'Một món đồ bị tháo tung',
    '{child} ngồi giữa những mảnh của một món đồ cũ. Con nói muốn xem bên trong, nhưng chưa biết cách lắp lại.',
    [
      [
        'Cùng tìm cách lắp và cho phép thử sai',
        'Sự tò mò có thêm chỗ để đi cùng trách nhiệm.',
        'explore',
      ],
      [
        'Đặt quy tắc về đồ được tháo và cùng dọn',
        'Bạn giữ giới hạn mà không biến câu hỏi thành lỗi.',
        'balanced',
      ],
      [
        'Cất mọi món dễ hỏng khỏi tầm tay con',
        'Đồ vật an toàn hơn; cơ hội tự thử cũng ít đi.',
        'protect',
      ],
      [
        'Mặc con tự xoay xở mà không hỏi thêm',
        'Con có thể tìm được cách riêng hoặc bỏ dở vì không biết nhờ ai.',
        'distant',
      ],
    ],
    'growing-own-way',
  ),
  scene(
    'family-friends',
    'Một cuộc cãi nhau ở sân trường',
    '{child} về nhà sau một cuộc cãi nhau. Câu chuyện con kể còn thiếu vài đoạn; bạn muốn giúp mà chưa hiểu hết điều đã xảy ra.',
    [
      [
        'Nghe con kể rồi cùng tìm thêm góc nhìn',
        'Con được bảo vệ mà vẫn có cơ hội nhận phần trách nhiệm của mình.',
        'support',
      ],
      [
        'Tập cách xin lỗi và nói rõ giới hạn',
        'Một cuộc tranh cãi trở thành kỹ năng có thể học.',
        'balanced',
      ],
      [
        'Yêu cầu con phải thắng để không bị coi thường',
        'Con có thêm quyết tâm, nhưng cũng thêm sức ép phải hơn người khác.',
        'achievement',
      ],
      [
        'Tự giải quyết hết với người lớn, không cho con tham gia',
        'Con được che chở, nhưng ít cơ hội tập lên tiếng.',
        'protect',
      ],
    ],
    'care-bridges',
  ),
  scene(
    'family-exam',
    'Điểm số không như mong đợi',
    'Ở tuổi mười hai, {child} mang về một bài kiểm tra thấp điểm. Con không giấu bài, nhưng ngồi im khi bạn mở ra.',
    [
      [
        'Hỏi con đang khó ở đâu trước khi lập kế hoạch học',
        'Bạn tìm được điều cần hỗ trợ phía sau con số.',
        'support',
      ],
      [
        'Cùng chia thời gian học và nghỉ cho tuần tới',
        'Một nếp học mới được thử, rồi có thể điều chỉnh.',
        'balanced',
      ],
      [
        'Đặt mục tiêu đứng đầu lớp và kiểm tra mỗi tối',
        'Mục tiêu có thể thúc con cố gắng, đồng thời làm việc học căng hơn.',
        'achievement',
      ],
      [
        'Phạt vì cho rằng con chưa đủ cố gắng',
        'Con nhận được một giới hạn, nhưng chưa chắc đã hiểu cách học khác đi.',
        'discipline',
      ],
    ],
    'growing-own-way',
  ),
  scene(
    'family-boundaries',
    'Cánh cửa con muốn tự đóng',
    '{child} muốn có khoảng riêng. Bạn lo mình sẽ không biết khi con gặp chuyện, còn con lo mọi điều nói ra đều bị kiểm soát.',
    [
      [
        'Thỏa thuận việc riêng và những tình huống cần báo người lớn',
        'Sự riêng tư đi cùng một cách tìm giúp đỡ đã rõ.',
        'balanced',
      ],
      [
        'Nghe con nói về điều khiến con khó mở lời',
        'Bạn chưa chắc biết thêm mọi chuyện, nhưng con biết mình có thể tìm đến.',
        'support',
      ],
      [
        'Kiểm soát mọi sinh hoạt để tránh rủi ro',
        'Bạn biết được nhiều việc hơn, trong khi con có thể dè chừng hơn.',
        'protect',
      ],
      [
        'Lúc kiểm rất chặt, lúc bỏ mặc hoàn toàn',
        'Con khó đoán đâu là giới hạn thật sự của gia đình.',
        'inconsistent',
      ],
    ],
    'care-bridges',
  ),
  scene(
    'family-creative',
    'Con đường con thích',
    'Ở tuổi mười sáu, {child} nói muốn theo một hướng sáng tạo. Gia đình hình dung một con đường khác, ổn định và quen thuộc hơn.',
    [
      [
        'Cho con một thời gian thử và cùng nhìn kết quả',
        'Bạn để sở thích được gặp việc làm cụ thể.',
        'explore',
      ],
      [
        'Bàn về học phí, nghề và phương án dự phòng',
        'Nguồn lực gia đình được đặt cạnh mong muốn của con.',
        'balanced',
      ],
      [
        'Muốn con theo hướng học thuật quen thuộc với gia đình',
        'Tham vọng được nói rõ, nhưng lựa chọn cuối của con chưa chắc giống mong đợi.',
        'achievement',
      ],
      [
        'Nói con tự lo mọi thứ nếu không nghe lời',
        'Khoảng cách có thể lớn hơn chính chuyện chọn nghề.',
        'distant',
      ],
    ],
    'growing-own-way',
  ),
  scene(
    'family-path',
    'Qua ngưỡng cửa của con',
    '{child} đã đủ mười tám tuổi. Học tiếp, học nghề hay đi làm sẽ phụ thuộc cả mong muốn của con lẫn những cơ hội thực tế của gia đình.',
    [
      [
        'Hỏi con muốn tự chọn điều gì và cần hỗ trợ ra sao',
        'Bạn có thể mở thêm cơ hội, không nhận quyền sống thay con.',
        'support',
      ],
      [
        'Cùng tìm một trải nghiệm trước khi quyết định dài hạn',
        'Con có thời gian thử một hướng đi thực tế.',
        'explore',
      ],
      [
        'Thúc con chọn hướng học thuật và bằng cấp danh tiếng',
        'Áp lực thành tích có thể tiếp tục ngay cả khi con đã trưởng thành.',
        'achievement',
      ],
      [
        'Thống nhất giới hạn hỗ trợ nhưng giữ cửa đối thoại',
        'Con biết nguồn lực mình có và điều cần tự chịu trách nhiệm.',
        'balanced',
      ],
    ],
    'growing-own-way',
  ),
  scene(
    'family-study',
    'Một lần muốn đổi hướng',
    '{child} kể về một điều không hợp trong chặng học hoặc việc đang làm. Những năm đã đi không vô ích, nhưng con không muốn tiếp tục chỉ vì sợ bắt đầu lại.',
    [
      [
        'Nghe lý do và hỏi con đã thử giải quyết thế nào',
        'Con được nhìn lại một lựa chọn bằng trải nghiệm của chính mình.',
        'support',
      ],
      [
        'Đề nghị thử một hướng mới trong giới hạn thời gian rõ',
        'Một khoảng thử có điểm hẹn để cùng xem lại.',
        'explore',
      ],
      [
        'Yêu cầu theo đến cùng vì gia đình đã đặt kỳ vọng',
        'Con có thể kiên trì hơn hoặc cảm thấy khó nói thật hơn.',
        'achievement',
      ],
      [
        'Giúp con lập kế hoạch rồi để con tự quyết',
        'Sự hỗ trợ không biến thành một lời ra lệnh.',
        'balanced',
      ],
    ],
    'growing-own-way',
  ),
  scene(
    'family-career',
    'Công việc đầu tiên con tự chọn',
    '{child} bắt đầu một hướng nghề do mình lựa chọn. Có phần giống điều bạn từng mong, có phần khác hẳn. Con muốn kể về ngày đi làm đầu tiên.',
    [
      [
        'Hỏi điều gì khiến con chọn công việc ấy',
        'Bạn tìm hiểu một cuộc đời đang dần có nhịp riêng.',
        'support',
      ],
      [
        'Cùng bàn về thu nhập, sức khỏe và học thêm',
        'Bạn giúp con nhìn một công việc bằng nhiều mặt.',
        'balanced',
      ],
      [
        'So sánh với nghề mà mình từng muốn con theo',
        'Con nghe lại một kỳ vọng cũ trong ngày muốn chia sẻ điều mới.',
        'achievement',
      ],
      [
        'Để con tự trải nghiệm, chỉ nhắc luôn có thể gọi về',
        'Khoảng tự chủ đi cùng một đường liên lạc còn mở.',
        'explore',
      ],
    ],
    'growing-own-way',
  ),
  scene(
    'family-leaving',
    'Chiếc túi con tự xếp',
    '{child} cân nhắc ra ở riêng. Câu hỏi không còn chỉ là có đủ tiền hay chưa, mà còn là cách gia đình giữ liên hệ khi không chung một mái nhà.',
    [
      [
        'Cùng tính việc sinh hoạt rồi để con chọn',
        'Bạn đưa kinh nghiệm mà không nắm hộ quyết định.',
        'balanced',
      ],
      [
        'Khuyến khích con thử tự lập và hẹn những lần về thăm',
        'Sự xa nhau có một nhịp kết nối mới.',
        'explore',
      ],
      [
        'Muốn con ở lại vì sợ con gặp khó',
        'Mong muốn bảo vệ có thể khác với điều con đang cần.',
        'protect',
      ],
      [
        'Ít quan tâm vì nghĩ con lớn rồi thì tự lo',
        'Con tự quyết nhiều hơn, đồng thời có thể ít tìm về hơn.',
        'distant',
      ],
    ],
    'care-bridges',
  ),
  scene(
    'family-adult-love',
    'Người con muốn giới thiệu',
    '{child} kể về một mối quan hệ quan trọng của mình. Con không xin bạn chọn hộ, nhưng mong người ấy được gặp gia đình với sự tôn trọng.',
    [
      [
        'Hỏi con muốn buổi gặp diễn ra thế nào',
        'Bạn bước vào chuyện của con bằng một lời mời.',
        'support',
      ],
      [
        'Giữ sự tò mò và những giới hạn lịch sự',
        'Gia đình có thể cần thời gian để hiểu nhau.',
        'balanced',
      ],
      [
        'Muốn chọn thay vì tin mình biết người phù hợp hơn',
        'Con có thể bảo vệ lựa chọn riêng bằng một khoảng cách lớn hơn.',
        'protect',
      ],
      [
        'Lúc đồng ý, lúc đổi ý khiến con không biết dựa vào đâu',
        'Sự bất nhất làm cuộc giới thiệu khó hơn.',
        'inconsistent',
      ],
    ],
    'care-bridges',
  ),
  scene(
    'family-help',
    'Lúc con cần một chỗ dựa',
    '{child} đang gặp một khó khăn trong đời sống riêng. Con gọi về không chỉ để xin một lời giải, mà để biết gia đình còn có thể nghe mình không.',
    [
      [
        'Nghe và hỏi điều con cần giúp cụ thể',
        'Bạn không phải giải quyết thay mọi việc để có thể hiện diện.',
        'support',
      ],
      [
        'Thống nhất phần có thể giúp và phần con tự xử lý',
        'Một lời hỗ trợ được đặt trong khả năng thật của cả hai.',
        'balanced',
      ],
      [
        'Yêu cầu con làm đúng ý mình mới được giúp',
        'Sự hỗ trợ đi kèm điều kiện có thể khiến con cân nhắc lại việc tìm về.',
        'discipline',
      ],
      [
        'Tránh nghe vì nghĩ đó là việc con phải tự gánh',
        'Con vẫn sẽ đi tiếp, nhưng đường tìm đến bạn có thể hẹp lại.',
        'distant',
      ],
    ],
    'care-bridges',
  ),
  scene(
    'family-legacy-memory',
    'Điều con còn nhớ',
    '{child} đã đi qua nhiều lựa chọn riêng. Trong một lần chuyện trò, con nhắc một việc thời nhỏ mà bạn tưởng mình đã quên.',
    [
      [
        'Hỏi con nhớ việc ấy theo cách nào',
        'Bạn được nghe tuổi thơ từ phía người đã sống trong nó.',
        'support',
      ],
      [
        'Nhận phần mình chưa làm được và nói điều muốn sửa',
        'Một quan hệ trưởng thành vẫn còn có thể thay đổi.',
        'balanced',
      ],
      [
        'Kể những kỳ vọng mình vẫn còn giữ',
        'Con hiểu thêm về bạn, dù chưa chắc sẽ sống theo kỳ vọng ấy.',
        'achievement',
      ],
      [
        'Để con giữ cách nhớ riêng, không cố giành lời cuối',
        'Hai ký ức có thể cùng tồn tại trong một gia đình.',
        'explore',
      ],
    ],
    'care-bridges',
  ),
];
