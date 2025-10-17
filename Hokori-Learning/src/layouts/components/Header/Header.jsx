import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout as logoutAction } from "../../../redux/features/userSlice";
import { logoutFirebase } from "../../../services/auth";
import { BellOutlined, UserOutlined } from "@ant-design/icons";
import { Badge, Avatar, Dropdown, Space } from "antd";
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

  const [openDropdown, setOpenDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Đóng dropdown khóa học khi click ra ngoài
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
      dispatch(logoutAction());
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
        {/* logo */}
        <div className={logo} onClick={() => navigate("/")}>
          <div className={logoBox}>
            <span className={logoText}>H</span>
          </div>
          <span className={brand}>Hokori</span>
        </div>

        {/* nav */}
        <nav className={nav}>
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? active : "")}
          >
            Trang chủ
          </NavLink>

          {/* dropdown */}
          <div className={dropdown} ref={dropdownRef}>
            <button
              className={dropdownToggle}
              onClick={() => setOpenDropdown(!openDropdown)}
            >
              Khóa học{" "}
              <span className={`${arrow} ${openDropdown ? rotate : ""}`}>
                ▾
              </span>
            </button>
            {openDropdown && (
              <div className={dropdownMenu}>
                <NavLink to="/marketplace" className={dropdownItem}>
                  Tất cả khóa học
                </NavLink>
                <NavLink to="/course-vip" className={dropdownItem}>
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

        {/* actions */}
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
              {/* 🔔 Notification Bell */}
              <Badge dot>
                <BellOutlined
                  style={{
                    fontSize: 20,
                    cursor: "pointer",
                    color: "#444",
                  }}
                />
              </Badge>

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
