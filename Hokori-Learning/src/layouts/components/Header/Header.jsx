import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import styles from "./styles.module.scss";

const {
  header,
  container,
  logo,
  logoBox,
  logoText,
  brand,
  menuToggle,
  nav,
  navShow,
  active,
  actions,
  loginBtn,
  registerBtn,
} = styles;

export const Header = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className={header}>
      <div className={container}>
        {/* logo */}
        <div className={logo}>
          <div className={logoBox}>
            <span className={logoText}>H</span>
          </div>
          <span className={brand}>Hokori</span>
        </div>

        {/* toggle mobile */}
        <button className={menuToggle} onClick={() => setOpen(!open)}>
          ☰
        </button>

        {/* nav */}
        <nav className={`${nav} ${open ? navShow : ""}`}>
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? active : "")}
          >
            Trang chủ
          </NavLink>
          <NavLink
            to="/courses"
            className={({ isActive }) => (isActive ? active : "")}
          >
            Khóa học
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) => (isActive ? active : "")}
          >
            Về chúng tôi
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) => (isActive ? active : "")}
          >
            Liên hệ
          </NavLink>
        </nav>

        {/* actions */}
        <div className={actions}>
          <button className={loginBtn}>Đăng nhập</button>
          <button className={registerBtn}>Đăng ký</button>
        </div>
      </div>
    </header>
  );
};
