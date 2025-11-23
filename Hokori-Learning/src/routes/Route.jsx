import React from "react";
import { Navigate } from "react-router-dom";

// ===== Layouts =====
import MainLayout from "../layouts/Mainlayout";
import RoleLayout from "../layouts/RoleLayouts/RoleLayout";
import ErrorPage from "../pages/ErrorPage";

// ===== Public =====
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
import AiAnalysePage from "../pages/AiAnalyse/AiAnalysePage";
// ===== Teacher =====
import TeacherDashboard from "../pages/Teacher/Dashboard/TeacherDashboard";
import ManageCourses from "../pages/Teacher/Courses/ManageCourses";
import CourseInformation from "../pages/Teacher/Courses/CourseInformation/CourseInformation";
import TeacherProfilePage from "../pages/Teacher/TeacherProfilePage/TeacherProfilePage";
import CreateCoursePage from "../pages/Teacher/Courses/Create-Course/CreateCoursePage";
import CreateQuizPage from "../pages/Teacher/ManageDocument/Quiz/CreateQuizPage/CreateQuizPage";
import ManageDocumentPage from "../pages/Teacher/ManageDocument/ManageDocumentPage";
import TeacherRevenue from "../pages/Teacher/Revenue/TeacherRevenue";

// ===== Moderator =====
import JLPTList from "../pages/JLPT/JLPTList";
import ManageQueues from "../pages/Moderator/Queues/ManageQueues";
import JlptEventsPage from "../pages/Moderator/JlptEventsPage/JlptEventsPage";

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

// ===== Guards =====
import ProtectedRoute from "./ProtectedRoute";
import JlptTestBuilderPage from "../pages/Moderator/JlptEventsPage/JlptTestBuilderPage/JlptTestBuilderPage";

// ===== Stub for unfinished pages =====
const Stub = ({ title }) => <div style={{ padding: 12 }}>{title}</div>;

const routes = [
  // ============================
  // AUTH (No layout)
  // ============================
  { path: "login", element: <Login /> },
  { path: "register", element: <Register /> },

  // ============================
  // PUBLIC + LEARNER AREA
  // ============================
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      { path: "marketplace", element: <Marketplace /> },
      { path: "course/:id", element: <CourseDetail /> },
      { path: "about", element: <AboutPage /> },
      { path: "contact", element: <Contact /> },
      { path: "information", element: <Information /> },
      { path: "policies", element: <Policies /> },

      // Protected Routes (Learner/Teacher/Admin/Moderator)
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
          { path: "ai-analyse", element: <AiAnalysePage /> },
          { path: "jlpt", element: <JLPTList /> },
          { path: "jlpt/test/:testId", element: <JLPTTestPage /> },

          { path: "course/:courseId/lesson/:lessonId", element: <LessonPlayer /> },
          { path: "course/:courseId/lesson/:lessonId/quiz/:quizId", element: <QuizPage /> },

        ],
      },

      // fallback for all unknown under MainLayout
      { path: "*", element: <ErrorPage /> },
    ],
  },

  // ============================
  // TEACHER AREA
  // ============================
  {
    path: "teacher",
    children: [
      {
        path: "",
        element: <RoleLayout role="teacher" />,
        children: [
          { index: true, element: <TeacherDashboard /> },
          { path: "manage-courses", element: <ManageCourses /> },
          { path: "courseinfo/:id", element: <CourseInformation /> },
          { path: "manage-documents", element: <ManageDocumentPage /> },
          { path: "revenue", element: <TeacherRevenue /> },
          { path: "profile", element: <TeacherProfilePage /> },

          { path: "*", element: <ErrorPage /> },
        ],
      },

      // ✅ Trang tách riêng, không dùng RoleLayout
      {
        path: "create-course",
        element: <CreateCoursePage />,
      },
      {
        path: "create-course/:courseId",
        element: <CreateCoursePage />,
      },
      {
        path: "create-quiz",
        element: <CreateQuizPage />,
      },
      { path: "create-course", element: <CreateCoursePage /> },
      { path: "create-quiz", element: <CreateQuizPage /> },
    ],
  },

  // ============================
  // MODERATOR AREA
  // ============================
  {
    path: "moderator",
    children: [
      {
        path: "",
        element: <RoleLayout role="moderator" />,
        children: [
          { index: true, element: <Stub title="Moderator Dashboard" /> },
          { path: "reviews", element: <Stub title="Reviews" /> },
          { path: "queues", element: <ManageQueues /> },
          { path: "jlptevents", element: <JlptEventsPage /> },
          { path: "ai-check", element: <Stub title="AI Check" /> },
          { path: "messages", element: <Stub title="Messages" /> },
          { path: "settings", element: <Stub title="Settings" /> },

          { path: "*", element: <ErrorPage /> },
        ],
      },
      {
        path: "jlptevents/:eventId/tests",
        element: <JlptTestBuilderPage />,
      },
    ],
  },

  // ============================
  // ADMIN AREA
  // ============================
  {
    path: "admin",
    children: [
      {
        path: "",
        element: <RoleLayout role="admin" />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "users", element: <Users /> },
          { path: "teacher-certificates", element: <TeacherCertificates /> },
          { path: "events", element: <JlptEvents /> },
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

  // ============================
  // GLOBAL FALLBACK
  // ============================
  { path: "*", element: <ErrorPage /> },
];

export default routes;
