import React, { useState, useEffect } from "react";
import styles from "./PersonalInfoForm.module.scss";

const PersonalInfoForm = ({ user, saving, onSave }) => {
  // ✅ Hooks luôn được gọi ở đầu
  const [form, setForm] = useState({
    displayName: "",
    country: "",
    nativeLanguage: "",
    currentJlptLevel: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        displayName: user.displayName || "",
        country: user.country || "",
        nativeLanguage: user.nativeLanguage || "",
        currentJlptLevel: user.currentJlptLevel || "",
      });
    }
  }, [user]);

  // Nếu chưa có user, render trống (sau khi gọi hook)
  if (!user) return null;

  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <section className={styles.formSection}>
      <h2>Thông tin cá nhân</h2>
      <form onSubmit={onSubmit}>
        <label>
          Tên hiển thị
          <input
            name="displayName"
            value={form.displayName}
            onChange={onChange}
            placeholder="Nhập tên hiển thị"
          />
        </label>

        <label>
          Quốc gia
          <select name="country" value={form.country} onChange={onChange}>
            <option value="">-- Chọn --</option>
            <option>Việt Nam</option>
            <option>Nhật Bản</option>
            <option>Mỹ</option>
            <option>Hàn Quốc</option>
          </select>
        </label>

        <label>
          Ngôn ngữ mẹ đẻ
          <select
            name="nativeLanguage"
            value={form.nativeLanguage}
            onChange={onChange}
          >
            <option value="">-- Chọn --</option>
            <option>Tiếng Việt</option>
            <option>Tiếng Anh</option>
            <option>Tiếng Nhật</option>
            <option>Tiếng Hàn</option>
            <option>Tiếng Trung</option>
          </select>
        </label>

        <label>
          Trình độ JLPT hiện tại
          <select
            name="currentJlptLevel"
            value={form.currentJlptLevel}
            onChange={onChange}
          >
            <option value="">-- Chọn --</option>
            <option>N5</option>
            <option>N4</option>
            <option>N3</option>
            <option>N2</option>
            <option>N1</option>
          </select>
        </label>

        <button type="submit" className={styles.saveBtn} disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </form>
    </section>
  );
};

export default PersonalInfoForm;
