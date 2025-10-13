import React from "react";
import { FaCrown } from "react-icons/fa";
import styles from "./SubscriptionPlan.module.scss";

const formatDate = (d) => new Date(d).toLocaleDateString("vi-VN");

const SubscriptionPlan = ({ planName, features = [], renewAt, onRenew }) => {
  return (
    <section className="card">
      <h3 className={styles.title}>Gói đăng ký</h3>

      <div className={styles.box}>
        <div className={styles.top}>
          <span className={styles.plan}>{planName}</span>
          <FaCrown className={styles.icon} />
        </div>

        {features?.length > 0 && (
          <ul className={styles.features}>
            {features.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        )}

        <div className={styles.renew}>Gia hạn: {formatDate(renewAt)}</div>

        <button className={styles.btn} onClick={onRenew}>Gia hạn gói</button>
      </div>
    </section>
  );
};

export default SubscriptionPlan;
