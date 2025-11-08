import React from "react";
import styles from "./CartPage.module.scss";
import CartItem from "./components/CartItem";
import OrderSummary from "./components/OrderSummary";
import RecommendedCourses from "./components/RecommendedCourses";
import { useSelector, useDispatch } from "react-redux";
import {
  removeItem,
  clearCart /* , fetchCart */,
} from "../../redux/features/cartSlice";
//           ↑↑↑ fetchCart để dành cho API thật, hiện tại tạm comment lại

const CartPage = () => {
  const dispatch = useDispatch();

  //  DEMO: lấy giỏ hàng trực tiếp từ Redux (đã persist bằng redux-persist)
  const items = useSelector((state) => state.cart.items);

  //  SAU NÀY KHI CÓ API GIỎ HÀNG (backend) THÌ DÙNG ĐOẠN NÀY:
  /*
  const { items, status } = useSelector((state) => state.cart);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCart()); // gọi API /api/cart để lấy giỏ hàng từ server
    }
  }, [status, dispatch]);
  */

  const handleRemove = (id) => {
    dispatch(removeItem(id));
  };

  const handleClearCart = () => {
    dispatch(clearCart());
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Giỏ hàng của bạn</h1>
          <p>{items.length} khóa học trong giỏ hàng</p>
        </div>

        {items.length === 0 ? (
          <p className={styles.empty}>Giỏ hàng trống, hãy thêm khóa học!</p>
        ) : (
          <div className={styles.grid}>
            <div className={styles.courseList}>
              {items.map((course) => (
                <CartItem
                  key={course.id}
                  course={course}
                  onRemove={handleRemove}
                  // onSave / onFavorite nếu cần sau này
                />
              ))}

              <button onClick={handleClearCart} className={styles.clearBtn}>
                Xóa toàn bộ giỏ hàng
              </button>
            </div>

            <OrderSummary courses={items} />
          </div>
        )}

        <RecommendedCourses />
      </div>
    </main>
  );
};

export default CartPage;
