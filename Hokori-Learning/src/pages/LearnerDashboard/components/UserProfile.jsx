import React from "react";
import styles from "./UserProfile.module.scss";

const UserProfile = ({ name, role, goal, joinedAt, streakDays, avatar }) => (
  <section className="card userProfileCard">
    <div className={styles.wrapper}>
      <div className={styles.left}>
        <img src={avatar} alt="avatar" className={styles.avatar} />
        <div>
          <h1>{name}</h1>
          <p>{role}</p>
          <div className={styles.meta}>
            <span className={styles.tag}>Mục tiêu: {goal}</span>
            <span className={styles.joined}>Tham gia: {joinedAt}</span>
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

export default UserProfile;
