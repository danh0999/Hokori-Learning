import React from "react";
import styles from "./Sidebar.module.scss";
import {
  FaBookOpen,
  FaRobot,
  FaClone,
  FaCreditCard,
  FaGear,
} from "react-icons/fa6";

const Sidebar = () => {
  const items = [
    { icon: <FaBookOpen />, label: "Khóa học của tôi", active: true },
    { icon: <FaRobot />, label: "Công cụ AI của tôi" },
    { icon: <FaClone />, label: "Thẻ ghi nhớ" },
    { icon: <FaCreditCard />, label: "Thanh toán" },
    { icon: <FaGear />, label: "Cài đặt tài khoản" },
  ];

  return (
    <aside className={styles.sidebar}>
      <nav>
        <ul>
          {items.map((i, idx) => (
            <li key={idx} className={i.active ? styles.active : ""}>
              <span>{i.icon}</span>
              <span>{i.label}</span>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
