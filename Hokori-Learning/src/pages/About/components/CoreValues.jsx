import React from "react";
import styles from "../about.module.scss";
import { FaMedal, FaRobot, FaHandshake } from "react-icons/fa";

const values = [
  {
    icon: <FaMedal />,
    title: "Khóa học chất lượng, chuẩn JLPT",
    text: "Nội dung được thiết kế theo tiêu chuẩn JLPT, đảm bảo chất lượng và hiệu quả học tập cao nhất cho người học.",
  },
  {
    icon: <FaRobot />,
    title: "AI hỗ trợ học tập thông minh",
    text: "Công nghệ AI tiên tiến giúp cá nhân hóa lộ trình học tập và đưa ra gợi ý phù hợp với từng học viên.",
  },
  {
    icon: <FaHandshake />,
    title: "Luôn đồng hành cùng học viên",
    text: "Đội ngũ hỗ trợ tận tâm, sẵn sàng giải đáp thắc mắc và đồng hành cùng bạn trong suốt hành trình học tập.",
  },
];

const CoreValues = () => (
  <section className={styles.coreValues}>
    <h2>Giá trị cốt lõi & Cam kết</h2>
    <div className={styles.grid}>
      {values.map((v, i) => (
        <div key={i} className={styles.card}>
          <div className={styles.icon}>{v.icon}</div>
          <h3>{v.title}</h3>
          <p>{v.text}</p>
        </div>
      ))}
    </div>
  </section>
);

export default CoreValues;
