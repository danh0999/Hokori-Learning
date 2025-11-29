import React, { useState } from "react";
import styles from "../PaymentPage.module.scss";

export default function PaymentForm({ onSubmit }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    note: "",
    paymentMethod: "",
    agree: false,
  });

  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    let msg = "";

    switch (name) {
      case "fullName":
        if (!value.trim()) msg = "Vui lòng nhập họ và tên";
        break;
      case "email":
        if (!value.trim()) msg = "Vui lòng nhập email";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          msg = "Email không hợp lệ";
        break;
      case "phone":
        if (!value.trim()) msg = "Vui lòng nhập số điện thoại";
        else if (!/^[0-9]{9,11}$/.test(value))
          msg = "Số điện thoại không hợp lệ";
        break;
      case "paymentMethod":
        if (!value) msg = "Chọn phương thức thanh toán";
        break;
      case "agree":
        if (!value) msg = "Bạn phải đồng ý với Điều khoản & Chính sách";
        break;
      default:
        break;
    }

    return msg;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setForm((prev) => ({ ...prev, [name]: newValue }));

    const errMsg = validateField(name, newValue);
    setErrors((prev) => ({ ...prev, [name]: errMsg }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    Object.keys(form).forEach((key) => {
      const msg = validateField(key, form[key]);
      if (msg) newErrors[key] = msg;
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // 🔥 Không còn alert mock!
      // Gửi data cho PaymentPage xử lý thực tế (API / redirect VNPay / navigate...)
      onSubmit?.(form);
    }
  };

  return (
    <div className={styles.rightCol}>
      <form onSubmit={handleSubmit}>
        {/* === Thông tin học viên === */}
        <div className={styles.card}>
          <h2>Thông tin học viên</h2>

          <div className={styles.form}>
            <label>
              Họ và tên *
              <input
                name="fullName"
                type="text"
                placeholder="Nhập họ và tên"
                value={form.fullName}
                onChange={handleChange}
              />
              {errors.fullName && (
                <span className={styles.error}>{errors.fullName}</span>
              )}
            </label>

            <label>
              Email *
              <input
                name="email"
                type="email"
                placeholder="example@email.com"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email && (
                <span className={styles.error}>{errors.email}</span>
              )}
            </label>

            <label>
              Số điện thoại *
              <input
                name="phone"
                type="tel"
                placeholder="0123 456 789"
                value={form.phone}
                onChange={handleChange}
              />
              {errors.phone && (
                <span className={styles.error}>{errors.phone}</span>
              )}
            </label>

            <label>
              Ghi chú (tuỳ chọn)
              <textarea
                name="note"
                rows="3"
                placeholder="Thông tin bổ sung..."
                value={form.note}
                onChange={handleChange}
              />
            </label>
          </div>
        </div>

        {/* === Phương thức thanh toán === */}
        <div className={styles.card}>
          <h3>Phương thức thanh toán</h3>
          <div className={styles.methods}>
            {[
              { value: "domestic", label: "Thẻ ngân hàng nội địa" },
              { value: "international", label: "Thẻ quốc tế (Visa/Mastercard)" },
              { value: "ewallet", label: "Ví điện tử (Momo, ZaloPay, VNPay)" },
            ].map((opt) => (
              <label key={opt.value}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value={opt.value}
                  checked={form.paymentMethod === opt.value}
                  onChange={handleChange}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
          {errors.paymentMethod && (
            <span className={styles.error}>{errors.paymentMethod}</span>
          )}
        </div>

        {/* === Checkbox & submit === */}
        <div className={styles.card}>
          <label className={styles.terms}>
            <input
              type="checkbox"
              name="agree"
              checked={form.agree}
              onChange={handleChange}
            />
            <span>
              Tôi đồng ý với{" "}
              <a href="#" className={styles.link}>
                Điều khoản & Chính sách
              </a>{" "}
              của Hokori
            </span>
          </label>

          {errors.agree && (
            <span className={styles.error}>{errors.agree}</span>
          )}

          <button type="submit" className={styles.payBtn}>
            Hoàn tất thanh toán
          </button>
          <p className={styles.note}>
            Thông tin của bạn được bảo mật và an toàn
          </p>
        </div>
      </form>
    </div>
  );
}
