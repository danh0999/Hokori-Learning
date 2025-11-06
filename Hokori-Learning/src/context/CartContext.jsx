/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("hokori_cart");
    return saved ? JSON.parse(saved) : [];
  });

  // Dùng map để lưu thời gian hành động gần nhất cho từng course id
  const lastActionTime = useRef({});

  useEffect(() => {
    localStorage.setItem("hokori_cart", JSON.stringify(cart));
  }, [cart]);

  // ====== HELPER: debounce từng khóa học ======
  const canTriggerToast = (id) => {
    const now = Date.now();
    if (!lastActionTime.current[id] || now - lastActionTime.current[id] > 200) {
      lastActionTime.current[id] = now;
      return true;
    }
    return false;
  };

  //  Thêm vào giỏ hàng
  const addToCart = (course) => {
    setCart((prev) => {
      if (prev.some((c) => c.id === course.id)) {
        if (canTriggerToast(`warn-${course.id}`)) {
          toast.warn(`Khóa học "${course.title}" đã có trong giỏ hàng!`, {
            icon: "🛒",
            style: { backgroundColor: "#fff", color: "#111" },
            autoClose: 1500,
          });
        }
        return prev;
      }

      if (canTriggerToast(`add-${course.id}`)) {
        toast.success(`Đã thêm "${course.title}" vào giỏ hàng!`, {
          icon: "🛍️",
          style: { backgroundColor: "#fff", color: "#111" },
          autoClose: 1500,
        });
      }

      //  TODO: POST /api/cart/add
      return [...prev, course];
    });
  };

  //  Xóa khỏi giỏ hàng
  const removeFromCart = (id) => {
    const course = cart.find((c) => c.id === id);
    setCart((prev) => prev.filter((c) => c.id !== id));

    if (course && canTriggerToast(`remove-${course.id}`)) {
      toast.info(`Đã xóa "${course.title}" khỏi giỏ hàng.`, {
        icon: "🗑️",
        style: { backgroundColor: "#fff", color: "#111" },
        autoClose: 1200,
      });
    }
    //  TODO: DELETE /api/cart/:id
  };

  //  Xóa toàn bộ giỏ hàng
  const clearCart = () => {
    setCart([]);
    if (canTriggerToast("clear")) {
      toast.info("Đã xóa toàn bộ giỏ hàng!", {
        icon: "🧺",
        style: { backgroundColor: "#fff", color: "#111" },
        autoClose: 1500,
      });
    }
    // 🔜 TODO: DELETE /api/cart/clear
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
