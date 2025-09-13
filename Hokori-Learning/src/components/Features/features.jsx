import React from "react";
import styles from "./styles.module.scss";
import { PlayCircleOutlined, UserOutlined } from "@ant-design/icons";
import { FaToriiGate } from "react-icons/fa6"; // icon cổng Torii

const Features = () => {
  const features = [
    {
      icon: <PlayCircleOutlined style={{ fontSize: "36px" }} />,
      title: "Bài học tương tác",
      desc: "Học qua video, audio và bài tập tương tác thú vị, giúp ghi nhớ lâu hơn",
    },
    {
      icon: <UserOutlined style={{ fontSize: "36px" }} />,
      title: "Giáo viên bản xứ",
      desc: "Học trực tiếp từ giáo viên người Nhật với phát âm chuẩn và kinh nghiệm giảng dạy",
    },
    {
      icon: <FaToriiGate size={36} />,
      title: "Kiến thức văn hóa",
      desc: "Tìm hiểu sâu về văn hóa, phong tục và lịch sử Nhật Bản qua từng bài học",
    },
  ];

  return (
    <section className={styles.features}>
      <h2 className={styles.title}>Tính năng nổi bật</h2>
      <p className={styles.subtitle}>
        Phương pháp học tiếng Nhật hiện đại và hiệu quả
      </p>
      <div className={styles.grid}>
        {features.map((item, idx) => (
          <div key={idx} className={styles.card}>
            <div className={styles.icon}>{item.icon}</div>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
