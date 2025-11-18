import React, { useEffect } from "react";
import styles from "./CartPage.module.scss";
import CartItem from "./components/CartItem";
import OrderSummary from "./components/OrderSummary";
import RecommendedCourses from "./components/RecommendedCourses";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchCart,
  removeFromCart,
  clearCartOnServer,
} from "../../redux/features/cartSlice";

const CartPage = () => {
  const dispatch = useDispatch();
  const { items, status, error } = useSelector((state) => state.cart);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCart());
    }
  }, [status, dispatch]);

  const handleRemove = (cartItemId) => {
    dispatch(removeFromCart(cartItemId));
  };

  const handleClearCart = () => {
    dispatch(clearCartOnServer());
  };

  // Chuẩn hóa data: cart item -> course
  const normalizedItems = (items || []).map((item) => {
    return {
      cartItemId: item.itemId,
      id: item.courseId,
      title: "Khóa học #" + item.courseId, // tạm placeholder
      price: item.totalPrice / item.quantity,
      quantity: item.quantity,
      selected: item.selected,
    };
  });

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Giỏ hàng của bạn</h1>
          <p>{normalizedItems.length} khóa học trong giỏ hàng</p>
        </div>

        {status === "loading" && (
          <p className={styles.loading}>Đang tải giỏ hàng...</p>
        )}

        {status === "failed" && (
          <p className={styles.error}>
            Không thể tải giỏ hàng: {String(error || "Unknown error")}
          </p>
        )}

        {status !== "loading" && normalizedItems.length === 0 && (
          <p className={styles.empty}>Giỏ hàng trống, hãy thêm khóa học!</p>
        )}

        {normalizedItems.length > 0 && (
          <div className={styles.grid}>
            <div className={styles.courseList}>
              {normalizedItems.map((course) => (
                <CartItem
                  key={course.cartItemId}
                  course={course}
                  onRemove={() => handleRemove(course.cartItemId)}
                />
              ))}

              <button onClick={handleClearCart} className={styles.clearBtn}>
                Xóa toàn bộ giỏ hàng
              </button>
            </div>

            <OrderSummary courses={normalizedItems} />
          </div>
        )}

        <RecommendedCourses />
      </div>
    </main>
  );
};

export default CartPage;
