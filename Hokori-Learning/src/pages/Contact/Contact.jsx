import React, { useState } from "react";
import styles from "./styles.module.scss";
import api from "../../configs/axios";
import { Button } from "../../components/Button/Button";
import { toast } from "react-toastify";

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Vui lòng nhập họ và tên";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Vui lòng nhập nội dung lời nhắn";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      try {
        await api.post("contact", {
          fullName: formData.name,
          email: formData.email,
          message: formData.message,
        });

        toast.success(
          "🎉 Cảm ơn bạn! Lời nhắn đã được gửi đến đội ngũ Hokori."
        );

        setFormData({ name: "", email: "", message: "" });
        setErrors({ name: "", email: "", message: "" });
      } catch (error) {
        console.error("Lỗi gửi lời nhắn:", error);

        const errorMsg =
          error.response?.data?.message ||
          error.response?.data ||
          "Có lỗi xảy ra. Vui lòng thử lại sau.";

        toast.error(`❌ ${errorMsg}`);
      }
    }
  };

  const isFormValid =
    formData.name.trim() &&
    formData.email.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
    formData.message.trim();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* LEFT PANEL - INFO */}
        <div className={styles.left}>
          <h2>Liên hệ Hokori</h2>
          <ul className={styles.infoList}>
            <li>
              <span>Email hỗ trợ:</span>
              <p>contact.hokorivn@gmail.com</p>
            </li>
            <li>
              <span>Hotline:</span>
              <p>028 3868 5509</p>
              <p>028 3868 5507</p>
            </li>
            <li>
              <span>Thời gian làm việc:</span>
              <p>Thứ Hai – Thứ Sáu: 8:30 – 17:30</p>
            </li>
          </ul>
        </div>

        {/* RIGHT PANEL - FORM */}
        <div className={styles.right}>
          <h2>Gửi lời nhắn đến Hokori</h2>
          <p className={styles.desc}>
            Nếu bạn có thắc mắc về{" "}
            <b>khóa học, lộ trình JLPT, hoặc tính năng AI</b>, vui lòng điền
            thông tin bên dưới. Đội ngũ Hokori sẽ phản hồi trong thời gian sớm
            nhất.
          </p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Họ và tên"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? styles.inputError : ""}
            />
            {errors.name && <span className={styles.error}>{errors.name}</span>}

            <input
              type="text"
              name="email"
              placeholder="Email của bạn"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? styles.inputError : ""}
            />
            {errors.email && (
              <span className={styles.error}>{errors.email}</span>
            )}

            <textarea
              name="message"
              placeholder="Nội dung lời nhắn (ví dụ: Vấn đề kỹ thuật, câu hỏi về khóa học, đề xuất tính năng...)"
              rows="4"
              value={formData.message}
              onChange={handleChange}
              className={errors.message ? styles.inputError : ""}
            />
            {errors.message && (
              <span className={styles.error}>{errors.message}</span>
            )}

            <Button
              content="Gửi lời nhắn"
              type="submit"
              className={`${styles.submitButton} ${
                !isFormValid ? styles.disabled : ""
              }`}
              disabled={!isFormValid}
            />
          </form>
        </div>
      </div>
    </div>
  );
};
