// main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AppProviders from "./providers/AppProviders";
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppProviders>
      <App />
      <ToastContainer />
    </AppProviders>
  </React.StrictMode>
);
