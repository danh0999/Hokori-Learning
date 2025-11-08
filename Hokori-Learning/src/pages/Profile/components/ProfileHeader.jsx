// src/pages/Profile/components/ProfileHeader.jsx
import React from "react";
import styles from "./ProfileHeader.module.scss";

const ProfileHeader = ({ user, onOpenChangePassword }) => {
  if (!user) return null;

  const avatar =
    user.avatarUrl ||
    user.avatar_url ||
    "https://api.dicebear.com/7.x/notionists/svg?seed=hokori";

  // 🔹 Lấy tên hiển thị từ tất cả các khả năng backend có thể trả
  const displayName =
    user.displayName ||
    user.username ||
    user.userName ||
    user.fullName ||
    user.name ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    "Chưa cập nhật";

  // 🔹 Vai trò: nếu backend không có thì mặc định "Học viên"
  const role =
    user.roleName ||
    user.role ||
    user.userRole ||
    "Học viên";

  return (
    <section className={styles.wrapper}>
      <div className={styles.avatarBox}>
        <img src={avatar} alt="avatar" className={styles.avatar} />
      </div>

      <div className={styles.info}>
        <p className={styles.role}>{role}</p>
        {/* ✅ chỉ hiển thị 1 dòng tên người dùng thật */}
        <h1 className={styles.name}>{displayName}</h1>

        {user.email && <p className={styles.email}>{user.email}</p>}

        <div className={styles.actions}>
          {/* ❌ bỏ nút "Chỉnh sửa hồ sơ" vì đã có ở card bên dưới */}
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={onOpenChangePassword}
          >
            Đổi mật khẩu
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProfileHeader;
