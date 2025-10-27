import React from "react";
import styles from "./ProfileHeader.module.scss";

const ProfileHeader = ({ user, onOpenModal }) => {
  if (!user) return null; // tránh crash khi chưa có data

  const avatar =
    user?.avatarUrl ||
    "https://api.dicebear.com/7.x/notionists/svg?seed=hokori";

  return (
    <section className={styles.header}>
      <div className={styles.avatarWrap}>
        <img src={avatar} alt="avatar" className={styles.avatar} />
      </div>

      <div className={styles.info}>
        <h1>{user?.displayName || "Người dùng"}</h1>
        <span className={styles.role}>Học viên</span>
        <p className={styles.email}>{user?.email || ""}</p>

        <div className={styles.actions}>
          <button className={styles.editBtn}>Chỉnh sửa hồ sơ</button>
          <button className={styles.pwBtn} onClick={onOpenModal}>
            Đổi mật khẩu
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProfileHeader;
