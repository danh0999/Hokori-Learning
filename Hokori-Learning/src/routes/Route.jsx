import Home from "../pages/Home/Home";

import ErrorPage from "../pages/ErrorPage";
import MainLayout from "../layouts/Mainlayout";
import CourseDetail from "../pages/CourseDetail/CourseDetail";
import React from "react";
import Login from "../pages/authen/login/login";
import Register from "../pages/authen/register/register";
import PaymentPage from "../pages/Payment/PaymentPage";
import TeacherDashboardLayout from "../pages/Teacher/TeacherDashboardLayout";
import Marketplace from "../pages/Marketplace/Marketplace";
import AboutPage from "../pages/About/AboutPage";


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

      { path: "/marketplace", element: <Marketplace /> },

      { path: "/course/:courseId", element: <CourseDetail /> },
      { path: "/about", element: <AboutPage /> },
      { path: "/payment", element: <PaymentPage /> }
    ],
  },
  {
    path: "/teacher",
    element: <TeacherDashboardLayout />,
    errorElement: <ErrorPage />,

  },
];

export default routes;
