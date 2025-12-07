import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import styles from "./CartPage.module.scss";
import CartItem from "./components/CartItem";
import OrderSummary from "./components/OrderSummary";
import RecommendedCourses from "./components/RecommendedCourses";

import {
  fetchCart,
  removeFromCart,
  clearCartOnServer,
} from "../../redux/features/cartSlice";

const CartPage = () => {
  const dispatch = useDispatch();
  const { items, status, error, cartId } = useSelector((state) => state.cart);

  // ====== Load cart khi vào trang ======
  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  // ====== Xử lý xoá 1 dòng khỏi giỏ ======
  const handleRemoveItem = (itemId) => {
    if (!itemId) return;
    dispatch(removeFromCart(itemId));
  };

  // ====== Xử lý xoá hết giỏ ======
  const handleClearCart = () => {
    if (!items || items.length === 0) return;
    const ok = window.confirm("Bạn có chắc muốn xoá toàn bộ giỏ hàng?");
    if (!ok) return;
    dispatch(clearCartOnServer());
  };

  // ====== Chuẩn hoá data từ BE sang format FE dùng ======
  const normalizedItems = (items || []).map((item) => {
    // BE trả: itemId, courseId, quantity, totalPrice (VND), selected, courseThumbnail, courseName, teacherName,...
    const priceFromServer = item.totalPrice ?? item.price ?? 0; // VND (đã là tổng tiền 1 dòng)
    const priceCentsFromServer =
      item.priceCents ?? item.totalPriceCents ?? priceFromServer * 100;

    const title = item.courseName || item.title || `Khóa học #${item.courseId}`;

    const thumbnail = item.courseThumbnail || item.thumbnail || null;

    return {
      cartItemId: item.itemId,
      id: item.courseId,
      title,
      price: Number(priceFromServer) || 0, // tổng tiền 1 dòng (VND)
      priceCents: Number(priceCentsFromServer) || 0,
      quantity: item.quantity ?? 1,
      selected: item.selected ?? true,
      teacherName: item.teacherName || "Giảng viên",
      thumbnail,
    };
  });

  const isEmpty = !normalizedItems.length;

  return (
    <main className={styles.cartPage}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Giỏ hàng của bạn</h1>

        {/* ====== Trạng thái loading / error ====== */}
        {status === "loading" && (
          <div className={styles.stateBox}>Đang tải giỏ hàng...</div>
        )}

        {error && (
          <div className={`${styles.stateBox} ${styles.error}`}>
            Đã có lỗi xảy ra: {error}
          </div>
        )}

        {/* ====== Nội dung giỏ hàng ====== */}
        {!isEmpty && status !== "loading" && (
          <div className={styles.content}>
            {/* ==== Cột trái: danh sách item ==== */}
            <div className={styles.itemsColumn}>
              <div className={styles.itemsHeader}>
                <span>Khoá học</span>
                <button
                  type="button"
                  className={styles.clearAllBtn}
                  onClick={handleClearCart}
                >
                  Xoá toàn bộ
                </button>
              </div>

              <div className={styles.itemsList}>
                {normalizedItems.map((course) => (
                  <CartItem
                    key={course.cartItemId}
                    course={course}
                    cartItemId={course.cartItemId}
                    onRemove={() => handleRemoveItem(course.cartItemId)}
                  />
                ))}
              </div>
            </div>

            {/* ==== Cột phải: Order summary & checkout ==== */}
            <OrderSummary courses={normalizedItems} cartId={cartId} />
          </div>
        )}

        {/* ====== Khi giỏ hàng trống ====== */}
        {isEmpty && status !== "loading" && (
          <div className={styles.emptyBox}>
            <p>Giỏ hàng của bạn đang trống.</p>
            <p>Hãy khám phá thêm khoá học ở Marketplace nhé!</p>
          </div>
        )}

        {/* ====== Gợi ý khoá học ====== */}
        <RecommendedCourses />
      </div>
    </main>
  );
};

export default CartPage;
