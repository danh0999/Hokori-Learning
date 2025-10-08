import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./components/Header/Header.jsx";
import { Footer } from "./components/Footer/Footer.jsx";
import ScrollToTop from "../components/ScrollToTopAuto/ScrollToTop.jsx";
const MainLayout = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100vw",     
        overflowX: "hidden",   // tránh thanh scroll ngang
      }}
    >
       <ScrollToTop />
      <Header />
      <main style={{ flex: 1, width: "100%" }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
