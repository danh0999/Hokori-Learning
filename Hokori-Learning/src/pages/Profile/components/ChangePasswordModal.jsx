import React, { useState } from "react";
import styles from "./ChangePasswordModal.module.scss";

const ChangePasswordModal = ({ open, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  if (!open) return null;

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      alert("Mật khẩu mới không khớp!");
      return;
    }
    onSubmit(form);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>Đổi mật khẩu</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            name="currentPassword"
            placeholder="Mật khẩu hiện tại"
            onChange={handleChange}
          />
          <input
            type="password"
            name="newPassword"
            placeholder="Mật khẩu mới"
            onChange={handleChange}
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Xác nhận mật khẩu mới"
            onChange={handleChange}
          />
          <div className={styles.actions}>
            <button type="button" onClick={onClose}>
              Hủy
            </button>
            <button type="submit">Xác nhận</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
