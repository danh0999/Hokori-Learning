import React from "react";
import { Navigate } from "react-router-dom";

// ===== Layouts =====
import MainLayout from "../layouts/Mainlayout";
import RoleLayout from "../layouts/RoleLayouts/RoleLayout";
import ErrorPage from "../pages/ErrorPage";

// ===== Public & Learner =====
import Home from "../pages/Home/Home";
import Login from "../pages/authen/login/login";
import Register from "../pages/authen/register/register";
import Marketplace from "../pages/Marketplace/Marketplace";
import AboutPage from "../pages/About/AboutPage";
import PaymentPage from "../pages/Payment/PaymentPage";
import { Contact } from "../pages/Contact/Contact";
import CourseDetail from "../pages/CourseDetail/CourseDetail";
import MyCourses from "../pages/MyCourses/MyCourses";
import Cart from "../pages/Cart/Cart";
import LearnerDashboard from "../pages/LearnerDashboard/LearnerDashboard";
import LessonPlayer from "../pages/LessonPlayer/LessonPlayer";
import QuizPage from "../pages/QuizPage/QuizPage";
import MyFlashcards from "../pages/Flashcards/MyFlashcards";
import ProfilePage from "../pages/Profile/ProfilePage";
// ===== Teacher/Admin/Moderator =====
import TeacherDashboard from "../pages/Teacher/Dashboard/TeacherDashboard";
import ManageCourses from "../pages/Teacher/Courses/ManageCourses";
import CourseInformation from "../pages/Teacher/Courses/CourseInformation/CourseInformation";

// ===== Guards =====
import ProtectedRoute from "./ProtectedRoute";
import TeacherProfilePage from "../pages/Teacher/TeacherProfilePage/TeacherProfilePage";
import CreateCoursePage from "../pages/Teacher/Courses/Create-Course/CreateCoursePage";
// import CreateCoursePageUdemy from "../pages/Teacher/Courses/CreateCoursePageUdemy/CreateCoursePageUdemy";

// ===== Stub (tạm cho trang chưa code) =====
const Stub = ({ title }) => <div style={{ padding: 12 }}>{title}</div>;

const routes = [
  // ===== Auth (No Layout) =====
  { path: "login", element: <Login /> },
  { path: "register", element: <Register /> },

  // ===== Public Layout (có Header/Footer) =====
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      { path: "marketplace", element: <Marketplace /> },
      { path: "course/:courseId", element: <CourseDetail /> },
      { path: "about", element: <AboutPage /> },
      { path: "contact", element: <Contact /> },

      // ===== Learner Area (Yêu cầu đăng nhập) =====
      {
        // element: (
        //   <ProtectedRoute
        //     allow={["LEARNER", "TEACHER", "ADMIN", "MODERATOR"]}
        //   />
        // ),
        children: [
          { path: "payment", element: <PaymentPage /> },
          { path: "learner-dashboard", element: <LearnerDashboard /> },
          { path: "my-courses", element: <MyCourses /> },
          { path: "my-flashcards", element: <MyFlashcards /> },
          { path: "cart", element: <Cart /> },
          { path: "profile", element: <ProfilePage /> },

          {
            path: "lesson/:lessonId",
            element: <LessonPlayer />,
          },
          {
            path: "lesson/:lessonId/quiz/:quizId", //  tách riêng ra ngoài
            element: <QuizPage />,
          },
        ],
      },

      // ===== Error fallback trong MainLayout =====
      { path: "error", element: <ErrorPage /> },
    ],
  },

  // ===== TEACHER AREA =====
  {
    path: "teacher",
    element: <ProtectedRoute allow={["TEACHER"]} />,
    children: [
      {
        path: "",
        element: <RoleLayout role="teacher" />,
        errorElement: <ErrorPage />,
        children: [
          { index: true, element: <TeacherDashboard /> },
          { path: "manage-courses", element: <ManageCourses /> },
          { path: "courseinfo/:id", element: <CourseInformation /> },
          { path: "create-course", element: <CreateCoursePage /> },
          { path: "students", element: <Stub title="Students" /> },
          { path: "revenue", element: <Stub title="Revenue" /> },
          { path: "messages", element: <Stub title="Messages" /> },
          { path: "profile", element: <TeacherProfilePage /> },
          { path: "*", element: <ErrorPage /> },
        ],
      },
    ],
  },

  // ===== ADMIN AREA =====
  {
    path: "admin",
    element: <ProtectedRoute allow={["ADMIN"]} />,
    children: [
      {
        path: "",
        element: <RoleLayout role="admin" />,
        errorElement: <ErrorPage />,
        children: [
          { index: true, element: <Stub title="Admin Dashboard" /> },
          { path: "users", element: <Stub title="Users" /> },
          { path: "catalog", element: <Stub title="Catalog" /> },
          { path: "moderation", element: <Stub title="Moderation" /> },
          { path: "reports", element: <Stub title="Reports" /> },
          { path: "settings", element: <Stub title="Settings" /> },
          { path: "*", element: <ErrorPage /> },
        ],
      },
    ],
  },

  // ===== MODERATOR AREA =====
  {
    path: "moderator",
    element: <ProtectedRoute allow={["MODERATOR"]} />,
    children: [
      {
        path: "",
        element: <RoleLayout role="moderator" />,
        errorElement: <ErrorPage />,
        children: [
          { index: true, element: <Stub title="Moderator Dashboard" /> },
          { path: "reviews", element: <Stub title="Reviews" /> },
          { path: "queues", element: <Stub title="Queues" /> },
          { path: "ai-check", element: <Stub title="AI Check" /> },
          { path: "messages", element: <Stub title="Messages" /> },
          { path: "settings", element: <Stub title="Settings" /> },
          { path: "*", element: <ErrorPage /> },
        ],
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },

  // ===== Global Fallback =====
  { path: "*", element: <ErrorPage /> },
];

export default routes;
