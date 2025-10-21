import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import { logout } from "../../../redux/features/userSlice";
import { logoutFirebase } from "../../../redux/features/auth";
import { BellOutlined, UserOutlined } from "@ant-design/icons";
import { Badge, Avatar, Dropdown, Space } from "antd";
import { FiShoppingCart, FiBell } from "react-icons/fi"; // ✅ React Icons

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

  const user = useSelector((state) => state.user); // ✅ lấy user từ Redux

  // Sau này có thể thêm cart Redux:
  // const cart = useSelector((state) => state.cart);
  const cartCount = 3; // ✅ tạm thời hardcode, sau gắn Redux


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
        {/* Logo */}
        <div className={logo} onClick={() => navigate("/")}>
          <div className={logoBox}>
            <span className={logoText}>H</span>
          </div>
          <span className={brand}>Hokori</span>
        </div>

        {/* Navigation */}
        <nav className={nav}>
          <NavLink to="/" className={({ isActive }) => (isActive ? active : "")}>
            Trang chủ
          </NavLink>

          {/* Dropdown khóa học */}
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

        {/* Actions */}
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
              {/*  Giỏ hàng */}
              <div
                onClick={() => navigate("/cart")}
                style={{
                  position: "relative",
                  cursor: "pointer",
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
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
                  transition: "color 0.2s ease, transform 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
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
                  <Avatar size={36} src={user.photoURL} icon={<UserOutlined />} />
                </Space>
              </Dropdown>
            </Space>
          )}
        </div>
      </div>
    </header>
  );
};
