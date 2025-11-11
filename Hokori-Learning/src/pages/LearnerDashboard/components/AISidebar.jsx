import React from "react";
import styles from "./AISidebar.module.scss";
import {
  FaRobot,
  FaChartLine,
  FaLightbulb,
  FaSpellCheck,
  FaMicrophone,
  FaVolumeHigh,
} from "react-icons/fa6";
import { Button } from "../../../components/Button/Button";
const AISidebar = () => {
  return (
    <aside className={styles.sidebar}>
      <section>
        <h3>
          <FaRobot /> Công cụ AI
        </h3>
        <div className={styles.buttons}>
          <Button
            
            content="Kiểm tra chính tả"
            className={styles.aiButton}
            containerClassName={styles.aiButtonContainer}
          />
          <Button
            to="/ai-kaiwa"
            content="Luyện nói"
            className={styles.aiButton}
            containerClassName={styles.aiButtonContainer}
          />
          <Button
   
            content="Kiểm tra phát âm"
            className={styles.aiButton}
            containerClassName={styles.aiButtonContainer}
          />
        </div>
      </section>

      <section>
        <h3>
          <FaChartLine /> Thống kê học tập
        </h3>
        <ul>
          <li>
            <span>Ngày học liên tiếp</span>
            <span>7 ngày</span>
          </li>
          <li>
            <span>Tổng thời gian học</span>
            <span>24h 30m</span>
          </li>
          <li>
            <span>Điểm trung bình</span>
            <span>8.5/10</span>
          </li>
          <li>
            <span>Tiến độ tổng thể</span>
            <span>58%</span>
          </li>
        </ul>
      </section>

      <section>
        <h3>
          <FaLightbulb /> Gợi ý ôn tập
        </h3>
        <div className={styles.hints}>
          <div>
            <strong>Kanji N4 - Bài 5</strong>
            <p>Bạn chưa ôn tập từ 3 ngày trước</p>
          </div>
          <div>
            <strong>Ngữ pháp て-form</strong>
            <p>AI phát hiện bạn cần luyện thêm</p>
          </div>
          <div>
            <strong>Từ vựng N3</strong>
            <p>Gợi ý từ khóa học đã hoàn thành</p>
          </div>
        </div>
      </section>
    </aside>
  );
};

export default AISidebar;
