import Home from "../pages/Home/Home.jsx";
import About from "../pages/About";
import ErrorPage from "../pages/ErrorPage.jsx";
import MainLayout from "../layouts/Mainlayout.jsx";
import React from "react";
import Login from "../pages/authen/login/login.jsx";
import Register from "../pages/authen/register/register.jsx";
import { CoursePage } from "../pages/Lesson/CoursePage.jsx";
const routes = [
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
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
];

export default routes;
