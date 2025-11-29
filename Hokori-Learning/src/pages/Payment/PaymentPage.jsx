import React, { useEffect, useState } from "react";
import styles from "./PaymentPage.module.scss";
import CourseInfo from "./components/CourseInfo";
import PaymentForm from "./components/PaymentForm";

export default function PaymentPage() {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("pendingOrder");
    if (!saved) return;

    setOrder(JSON.parse(saved));
  }, []);

  if (!order) {
    return <div className={styles.empty}>Không có đơn hàng để thanh toán.</div>;
  }

  return (
    <main className={styles.payment}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Thanh toán khóa học</h1>
          <p>Hoàn tất thông tin để bắt đầu học tập cùng Hokori</p>
        </div>

        <div className={styles.grid}>
          {/* TRUYỀN ORDER ITEMS VÀO CourseInfo */}
          <CourseInfo courses={order.items} total={order.final} />

          <PaymentForm
            onSubmit={(form) => {
              console.log("Order info:", order);
              console.log("User info:", form);

              // TODO: CALL API /orders - POST
              alert("Thanh toán thành công!");

              // clear
              localStorage.removeItem("pendingOrder");
            }}
          />
        </div>
      </div>
    </main>
  );
}
