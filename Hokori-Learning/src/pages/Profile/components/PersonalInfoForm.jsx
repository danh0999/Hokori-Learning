import React, { useState } from "react";
import styles from "./PersonalInfoForm.module.scss";
import EditProfileModal from "./EditProfileModal";

const PersonalInfoForm = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (iso) => {
    if (!iso) return "Không rõ";
    const date = new Date(iso);
    const months = [
      "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5",
      "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10",
      "Tháng 11", "Tháng 12",
    ];
    return `${date.getDate().toString().padStart(2, "0")} ${
      months[date.getMonth()]
    }, ${date.getFullYear()} — ${date
      .getHours()
      .toString()
      .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  if (!user) return null;

  return (
    <section className={styles.wrapper}>
      <h2 className={styles.title}>THÔNG TIN CÁ NHÂN</h2>

      <div className={styles.infoGrid}>
        <div>
          <p>Tên tài khoản </p>
          <span>{user.username || "Chưa cập nhật"}</span>
        </div>

        <div>
          <p>Email</p>
          <span>{user.email || "Chưa cập nhật"}</span>
        </div>

        <div>
          <p>Số điện thoại</p>
          <span>{user.phoneNumber || "Chưa cập nhật"}</span>
        </div>

        <div>
          <p>Ngày tạo tài khoản</p>
          <span>{formatDate(user.createdAt)}</span>
        </div>

        <div>
          <p>Lần đăng nhập gần nhất</p>
          <span>{formatDate(user.lastLoginAt)}</span>
        </div>

        <div>
          <p>Trạng thái</p>
          <span
            className={
              user.isActive ? styles.activeStatus : styles.inactiveStatus
            }
          >
            {user.isActive ? "Đang hoạt động" : "Bị khóa"}
          </span>
        </div>

        <div className={styles.action}>
          <button className={styles.primaryBtn} onClick={() => setIsOpen(true)}>
            Chỉnh sửa
          </button>
        </div>
      </div>

      {/* Modal chỉnh sửa */}
      {isOpen && <EditProfileModal user={user} onClose={() => setIsOpen(false)} />}
    </section>
  );
};

export default PersonalInfoForm;
