import React, { useEffect } from "react";
import styles from "./CartPage.module.scss";
import CartItem from "./components/CartItem";
import OrderSummary from "./components/OrderSummary";
import RecommendedCourses from "./components/RecommendedCourses";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchCart,
  clearCart,
  removeCartItem,
} from "../../redux/features/cartSlice";

const CartPage = () => {
  const dispatch = useDispatch();

  //  Lấy dữ liệu giỏ hàng từ Redux
  const { items, loading } = useSelector(
    (state) => state.cart
  );

  //  Lấy giỏ hàng từ backend khi vào trang
  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);
  //  Xóa 1 khóa học khỏi giỏ
  const handleRemove = (itemId) => {
    dispatch(removeCartItem(itemId));
  };

  //  Xóa toàn bộ giỏ
  const handleClearCart = () => {
    if (window.confirm("Bạn có chắc muốn xóa toàn bộ giỏ hàng?")) {
      dispatch(clearCart());
    }
  };

  // 🔹 Hiển thị khi đang tải
  if (loading) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <p>Đang tải giỏ hàng...</p>
        </div>
      </main>
    );
  }

  //  Hiển thị khi giỏ trống
  if (!items || items.length === 0) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <h1>Giỏ hàng của bạn</h1>
          <p className={styles.empty}>Giỏ hàng trống, hãy thêm khóa học!</p>
          <RecommendedCourses />
        </div>
      </main>
    );
  }

  //  Giao diện chính
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* ===== Header ===== */}
        <div className={styles.header}>
          <h1>Giỏ hàng của bạn</h1>
          <p>{items.length} khóa học trong giỏ hàng</p>
        </div>

        {/* ===== Content Grid ===== */}
        <div className={styles.grid}>
          {/* Danh sách khóa học */}
          <div className={styles.courseList}>
            {items.map((item, index) => (
              //  thêm key dự phòng cả itemId, courseId, index để đảm bảo luôn unique
              <CartItem
                key={item.itemId || item.courseId || index}
                item={item}
                onRemove={() => handleRemove(item.itemId)}
              />
            ))}

            <button onClick={handleClearCart} className={styles.clearBtn}>
              Xóa toàn bộ giỏ hàng
            </button>
          </div>

          {/*  Truyền đúng props cho OrderSummary */}
          <OrderSummary courses={items} />
        </div>

        {/* Gợi ý khóa học */}
        <RecommendedCourses />
      </div>
    </main>
  );
};

export default CartPage;
