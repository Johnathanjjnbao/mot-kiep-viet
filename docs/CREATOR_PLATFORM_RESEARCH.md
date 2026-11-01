# Nguồn nền tảng cho checkpoint C

Đối chiếu ngày 01/11/2026. Đây là nghiên cứu cho phần chưa phát hành, không phải bằng chứng creator đã chơi được. Không gọi API nền tảng hoặc dùng tài khoản thật.

| Mốc có nguồn | Nguồn chính thức | Hệ quả thiết kế dự kiến |
|---|---|---|
| YouTube ra mắt toàn cầu năm2005; hoạt động chính thức tại Việt Nam từ2014 | [Google Việt Nam, tổng kết mười năm, 03/12/2024](https://vietnamese.googleblog.com/2024/12/youtube-muoi-nam-cung-viet-nam-kien-tao.html) | Mở nhánh creator YouTube từ2014 là lựa chọn bảo thủ của game, không phủ nhận người Việt từng truy cập trước đó. |
| YPP có chương trình thử nghiệm năm2007, sau đó mở rộng | [YouTube Blog, 10/12/2007](https://blog.youtube/news-and-events/partner-program-expands/) | Không suy ra mọi quốc gia đã kiếm tiền từ2007. |
| Việt Nam nằm trong danh sách YPP; số người đăng ký chưa đủ để tự được duyệt | [Danh sách quốc gia](https://support.google.com/youtube/answer/7101720?hl=en), [Điều kiện và xét duyệt](https://support.google.com/youtube/answer/72851?hl=en) | Thu nhập cần điều kiện, tương tác/chất lượng, xét duyệt và chi phí. Các ngưỡng mô phỏng phải ghi rõ là luật game; không mô tả như bản sao chính sách thật qua mọi năm. |
| musical.ly và TikTok hợp nhất thành ứng dụng toàn cầu năm2018 | [TikTok Newsroom, 01/08/2018](https://newsroom.tiktok.com/musical-ly-and/?lang=en) | Video TikTok không xuất hiện trước2018; không suy ra LIVE/quà tặng ra mắt cùng năm. |
| LIVE và các tính năng tương tác có tài liệu năm2022; tuổi LIVE đổi lên18 từ23/11/2022 | [TikTok Newsroom, 17/10/2022](https://newsroom.tiktok.com/enhancing-the-live-community-experience?lang=en) | Nếu dùng lịch năm, mở LIVE từ2023 là mốc bảo thủ thiết kế, không tuyên bố ngày ra mắt tại Việt Nam. |
| Điều kiện người theo dõi có thể khác nhau và được thử nghiệm | [TikTok Newsroom, LIVE communities](https://newsroom.tiktok.com/tiktoklive?lang=en-ZA) | Không ghi một ngưỡng follower cố định của game là quy tắc TikTok ở mọi vùng. |

Mô hình dự kiến: selector mới creator-v1 kế thừa shop và annual; enterprise-v1 đã phát hành phải tiếp tục giữ nguyên. Video và LIVE có nhịp/cost/growth khác nhau, khán giả không tự thành tiền. Vốn/chi phí/doanh thu qua transact; RNG tháng phụ thuộc seed, ID và tháng. Policy tự vận hành, tối đa bốn ID kinh doanh+kênh trong cả đời, chung120quản lý và512actions. Chỉ giữ12báo cáo tháng và tổng tích lũy; dừng chi khi thiếu tiền, không tự vay. Sau2026 là tương lai hư cấu của mô phỏng, không dự báo chính sách hay thu nhập thật.

Checkpoint C/D hiện INCOMPLETE. Chưa audience, monetization, TikTok LIVE, YouTube creator, gaming streamer, freelancer contracts hay idol playable trong bản0.3.8-business.1. Các mục trên là ranh giới cho triển khai tiếp sau khi shop qua release gates.
