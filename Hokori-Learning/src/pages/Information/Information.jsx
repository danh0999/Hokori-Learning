import React from "react";
import styles from "./styles.module.scss";
import FaqItem from "../../pages/Home/components/Faqs/FaqsItem.jsx";
import { Button } from "../../components/Button/Button.jsx";

const Information = () => {
  const { faqsContainer, faqsTitle, faqItemContainer, div, p, btn } = styles;

  return (
    <div className={faqsContainer}>
      <div className={div}>
        <div className={faqsTitle}>Câu hỏi thường gặp cho học viên</div>
        <p className={p}>
          Giải đáp những thắc mắc phổ biến của người học về cách tham gia, học
          tập và sử dụng các tính năng của Hokori.
        </p>
      </div>

      {/* === 1. Bắt đầu học === */}
      <div className={faqItemContainer}>
        <FaqItem question="Tôi cần làm gì để bắt đầu học trên Hokori?">
          <ul>
            <li>
              Trước tiên, bạn cần đăng ký tài khoản học viên miễn phí trên hệ
              thống.
            </li>
            <li>
              Sau đó, bạn có thể chọn khóa học phù hợp với cấp độ JLPT (N5 → N1)
              và bắt đầu học ngay sau khi mua khóa.
            </li>
          </ul>
        </FaqItem>
      </div>

      <div className={faqItemContainer}>
        <FaqItem question="Tôi có thể học trên điện thoại hoặc máy tính bảng không?">
          <ul>
            <li>
              Hiện tại Hokori là web app, bạn có thể học trên mọi thiết bị có
              trình duyệt như laptop, tablet hoặc điện thoại.
            </li>
            <li>
              Giao diện được tối ưu cho cả màn hình nhỏ và lớn để đảm bảo trải
              nghiệm học tập thoải mái.
            </li>
          </ul>
        </FaqItem>
      </div>

      {/* === 2. Trong quá trình học === */}
      <div className={faqItemContainer}>
        <FaqItem question="Hệ thống có lưu lại tiến độ học của tôi không?">
          <ul>
            <li>
              Có. Hokori tự động lưu tiến độ mỗi khi bạn hoàn thành một bài học,
              flashcard hay bài kiểm tra.
            </li>
            <li>
              Bạn có thể xem tiến độ tổng thể của mình trong trang Dashboard học
              viên.
            </li>
          </ul>
        </FaqItem>
      </div>

      <div className={faqItemContainer}>
        <FaqItem question="Nếu tôi thoát ra giữa chừng, có thể tiếp tục học lại từ chỗ dừng không?">
          <ul>
            <li>
              Hoàn toàn có thể. Hệ thống sẽ ghi nhớ vị trí bài học bạn đang học
              dở và gợi ý tiếp tục khi đăng nhập lại.
            </li>
          </ul>
        </FaqItem>
      </div>

      <div className={faqItemContainer}>
        <FaqItem question="Tôi có thể làm lại bài kiểm tra hoặc quiz không?">
          <ul>
            <li>
              Có. Bạn có thể làm lại các bài quiz hoặc bài kiểm tra nhiều lần để
              cải thiện điểm và kỹ năng.
            </li>
            <li>
              Kết quả gần nhất sẽ được lưu để tính điểm trung bình trong
              Dashboard.
            </li>
          </ul>
        </FaqItem>
      </div>

      <div className={faqItemContainer}>
        <FaqItem question="Tôi có thể thảo luận hoặc đặt câu hỏi với giáo viên không?">
          <ul>
            <li>
              Trong mỗi khóa học có phần bình luận để học viên đặt câu hỏi, chia
              sẻ thắc mắc hoặc phản hồi với giáo viên.
            </li>
            <li>
              Giáo viên hoặc moderator có thể phản hồi để hỗ trợ bạn trong quá
              trình học.
            </li>
          </ul>
        </FaqItem>
      </div>

      {/* === 3. Tính năng AI hỗ trợ học viên === */}
      <div className={faqItemContainer}>
        <FaqItem question="AI trên Hokori hỗ trợ tôi học như thế nào?">
          <ul>
            <li>
              AI giúp bạn luyện phát âm (Kaiwa), kiểm tra ngữ pháp, gợi ý từ
              vựng và tạo flashcard hoặc quiz từ nội dung đã học.
            </li>
            <li>
              Nhờ đó, bạn có thể ôn luyện và cải thiện kỹ năng tiếng Nhật nhanh
              hơn, chính xác hơn.
            </li>
          </ul>
        </FaqItem>
      </div>

      <div className={faqItemContainer}>
        <FaqItem question="Tôi có thể luyện nói tiếng Nhật với AI không?">
          <ul>
            <li>
              Có. AI Kaiwa cho phép bạn luyện hội thoại và chấm điểm độ tự
              nhiên, phát âm và ngữ điệu.
            </li>
            <li>
              Tính năng này nằm trong gói AI cơ bản miễn phí 30 ngày hoặc gói AI
              nâng cao có phí.
            </li>
          </ul>
        </FaqItem>
      </div>

      <div className={faqItemContainer}>
        <FaqItem question="AI có gợi ý lỗi sai hoặc cách sửa trong bài viết của tôi không?">
          <ul>
            <li>
              Có. Khi bạn nhập câu tiếng Nhật, AI Grammar sẽ phân tích và chỉ ra
              lỗi sai ngữ pháp, kèm gợi ý cách viết đúng.
            </li>
          </ul>
        </FaqItem>
      </div>

      {/* === 4. JLPT, Flashcard & luyện tập === */}
      <div className={faqItemContainer}>
        <FaqItem question="Hokori có bài thi thử JLPT để tôi luyện tập không?">
          <ul>
            <li>
              Có. Hokori cung cấp đề thi mô phỏng JLPT với cấu trúc thật, giúp
              bạn luyện tập các kỹ năng Từ vựng, Ngữ pháp, Đọc và Nghe.
            </li>
            <li>
              Sau khi làm xong, bạn sẽ nhận được điểm và phần nhận xét tự động
              để cải thiện.
            </li>
          </ul>
        </FaqItem>
      </div>

      <div className={faqItemContainer}>
        <FaqItem question="Tôi có thể dùng flashcard để học từ vựng không?">
          <ul>
            <li>
              Có. Mỗi khóa học có bộ flashcard giúp bạn ghi nhớ Kanji và từ vựng
              hiệu quả theo phương pháp lặp lại ngắt quãng (SRS).
            </li>
            <li>Bạn cũng có thể tạo flashcard cá nhân để tự luyện thêm.</li>
          </ul>
        </FaqItem>
      </div>

      <div className={faqItemContainer}>
        <FaqItem question="Tôi gặp lỗi khi học thì phải làm sao?">
          <ul>
            <li>
              Bạn có thể gửi phản hồi trực tiếp trong phần hỗ trợ hoặc liên hệ
              qua email <strong>support@hokori.vn</strong>.
            </li>
            <li>
              Đội ngũ kỹ thuật sẽ phản hồi và hỗ trợ trong thời gian sớm nhất.
            </li>
          </ul>
        </FaqItem>
      </div>

      <Button className={btn} content="Tìm hiểu thêm" to="/information" />
    </div>
  );
};

export default Information;
