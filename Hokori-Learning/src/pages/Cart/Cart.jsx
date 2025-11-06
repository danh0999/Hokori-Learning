import React from "react";
import styles from "./CartPage.module.scss";
import CartItem from "./components/CartItem";
import OrderSummary from "./components/OrderSummary";
import RecommendedCourses from "./components/RecommendedCourses";
import { useCart } from "../../context/CartContext";

const CartPage = () => {
  const { cart, removeFromCart } = useCart(); // ✅ giỏ hàng global

  //  Lưu để sau (mock): remove khỏi cart + sau này call API
  const handleSaveForLater = (id) => {
    const saved = cart.find((c) => c.id === id);
    if (saved) {
      console.log("Đã lưu khóa học:", saved.title);
      // 🔜 TODO: POST /api/cart/save-later
      removeFromCart(id);
    }
  };

  // Thêm vào yêu thích (mock)
  const handleAddToFavorite = (id) => {
    const fav = cart.find((c) => c.id === id);
    if (fav) {
      console.log("Đã thêm vào yêu thích:", fav.title);
      //  TODO: POST /api/favorites
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Giỏ hàng của bạn</h1>
          <p>{cart.length} khóa học trong giỏ hàng</p>
        </div>

        {cart.length === 0 ? (
          <p className={styles.empty}>Giỏ hàng trống, hãy thêm khóa học!</p>
        ) : (
          <div className={styles.grid}>
            <div className={styles.courseList}>
              {cart.map((course) => (
                <CartItem
                  key={course.id}
                  course={course}
                  onRemove={removeFromCart}
                  onSave={handleSaveForLater}
                  onFavorite={handleAddToFavorite}
                />
              ))}
            </div>

            <OrderSummary courses={cart} />
          </div>
        )}

        <RecommendedCourses />
      </div>
    </main>
  );
};

export default CartPage;
