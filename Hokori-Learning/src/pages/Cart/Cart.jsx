import React from "react";
import styles from "./CartPage.module.scss";
import CartItem from "./components/CartItem";
import OrderSummary from "./components/OrderSummary";
import RecommendedCourses from "./components/RecommendedCourses";

const CartPage = () => {
  const courses = [
    {
      id: 1,
      title: "Tiếng Nhật Cơ Bản N5 - Từ Zero Đến Thành Thạo",
      teacher: "Sensei Yamada",
      level: "JLPT N5",
      lessons: 42,
      duration: "8.5 giờ",
      price: 599000,
      oldPrice: 899000,
      discount: "-33%",
    },
    {
      id: 2,
      title: "Kanji Mastery N4 - Học Kanji Hiệu Quả",
      teacher: "Sensei Tanaka",
      level: "JLPT N4",
      lessons: 35,
      duration: "6.2 giờ",
      price: 449000,
      oldPrice: 699000,
      discount: "-36%",
    },
    {
      id: 3,
      title: "Giao Tiếp Tiếng Nhật Thực Tế",
      teacher: "Sensei Sato",
      level: "N3-N2",
      lessons: 28,
      duration: "5.8 giờ",
      price: 399000,
    },
  ];

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Giỏ hàng của bạn</h1>
          <p>{courses.length} khóa học trong giỏ hàng</p>
        </div>

        <div className={styles.grid}>
          <div className={styles.courseList}>
            {courses.map((course) => (
              <CartItem key={course.id} course={course} />
            ))}
          </div>

          <OrderSummary courses={courses} />
        </div>

        <RecommendedCourses />
      </div>
    </main>
  );
};

export default CartPage;
