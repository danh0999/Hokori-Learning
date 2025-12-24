import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import { logout } from "../../../redux/features/userSlice";
import { logoutFirebase } from "../../../redux/features/auth";

import { UserOutlined } from "@ant-design/icons";
import { Avatar, Dropdown, Space } from "antd";
import { FiShoppingCart } from "react-icons/fi";

import {
  resetAiPackageState,
  openModal,
  fetchMyAiPackage,
  fetchAiQuota,
} from "../../../redux/features/aiPackageSlice";

import { fetchCart } from "../../../redux/features/cartSlice";
import { resetProfile, fetchMe } from "../../../redux/features/profileSlice";

import styles from "./styles.module.scss";
import NotificationBell from "../../../components/NotificationBell/NotificationBell";

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

  /* ===============================
     REDUX STATE
  =============================== */
  const user = useSelector((state) => state.user);
  const profile = useSelector((state) => state.profile.data);

  const myPackage = useSelector((state) => state.aiPackage.myPackage);
  const quota = useSelector((state) => state.aiPackage.quota);

  const cartItems = useSelector((state) => state.cart.items);
  const cartCount = cartItems?.length || 0;

  /* ===============================
     FETCH DATA SAU LOGIN
  =============================== */
  useEffect(() => {
    if (user?.accessToken) {
      dispatch(fetchMe());
      dispatch(fetchMyAiPackage());
      dispatch(fetchAiQuota());
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (user?.accessToken && profile) {
      dispatch(fetchCart());
    }
  }, [user, profile, dispatch]);

  /* ===============================
     DROPDOWN HANDLING
  =============================== */
  const [openDropdown, setOpenDropdown] = useState(null);

  const courseDropdownRef = useRef(null);
  const aboutDropdownRef = useRef(null);
  const aiDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        courseDropdownRef.current?.contains(e.target) ||
        aboutDropdownRef.current?.contains(e.target) ||
        aiDropdownRef.current?.contains(e.target)
      ) {
        return;
      }
      setOpenDropdown(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ===============================
     LOGOUT
  =============================== */
  const handleLogout = async () => {
    try {
      const userId = user?.id;

      await logoutFirebase();

      if (userId) {
        //  AI Kaiwa
        localStorage.removeItem(`ai_kaiwa_result_${userId}`);

        //  AI Conversation (QUAN TRỌNG)
        localStorage.removeItem(`ai_conversation_session_${userId}`);
      }

      //  AI Sentence Analysis
      localStorage.removeItem("ai_sentence");
      localStorage.removeItem("ai_level");
      localStorage.removeItem("ai_result");

      dispatch(logout());
      dispatch(resetProfile());
      dispatch(resetAiPackageState());

      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  /* ===============================
     AI PERMISSION – 
  =============================== */
  const remainingRequests = Number(quota?.remainingRequests ?? 0);

  const hasActivePackage =
    myPackage?.hasPackage === true && !myPackage?.isExpired;

  const canUseAI = hasActivePackage && remainingRequests > 0;

  /* ===============================
     HANDLE OPEN AI TOOL (HEADER + DROPDOWN)
  =============================== */
  const handleOpenAiTool = (path) => {
    if (!user) {
      navigate(`/login?redirect=${path}`);
      return;
    }

    // ❗ NGHIỆP VỤ CHUẨN:
    // Không có gói HOẶC hết lượt → mở modal
    if (!canUseAI) {
      dispatch(openModal());
      return;
    }

    navigate(path);
  };

  /* ===============================
     USER MENU
  =============================== */
  const userMenu = {
    items: [
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
        key: "my-payments",
        label: "Lịch sử giao dịch",
        onClick: () => navigate("/my-payments"),
      },
      {
        key: "logout",
        label: "Đăng xuất",
        onClick: handleLogout,
      },
    ],
  };

  return (
    <header className={`${header} notification-light`}>
      <div className={container}>
        {/* LOGO */}
        <div className={logo} onClick={() => navigate("/")}>
          <div className={logoBox}>
            <span className={logoText}>H</span>
          </div>
          <span className={brand}>Hokori</span>
        </div>

        {/* ====================== NAV ====================== */}
        <nav className={nav}>
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? active : "")}
          >
            Trang chủ
          </NavLink>

          {/* ===== Khóa học ===== */}
          <div className={dropdown} ref={courseDropdownRef}>
            <button
              className={dropdownToggle}
              onClick={() =>
                setOpenDropdown(openDropdown === "course" ? null : "course")
              }
            >
              Khóa học
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

                <NavLink
                  to={user ? "/my-courses" : "/login?redirect=/my-courses"}
                  className={dropdownItem}
                >
                  Khóa học của tôi
                </NavLink>

                <NavLink
                  to={
                    user ? "/my-flashcards" : "/login?redirect=/my-flashcards"
                  }
                  className={dropdownItem}
                >
                  Flashcard của tôi
                </NavLink>
              </div>
            )}
          </div>

          {/* ===== JLPT ===== */}
          <NavLink
            to="/JLPT"
            className={({ isActive }) => (isActive ? active : "")}
          >
            Thi thử JLPT
          </NavLink>

          {/* ===== Công cụ AI ===== */}
          <div className={dropdown} ref={aiDropdownRef}>
            <button
              className={dropdownToggle}
              onClick={() =>
                setOpenDropdown(openDropdown === "ai" ? null : "ai")
              }
            >
              Công cụ AI
              <span
                className={`${arrow} ${openDropdown === "ai" ? rotate : ""}`}
              >
                ▾
              </span>
            </button>

            {openDropdown === "ai" && (
              <div className={dropdownMenu}>
                <div
                  className={dropdownItem}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleOpenAiTool("/ai-analyse")}
                >
                  Phân tích câu
                </div>

                <div
                  className={dropdownItem}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleOpenAiTool("/ai-kaiwa")}
                >
                  Luyện nói
                </div>

                <div
                  className={dropdownItem}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleOpenAiTool("/ai-conversation")}
                >
                  Trò chuyện cùng AI
                </div>
              </div>
            )}
          </div>

          {/* ===== Về Hokori ===== */}
          <div className={dropdown} ref={aboutDropdownRef}>
            <button
              className={dropdownToggle}
              onClick={() =>
                setOpenDropdown(openDropdown === "about" ? null : "about")
              }
            >
              Về Hokori
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
                <NavLink to="/contact" className={dropdownItem}>
                  Liên hệ
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        {/* ====================== USER ACTIONS ====================== */}
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
              {/* Cart */}
              <div
                onClick={() => navigate("/cart")}
                style={{ position: "relative", cursor: "pointer" }}
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
                    }}
                  >
                    {cartCount}
                  </span>
                )}
              </div>

              <NotificationBell />

              <Dropdown
                menu={userMenu}
                placement="bottomRight"
                arrow
                trigger={["click"]}
              >
                <Space style={{ cursor: "pointer" }}>
                  <Avatar
                    size={36}
                    src={profile?.avatarUrl}
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
