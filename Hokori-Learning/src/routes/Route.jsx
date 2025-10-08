import Home from "../pages/Home/Home.jsx";

import ErrorPage from "../pages/ErrorPage.jsx";
import MainLayout from "../layouts/Mainlayout.jsx";
import React from "react";
import Login from "../pages/authen/login/login.jsx";
import Register from "../pages/authen/register/register.jsx";

import Marketplace from '../pages/Marketplace/Marketplace';
import AboutPage from "../pages/About/AboutPage";


const routes = [
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: "/", element: <Home /> },



      { path: "/marketplace", element: <Marketplace /> },


      { path: "/about", element: <AboutPage /> },
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
