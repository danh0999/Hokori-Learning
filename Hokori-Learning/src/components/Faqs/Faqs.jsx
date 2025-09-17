import React from "react";
import styles from "./styles.module.scss";
import FaqItem from "./FaqsItem";
import { Button } from "../Button/Button.jsx";

export const Faqs = () => {
  const { faqsContainer, faqsTitle, faqItemContainer, div,p } = styles;

  return (
    <div className={faqsContainer}>
      <div className={div}>
        <div className={faqsTitle}>Câu hỏi thường gặp</div>
        <p className={p}>Giải đáp những thắc mắc phổ biến</p>
      </div>

      <div className={faqItemContainer}>
        <FaqItem question="Tôi cần bao lâu để hoàn thành một khóa học?">
          <ul>
            <li>
              Thời gian hoàn thành phụ thuộc vào trình độ và thời gian học.
            </li>
            <li>Trung bình mỗi cấp độ từ 3–6 tháng.</li>
          </ul>
        </FaqItem>
      </div>

      <div className={faqItemContainer}>
        <FaqItem question="Có hỗ trợ học viên sau khi hoàn thành khóa học không?">
          <ul>
            <li>Học viên nhận được tài liệu ôn thi bổ sung.</li>
            <li>Được định hướng lộ trình học nâng cao.</li>
            <li>Tham gia cộng đồng học viên để trao đổi kinh nghiệm.</li>
          </ul>
        </FaqItem>
      </div>

      <div className={faqItemContainer}>
        <FaqItem question="Tôi có thể học offline không?">
          <ul>
            <li>Hiện tại Hokori tập trung vào hình thức học online.</li>
            <li>Một số buổi workshop offline được tổ chức định kỳ.</li>
          </ul>
        </FaqItem>
      </div>

      <div className={faqItemContainer}>
        <FaqItem question="Có chính sách hoàn tiền không?">
          <ul>
            <li>Hokori có chính sách hoàn tiền trong vòng 7 ngày đầu tiên.</li>
            <li>Điều kiện: học viên không hài lòng và có lý do hợp lý.</li>
          </ul>
        </FaqItem>
      </div>

      <Button content="Tìm hiểu thêm" to="/information" />
    </div>
  );
};
