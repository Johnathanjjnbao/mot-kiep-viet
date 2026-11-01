import type { EventDefinition, GameRun } from '../domain/model';
import type { ProgramId, StudyRecord } from '../domain/academics';
import { PROGRAMS, programById } from './programs';
import { event, choice } from './authoring';

type Stage = [title: string, prompt: string, steady: string, practice: string];
// One authored situation per normal year (six for health). IDs identify stories, not instances.
export const academicStages: Record<ProgramId, Stage[]> = {
  it: [
    [
      'Chương trình đầu tiên',
      'Bài tập chạy được với ví dụ mẫu nhưng hỏng khi nhập dữ liệu trống. Bạn cần hiểu điều chương trình đang giả định.',
      'Lần theo từng bước xử lý dữ liệu',
      'Viết bộ kiểm thử cùng bạn học',
    ],
    [
      'Các phần không ghép được',
      'Mỗi thành viên viết xong phần của mình, nhưng khi ghép lại, dữ liệu đi qua các phần có định dạng khác nhau.',
      'Thống nhất giao diện rồi sửa từng phần',
      'Tạo bản chạy chung để phát hiện lỗi sớm',
    ],
    [
      'Một lỗi ở nơi thực tập',
      'Người hướng dẫn giao một lỗi có thể tái hiện trên dữ liệu giả. Bạn phải tìm nguyên nhân mà không đụng vào hệ thống thật.',
      'Đọc luồng xử lý và ghi giả thuyết',
      'Dựng môi trường thử rồi xin người hướng dẫn duyệt',
    ],
    [
      'Sản phẩm trước hội đồng',
      'Đề tài cuối khóa có nhiều chức năng nhưng người thử còn lúng túng. Thời gian còn lại buộc bạn xác định phần cốt lõi.',
      'Rà yêu cầu và hoàn thiện tài liệu',
      'Thử với người dùng rồi sửa luồng quan trọng',
    ],
  ],
  engineering: [
    [
      'Một phép đo lệch',
      'Kết quả đo trong xưởng không khớp bài tính. Bạn cần phân biệt sai số dụng cụ với sai ở cách dựng mô hình.',
      'Kiểm tra đơn vị và tính lại sai số',
      'Lặp phép đo dưới hướng dẫn',
    ],
    [
      'Bản vẽ và vật liệu',
      'Thiết kế của nhóm khó gia công bằng vật liệu được giao. Đổi vật liệu hay đổi hình dạng đều tác động đến kết quả.',
      'Tính lại giới hạn của thiết kế',
      'Làm mô hình nhỏ để so sánh hai phương án',
    ],
    [
      'Dừng thiết bị thử',
      'Thiết bị trong buổi thực hành rung khác thường. Người phụ trách cho phép dừng để nhóm xem lại lắp đặt.',
      'Đọc quy trình kiểm tra trước khi chạy lại',
      'Cùng người phụ trách tìm điểm lắp sai',
    ],
    [
      'Đồ án chịu phản biện',
      'Hội đồng hỏi thiết kế sẽ ra sao khi điều kiện sử dụng thay đổi. Bản vẽ đẹp chưa đủ trả lời.',
      'Bổ sung tính toán cho điều kiện biên',
      'Dựng mẫu thử giới hạn và ghi lại kết quả',
    ],
  ],
  health: [
    [
      'Kiến thức nền còn hổng',
      'Bạn thuộc tên gọi nhưng chưa giải thích được mối liên hệ trong bài học cơ sở. Nhóm học nhỏ đề nghị cùng rà lại.',
      'Vẽ lại mối liên hệ từ tài liệu học',
      'Cùng nhóm giải thích chéo bằng mô hình',
    ],
    [
      'Thao tác trên mô hình',
      'Một bước trong buổi thực hành mô phỏng bị bỏ sót. Người hướng dẫn yêu cầu dừng, xem lại và làm lại từ đầu.',
      'Ôn trình tự và điểm cần kiểm tra',
      'Tập lại dưới giám sát rồi nhận góp ý',
    ],
    [
      'Ghi chép khi quan sát',
      'Trong buổi quan sát có giám sát, bạn phải phân biệt điều trực tiếp thấy với điều mới suy đoán. Bạn chưa có quyền tự xử trí.',
      'Sắp lại ghi chép theo nguồn thông tin',
      'Xin người hướng dẫn rà từng nhận định',
    ],
    [
      'Thông tin cần được giữ kín',
      'Một bài thảo luận dùng tình huống thực tập có chi tiết có thể nhận ra một người. Nhóm phải sửa trước khi trình bày.',
      'Loại chi tiết nhận diện và đọc quy định',
      'Đổi sang tình huống mô phỏng có giám sát',
    ],
    [
      'Một ca mô phỏng khó',
      'Buổi đánh giá đặt nhiều yêu cầu cùng lúc. Nhóm cần phân công, kiểm tra chéo và biết lúc nào phải gọi người hướng dẫn.',
      'Ôn cách nhận diện giới hạn của bản thân',
      'Tập phối hợp dưới giám sát',
    ],
    [
      'Đánh giá trước tốt nghiệp',
      'Bạn chuẩn bị phần tổng hợp kiến thức và thực hành có giám sát. Tốt nghiệp vẫn không tự cấp giấy phép hành nghề.',
      'Rà hồ sơ năng lực và nội dung còn yếu',
      'Diễn tập đánh giá rồi nhận phản hồi',
    ],
  ],
  business: [
    [
      'Khách hàng nào được hỏi',
      'Nhóm chỉ hỏi những người quen và nhận toàn lời khen. Bài nghiên cứu cần chỉ ra ai chưa có mặt trong mẫu.',
      'Đọc lại giới hạn của mẫu khảo sát',
      'Phỏng vấn thêm nhóm khách khác',
    ],
    [
      'Gian hàng mô phỏng',
      'Trong bài tập nhóm, lượng hàng dự kiến bán cao hơn khả năng phục vụ. Nhóm phải sắp lại quy trình trước buổi chạy thử.',
      'Lập kế hoạch nguồn lực thực tế',
      'Chạy thử quy trình với quy mô nhỏ',
    ],
    [
      'Điều thấy ở nơi thực tập',
      'Quy trình thực tế có một khâu chờ lâu mà tài liệu không mô tả. Bạn cần hiểu nguyên nhân trước khi đề nghị thay đổi.',
      'Vẽ lại luồng công việc và thời gian chờ',
      'Xin phép theo dõi thử một cải tiến nhỏ',
    ],
    [
      'Kế hoạch khi nhu cầu giảm',
      'Đề án tốt nghiệp phải sống được cả khi doanh số giả định thấp hơn mong muốn. Bạn phải giải thích phần nào cần thu hẹp.',
      'Tính lại các kịch bản chi phí',
      'Bảo vệ một phương án thử nghiệm có giới hạn',
    ],
  ],
  accounting: [
    [
      'Hai sổ chưa khớp',
      'Bộ chứng từ bài tập có một khoản được ghi hai lần. Số dư trông hợp lý nếu chỉ nhìn tổng cuối.',
      'Đối chiếu từng chứng từ theo ngày',
      'Lập bảng kiểm để nhóm tìm lỗi chéo',
    ],
    [
      'Một chỗ thiếu kiểm soát',
      'Cùng một người trong tình huống mô phỏng vừa phê duyệt vừa ghi sổ. Nhóm phải giải thích rủi ro mà không quy kết sai phạm.',
      'Đọc lại nguyên tắc phân tách trách nhiệm',
      'Thiết kế quy trình kiểm tra cho tình huống',
    ],
    [
      'Bằng chứng ở kỳ thực tập',
      'Một con số trong bản nháp chưa có tài liệu hỗ trợ. Người hướng dẫn yêu cầu ghi rõ phần chưa kiểm chứng.',
      'Đối chiếu nguồn và ghi giới hạn',
      'Lập danh sách bằng chứng còn thiếu',
    ],
    [
      'Áp lực làm đẹp báo cáo',
      'Bài đánh giá đặt bạn trước đề nghị bỏ qua một sai lệch nhỏ để báo cáo dễ nhìn. Bạn cần nêu lý do và cách xử lý.',
      'Trình bày sai lệch cùng căn cứ',
      'Đề xuất bước rà soát và lưu dấu kiểm tra',
    ],
  ],
  finance: [
    [
      'Dòng tiền và con số lợi nhuận',
      'Bài phân tích có lợi nhuận trên giấy nhưng thiếu tiền cho kỳ thanh toán. Hai chỉ số đang kể hai câu chuyện khác nhau.',
      'Lập lại bảng dòng tiền',
      'Thử giải thích tình huống bằng nhiều thời điểm',
    ],
    [
      'Một giả định quá lạc quan',
      'Mô hình của nhóm cho kết quả tốt chỉ khi giá đầu vào không tăng. Bạn cần cho thấy điều xảy ra khi giả định ấy đổi.',
      'Kiểm tra độ nhạy từng giả định',
      'Xây hai kịch bản rủi ro để phản biện',
    ],
    [
      'Bản phân tích tại nơi thực tập',
      'Nguồn số liệu có ngày cập nhật khác nhau. Ghép chúng ngay sẽ tạo một kết luận thiếu căn cứ.',
      'Chuẩn hóa mốc thời gian và ghi nguồn',
      'Xin người hướng dẫn rà bản phân tích thử',
    ],
    [
      'Danh mục trong tình huống giả định',
      'Đề án cuối yêu cầu cân bằng nhu cầu dùng tiền sớm với rủi ro dài hạn. Không có phương án nào bảo đảm lợi nhuận.',
      'Nêu rõ giới hạn và nhu cầu thanh khoản',
      'So sánh phương án bằng kịch bản thua lỗ',
    ],
  ],
  law: [
    [
      'Lập luận cần một căn cứ',
      'Bạn có trực giác về kết luận nhưng tài liệu bài tập chưa đủ để chứng minh. Giảng viên yêu cầu tách nhận định và căn cứ.',
      'Đọc lại văn bản phù hợp thời điểm',
      'Lập sơ đồ lập luận và điểm chưa rõ',
    ],
    [
      'Hai cách đọc một hồ sơ',
      'Các lời kể trong hồ sơ giả định khác nhau ở một chi tiết quan trọng. Nhóm cần xác định điều nào là sự kiện đã được chứng minh.',
      'Phân loại chứng cứ và giả định',
      'Thử phản biện từ phía còn lại',
    ],
    [
      'Phiên tranh biện giả định',
      'Một câu hỏi bất ngờ làm nhóm lệch khỏi lập luận đã chuẩn bị. Bạn có thể xin làm rõ thay vì vội khẳng định.',
      'Chuẩn bị câu trả lời dựa trên hồ sơ',
      'Tập phiên tranh biện với phản hồi',
    ],
    [
      'Giới hạn của lời tư vấn',
      'Bài tốt nghiệp yêu cầu giải thích khi nào thông tin chưa đủ và khi nào cần người có thẩm quyền chuyên môn. Văn bằng không phải giấy phép hành nghề.',
      'Ghi rõ phạm vi và nguồn căn cứ',
      'Bảo vệ cách xử lý một tình huống đạo đức',
    ],
  ],
  education: [
    [
      'Một cách học không hợp tất cả',
      'Hai người học trong bài tập hiểu cùng nội dung theo hai cách khác nhau. Bạn phải điều chỉnh cách giải thích.',
      'So sánh các bước hình thành kiến thức',
      'Thiết kế hai hoạt động học khác nhau',
    ],
    [
      'Buổi quan sát lớp',
      'Trong giờ quan sát, một số học sinh im lặng nhưng bài làm cho thấy họ vẫn theo kịp. Bạn cần ghi nhận thay vì phán đoán từ vẻ ngoài.',
      'Rà tiêu chí quan sát và ghi chép',
      'Thiết kế cách kiểm tra mức hiểu nhẹ nhàng',
    ],
    [
      'Tiết dạy thử bị chậm',
      'Hoạt động đầu kéo dài khiến phần cuối thiếu thời gian. Người hướng dẫn đề nghị giữ mục tiêu quan trọng nhất.',
      'Rút gọn giáo án theo mục tiêu',
      'Dạy thử lại và nhận phản hồi',
    ],
    [
      'Đánh giá học sinh công bằng',
      'Bài tổng kết có học sinh tiến bộ rõ nhưng điểm cuối chưa cao. Bạn phải phân biệt đánh giá kết quả với lời nhận xét quá trình.',
      'Viết tiêu chí và minh chứng rõ ràng',
      'Bảo vệ phương án phản hồi trước nhóm',
    ],
  ],
  korean: [
    [
      'Nghe được âm, chưa hiểu ý',
      'Bạn nghe ra từng từ nhưng chưa nắm sắc thái trong đoạn hội thoại học tập. Việc đoán quá nhanh dẫn đến hiểu lệch.',
      'Nghe lại theo từng cụm ý',
      'Đóng vai hội thoại và xin sửa phát âm',
    ],
    [
      'Mốc năng lực mô phỏng',
      'Bài đánh giá ngôn ngữ trong trường có phần đọc tốt hơn phần viết. Đây là bài mô phỏng, không cấp chứng chỉ TOPIK thật.',
      'Lập kế hoạch luyện phần còn yếu',
      'Làm bài thử rồi nhận góp ý',
    ],
    [
      'Bản dịch thiếu ngữ cảnh',
      'Cùng một câu trong hai bối cảnh cần cách diễn đạt khác nhau. Nhóm dịch phải hỏi thêm mục đích sử dụng.',
      'Tra cứu cách dùng và ghi chú lựa chọn',
      'Dịch thử hai phiên bản cho hai người đọc',
    ],
    [
      'Hồ sơ ngôn ngữ trước khi ra trường',
      'Bạn chọn sản phẩm thể hiện khả năng ngôn ngữ cho một vị trí giả định. Bản dịch đẹp cần đi cùng giải thích quyết định dịch.',
      'Rà hồ sơ và sửa lỗi nhất quán',
      'Trình bày sản phẩm rồi nhận phản biện',
    ],
  ],
  english: [
    [
      'Ý chính sau những từ mới',
      'Bạn dừng ở từng từ lạ nên mất mạch một bài đọc. Giảng viên đề nghị thử xác định ý chính trước.',
      'Đọc lại theo cấu trúc lập luận',
      'Tóm tắt rồi trao đổi với nhóm',
    ],
    [
      'Một thông điệp, hai người đọc',
      'Bản dịch sát chữ nhưng người nhận không hiểu việc cần làm. Bài tập yêu cầu giữ ý và điều chỉnh cách diễn đạt.',
      'So sánh mục đích của hai văn bản',
      'Thử bản dịch với người đọc khác',
    ],
    [
      'Giao tiếp tại kỳ thực tập',
      'Một cuộc trao đổi bị hiểu nhầm về thời hạn. Bạn cần xác nhận lại thay vì chỉ nói lưu loát.',
      'Ghi lại điểm cần làm rõ',
      'Diễn tập trao đổi và nhận góp ý',
    ],
    [
      'Sản phẩm tổng hợp cuối khóa',
      'Bạn phải chọn bằng chứng cho năng lực đọc, viết và giao tiếp. Một sản phẩm đơn lẻ không thể hiện hết tiến bộ.',
      'Rà và giải thích quá trình sửa bài',
      'Trình bày hồ sơ năng lực trước nhóm',
    ],
  ],
  design: [
    [
      'Bố cục có chỗ nghẽn',
      'Người xem không tìm được thông tin chính trong bài thiết kế. Bạn cần quan sát cách họ nhìn thay vì chỉ sửa màu.',
      'Phân tích thứ bậc thông tin',
      'Làm ba bản phác để thử cách nhìn',
    ],
    [
      'Góp ý trái chiều',
      'Hai người nhận xét muốn hai hướng khác nhau. Bạn cần trở lại mục tiêu của bài thay vì sửa theo mọi ý kiến.',
      'Phân loại góp ý theo mục tiêu',
      'Thử hai phương án rồi giải thích lựa chọn',
    ],
    [
      'Giới hạn từ bên đặt bài',
      'Bài mô phỏng có thời hạn và vật liệu giới hạn. Một ý tưởng đẹp chưa chắc sản xuất được trong điều kiện ấy.',
      'Rà yêu cầu và cắt phần ít cần thiết',
      'Làm mẫu thử trong đúng giới hạn',
    ],
    [
      'Buổi bảo vệ hồ sơ sáng tạo',
      'Hồ sơ cuối khóa cần cho thấy cả thử nghiệm thất bại và cách bạn sửa. Bạn chọn những gì thể hiện quá trình rõ nhất.',
      'Viết lại câu chuyện của từng sản phẩm',
      'Dựng buổi trình bày thử và nhận phản hồi',
    ],
  ],
  communications: [
    [
      'Người đọc hiểu điều khác',
      'Mẩu nội dung đầu tiên làm nhóm người xem hiểu lệch ý chính. Bạn cần hỏi họ đã dựa vào chi tiết nào.',
      'Đọc lại thông điệp và mục tiêu',
      'Thử nội dung với một nhóm nhỏ',
    ],
    [
      'Kế hoạch thiếu người thực hiện',
      'Lịch chiến dịch bài tập có nhiều đầu việc cùng đến hạn. Nhóm phải chọn phần nào thật sự cần và ai chịu trách nhiệm.',
      'Sắp lại ưu tiên và phân công',
      'Chạy thử một phần chiến dịch',
    ],
    [
      'Số liệu chưa kể hết',
      'Bài thực tập có nhiều lượt xem nhưng ít phản hồi đúng mục tiêu. Bạn cần phân biệt sự chú ý với kết quả mong muốn.',
      'Rà câu hỏi nghiên cứu và nguồn số liệu',
      'Phỏng vấn thêm nhóm công chúng liên quan',
    ],
    [
      'Phản hồi khi có sai sót',
      'Tình huống tốt nghiệp có một thông tin chưa chính xác đã được phát đi. Nhóm phải chuẩn bị cách sửa và giải thích trách nhiệm.',
      'Kiểm tra sự thật và ghi phần chưa biết',
      'Diễn tập phản hồi cùng quy trình đính chính',
    ],
  ],
};

export function stageTemplate(r: GameRun, s: StudyRecord): EventDefinition {
  const p = programById(s.programId)!;
  const year = Math.min(s.completedYears, p.years - 1);
  const [title, prompt, steady, practice] = academicStages[p.id][year];
  const id = `annual-edu-${p.id}-${year + 1}`;
  const previous = s.results.at(-1);
  const retry = previous && !previous.passed && previous.templateId === id;
  const sceneId = id + (retry ? '-remediation' : '');
  const situation = retry
    ? `Lần đánh giá trước chưa đạt (${previous.score} điểm mô phỏng). Bạn cùng người hướng dẫn xem lại phần còn thiếu của “${title.toLowerCase()}”, chọn cách học lại thay vì lặp nguyên bài cũ.`
    : prompt;
  const context = `Đã đạt ${s.completedYears}/${p.years} năm; ${s.internship ? 'đã ghi nhận thực tập' : 'chưa ghi nhận thực tập'}. Áp lực hiện tại ${Math.round(r.player.stats.stress)}/100.`;
  return event(
    sceneId,
    'education',
    `${retry ? 'Học lại' : `Năm ${year + 1}`}: ${title}`,
    `${situation}\n\n${context}`,
    { minAge: 18, minYear: p.from },
    [
      choice(
        'steady',
        retry ? 'Ôn lại phần chưa đạt theo góp ý' : steady,
        'Dự đánh giá; củng cố kiến thức',
        'Bạn chuẩn bị phần đánh giá bằng những gì đã học.',
        [{ kind: 'academic', method: 'steady' }],
      ),
      choice(
        'project',
        retry ? 'Làm bài thực hành mới có hướng dẫn' : practice,
        'Thực hành, tăng áp lực; có thể ghi thực tập ở năm sau',
        'Bạn dành thêm thời gian cho thực hành và phản hồi.',
        [{ kind: 'academic', method: 'project' }],
      ),
      choice(
        'work',
        'Làm thêm ngoài giờ, giảm thời gian ôn',
        'Thu nhập36 đSM; khó đạt hơn, áp lực tăng',
        'Bạn chia thời gian giữa việc làm thêm và đánh giá.',
        [{ kind: 'academic', method: 'work' }],
      ),
      choice(
        'rest',
        'Nghỉ ngơi và học chậm thêm một năm',
        'Vẫn ghi danh; chưa có tín chỉ năm này, có học phí năm tiếp',
        'Bạn chọn hồi phục trong khi tiếp tục ghi danh.',
        [{ kind: 'academic', method: 'rest' }],
      ),
      choice(
        'pause',
        'Bảo lưu học tập, chuẩn bị trở lại sau',
        'Dừng tiến độ và học phí mới; có thể trở lại sau6 tháng',
        'Bạn tạm dừng chương trình, giữ phần đã hoàn thành.',
        [{ kind: 'academic', method: 'pause' }],
      ),
    ],
    { version: 10 },
  );
}

// Used by content validation without manufacturing enrolled state or claiming generated IDs authored.
export const authoredAcademicStageCount = PROGRAMS.reduce(
  (n, p) => n + academicStages[p.id].length,
  0,
);
