import React, { useState } from "react";
import styles from "./ChangePasswordModal.module.scss";
import { useDispatch } from "react-redux";
import { changePassword } from "../../../redux/features/profileSlice";
import { toast } from "react-toastify";

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
      err.currentPassword = "Vui lòng nhập mật khẩu hiện tại.";
    if (!form.newPassword.trim())
      err.newPassword = "Vui lòng nhập mật khẩu mới.";
    else if (form.newPassword.length < 5)
      err.newPassword = "Mật khẩu mới phải có ít nhất 5 ký tự.";
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
    toast.success("Đổi mật khẩu thành công!");
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3 className={styles.title}>Đổi mật khẩu</h3>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Mật khẩu hiện tại</label>
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
          </div>

          <div className={styles.field}>
            <label>Mật khẩu mới</label>
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
          </div>

          <div className={styles.field}>
            <label>Xác nhận mật khẩu mới</label>
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
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.cancel}`}
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`${styles.btn} ${styles.confirm}`}
            >
              Xác nhận
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
