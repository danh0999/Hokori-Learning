// src/pages/Authen-Template/AuthenTemplate.jsx
import React from "react";
import LoginForm from "../Authen-Form/Login-Form/LoginForm";
import RegisterForm from "../Authen-Form/Register-Form/RegisterForm";
import styles from "./styles.module.scss";

function AuthenTemplate({ isLogin }) {
  return (
    <div className={styles.authenTemplate}>
      {/* lớp nền ảnh */}
      <div className={styles.bg} />
      {/* overlay đen */}
      <div className={styles.overlay} />

      {/* vùng chứa nội dung, có padding để tạo khoảng trống và cho phép scroll */}
      <main className={styles.content}>
        <section className={styles.formWrap}>
          {isLogin ? <LoginForm /> : <RegisterForm />}
        </section>
      </main>
    </div>
  );
}

export default AuthenTemplate;
