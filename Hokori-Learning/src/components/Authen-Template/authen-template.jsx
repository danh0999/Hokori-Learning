import React from "react";
import LoginForm from "../Authen-Form/Login-Form/LoginForm";
import RegisterForm from "../Authen-Form/Register-Form/RegisterForm";
import styles from "./styles.module.scss";

function AuthenTemplate({ isLogin }) {
  return (
    <div className={styles.authenTemplate}>
      <div className={styles.authenTemplate__overlay}>
        <div className={styles.authenTemplate__form}>
          {isLogin ? <LoginForm /> : <RegisterForm />}
        </div>
      </div>
    </div>
  );
}

export default AuthenTemplate;
