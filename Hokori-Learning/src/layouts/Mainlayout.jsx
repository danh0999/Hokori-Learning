import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./components/Header/Header.jsx";
import { Footer } from "./components/Footer/Footer.jsx";

const MainLayout = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100vw",        // 🔑 phải là 100vw, không phải 100%
        overflowX: "hidden",   // tránh thanh scroll ngang
      }}
    >
      <Header />
      <main style={{ flex: 1, width: "100%" }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
