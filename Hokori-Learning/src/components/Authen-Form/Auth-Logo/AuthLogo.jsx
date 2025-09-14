import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./styles.module.scss";

const AuthLogo = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.logoWrapper} onClick={() => navigate("/")}>
      <div className={styles.logoBox}>
        <span className={styles.logoText}>HOKORI</span>
      </div>
      <p className={styles.tagline}>Japanese Learning Platform</p>
    </div>
  );
};

export default AuthLogo;
