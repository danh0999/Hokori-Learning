// src/pages/Profile/components/ProfileHeader.jsx
import React from "react";
import styles from "./ProfileHeader.module.scss";
import { useDispatch } from "react-redux";
import { uploadAvatar } from "../../../redux/features/profileSlice";

const ProfileHeader = ({ user, onOpenChangePassword }) => {
  const dispatch = useDispatch();

  if (!user) return null;

  const avatar =
    user.avatarUrl ||
    user.avatar_url ||
    "https://api.dicebear.com/7.x/notionists/svg?seed=hokori";

  const displayName =
    user.displayName ||
    user.username ||
    user.userName ||
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    "Chưa cập nhật";

  const role = user.roleName || user.role || "Học viên";

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    dispatch(uploadAvatar(file));
  };

  return (
    <section className={styles.wrapper}>
      <div className={styles.avatarBox}>
        <label className={styles.uploadArea}>
          <img src={avatar} alt="avatar" className={styles.avatar} />
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleUpload}
          />
        </label>

        <p className={styles.roleBelow}>{role}</p>
      </div>

      <div className={styles.info}>
        <p className={styles.label}>Tên hiển thị</p>

        <h1 className={styles.name}>{displayName}</h1>

        {user.email && <p className={styles.email}>{user.email}</p>}

        <div className={styles.actions}>
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
