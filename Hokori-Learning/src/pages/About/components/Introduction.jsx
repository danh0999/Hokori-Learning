import React from "react";
import styles from "../about.module.scss";

const Introduction = () => (
  <section className={styles.introduction}>
    <div className={styles.container}>
      <h2>Giới thiệu về Hokori</h2>
      <p>
        Hokori ra đời từ niềm đam mê sâu sắc với tiếng Nhật và mong muốn tạo ra
        một nền tảng học tập dễ dàng, hiệu quả cho người Việt Nam. Chúng tôi hiểu
        rằng việc học một ngôn ngữ mới có thể gặp nhiều thử thách, đặc biệt là
        tiếng Nhật với hệ thống chữ viết phức tạp và ngữ pháp đặc trưng.
      </p>
      <p>
        Hokori tích hợp công nghệ AI tiên tiến để cá nhân hóa lộ trình học tập,
        hỗ trợ tra cứu thông minh và tạo ra trải nghiệm luyện tập tương tác. Với
        phương pháp giảng dạy được thiết kế riêng cho người Việt, chúng tôi cam
        kết mang đến cho bạn hành trình học tiếng Nhật thú vị và đầy cảm hứng.
      </p>
    </div>
  </section>
);

export default Introduction;
