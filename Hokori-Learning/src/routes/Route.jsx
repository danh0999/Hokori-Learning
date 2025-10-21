import Home from "../pages/Home/Home";

import ErrorPage from "../pages/ErrorPage";
import MainLayout from "../layouts/Mainlayout";
import CourseDetail from "../pages/CourseDetail/CourseDetail";
import React from "react";
import Login from "../pages/authen/login/login";
import Register from "../pages/authen/register/register";
import PaymentPage from "../pages/Payment/PaymentPage";
import Marketplace from "../pages/Marketplace/Marketplace";
import AboutPage from "../pages/About/AboutPage";
import RoleLayout from "../layouts/RoleLayouts/RoleLayout";
import LearnerDashboard from "../pages/LearnerDashboard/LearnerDashboard";
import { Navigate } from "react-router-dom";
import { Contact } from "../pages/Contact/Contact";
import TeacherDashboard from "../pages/Teacher/Dashboard/TeacherDashboard";
import CourseInformation from "../pages/Teacher/Courses/CourseInformation/CourseInformation";
import MyCourses from "../pages/MyCourses/MyCourses";

import ManageCourses from "../pages/Teacher/Courses/ManageCourses";
import ProtectedRoute from "./ProtectedRoute";
import Cart from "../pages/Cart/Cart";

const Stub = ({ title }) => <div style={{ padding: 12 }}>{title}</div>;

const routes = [
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  // Guest + Learner (chỉ cần đăng nhập cho những trang nhạy cảm)
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/marketplace", element: <Marketplace /> },
      { path: "/course/:courseId", element: <CourseDetail /> },
      { path: "/about", element: <AboutPage /> },
      { path: "/contact", element: <Contact /> },
      // Các trang cần đăng nhập (Learner)
      {
        element: (
          <ProtectedRoute
            allow={["LEARNER", "TEACHER", "ADMIN", "MODERATOR"]}
          />
        ),
        children: [
          { path: "/payment", element: <PaymentPage /> },
          { path: "/learner-dashboard", element: <LearnerDashboard /> },
          { path: "/my-courses", element: <MyCourses /> },
          { path: "/cart", element: <Cart /> },
        ],
      },
    ],
  },

  // TEACHER area
  {
    path: "/teacher",
    element: <ProtectedRoute allow={["TEACHER"]} />, // guard trước
    children: [
      {
        path: "/teacher",
        element: <RoleLayout role="teacher" />, // layout hiện tại
        errorElement: <ErrorPage />,
        children: [
          { index: true, element: <TeacherDashboard /> },
          { path: "manage-courses", element: <ManageCourses /> },
          { path: "courses/:id", element: <CourseInformation /> },
          { path: "create-course", element: <Stub title="Create Course" /> },
          { path: "students", element: <Stub title="Students" /> },
          { path: "revenue", element: <Stub title="Revenue" /> },
          { path: "messages", element: <Stub title="Messages" /> },
          { path: "profile", element: <Stub title="Profile" /> },

        ],
      },
    ],
  },

  // ADMIN area
  {
    path: "/admin",
    element: <ProtectedRoute allow={["ADMIN"]} />,
    children: [

      {
        path: "/admin",
        element: <RoleLayout role="admin" />,
        errorElement: <ErrorPage />,
        children: [
          { index: true, element: <Stub title="Admin Dashboard" /> },
          { path: "users", element: <Stub title="Users" /> },
          { path: "catalog", element: <Stub title="Catalog" /> },
          { path: "moderation", element: <Stub title="Moderation" /> },
          { path: "reports", element: <Stub title="Reports" /> },
          { path: "settings", element: <Stub title="Settings" /> },
        ],
      },

    ],
  },

  // MODERATOR area
  {
    path: "/moderator",
    element: <ProtectedRoute allow={["MODERATOR"]} />,
    children: [

      {
        path: "/moderator",
        element: <RoleLayout role="moderator" />,
        errorElement: <ErrorPage />,
        children: [
          { index: true, element: <Stub title="Moderator Dashboard" /> },
          { path: "reviews", element: <Stub title="Reviews" /> },
          { path: "queues", element: <Stub title="Queues" /> },
          { path: "ai-check", element: <Stub title="AI Check" /> },
          { path: "messages", element: <Stub title="Messages" /> },
          { path: "settings", element: <Stub title="Settings" /> },
        ],
      },

      // Fallback
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
];
export default routes;
