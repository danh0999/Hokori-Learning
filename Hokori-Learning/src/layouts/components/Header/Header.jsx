import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import styles from "./styles.module.scss";

const {
  header,
  container,
  logo,
  logoBox,
  logoText,
  brand,
  nav,
  active,
  actions,
  loginBtn,
  registerBtn,
  dropdown,
  dropdownToggle,
  dropdownMenu,
  dropdownItem,
  arrow,
  rotate,
} = styles;

export const Header = () => {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

        {/* nav */}
        <nav className={nav}>
          <NavLink to="/" className={({ isActive }) => (isActive ? active : "")}>
            Trang chủ
          </NavLink>

          {/* dropdown */}
          <div className={dropdown} ref={dropdownRef}>
            <button
              className={dropdownToggle}
              onClick={() => setOpenDropdown(!openDropdown)}
            >
              Khóa học{" "}
              <span className={`${arrow} ${openDropdown ? rotate : ""}`}>▾</span>
            </button>
            {openDropdown && (
              <div className={dropdownMenu}>
                <NavLink to="/course" className={dropdownItem}>
                  Khóa học chung
                </NavLink>
                <NavLink to="/course-vip" className={dropdownItem}>
                  Khóa học VIP
                </NavLink>
              </div>
            )}
          </div>

          <NavLink to="/about" className={({ isActive }) => (isActive ? active : "")}>
            Về chúng tôi
          </NavLink>
          <NavLink to="/contact" className={({ isActive }) => (isActive ? active : "")}>
            Liên hệ
          </NavLink>
        </nav>

        {/* actions */}
        <div className={actions}>
          <button className={loginBtn} onClick={() => navigate("/login")}>
            Đăng nhập
          </button>
          <button className={registerBtn} onClick={() => navigate("/register")}>
            Đăng ký
          </button>
        </div>
      </div>
    </header>
  );
};
