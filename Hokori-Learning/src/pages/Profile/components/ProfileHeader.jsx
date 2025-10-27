import React from "react";
import styles from "./ProfileHeader.module.scss";

const ProfileHeader = ({ user, onOpenModal }) => {
  return (
    <section className={styles.header}>
      <div className={styles.avatarWrap}>
        <img
          src={user.avatarUrl || "https://avatardep.info/wp-content/uploads/2025/01/avt-mac-dinh-fb-moi.jpg"}
          alt="avatar"
          className={styles.avatar}
        />
      </div>
      <div className={styles.info}>
        <h1>{user.displayName}</h1>
        <span className={styles.role}>Học viên</span>
        <p>{user.email}</p>
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
