import type { Choice, Effect, Stat } from '../domain/model';
// Each row is authored for its event. Recipes describe immediate stats, then optional effects 24 months later.
type Alternative = [string, string, string];
const rows: Record<string, Alternative[]> = {
  'first-rain': [
    [
      'Hỏi mẹ về ngày mình sinh',
      'Mẹ kể lại buổi cả nhà chờ bạn; bạn nhớ thêm một phần chuyện của mình.',
      'k4,x3',
    ],
    ['Hát theo tiếng mưa', 'Bạn gõ nhịp lên thành ghế, hát sai mấy câu mà vẫn vui.', 'm7,t2'],
    ['Vẽ cửa sổ đang mưa', 'Bạn giữ buổi chiều trong một tờ giấy để sau này xem lại.', 't4|m4'],
  ],
  'first-school': [
    [
      'Làm quen bạn ngồi cạnh',
      'Bạn hỏi tên người bên cạnh; sáng mai đã có người để chào.',
      'x6,m3',
    ],
    ['Xin cô chỉ chỗ chưa hiểu', 'Bạn tập hỏi khi chưa biết, thay vì ngồi lo.', 'k5,s-3'],
    ['Giúp xếp sách trong lớp', 'Bạn tìm được một việc vừa sức giữa căn phòng còn lạ.', 't5,h2'],
  ],
  'old-book': [
    [
      'Chép lại đoạn mình thích',
      'Bạn giữ một đoạn văn trong sổ và tự viết đoạn tiếp theo.',
      't5,k4',
    ],
    [
      'Hỏi xem chiếc lá từ đâu',
      'Câu chuyện về người từng giữ cuốn sách làm tình bạn gần hơn.',
      'x7,m3',
    ],
    ['Hẹn đổi sách vào mùa sau', 'Hai đứa giữ một lời hẹn nhỏ; sau này vẫn còn nhắc lại.', 'x3|k6'],
  ],
  'education-path': [
    [
      'Đi làm một thời gian rồi học nghề',
      'Bạn chọn tự kiếm tiền trước, vẫn giữ kế hoạch học nghề khi đủ sức.',
      't6,s3|k7',
    ],
    [
      'Học từ người quen tại địa phương',
      'Bạn theo một người thợ quan sát việc thật, chưa nhận bằng chính quy.',
      't10,k3',
    ],
    [
      'Chọn tự học với lịch học cố định',
      'Bạn giữ chi phí thấp và tự chịu trách nhiệm với từng buổi học.',
      'k9,s4',
    ],
  ],
  'first-offer': [
    [
      'Hỏi rõ ca làm và cách trả công',
      'Bạn chưa ký vội; biết hỏi đúng giúp tránh nhận lời quá sức.',
      'k6,x4',
    ],
    [
      'Nhờ bạn xem cùng điều kiện làm việc',
      'Một góc nhìn khác giúp bạn nhận ra phần mình đã bỏ sót.',
      'x8,s-3',
    ],
    [
      'Luyện tay nghề trước khi tìm chỗ khác',
      'Bạn làm thử các việc nhỏ, biết mình cần luyện thêm ở đâu.',
      't9,s3',
    ],
  ],
  'work-rhythm': [
    [
      'Bàn lại thứ tự ưu tiên',
      'Bạn xin làm phần cần trước; công việc bớt dồn vào một người.',
      'x6,s-4',
    ],
    [
      'Chỉ nhận phần đúng chuyên môn',
      'Bạn làm ít đầu việc hơn nhưng học được cách làm chắc tay.',
      't7,m2',
    ],
    [
      'Ghi khối lượng để trao đổi lần sau',
      'Cuốn ghi chép giúp bạn nói bằng công việc đã làm, thay vì than mệt.',
      'k4|s-5',
    ],
  ],
  'old-friend': [
    [
      'Hỏi điều Hòa đang lo',
      'Lần này bạn nghe nhiều hơn kể; Hòa có chỗ trút bớt chuyện nặng lòng.',
      'x8,m2',
    ],
    [
      'Cùng làm một việc từng thích',
      'Hai người sửa lại trò chơi cũ, vừa làm vừa nhắc chuyện xưa.',
      't6,m4',
    ],
    ['Hẹn gặp đều dù bận', 'Một cuộc gặp ngắn trở thành thói quen giữ liên lạc.', 'x3|m7'],
  ],
  'slow-morning': [
    ['Sắp xếp lại giờ ngủ', 'Bạn dời bớt việc tối muộn để cơ thể có giờ nghỉ đều.', 'h6,s-3'],
    ['Ghé hỏi thăm hàng xóm', 'Một buổi sáng có thêm tiếng người và một câu chuyện mới.', 'x7,m3'],
    [
      'Ghi lại điều muốn bỏ bớt',
      'Bạn nhận ra có những việc làm vì quen, không còn vì cần.',
      'k4|s-6',
    ],
  ],
  'paper-kite': [
    [
      'Nhờ Hòa giữ diều cùng mình',
      'Hai đứa chia việc; con diều chưa cao nhưng dây đã bớt rối.',
      'x7,t3',
    ],
    ['Quan sát gió rồi mới thả', 'Bạn chạy ít hơn và bắt đầu hiểu vì sao diều nghiêng.', 'k7,h2'],
    ['Giữ lại để sửa vào hôm sau', 'Bạn không bỏ con diều khi lần đầu thất bại.', 'm3|t6'],
  ],
  'shared-snack': [
    [
      'Đổi một phần bánh lấy trò chơi mới',
      'Hai đứa tự thỏa thuận, rồi mải chơi quên cả phần bánh còn lại.',
      'x6,k3',
    ],
    [
      'Mang bánh về chia với người chăm sóc',
      'Bạn dành một niềm vui nhỏ cho người ở nhà.',
      'm7,s-2',
    ],
    [
      'Rủ bạn cùng nghĩ cách làm bánh',
      'Bánh mua hết rồi, câu chuyện làm món mới vẫn còn.',
      't3|k6',
    ],
  ],
  'family-market': [
    ['Giúp mẹ sắp hàng', 'Bạn học cách bày món dễ tìm và để lối đi cho khách.', 't7,x2'],
    ['Nhớ các khoản để về ghi sổ', 'Bạn biến buổi đi chợ thành bài tập cộng trừ.', 'k8,s2'],
    [
      'Hỏi mẹ cách chọn đồ dùng lâu',
      'Những mẹo nhỏ khiến bạn bớt mua thứ mau hỏng về sau.',
      'k3|t5',
    ],
  ],
  'coast-shelter': [
    [
      'Ở trong nhà kiểm lại cửa',
      'Bạn không chạy ra gió, chỉ làm chắc những việc trong tầm tay.',
      't5,s-3',
    ],
    ['Nghe dự tính của người lớn', 'Bạn hỏi vì sao phải dọn món này trước món kia.', 'k7,x2'],
    [
      'Cất giấy để mai làm thuyền khác',
      'Bạn tiếc con thuyền cũ, rồi dành một tờ giấy cho ngày yên gió.',
      'm4|t5',
    ],
  ],
  'rice-season': [
    ['Hỏi cách nhận biết lúa chín', 'Bạn nhớ màu hạt và cách người lớn nhìn trời.', 'k8,t2'],
    [
      'Chơi vận động ở chỗ được phép',
      'Bạn không phụ ruộng hôm ấy, nhưng vẫn có buổi chiều khỏe khoắn.',
      'h7,m3',
    ],
    [
      'Ghi chuyện mùa gặt vào sổ',
      'Vài năm sau, bạn còn nhớ ai đã ngồi nghỉ dưới bóng cây.',
      'k3|m6',
    ],
  ],
  'alley-lights': [
    [
      'Rủ mọi người chơi đoán chữ',
      'Bạn chia lượt để cả người nhút nhát cũng được tham gia.',
      'x7,k3',
    ],
    [
      'Ngồi nghỉ, nghe âm thanh ngoài hẻm',
      'Không cần phải nói, bạn vẫn thấy mình thuộc về buổi tối ấy.',
      's-6,m3',
    ],
    [
      'Hẹn hôm sau cùng làm đèn giấy',
      'Buổi mất điện để lại một kế hoạch vui cho hai đứa trẻ.',
      't3|m6',
    ],
  ],
  'broken-cup': [
    [
      'Viết lời nhận lỗi để nói sau',
      'Bạn dọn an toàn rồi chuẩn bị lời giải thích, thay vì trốn mãi.',
      'k4,s3|s-6',
    ],
    ['Xin học cách giữ đồ dễ vỡ', 'Bạn tập cầm khay và đặt cốc xa mép bàn.', 't8,m2'],
    [
      'Nhờ người lớn cùng nói chuyện',
      'Bạn tìm sự giúp đỡ để nhận lỗi mà không làm ai bị thương bởi mảnh vỡ.',
      'x7,s-3',
    ],
  ],
  'school-fee': [
    [
      'Cùng gia đình hỏi nguồn sách dùng chung',
      'Bạn tìm được cách học mà không cần mua mọi thứ mới.',
      'x7,k3',
    ],
    [
      'Chia lịch dùng sách với bạn',
      'Hai đứa phải giữ lời hẹn, đổi lại ai cũng có sách học.',
      'k6,s3',
    ],
    [
      'Tập bảo quản sách đang có',
      'Bạn bọc và vá lại gáy; ít trang bị rách hơn trong năm học.',
      't5|k5',
    ],
  ],
  'school-rival': [
    [
      'Hỏi bạn về cách học khó nhất',
      'Bạn học được rằng người làm nhanh cũng từng bí bài.',
      'x6,s-3',
    ],
    ['Chọn một môn để luyện đều', 'Bạn thôi so mọi điểm số và giữ một mục tiêu vừa sức.', 't5|k7'],
    ['Xin thầy cô góp ý riêng', 'Bạn biết lỗi mình hay lặp, không chỉ biết thứ hạng.', 'k8,m2'],
  ],
  'repair-radio': [
    [
      'Quan sát rồi vẽ lại bộ phận',
      'Bạn chưa chạm vào máy, nhưng hiểu đường đi của một mối nối.',
      'k9,t2',
    ],
    ['Phụ xếp dụng cụ cho người thợ', 'Bạn nhớ tên đồ nghề nhờ đặt chúng về đúng chỗ.', 't7,x3'],
    ['Xin quay lại xem lần sửa tiếp', 'Bạn chấp nhận học chậm, mỗi lần thêm một lỗi máy.', 'k3|t7'],
  ],
  'exam-night': [
    [
      'Nhờ bạn hỏi nhanh những ý chính',
      'Bạn kiểm lại phần đã hiểu mà không học thêm cả đêm.',
      'x5,k5',
    ],
    ['Soạn đồ rồi thả lỏng', 'Bạn để sẵn bút giấy và cho mình thời gian bình tĩnh.', 's-8,h2'],
    [
      'Chia chương cuối thành ghi chú ngắn',
      'Bạn giữ vài ý thật chắc thay vì cố nhồi hết.',
      't5,k4',
    ],
  ],
  scholarship: [
    [
      'Xin thầy cô góp ý bản nháp',
      'Bạn biết cách kể hoàn cảnh cụ thể hơn trước khi nộp đợt sau.',
      'k7,x3',
    ],
    [
      'Tìm hiểu cả đường học chi phí thấp',
      'Bạn chuẩn bị thêm một phương án nếu không nhận hỗ trợ.',
      'k6,s-3',
    ],
    [
      'Lập hồ sơ từng phần từ bây giờ',
      'Lần sau mở đơn, bạn không phải tìm lại mọi giấy tờ.',
      't3|k6',
    ],
  ],
  apprentice: [
    ['Xin quan sát một ca trước', 'Bạn biết nhịp việc thật có hợp sức mình không.', 'k7,s-2'],
    [
      'Thử việc nhỏ dưới hướng dẫn',
      'Bạn không nhận khoản công, đổi lấy thời gian được sửa từng lỗi.',
      't9,h-2',
    ],
    ['Hẹn học cùng một người bạn', 'Hai người nhắc nhau giữ lịch và kể lại điều đã học.', 'x5|t5'],
  ],
  'online-course': [
    ['Lập nhóm học không mất phí', 'Bạn chia tài liệu và giải thích lại bài cho nhau.', 'x7,k5'],
    [
      'Chọn một dự án nhỏ để tự làm',
      'Bạn học ít chủ đề hơn nhưng có sản phẩm để kiểm tra.',
      't9,s3',
    ],
    [
      'Dành một buổi kiểm chứng chất lượng khóa',
      'Bạn xem bài mẫu trước, tránh mua vì lời quảng cáo.',
      'k7,s-2',
    ],
  ],
  'return-study': [
    [
      'Nhờ người có kinh nghiệm xem mục tiêu',
      'Bạn nhận ra có phần cần bằng cấp, có phần cần thực hành.',
      'x7,k4',
    ],
    [
      'Ôn kiến thức nền trước khi đăng ký',
      'Bạn dành thời gian lấp chỗ hổng, chưa nhận thêm lịch học.',
      'k8,s-2',
    ],
    [
      'Học chậm theo từng tuần',
      'Tiến độ ít hào hứng hơn, nhưng bạn vẫn quay lại bàn học.',
      'm3|k7',
    ],
  ],
  'teach-neighbor': [
    ['Hướng dẫn trẻ tự tìm lời giải', 'Bạn hỏi từng bước thay vì đọc luôn đáp án.', 'k7,t4'],
    [
      'Nhờ một người dạy giỏi cùng góp ý',
      'Bạn học thêm cách giải thích phù hợp người mới học.',
      'x8,k3',
    ],
    [
      'Hẹn buổi học chung hằng tháng',
      'Một lịch ngắn giúp việc giúp đỡ không làm bạn kiệt sức.',
      's-3|m6',
    ],
  ],
  'business-invitation': [
    [
      'Giúp thử việc trước khi góp vốn',
      'Bạn chưa bỏ tiền, nhận làm thử để biết hai người phối hợp ra sao.',
      't7,x3',
    ],
    [
      'Đề nghị ghi rõ quyền và trách nhiệm',
      'Bạn giữ vốn lúc này, học cách bàn chuyện khó mà không né tránh.',
      'k7,s3',
    ],
    [
      'Từ chối làm chung, giúp tìm người phù hợp',
      'Bạn nói rõ giới hạn và vẫn dành công sức cho bạn mình.',
      'x8,m3',
    ],
  ],
  'business-ledger': [
    [
      'Xin kiểm kê hàng còn lại trước khi bàn tiếp',
      'Bạn giữ nguyên phần vốn, kiểm rõ thứ gì đang bán được.',
      'k8,t3',
    ],
    [
      'Thống nhất dừng nhập món bán chậm',
      'Hai người thu gọn công việc để bớt mệt, chưa hứa khoản lãi mới.',
      's-6,t4',
    ],
    [
      'Tổ chức buổi bàn công khai giữa hai người',
      'Bạn nhắc lại cam kết và dành chỗ cho những điều chưa nói.',
      'x8,s2',
    ],
  ],
  'business-crossroads': [
    [
      'Khép tiệm và rút kinh nghiệm làm sổ',
      'Bạn không nhận một thành công tưởng tượng; phần học được là cách quản lý.',
      'k9,s-3',
    ],
    [
      'Chọn làm thuê để giữ thu nhập đều',
      'Bạn khép phần việc chung rồi tự tìm một nơi nhận việc.',
      't7,m4',
    ],
    [
      'Giữ liên lạc nhưng nghỉ chuyện làm ăn',
      'Hai người đồng ý một thời gian không bàn vốn và lời lỗ.',
      's-8,x4',
    ],
  ],
  'career-collapse': [
    [
      'Hỏi quyền lợi trước khi rời việc',
      'Bạn nhận đủ giấy tờ, chưa coi lời hứa giới thiệu là công việc mới.',
      'k8,s2',
    ],
    ['Lập lịch tìm việc theo tuần', 'Bạn cần một nếp sống trong lúc chưa có chỗ làm.', 't6,m4'],
    [
      'Nhờ bạn tập lại buổi phỏng vấn',
      'Bạn kể chuyện mất việc thành thật và luyện cách trình bày kỹ năng.',
      'x9,s3',
    ],
  ],
  'career-retraining': [
    [
      'Hỏi nơi tuyển dụng đang cần gì',
      'Bạn học từ yêu cầu thật trước khi chọn thêm một khóa.',
      'k8,x3',
    ],
    [
      'Luyện lại nghề cũ với mục tiêu nhỏ',
      'Bạn chưa chắc quay về được, nhưng tay nghề bớt mai một.',
      't10,s2',
    ],
    [
      'Giảm nhịp để xem lại sức khỏe',
      'Bạn dành sức cho đường dài và chấp nhận chưa có đáp án ngay.',
      'h8,s-5',
    ],
  ],
  'career-comeback': [
    [
      'Thử phỏng vấn để biết mình còn thiếu gì',
      'Bạn chưa nhận việc ngay; lần gặp này giúp tìm lỗ hổng thực tế.',
      'x8,k4',
    ],
    [
      'Tìm việc khác phù hợp sức mình',
      'Bạn khép việc tìm lại vị trí cũ, mở một hướng tìm kiếm mới.',
      'h5,s-6',
    ],
    [
      'Nhờ người giới thiệu góp ý thẳng',
      'Bạn nghe điều khó nghe và giữ lại phần có thể sửa.',
      't8,m3',
    ],
  ],
  'harvest-risk': [
    [
      'Ưu tiên thu phần dễ hỏng trước',
      'Bạn chia việc theo độ rủi ro, chấp nhận không làm tất cả cùng lúc.',
      'k6,t6',
    ],
    ['Đổi công với nhà bên', 'Bạn giúp lại một ca khác để cả hai nhà kịp việc.', 'x9,h-2'],
    [
      'Giữ phần giống và ghi lại thiệt hại',
      'Bạn nghĩ đến vụ sau, không giấu những khoản mất của vụ này.',
      'k4|t7',
    ],
  ],
  'workshop-promotion': [
    [
      'Xin chia đầu việc thành các mốc thử',
      'Bạn muốn phát hiện lỗi sớm trước khi nhận toàn bộ trách nhiệm.',
      'k7,t4',
    ],
    ['Giúp người khác đứng đầu dự án', 'Bạn giữ vai trò hỗ trợ và học cách phối hợp.', 'x8,s-3'],
    [
      'Hỏi rõ tiêu chí đánh giá trước',
      'Bạn xác định khi nào cần báo khó thay vì cố giấu chậm tiến độ.',
      'k6,s-4',
    ],
  ],
  'retail-credit': [
    [
      'Giúp khách chọn món nhỏ hơn',
      'Khách không phải vay thêm, bạn luyện cách nói điều tế nhị.',
      'x8,t3',
    ],
    [
      'Giới thiệu nguồn hỗ trợ phù hợp',
      'Bạn không tự ứng tiền nhưng dành thời gian tìm một lối khác.',
      'k6,m4',
    ],
    [
      'Đề nghị quy tắc ghi nợ rõ cho lần sau',
      'Bạn bảo vệ cả sổ hàng lẫn mối quan hệ với khách.',
      't4|s-5',
    ],
  ],
  'service-weekend': [
    [
      'Báo thời gian chờ thật cho khách',
      'Khách có quyền quyết định ở lại; bạn không hứa quá khả năng.',
      'x9,s-2',
    ],
    ['Sắp lại chỗ chuẩn bị món', 'Bạn bớt được những lượt đi vòng không cần thiết.', 't8,k3'],
    [
      'Nhờ quản lý chia thêm người',
      'Bạn chấp nhận nói mình quá tải để cả ca làm có thể tiếp tục.',
      's-6,h3',
    ],
  ],
  'office-boundary': [
    [
      'Hỏi mức khẩn cấp và hạn thực tế',
      'Bạn phân biệt việc cần ngay với việc có thể đợi đến sáng.',
      'x8,s-3',
    ],
    [
      'Ghi cách xử lý vào danh sách ngày mai',
      'Bạn không làm ngay, nhưng cũng không phải giữ việc ấy trong đầu cả tối.',
      'k5,s-5',
    ],
    [
      'Đề nghị quy ước liên lạc cho nhóm',
      'Bạn đặt vấn đề để những buổi tối sau bớt bị ngắt quãng.',
      'x3|s-7',
    ],
  ],
  'classroom-letter': [
    [
      'Mời học trò kể cả điều còn khó',
      'Bạn không chỉ nghe phần thành công, mà hỏi nơi em cần giúp.',
      'x8,k4',
    ],
    [
      'Chia niềm vui với đồng nghiệp',
      'Một lời cảm ơn giúp cả nhóm nhớ vì sao mình chọn nghề.',
      'm9,s-3',
    ],
    [
      'Giữ thư để đọc lại lúc nản',
      'Bạn dành một chỗ cho lá thư, không biến nó thành thước đo mọi học trò.',
      'm3|s-6',
    ],
  ],
  'tech-outdated': [
    [
      'Làm thử một chức năng thật nhỏ',
      'Bạn kiểm được chỗ mình chưa hiểu bằng một việc chạy được.',
      't10,s2',
    ],
    [
      'Đề nghị cả nhóm chia buổi hướng dẫn',
      'Kiến thức mới không còn phụ thuộc một người rảnh để chỉ.',
      'x8,k4',
    ],
    [
      'So sánh công cụ mới với cách cũ',
      'Bạn giữ phần kinh nghiệm hữu ích, bỏ cách đã không còn phù hợp.',
      'k9,t2',
    ],
  ],
  'freelance-scope': [
    [
      'Chốt phần cũ trước, phần mới bàn riêng',
      'Bạn giữ ranh giới công việc bằng một cuộc trao đổi rõ ràng.',
      'x7,s-4',
    ],
    [
      'Đề nghị giảm phần khác để bù vào',
      'Bạn thương lượng bằng khối lượng thật thay vì chỉ nói có hoặc không.',
      'k7,t4',
    ],
    [
      'Từ chối phần phát sinh và ghi lý do',
      'Bạn chấp nhận khách có thể không vui để giữ sức và lịch đã hẹn.',
      'h5,s-5',
    ],
  ],
  'family-call': [
    [
      'Hỏi kỹ phần nào cần sửa trước',
      'Bạn giúp chia việc vừa sức và hẹn quay lại xem tiến độ.',
      'k7,x4',
    ],
    [
      'Nhờ người thân gần nhà xem giúp',
      'Bạn không hứa khoản tiền chưa có, nhưng giữ liên lạc để cùng lo.',
      'x8,s2',
    ],
    [
      'Sắp lịch về phụ từng phần nhỏ',
      'Bạn dành thời gian đều hơn thay vì đợi một lần về thật lâu.',
      't5|m6',
    ],
  ],
  'family-followup': [
    [
      'Hẹn lịch chăm nom luân phiên',
      'Bạn chia thời gian với người thân thay vì nhận hết trách nhiệm.',
      'x8,s-3',
    ],
    [
      'Giữ chỗ ở hiện tại, hỏi thăm đều',
      'Bạn nói rõ giới hạn mà vẫn giữ một lịch liên lạc.',
      'm5,s-4',
    ],
    [
      'Cùng mẹ ghi lại việc nhà cần làm',
      'Danh sách giúp những lời nhắc bớt trở thành trách móc.',
      'k5,t4',
    ],
  ],
  'family-legacy': [
    [
      'Hỏi mẹ muốn giữ lại điều gì',
      'Bạn nghe chuyện của mẹ trước khi tự quyết thay cho cả nhà.',
      'x9,m3',
    ],
    [
      'Để chìa khóa lại cho người cần hơn',
      'Bạn nhận trách nhiệm theo cách khác, không coi vật kỷ niệm là quyền sở hữu.',
      's-6,k4',
    ],
    [
      'Kể chuyện mái nhà cho thế hệ sau',
      'Bạn giữ ký ức bằng lời kể để người chưa sống ở đó vẫn hiểu.',
      'x4|m7',
    ],
  ],
  'meet-partner': [
    [
      'Đề nghị tìm hiểu chậm hơn',
      'Bạn chưa hứa gắn bó, dành thêm thời gian để hiểu nhau.',
      'x8,s-3',
    ],
    [
      'Nói rõ điều mình chưa sẵn sàng',
      'Bạn giữ sự thành thật dù sợ làm cuộc trò chuyện bớt vui.',
      'm6,s-4',
    ],
    ['Rủ tham gia nhóm bạn chung', 'Bạn chọn một lần gặp không đặt nặng chuyện tình cảm.', 'x6,k4'],
  ],
  'welcome-child': [
    [
      'Hoãn quyết định, chuẩn bị sức và tiền',
      'Hai người thống nhất chưa đón con và sẽ nói lại khi sẵn sàng.',
      'k6,s-5',
    ],
    [
      'Bàn kỹ việc chia công chăm sóc',
      'Bạn chưa quyết có con, nhưng biết rõ hơn trách nhiệm mỗi người.',
      'x8,k4',
    ],
    [
      'Nói về mong muốn riêng trước gia đình',
      'Bạn và Minh dành quyết định cho hai người, chưa nhận một lời hứa mới.',
      'm7,s-3',
    ],
  ],
  'relationship-distance': [
    [
      'Viết điều khó nói rồi đọc cho nhau',
      'Bạn chọn từng lời để cuộc trò chuyện bớt thành cuộc cãi.',
      'x7,s-4',
    ],
    [
      'Hẹn một việc cùng làm cuối tuần',
      'Bạn không đòi mọi chuyện tốt lại ngay, bắt đầu từ thời gian chung.',
      'm5|s-5',
    ],
    [
      'Xin khoảng yên tĩnh có ngày nói lại',
      'Bạn nói rõ thời gian và quay lại cuộc trò chuyện, thay vì biến mất.',
      'h5,s-4',
    ],
  ],
  'ex-encounter': [
    [
      'Hỏi trước xem có muốn trò chuyện không',
      'Bạn để người cũ được chọn giữ khoảng cách.',
      'x8,s-3',
    ],
    [
      'Chúc bình an rồi giữ ranh giới',
      'Bạn không cần khơi lại chuyện riêng để chứng minh mình đã ổn.',
      'm7,s-4',
    ],
    [
      'Viết cảm xúc vào nhật ký sau đó',
      'Bạn giữ điều còn vướng cho mình xử lý, không gửi một lời trách muộn.',
      'k4|s-6',
    ],
  ],
  'parent-record': [
    [
      'Hỏi cha điều đã từng chọn khác',
      'Bạn hiểu thêm cả những lần cha chưa tự hào về mình.',
      'k8,x3',
    ],
    [
      'Giúp cha sắp lại vật kỷ niệm',
      'Công việc chậm rãi mang ra thêm những câu chuyện tưởng đã quên.',
      't7,m4',
    ],
    [
      'Hẹn ghi tiếp vào lần gặp sau',
      'Bạn giữ chỗ cho chuyện chưa kể hết, không ép cha nhớ mọi điều ngay.',
      'x3|m7',
    ],
  ],
  'grown-child': [
    ['Hỏi con cần sự hỗ trợ nào', 'Bạn không đoán hộ điều người con muốn nghe.', 'x9,k3'],
    [
      'Kể cả lần mình chọn sai',
      'Một chuyện thất bại giúp con thấy lựa chọn không phải bài thi có một đáp án.',
      'm7,s-3',
    ],
    [
      'Cho con thời gian rồi hẹn nói tiếp',
      'Bạn giữ cánh cửa trò chuyện mở mà không thúc một quyết định.',
      's-4|m5',
    ],
  ],
  'emergency-fund': [
    [
      'Rà lại khoản nhỏ hay quên ghi',
      'Bạn tìm thấy phần chi không lớn nhưng lặp lại nhiều lần.',
      'k8,t3',
    ],
    ['Bàn tiền với người mình tin', 'Bạn gọi tên được nỗi lo thay vì chỉ nhìn con số.', 'x7,s-4'],
    [
      'Đặt lịch xem sổ mỗi tháng',
      'Một lịch ngắn giúp kế hoạch không nằm mãi trong ngăn kéo.',
      't3|s-6',
    ],
  ],
  'debt-pressure': [
    [
      'Hỏi rõ cách tính lãi trong sổ',
      'Bạn hiểu khoản nợ tăng thế nào trước khi hứa lịch trả.',
      'k9,s2',
    ],
    [
      'Nhờ bạn xem lại kế hoạch sinh hoạt',
      'Bạn vẫn chịu trách nhiệm món nợ, có thêm người giúp tìm phần có thể giảm.',
      'x7,s-4',
    ],
    [
      'Giữ sức để không nhận việc quá sức',
      'Bạn chấp nhận trả chậm hơn nếu cái giá là một lần kiệt sức.',
      'h7,m3',
    ],
  ],
  'rent-increase': [
    [
      'Xin xem phần chi sửa thực tế',
      'Bạn đề nghị minh bạch các khoản trước khi đồng ý góp.',
      'k7,x4',
    ],
    [
      'Hỏi hàng xóm về phương án dùng chung',
      'Một cách chia việc giúp giảm bất tiện mà chưa phải chi thêm.',
      'x9,s-2',
    ],
    [
      'Ghi lại điều khoản cho kỳ thuê sau',
      'Bạn giữ bài học về những khoản phụ ngoài giá thuê.',
      'k4|s-5',
    ],
  ],
  'tempting-investment': [
    [
      'Xin tài liệu rồi tạm dừng quyết định',
      'Bạn không bỏ vốn khi người mời chỉ thúc giục thay vì giải thích.',
      'k8,s-3',
    ],
    [
      'Hỏi người độc lập về rủi ro',
      'Bạn nghe ý kiến không được trả công để thuyết phục mình.',
      'x7,k5',
    ],
    [
      'Chia sẻ dấu hiệu đáng ngờ với bạn',
      'Bạn không kết tội ai, chỉ nhắc nhau kiểm chứng trước khi chuyển tiền.',
      'x8,m3',
    ],
  ],
  'house-dream': [
    [
      'So sánh nhà riêng với chi phí chăm nhà',
      'Bạn nhìn thêm việc sửa chữa và thời gian giữ nhà.',
      'k8,t3',
    ],
    ['Hỏi người đang sống ở khu đó', 'Một căn nhà không chỉ là bốn bức tường và giá bán.', 'x8,k4'],
    [
      'Chọn cải thiện chỗ ở hiện tại',
      'Bạn bắt đầu từ cách sắp xếp để ngày về nhà dễ chịu hơn.',
      't6,m5',
    ],
  ],
  'care-cost': [
    [
      'Ghi lại nhịp mệt và thói quen',
      'Bạn dành một cuốn sổ theo dõi thay vì cố nhớ mỗi khi thấy mệt.',
      'k7,s-3',
    ],
    [
      'Nhờ người thân giúp giảm một phần việc',
      'Bạn không phải chứng minh sức mình bằng cách làm hết mọi thứ.',
      'x7,h4',
    ],
    [
      'Giữ một lịch nghỉ có người nhắc',
      'Một lời hẹn giúp bạn bớt bỏ buổi nghỉ vì công việc.',
      'h3|s-6',
    ],
  ],
  'gift-request': [
    [
      'Hỏi bạn đang cần tiền cho việc gì',
      'Bạn tìm hiểu nhu cầu trước khi nhận lời vay hay cho.',
      'k6,x6',
    ],
    [
      'Giúp chia việc thành phần có thể tự làm',
      'Bạn góp công thay vì chuyển một khoản mình chưa sẵn sàng mất.',
      't7,x3',
    ],
    [
      'Nói rõ giới hạn rồi giữ lời hỏi thăm',
      'Bạn từ chối khoản vay, không từ chối người bạn.',
      'm5,s-5',
    ],
  ],
  'retirement-plans': [
    [
      'Lập lịch gặp những người còn thân',
      'Bạn dành chỗ cho người khác trong những ngày không còn ca làm.',
      'x8,m5',
    ],
    [
      'Rà lại sức mình trước khi nhận việc mới',
      'Bạn học cách nghỉ mà không coi nghỉ là vô ích.',
      'h8,s-3',
    ],
    [
      'Ghi lại điều muốn truyền cho người trẻ',
      'Những kinh nghiệm làm việc có chỗ để được dùng tiếp.',
      'k4|m7',
    ],
  ],
  'small-repair': [
    [
      'Hỏi rõ lỗi trước khi chọn cách sửa',
      'Bạn phân biệt bộ phận hỏng với món được đề nghị thay thêm.',
      'k8,t3',
    ],
    ['Nhờ người quen xem cùng', 'Bạn bớt ngại hỏi những điều chưa hiểu về chiếc xe.', 'x7,s-3'],
    [
      'Tạm đổi cách đi lại để có thời gian tính',
      'Bạn chấp nhận bất tiện ngắn hạn, không quyết lúc đang sốt ruột.',
      'h4,s-5',
    ],
  ],
  'scarce-years': [
    ['Chia nhau học cách giữ đồ lâu', 'Bạn mang một mẹo nhỏ về nhà rồi cùng thử.', 'k6,x4'],
    [
      'Dành một buổi nghỉ cho cả nhà',
      'Một khoảng yên giúp mọi người bớt cáu với nhau vì thiếu thốn.',
      'm7,s-4',
    ],
    [
      'Ghi những món có thể tự làm',
      'Bạn chưa làm được ngay, nhưng giữ danh sách để tập dần.',
      't4|k6',
    ],
  ],
  'doi-moi': [
    [
      'Hỏi cả người đã làm ăn thất bại',
      'Bạn nghe thêm phần rủi ro thường bị bỏ khỏi câu chuyện thành công.',
      'k9,s2',
    ],
    [
      'Giúp người quen thử một việc nhỏ',
      'Bạn góp công để học, chưa bỏ khoản vốn của mình.',
      't7,x4',
    ],
    [
      'Bàn với gia đình về giới hạn có thể chịu',
      'Bạn chọn cách thử mà vẫn giữ một đường lui.',
      'k5,s-4',
    ],
  ],
  'internet-cafe': [
    [
      'Học cách kiểm nguồn trước khi tin',
      'Bạn so hai lời kể thay vì chọn điều nghe hấp dẫn nhất.',
      'k9,s2',
    ],
    [
      'Nhờ bạn chỉ cách dùng máy an toàn',
      'Bạn học giữ thông tin riêng trước khi muốn chia sẻ mọi thứ.',
      'x6,k5',
    ],
    ['Ghi câu hỏi để buổi sau tìm tiếp', 'Bạn không cần ở quán tới khi hết tò mò.', 's-3|k7'],
  ],
  'city-opportunity': [
    [
      'Hỏi kỹ chi phí trước khi quyết đi',
      'Bạn hỏi cả người phải trở về, không chỉ người đã ở lại.',
      'k8,s-3',
    ],
    [
      'Tìm việc gần nhà trước một thời hạn',
      'Bạn cho mình khoảng thử cụ thể rồi mới bàn lại chuyện đi xa.',
      't5|x5',
    ],
    [
      'Nhờ bạn giới thiệu nhiều nơi để so',
      'Bạn tìm thêm lựa chọn thay vì xem một lời rủ là cơ hội cuối.',
      'x9,k3',
    ],
  ],
  'social-feed': [
    [
      'Kiểm chứng một tin trước khi chia sẻ',
      'Bạn chậm một nhịp và tránh được việc lan một lời chưa rõ.',
      'k8,s-2',
    ],
    [
      'Hẹn nói chuyện trực tiếp với bạn',
      'Một cuộc gặp ngắn giúp câu chuyện bớt phụ thuộc màn hình.',
      'x8,h3',
    ],
    [
      'Dọn bớt những nguồn khiến mình mệt',
      'Bạn chủ động chọn điều muốn đọc vào buổi tối.',
      'm4|s-7',
    ],
  ],
  pandemic: [
    [
      'Chia việc theo sức từng người',
      'Bạn hỏi ai đang quá tải rồi điều chỉnh những việc trong nhà.',
      'x7,s-4',
    ],
    [
      'Giữ một nếp học nhỏ mỗi ngày',
      'Bạn không cố giữ nguyên năng suất giữa lúc đời sống xáo trộn.',
      'k6,m3',
    ],
    [
      'Ghi lại cách gia đình đã xoay xở',
      'Cuốn sổ giữ cả điều làm được và điều cần giúp khi biến động trở lại.',
      'k4|s-5',
    ],
  ],
  'digital-stall': [
    ['Giúp kiểm lời hứa với khách', 'Bạn đề nghị ghi rõ giờ giao và cách báo khi trễ.', 'x8,t4'],
    [
      'Tính thử một đơn sau đủ chi phí',
      'Bạn thấy doanh thu và phần thực giữ lại không phải một con số.',
      'k9,t2',
    ],
    [
      'Đề nghị thử ít đơn rồi xem lại',
      'Bạn giúp người bán giữ sức và sửa quy trình trước khi nhận nhiều.',
      's-4|t6',
    ],
  ],
  'future-neighborhood': [
    [
      'Hỏi người ít được nghe xem họ cần gì',
      'Bạn muốn không gian chung có chỗ cho cả người không quen phát biểu.',
      'x9,k4',
    ],
    [
      'Giúp lập lịch dùng nơi sinh hoạt',
      'Bạn biến một ý tưởng trong tương lai hư cấu thành việc có thể cùng làm.',
      't8,s2',
    ],
    [
      'Góp kinh nghiệm từ những khu phố cũ',
      'Bạn mang ký ức vào câu chuyện ngày mai thay vì coi mọi thứ mới đều tốt.',
      'k5|m6',
    ],
  ],
  'rooster-alarm': [
    [
      'Hỏi hàng xóm cách chăm con gà',
      'Bạn hiểu thêm lịch của chủ gà, dù gà không hứa đổi giờ.',
      'x7,k4',
    ],
    [
      'Tranh thủ đi bộ khi trời còn mát',
      'Bạn thử tận dụng tiếng gáy một hôm, không ép mình ngày nào cũng vậy.',
      'h8,m2',
    ],
    ['Viết chuyện gà vào sổ', 'Con gà vô tình có một vai trong những ký ức bạn giữ lại.', 't3|m6'],
  ],
  karaoke: [
    [
      'Nhận phần giới thiệu bài hát',
      'Bạn không hát nhưng giúp người khác có một lượt lên tiếng.',
      'x8,s-3',
    ],
    [
      'Gõ nhịp và cổ vũ người nhút nhát',
      'Bạn góp một phần vào cuộc vui bằng cách mình thoải mái hơn.',
      'm7,x4',
    ],
    [
      'Xin tập trước rồi hẹn bài sau',
      'Bạn giữ lời hẹn với micro nhưng cho mình thời gian chuẩn bị.',
      't4|x6',
    ],
  ],
  'wedding-envelope': [
    [
      'Hỏi chủ nhà còn việc gì cần phụ',
      'Bạn góp công chuẩn bị để lời chúc không chỉ nằm trong phong bì.',
      't7,h-2',
    ],
    [
      'Viết lời chúc riêng cho đôi trẻ',
      'Bạn nhắc một chuyện hai người từng kể, khiến lời chúc có người nhận cụ thể.',
      'x8,m3',
    ],
    [
      'Dành thời gian cho người đi dự một mình',
      'Bạn tìm thêm một người để cùng trò chuyện trong bữa tiệc.',
      'x6,s-4',
    ],
  ],
  'lost-slipper': [
    [
      'Hỏi cả người vừa dọn nhà',
      'Bạn dừng đoán thủ phạm và tìm người biết chiếc dép đã đi đâu.',
      'x8,k3',
    ],
    [
      'Kiểm lại lối đi cho mọi người',
      'Bạn phát hiện vài món khác đang chắn đường, tiện tay dọn lại.',
      't7,h3',
    ],
    [
      'Ghi nhớ một chỗ để dép cố định',
      'Một chuyện buồn cười để lại thói quen bớt tìm đồ.',
      't3|s-5',
    ],
  ],
  'family-computer': [
    [
      'Nhờ người thân chụp đúng thông báo lỗi',
      'Bạn tìm thông tin cụ thể trước khi đoán từ xa.',
      'k8,x3',
    ],
    [
      'Hẹn lúc rảnh để xem cùng',
      'Bạn giữ việc giúp đỡ trong khả năng, không hứa sửa giữa lúc đang bận.',
      's-5,t4',
    ],
    [
      'Viết lại cách xử lý lỗi đơn giản',
      'Bạn để người thân có thể tự thử lần sau mà không phải ngại gọi.',
      't4|k6',
    ],
  ],
  'cat-owner': [
    [
      'Hỏi quanh xóm trước khi cho ăn',
      'Bạn tìm chủ mèo, tránh biến khách lạc thành thành viên mới khi chưa rõ.',
      'x8,k3',
    ],
    [
      'Để mèo yên, giữ khoảng cách an toàn',
      'Bạn giúp bằng một góc yên tĩnh thay vì cố bế người khách khó tính.',
      's-5,m4',
    ],
    [
      'Kể lại hành trình tìm chủ cho bạn',
      'Một con mèo ngủ suốt buổi vẫn làm được vài người quen nhau.',
      'x4|m6',
    ],
  ],
  'wrong-group': [
    [
      'Để cảm xúc lắng rồi giải thích',
      'Bạn không gửi thêm một loạt tin chữa ngượng ngay lúc đang rối.',
      's-6,k3',
    ],
    [
      'Nhận lỗi riêng với người bị nhắc tới',
      'Bạn không ép cả nhóm chứng kiến một cuộc phân bua dài.',
      'x8,m2',
    ],
    [
      'Tập kiểm người nhận trước khi gửi',
      'Bạn đổi một lần ngượng thành thói quen kiểm lại tên nhóm.',
      't3|s-6',
    ],
  ],
  'forgotten-pickle': [
    [
      'Hỏi người biết làm vì sao hũ bị hỏng',
      'Bạn tìm nguyên nhân trước khi thử thêm một mẻ giống hệt.',
      'k8,t3',
    ],
    [
      'Chia lịch dọn bếp với người ở cùng',
      'Bạn không để một món bị quên trở thành chuyện trách nhau.',
      'x7,s-4',
    ],
    [
      'Làm bảng ngày cho những món đang ủ',
      'Bạn giữ lại một cách nhớ bằng mắt thay vì tin trí nhớ.',
      't5|k5',
    ],
  ],
  'ordinary-days': [
    [
      'Ghé gặp người bạn lâu chưa hỏi',
      'Bạn dành một buổi bình thường cho một người quen cũ.',
      'x7,m3',
    ],
    [
      'Ghi chuyện nhỏ vào nhật ký',
      'Những điều không thành bước ngoặt vẫn có một trang để ở lại.',
      'k3|m6',
    ],
  ],
};
const keys: Record<string, Stat> = {
  k: 'knowledge',
  t: 'skill',
  m: 'mood',
  s: 'stress',
  h: 'health',
  x: 'social',
};
function recipe(text: string): Effect[] {
  return text
    .split(',')
    .filter(Boolean)
    .map((part) => ({ kind: 'stat', stat: keys[part[0]], amount: Number(part.slice(1)) }));
}
export function additions(id: string): Choice[] {
  if (!rows[id]) throw new Error(`Missing authored alternatives: ${id}`);
  return rows[id].map(([text, outcome, effects], i) => {
    const [now, delay] = effects.split('|');
    const immediate = recipe(now);
    if (delay)
      immediate.push({
        kind: 'schedule',
        afterMonths: 24,
        label: `Nhớ lại: ${text.toLowerCase()}`,
        effects: recipe(delay),
      });
    const flag = (f: string): Effect => ({ kind: 'flag', flag: f, value: true });
    // These routes deliberately continue the arcs with distinct economic/support decisions.
    if (id === 'education-path')
      immediate.push({ kind: 'education', level: 'self', years: 0 }, flag('education-decided'));
    if (id === 'business-invitation' && i === 0)
      immediate.push(flag('business-started'), {
        kind: 'schedule',
        afterMonths: 24,
        label: 'Tính lại việc thử tiệm',
        effects: [flag('business-review')],
      });
    if (id === 'business-ledger')
      immediate.push({
        kind: 'schedule',
        afterMonths: 24,
        label: 'Chọn hướng đi sau tính sổ',
        effects: [flag('business-decision')],
      });
    if (id === 'business-crossroads') immediate.push(flag('business-complete'));
    if (id === 'career-collapse')
      immediate.push({ kind: 'career', career: null }, flag('career-failed'), {
        kind: 'schedule',
        afterMonths: 24,
        label: 'Học lại sau ca làm cuối',
        effects: [flag('career-retrain')],
      });
    if (id === 'career-retraining')
      immediate.push({
        kind: 'schedule',
        afterMonths: 24,
        label: 'Thử một cánh cửa nghề',
        effects: [flag('career-return')],
      });
    if (id === 'career-comeback') immediate.push(flag('recovery-complete'));
    if (id === 'family-call')
      immediate.push(flag('family-visited'), {
        kind: 'schedule',
        afterMonths: 24,
        label: 'Hỏi thăm mái nhà cũ',
        effects: [flag('family-check')],
      });
    if (id === 'family-followup')
      immediate.push({
        kind: 'schedule',
        afterMonths: 24,
        label: 'Nhìn lại cách chăm nom',
        effects: [flag('family-reflection')],
      });
    if (id === 'family-legacy') immediate.push(flag('family-complete'));
    if (id === 'welcome-child') immediate.push(flag('child-decision'));
    return {
      id: `path-${i + 1}`,
      text,
      hint: [
        ...recipe(now).map((e) =>
          e.kind === 'stat'
            ? `${{ knowledge: 'Tri thức', skill: 'Tay nghề', mood: 'Tinh thần', stress: 'Áp lực', health: 'Sức khỏe', social: 'Giao tiếp' }[e.stat]} ${e.amount >= 0 ? '+' : ''}${e.amount}`
            : '',
        ),
        ...(delay ? ['Có hệ quả sau 2 năm'] : []),
      ].join(' · '),
      outcome,
      effects: immediate,
    };
  });
}
