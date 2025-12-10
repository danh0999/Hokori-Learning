import React, { useState } from "react";
import styles from "./EditProfileModal.module.scss";
import { useDispatch } from "react-redux";
import { updateMe } from "../../../redux/features/profileSlice";
import { toast } from "react-toastify";

const EditProfileModal = ({ user, onClose }) => {
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    displayName: user?.displayName || user?.username || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const err = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(0|\+84)[0-9]{8,10}$/;

    if (!form.displayName.trim()) {
      err.displayName = "Vui lòng nhập tên hiển thị.";
    }

    if (!form.email.trim() || !emailRegex.test(form.email.trim())) {
      err.email = "Email không hợp lệ.";
    }

    if (form.phoneNumber && !phoneRegex.test(form.phoneNumber.trim())) {
      err.phoneNumber = "Số điện thoại không hợp lệ.";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.warn("Vui lòng kiểm tra lại thông tin!");
      return;
    }

    const payload = {
      username: form.displayName.trim(),
      displayName: form.displayName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
    };

    await dispatch(updateMe(payload));
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3 className={styles.title}>Chỉnh sửa hồ sơ</h3>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="displayName">Tên hiển thị</label>
            <input
              id="displayName"
              type="text"
              name="displayName"
              value={form.displayName}
              onChange={handleChange}
            />
            {errors.displayName && (
              <span className={styles.error}>{errors.displayName}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />
            {errors.email && (
              <span className={styles.error}>{errors.email}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="phoneNumber">Số điện thoại</label>
            <input
              id="phoneNumber"
              type="text"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
            />
            {errors.phoneNumber && (
              <span className={styles.error}>{errors.phoneNumber}</span>
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
            <button type="submit" className={`${styles.btn} ${styles.save}`}>
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
