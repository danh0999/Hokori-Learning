import React, { useState } from "react";
import styles from "./CreateDeckModal.module.scss";
import DeckPreview from "./DeckPreview";
import toast from "react-hot-toast";

const CreateDeckModal = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    level: "",
    type: "",
  });

  const [errors, setErrors] = useState({});

  // Validate tất cả field
  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Tên bộ thẻ là bắt buộc.";
    if (!form.level) newErrors.level = "Vui lòng chọn cấp độ JLPT.";
    if (!form.type) newErrors.type = "Vui lòng chọn loại thẻ.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" }); // clear lỗi khi user sửa
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc!");
      return;
    }

    try {
      console.log("Created deck:", form);
      toast.success("Tạo bộ thẻ thành công!");
      onCreate?.(form);
      onClose?.();
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra, vui lòng thử lại!");
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleBox}>
            <i className="fa-solid fa-layer-group" />
            <h2>Tạo bộ flashcard mới</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Form */}
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>Tên bộ thẻ *</label>
              <input
                name="name"
                placeholder="Nhập tên bộ thẻ..."
                value={form.name}
                onChange={handleChange}
                className={errors.name ? styles.errorInput : ""}
              />
              {errors.name && <p className={styles.errorMsg}>{errors.name}</p>}
            </div>

            <div className={styles.formGroup}>
              <label>Mô tả ngắn</label>
              <textarea
                name="description"
                rows="3"
                placeholder="Mô tả ngắn về bộ thẻ này..."
                value={form.description}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Cấp độ JLPT *</label>
              <select
                name="level"
                value={form.level}
                onChange={handleChange}
                className={errors.level ? styles.errorInput : ""}
              >
                <option value="">-- Chọn cấp độ --</option>
                <option value="N5">N5 - Sơ cấp</option>
                <option value="N4">N4 - Sơ trung cấp</option>
                <option value="N3">N3 - Trung cấp</option>
                <option value="N2">N2 - Trung cao cấp</option>
                <option value="N1">N1 - Cao cấp</option>
              </select>
              {errors.level && (
                <p className={styles.errorMsg}>{errors.level}</p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>Loại thẻ *</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className={errors.type ? styles.errorInput : ""}
              >
                <option value="">-- Chọn loại thẻ --</option>
                <option value="vocabulary">Từ vựng</option>
                <option value="kanji">Kanji</option>
                <option value="phrases">Cụm câu</option>
              </select>
              {errors.type && <p className={styles.errorMsg}>{errors.type}</p>}
            </div>
          </form>

          {/* Preview */}
          <DeckPreview data={form} />
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Hủy
          </button>
          <button className={styles.createBtn} onClick={handleSubmit}>
            <i className="fa-solid fa-plus" /> Tạo bộ thẻ
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateDeckModal;
