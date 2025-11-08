import React, { useState } from "react";
import styles from "./ChangePasswordModal.module.scss";
import { useDispatch } from "react-redux";
import { changePassword } from "../../../redux/features/profileSlice";

const ChangePasswordModal = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const err = {};
    if (!form.currentPassword.trim())
      err.currentPassword = "Nhập mật khẩu hiện tại.";
    if (!form.newPassword.trim())
      err.newPassword = "Nhập mật khẩu mới.";
    else if (form.newPassword.length < 5)
      err.newPassword = "Mật khẩu mới ít nhất 5 ký tự.";
    else if (form.newPassword === form.currentPassword)
      err.newPassword = "Mật khẩu mới không được trùng mật khẩu cũ.";
    if (form.confirmPassword !== form.newPassword)
      err.confirmPassword = "Xác nhận mật khẩu không khớp.";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    await dispatch(changePassword(form));
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3 className={styles.title}>Đổi mật khẩu</h3>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Mật khẩu hiện tại
            <input
              type="password"
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
              placeholder="Nhập mật khẩu hiện tại"
            />
            {errors.currentPassword && (
              <span className={styles.error}>{errors.currentPassword}</span>
            )}
          </label>

          <label>
            Mật khẩu mới
            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              placeholder="Nhập mật khẩu mới"
            />
            {errors.newPassword && (
              <span className={styles.error}>{errors.newPassword}</span>
            )}
          </label>

          <label>
            Xác nhận mật khẩu mới
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Nhập lại mật khẩu mới"
            />
            {errors.confirmPassword && (
              <span className={styles.error}>{errors.confirmPassword}</span>
            )}
          </label>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
            >
              Hủy
            </button>
            <button type="submit" className={styles.saveBtn}>
              Xác nhận
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
