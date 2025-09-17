import React from "react";
import { Carousel } from "antd";
import banner1 from "../../assets/banner5.jpg";
import banner2 from "../../assets/banner2.jpg";
import banner3 from "../../assets/banner3.jpg";
import styles from "./styles.module.scss"; // import SCSS module

const Banner = () => (
  <div className={styles.bannerContainer}>
    <Carousel autoplay autoplaySpeed={4000}>
      <div>
        <img src={banner1} alt="Banner 1" />
      </div>
      <div>
        <img src={banner2} alt="Banner 2" />
      </div>
      <div>
        <img src={banner3} alt="Banner 3" />
      </div>
    </Carousel>
    <div>
      <div className={styles.overlay}>
        <div className={styles.content}>
          <h1>Learn Japanese Online</h1>
          <p>
            Nắm vững tiếng Nhật với các bài học tương tác, sự hỗ trợ của giáo
            viên bản ngữ và hiểu biết sâu sắc về văn hóa. Từ trình độ sơ cấp đến
            nâng cao.
          </p>
          <div className={styles.buttons}>
            <button className={styles.startBtn}>Bắt đầu học</button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Banner;
