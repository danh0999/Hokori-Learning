import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe } from "../../../redux/features/profileSlice"; // ✅ đường dẫn đúng với cấu trúc Hokori
import styles from "./UserProfile.module.scss";

const UserProfile = () => {
  const dispatch = useDispatch();
  const { data: user, loading } = useSelector((state) => state.profile);

  // 🔹 Gọi API lấy thông tin user khi vào dashboard
  useEffect(() => {
    if (!user) dispatch(fetchMe());
  }, [dispatch, user]);

  if (loading || !user) {
    return (
      <section className="card userProfileCard">
        <div className={styles.wrapper}>Đang tải thông tin người học...</div>
      </section>
    );
  }

  return (
    <section className="card userProfileCard">
      <div className={styles.wrapper}>
        <div className={styles.left}>
          <img
            src={
              user.avatarUrl ||
              "https://cdn-icons-png.flaticon.com/512/9131/9131529.png"
            }
            alt="avatar"
            className={styles.avatar}
          />
          <div>
            <h1>{user.displayName || user.username}</h1>
            <p>{user.roleName || "Học viên"}</p>
            <div className={styles.meta}>
            
              <span className={styles.joined}>
                Tham gia:{" "}
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                  : "Không rõ"}
              </span>
            </div>
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.days}>{user.streakDays || 0}</div>
          <div className={styles.text}>Ngày học liên tiếp</div>
        </div>
      </div>
    </section>
  );
};

export default UserProfile;
