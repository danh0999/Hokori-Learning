import React from "react";
import styles from "./AiPackageIntro.module.scss";
import { motion } from "framer-motion";

import {
  PiMicrophoneBold,
  PiBooksBold,
  PiMagicWandBold,
  PiRobotBold,
} from "react-icons/pi";

export default function AiPackageIntro({ onOpenModal }) {
  const items = [
    {
      icon: <PiMicrophoneBold size={26} />,
      title: "Luyện Kaiwa thông minh",
      desc: "Chấm điểm – sửa phát âm – gợi ý mẫu câu tự nhiên.",
    },
    {
      icon: <PiBooksBold size={26} />,
      title: "Phân tích ngữ pháp & từ vựng",
      desc: "Hiểu rõ cấu trúc, nghĩa và cấp độ JLPT của câu.",
    },
    {
      icon: <PiMagicWandBold size={26} />,
      title: "Tạo Quiz & Flashcard AI",
      desc: "Sinh quiz / flashcard từ video hoặc đoạn văn.",
    },
    {
      icon: <PiRobotBold size={26} />,
      title: "Trợ lý AI học tập",
      desc: "Trả lời câu hỏi, giải thích ngữ pháp như giáo viên Nhật.",
    },
  ];

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Gói AI Hokori – Học tiếng Nhật hiệu quả hơn</h2>
      <p className={styles.subtitle}>
        Công cụ AI hỗ trợ toàn diện giúp bạn tăng tốc hành trình JLPT.
      </p>

      <div className={styles.grid}>
        {items.map((item, idx) => (
          <motion.div
            key={idx}
            className={styles.card}
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 160, damping: 16 }}
          >
            <div className={styles.iconCircle}>{item.icon}</div>
            <h3 className={styles.cardTitle}>{item.title}</h3>
            <p className={styles.desc}>{item.desc}</p>
          </motion.div>
        ))}
      </div>

      <button className={styles.btn} onClick={onOpenModal}>
        Khám phá gói AI
      </button>
    </section>
  );
}
