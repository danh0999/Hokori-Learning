import React, { useState } from "react";
import styles from "./EditProfileModal.module.scss";
import { useDispatch } from "react-redux";
import { updateMe } from "../../../redux/features/profileSlice";
import { toast } from "react-toastify";

const EditProfileModal = ({ user, onClose }) => {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const err = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(0|\+84)[0-9]{8,10}$/;

    if (!form.username.trim()) err.username = "Vui lòng nhập tên hiển thị.";
    if (!form.email.trim() || !emailRegex.test(form.email))
      err.email = "Email không hợp lệ.";
    if (form.phoneNumber && !phoneRegex.test(form.phoneNumber))
      err.phoneNumber = "Số điện thoại không hợp lệ.";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    await dispatch(updateMe(form));
    toast.success("✅ Cập nhật hồ sơ thành công!");
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>Chỉnh sửa hồ sơ</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            Tên hiển thị
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
            />
            {errors.username && (
              <span className={styles.error}>{errors.username}</span>
            )}
          </label>

          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />
            {errors.email && (
              <span className={styles.error}>{errors.email}</span>
            )}
          </label>

          <label>
            Số điện thoại
            <input
              type="text"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
            />
            {errors.phoneNumber && (
              <span className={styles.error}>{errors.phoneNumber}</span>
            )}
          </label>

          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className={styles.save}>
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
