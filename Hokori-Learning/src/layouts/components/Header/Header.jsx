import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import { logout } from "../../../redux/features/userSlice";
import { logoutFirebase } from "../../../redux/features/auth";

import { UserOutlined } from "@ant-design/icons";
import { Avatar, Dropdown, Space } from "antd";
import { FiShoppingCart, FiBell } from "react-icons/fi";

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
  const dispatch = useDispatch();

  const user = useSelector((state) => state.user);
  const cartItems = useSelector((state) => state.cart.items);
  const cartCount = cartItems?.length || 0;

  const [openDropdown, setOpenDropdown] = useState(null);
  const courseDropdownRef = useRef(null);
  const aboutDropdownRef = useRef(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        courseDropdownRef.current &&
        !courseDropdownRef.current.contains(e.target) &&
        aboutDropdownRef.current &&
        !aboutDropdownRef.current.contains(e.target)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutFirebase();
      dispatch(logout());
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const userMenu = [
    {
      key: "profile",
      label: "Hồ sơ cá nhân",
      onClick: () => navigate("/profile"),
    },
    {
      key: "learner-dashboard",
      label: "Thống kê học tập",
      onClick: () => navigate("/learner-dashboard"),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: "Đăng xuất",
      onClick: handleLogout,
    },
  ];

  return (
    <header className={header}>
      <div className={container}>
        {/* ===== Logo ===== */}
        <div className={logo} onClick={() => navigate("/")}>
          <div className={logoBox}>
            <span className={logoText}>H</span>
          </div>
          <span className={brand}>Hokori</span>
        </div>

        {/* ===== Navigation ===== */}
        <nav className={nav}>
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? active : "")}
          >
            Trang chủ
          </NavLink>

          {/* ===== Dropdown: Khóa học ===== */}
          <div className={dropdown} ref={courseDropdownRef}>
            <button
              className={dropdownToggle}
              onClick={() =>
                setOpenDropdown(openDropdown === "course" ? null : "course")
              }
            >
              Khóa học{" "}
              <span
                className={`${arrow} ${
                  openDropdown === "course" ? rotate : ""
                }`}
              >
                ▾
              </span>
            </button>
            {openDropdown === "course" && (
              <div className={dropdownMenu}>
                <NavLink to="/marketplace" className={dropdownItem}>
                  Tất cả khóa học
                </NavLink>
                <NavLink to="/my-courses" className={dropdownItem}>
                  Khóa học của bạn
                </NavLink>
              </div>
            )}
          </div>

          <NavLink
            to="/JLPT"
            className={({ isActive }) => (isActive ? active : "")}
          >
            Thi thử JLPT
          </NavLink>

          {/* ===== Dropdown: Về Hokori ===== */}
          <div className={dropdown} ref={aboutDropdownRef}>
            <button
              className={dropdownToggle}
              onClick={() =>
                setOpenDropdown(openDropdown === "about" ? null : "about")
              }
            >
              Về Hokori{" "}
              <span
                className={`${arrow} ${openDropdown === "about" ? rotate : ""}`}
              >
                ▾
              </span>
            </button>
            {openDropdown === "about" && (
              <div className={dropdownMenu}>
                <NavLink to="/about" className={dropdownItem}>
                  Về chúng tôi
                </NavLink>
                <NavLink to="/policies" className={dropdownItem}>
                  Chính sách & Điều khoản
                </NavLink>
              </div>
            )}
          </div>

          {/* ===== Liên hệ ===== */}
          <NavLink
            to="/contact"
            className={({ isActive }) => (isActive ? active : "")}
          >
            Liên hệ
          </NavLink>
        </nav>

        {/* ===== User Actions ===== */}
        <div className={actions}>
          {!user ? (
            <>
              <button className={loginBtn} onClick={() => navigate("/login")}>
                Đăng nhập
              </button>
              <button
                className={registerBtn}
                onClick={() => navigate("/register")}
              >
                Đăng ký
              </button>
            </>
          ) : (
            <Space size={24} align="center">
              {/* 🛒 Giỏ hàng */}
              <div
                onClick={() => navigate("/cart")}
                style={{
                  position: "relative",
                  cursor: "pointer",
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1.0)")
                }
              >
                <FiShoppingCart size={21} color="#444" />
                {cartCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -6,
                      backgroundColor: "#1a2940",
                      color: "#fff",
                      borderRadius: "50%",
                      fontSize: "10px",
                      width: "16px",
                      height: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 500,
                    }}
                  >
                    {cartCount}
                  </span>
                )}
              </div>

              {/* 🔔 Notification */}
              <div
                style={{
                  position: "relative",
                  cursor: "pointer",
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1.0)")
                }
              >
                <FiBell size={21} color="#444" />
                <span
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#ef4444",
                    borderRadius: "50%",
                  }}
                />
              </div>

              {/* 👤 User Avatar */}
              <Dropdown
                menu={{ items: userMenu }}
                placement="bottomRight"
                arrow
                trigger={["click"]}
              >
                <Space style={{ cursor: "pointer" }}>
                  <Avatar
                    size={36}
                    src={user.photoURL}
                    icon={<UserOutlined />}
                  />
                </Space>
              </Dropdown>
            </Space>
          )}
        </div>
      </div>
    </header>
  );
};
