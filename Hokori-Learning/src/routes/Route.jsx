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
import JLPTTestPage from "../pages/JLPTTest/JLPTTestPage";
import Information from "../pages/Information/Information";
import Policies from "../pages/Policies/Policies";
import AiKaiwaPage from "../pages/AiKaiwa/AiKaiwaPage";
// ===== Teacher/Admin/Moderator =====
import TeacherDashboard from "../pages/Teacher/Dashboard/TeacherDashboard";
import ManageCourses from "../pages/Teacher/Courses/ManageCourses";
import CourseInformation from "../pages/Teacher/Courses/CourseInformation/CourseInformation";

// ===== Guards =====
import ProtectedRoute from "./ProtectedRoute";
import TeacherProfilePage from "../pages/Teacher/TeacherProfilePage/TeacherProfilePage";
import CreateCoursePage from "../pages/Teacher/Courses/Create-Course/CreateCoursePage";

import JLPTList from "../pages/JLPT/JLPTList";
import ManageQueues from "../pages/Moderator/Queues/ManageQueues";
import CreateQuizPage from "../pages/Teacher/ManageDocument/Quiz/CreateQuizPage/CreateQuizPage";
import ManageDocumentPage from "../pages/Teacher/ManageDocument/ManageDocumentPage";
import TeacherRevenue from "../pages/Teacher/Revenue/TeacherRevenue";
// ===== Admin =====

import Dashboard from "../pages/Admin/pages/Dashboard";
import Users from "../pages/Admin/pages/Users";
import SystemLogs from "../pages/Admin/pages/SystemLogs";
import Complaints from "../pages/Admin/pages/Complaints";
import Revenue from "../pages/Admin/pages/Revenue";
import JlptEvents from "../pages/Admin/pages/JlptEvents";
import Withdrawals from "../pages/Admin/pages/Withdrawals";
import TeacherCertificates from "../pages/Admin/pages/TeacherCertificates";
import AiPackages from "../pages/Admin/pages/AiPackages";

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
      { path: "information", element: <Information /> },
      { path: "policies", element: <Policies /> },
      // ===== Learner Area (Yêu cầu đăng nhập) =====
      {
        element: (
          <ProtectedRoute
            allow={["LEARNER", "TEACHER", "ADMIN", "MODERATOR"]}
          />
        ),
        children: [
          { path: "payment", element: <PaymentPage /> },
          { path: "learner-dashboard", element: <LearnerDashboard /> },
          { path: "my-courses", element: <MyCourses /> },
          { path: "my-flashcards", element: <MyFlashcards /> },
          { path: "cart", element: <Cart /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "ai-kaiwa", element: <AiKaiwaPage /> },
          {
            path: "jlpt",
            element: <JLPTList />,
          },
          {
            path: "jlpt/test/:testId",
            element: <JLPTTestPage />, // import ở trên
          },

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
    // element: <ProtectedRoute allow={["TEACHER"]} />,
    children: [
      // Các trang có layout chung
      {
        path: "",
        element: <RoleLayout role="teacher" />,
        errorElement: <ErrorPage />,
        children: [
          { index: true, element: <TeacherDashboard /> },
          { path: "manage-courses", element: <ManageCourses /> },
          { path: "courseinfo/:id", element: <CourseInformation /> },
          {
            path: "manage-documents",
            element: <ManageDocumentPage />,
          },
          { path: "revenue", element: <TeacherRevenue /> },
          { path: "profile", element: <TeacherProfilePage /> },
          { path: "*", element: <ErrorPage /> },
        ],
      },

      //  Trang tách riêng, không dùng RoleLayout
      {
        path: "create-course",
        element: <CreateCoursePage />,
      },
      {
        path: "create-quiz",
        element: <CreateQuizPage />,
      },
    ],
  },
  { path: "*", element: <ErrorPage /> },

  // ===== ADMIN AREA =====
  {
    path: "admin",
    children: [
      {
        path: "",
        element: <RoleLayout role="admin" />,
        errorElement: <ErrorPage />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "users", element: <Users /> },

          { path: "teacher-certificates", element: <TeacherCertificates /> },
          { path: "jlpt", element: <JlptEvents /> },
          { path: "ai-packages", element: <AiPackages /> },
          { path: "revenue", element: <Revenue /> },
          { path: "withdrawals", element: <Withdrawals /> },
          { path: "complaints", element: <Complaints /> },
          { path: "policies", element: <Policies /> },
          { path: "system-logs", element: <SystemLogs /> },
          { path: "*", element: <ErrorPage /> },
        ],
      },
    ],
  },

  // ===== MODERATOR AREA =====
  {
    path: "moderator",
    // element: <ProtectedRoute allow={["MODERATOR"]} />,
    children: [
      {
        path: "",
        element: <RoleLayout role="moderator" />,
        errorElement: <ErrorPage />,
        children: [
          { index: true, element: <Stub title="Moderator Dashboard" /> },
          { path: "reviews", element: <Stub title="Reviews" /> },
          { path: "queues", element: <ManageQueues /> },
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
