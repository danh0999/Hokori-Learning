import React from "react";
import LoginForm from "../Authen-Form/Login-Form/LoginForm";
import RegisterForm from "../Authen-Form/Register-Form/RegisterForm";
import styles from "./styles.module.scss";
import authImg from "../../assets/authen-img.jpg";

function AuthenTemplate({ isLogin }) {
  return (
    <div className={styles.authenTemplate}>
      <div className={styles.authenTemplate__form}>
        {isLogin ? <LoginForm /> : <RegisterForm />}
      </div>
      <div className={styles.authenTemplate__image}>
        <img src={authImg} alt="Authentication" />
      </div>
    </div>
  );
}

export default AuthenTemplate;
