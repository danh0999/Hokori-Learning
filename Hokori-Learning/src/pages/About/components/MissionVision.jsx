import React from "react";
import styles from "../about.module.scss";
import { FaBullseye, FaEye } from "react-icons/fa";

const MissionVision = () => (
  <section className={styles.missionVision}>
    <div className={styles.grid2}>
      <div className={styles.card}>
        <div className={styles.icon}><FaBullseye /></div>
        <h3 className={styles.title}>Sứ mệnh</h3>
        <p>
          Hỗ trợ người Việt Nam học tiếng Nhật một cách hiệu quả và thú vị thông
          qua việc ứng dụng công nghệ hiện đại, phương pháp giảng dạy khoa học và
          nội dung chất lượng cao.
        </p>
      </div>
      <div className={styles.card}>
        <div className={styles.icon}><FaEye /></div>
        <h3>Tầm nhìn</h3>
        <p>
          Trở thành nền tảng học tiếng Nhật trực tuyến hàng đầu Đông Nam Á, kết
          nối văn hóa Việt - Nhật và truyền cảm hứng học tập cho hàng triệu người.
        </p>
      </div>
    </div>
  </section>
);

export default MissionVision;
