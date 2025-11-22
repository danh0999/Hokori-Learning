// src/pages/Flashcards/components/FlashcardEditModal.jsx
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./FlashcardEditModal.module.scss";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

import FlashcardCardListModal from "./FlashcardCardListModal";
import { updateSet } from "../../../redux/features/flashcardLearnerSlice";

const FlashcardEditModal = ({ deck, onClose }) => {
  const dispatch = useDispatch();

  /* =============================
        STATE
  ============================= */
  const [form, setForm] = useState({
    title: "",
    description: "",
    level: "N5",
  });

  const [errors, setErrors] = useState({
    title: "",
    description: "",
    level: "",
  });

  const [showCardList, setShowCardList] = useState(false);

  /* =============================
        LOAD INITIAL DATA
  ============================= */
  useEffect(() => {
    if (deck) {
      setForm({
        title: deck.title || "",
        description: deck.description || "",
        level: deck.level || "N5",
      });
    }
  }, [deck]);

  /* =============================
        LOCK SCROLL
  ============================= */
  useEffect(() => {
    const original = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    const keyListener = (e) => e.key === "Escape" && onClose?.();

    window.addEventListener("keydown", keyListener);

    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", keyListener);
    };
  }, [onClose]);

  /* =============================
        VALIDATE
  ============================= */
  const validate = () => {
    const newErrors = {};

    if (!form.title.trim()) newErrors.title = "Tiêu đề không được để trống!";
    if (!form.description.trim())
      newErrors.description = "Mô tả không được để trống!";
    if (!form.level.trim()) newErrors.level = "Hãy chọn cấp độ JLPT!";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* =============================
        HANDLERS
  ============================= */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSave = async () => {
    if (!validate()) return;

    const action = await dispatch(
      updateSet({
        setId: deck.id,
        data: form,
      })
    );

    if (updateSet.fulfilled.match(action)) {
      toast.success("Đã lưu thay đổi bộ thẻ!");
      onClose?.();
    } else {
      toast.error("Không lưu được, vui lòng thử lại!");
    }
  };

  /* =============================
        UI
  ============================= */
  const modalUI = (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className={styles.modal}>
        {/* HEADER */}
        <div className={styles.header}>
          <h2>Chỉnh sửa bộ thẻ</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* BODY */}
        <div className={styles.body}>
          {/* TITLE */}
          <div className={styles.group}>
            <label>Tiêu đề *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Tên bộ thẻ..."
            />
            {errors.title && <p className={styles.error}>{errors.title}</p>}
          </div>

          {/* DESCRIPTION */}
          <div className={styles.group}>
            <label>Mô tả *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Mô tả ngắn..."
            ></textarea>
            {errors.description && (
              <p className={styles.error}>{errors.description}</p>
            )}
          </div>

          {/* LEVEL */}
          <div className={styles.group}>
            <label>Cấp độ JLPT *</label>
            <select name="level" value={form.level} onChange={handleChange}>
              <option value="">-- Chọn cấp độ --</option>
              <option value="N5">N5</option>
              <option value="N4">N4</option>
              <option value="N3">N3</option>
              <option value="N2">N2</option>
              <option value="N1">N1</option>
            </select>
            {errors.level && <p className={styles.error}>{errors.level}</p>}
          </div>
        </div>

        {/* FOOTER */}
        <div className={styles.footer}>
          <button
            className={styles.viewBtn}
            onClick={() => setShowCardList(true)}
          >
            <i className="fa-solid fa-list"></i> Xem tất cả thẻ
          </button>

          <button className={styles.saveBtn} onClick={handleSave}>
            <i className="fa-solid fa-floppy-disk"></i> Lưu bộ thẻ
          </button>

          <button className={styles.cancelBtn} onClick={onClose}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {createPortal(modalUI, document.body)}

      {/* Modal danh sách thẻ */}
      {showCardList && (
        <FlashcardCardListModal
          deck={deck}
          onClose={() => setShowCardList(false)}
        />
      )}
    </>
  );
};

export default FlashcardEditModal;
