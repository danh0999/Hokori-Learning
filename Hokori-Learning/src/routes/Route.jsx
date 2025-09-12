import Home from "../pages/Home";
import About from "../pages/About";
import ErrorPage from "../pages/ErrorPage.jsx";
import MainLayout from "../layouts/Mainlayout.jsx";
import React from "react";
const routes = [
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/about", element: <About /> },
    ],
  },
];

export default routes;
