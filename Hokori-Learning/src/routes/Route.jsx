import Home from "../pages/Home/Home.jsx";
import About from "../pages/About";
import ErrorPage from "../pages/ErrorPage.jsx";
import MainLayout from "../layouts/Mainlayout.jsx";
import React from "react";
import Login from "../pages/authen/login/login.jsx";
import Register from "../pages/authen/register/register.jsx";
import { CoursePage } from "../pages/Lesson/CoursePage.jsx";
import TeacherDashboardLayout from "../pages/Teacher/TeacherDashboardLayout.jsx";
const routes = [
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  //Guest,Learner
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/about", element: <About /> },
      { path: "/course", element: <CoursePage /> },
    ],
  },
  {
    path: "/teacher",
    element: <TeacherDashboardLayout />,
    errorElement: <ErrorPage />,
  },
];

export default routes;
