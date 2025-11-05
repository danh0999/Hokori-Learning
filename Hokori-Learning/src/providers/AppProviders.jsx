import React from "react";
import { CartProvider } from "../context/CartContext";
// sau này thêm AuthProvider, ThemeProvider...

const AppProviders = ({ children }) => {
  return <CartProvider>{children}</CartProvider>;
};

export default AppProviders;
