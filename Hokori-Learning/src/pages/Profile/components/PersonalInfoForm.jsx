import React, { useState } from "react";
import styles from "./PersonalInfoForm.module.scss";

const PersonalInfoForm = ({ user, onSave }) => {
  const [form, setForm] = useState({
    displayName: user.displayName || "",
    country: user.country || "",
    nativeLanguage: user.nativeLanguage || "",
    currentJlptLevel: user.currentJlptLevel || "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <section className={styles.formSection}>
      <h2>Thông tin cá nhân</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Tên hiển thị
          <input name="displayName" value={form.displayName} onChange={handleChange} />
        </label>
        <label>
          Quốc gia
          <select name="country" value={form.country} onChange={handleChange}>
            <option>Việt Nam</option>
          
          </select>
        </label>
        <label>
          Ngôn ngữ mẹ đẻ
          <select name="nativeLanguage" value={form.nativeLanguage} onChange={handleChange}>
            <option>Tiếng Việt</option>
          
          </select>
        </label>
        <label>
          Trình độ JLPT hiện tại
          <select name="currentJlptLevel" value={form.currentJlptLevel} onChange={handleChange}>
            <option>N5</option>
            <option>N4</option>
            <option>N3</option>
            <option>N2</option>
            <option>N1</option>
          </select>
        </label>
        <button type="submit" className={styles.saveBtn}>
          Lưu thay đổi
        </button>
      </form>
    </section>
  );
};

export default PersonalInfoForm;
