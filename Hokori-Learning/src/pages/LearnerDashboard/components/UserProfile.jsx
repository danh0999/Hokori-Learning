// src/pages/LearnerDashboard/components/UserProfile.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe } from "../../../redux/features/profileSlice";
import api from "../../../configs/axios"; // ✅ dùng axios chung của Hokori
import styles from "./UserProfile.module.scss";

const UserProfile = () => {
  const dispatch = useDispatch();
  const { data: user, loading } = useSelector((state) => state.profile);

  // Streak lấy từ API learner dashboard summary
  const [streakDays, setStreakDays] = useState(0);

  // 🔹 Lấy thông tin user (đang dùng tốt, giữ nguyên)
  useEffect(() => {
    if (!user) dispatch(fetchMe());
  }, [dispatch, user]);

  // 🔹 Lấy dashboard summary để hiển thị số ngày học liên tiếp
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get("/learner/dashboard/summary");
        const data = res.data?.data || res.data;

        setStreakDays(data?.currentLearningStreak || 0);
      } catch (err) {
        console.error("Error fetching learner dashboard summary:", err);
        // Nếu lỗi thì giữ 0 cho đỡ crash UI
        setStreakDays(0);
      }
    };

    fetchSummary();
  }, []);

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
          <div className={styles.days}>{streakDays}</div>
          <div className={styles.text}>Ngày học liên tiếp</div>
        </div>
      </div>
    </section>
  );
};

export default UserProfile;
