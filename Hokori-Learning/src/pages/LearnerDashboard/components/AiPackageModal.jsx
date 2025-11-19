import React from "react";
import styles from "./AiPackageModal.module.scss";
import { Button } from "../../../components/Button/Button";

export default function AiPackageModal({ onClose, onSelect }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Nâng cấp để sử dụng tính năng AI</h2>
        <p>Chọn gói phù hợp để tiếp tục sử dụng dịch vụ AI.</p>

        <div className={styles.packageList}>

          {/* BASIC */}
          <div className={styles.card}>
            <h3>Basic</h3>
            <p>30 ngày sử dụng</p>
            <ul>
              <li>200 lượt kiểm tra chính tả</li>
              <li>100 lượt Kaiwa</li>
              <li>150 lượt kiểm tra phát âm</li>
              <li>50 Quiz AI</li>
            </ul>
            <div className={styles.price}>99.000đ</div>
            <Button content="Mua Basic" onClick={() => onSelect(1)} />
          </div>

          {/* PRO */}
          <div className={`${styles.card} ${styles.pro}`}>
            <span className={styles.best}>BEST VALUE</span>
            <h3>Pro</h3>
            <p>90 ngày sử dụng</p>
            <ul>
              <li>1000 lượt kiểm tra chính tả</li>
              <li>500 lượt Kaiwa</li>
              <li>700 lượt kiểm tra phát âm</li>
              <li>200 Quiz AI</li>
            </ul>
            <div className={styles.price}>199.000đ</div>
            <Button content="Mua Pro" onClick={() => onSelect(2)} />
          </div>

        </div>

        <button className={styles.close} onClick={onClose}>
          Đóng
        </button>
      </div>
    </div>
  );
}
