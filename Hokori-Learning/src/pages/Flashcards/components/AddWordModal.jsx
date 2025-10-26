import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./AddWordModal.module.scss";
import toast from "react-hot-toast";

const AddWordModal = ({ deck, onClose, onSave }) => {
  const [word, setWord] = useState({ term: "", meaning: "", example: "" });
  const [cards, setCards] = useState([]);

  // chặn scroll nền & ESC để đóng
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setWord((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!word.term.trim() || !word.meaning.trim()) {
      toast.error("Vui lòng nhập ít nhất Từ vựng và Nghĩa!");
      return;
    }
    const newCard = { id: Date.now(), ...word };
    setCards((prev) => [...prev, newCard]);
    setWord({ term: "", meaning: "", example: "" });
    toast.success("Đã thêm 1 thẻ mới!");
  };

  const handleSaveDeck = () => {
    if (cards.length === 0) {
      toast.error("Bạn chưa thêm thẻ nào!");
      return;
    }
    onSave?.(cards);
    toast.success("Đã lưu bộ thẻ thành công!");
    onClose?.();
  };

  const modalUi = (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleBox}>
            <i className="fa-solid fa-book" />
            <h2>Thêm từ vựng vào bộ “{deck?.tenBo || "Mới tạo"}”</h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Đóng"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          <form className={styles.form} onSubmit={handleAdd}>
            <div className={styles.formGroup}>
              <label>Từ vựng *</label>
              <input
                name="term"
                placeholder="Nhập từ vựng (Kanji, Hiragana...)"
                value={word.term}
                onChange={handleChange}
                autoFocus
              />
            </div>

            <div className={styles.formGroup}>
              <label>Nghĩa *</label>
              <input
                name="meaning"
                placeholder="Nghĩa tiếng Việt"
                value={word.meaning}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Ví dụ (tuỳ chọn)</label>
              <textarea
                name="example"
                placeholder="Ví dụ sử dụng trong câu..."
                value={word.example}
                onChange={handleChange}
                rows={2}
              />
            </div>

            <button type="submit" className={styles.addBtn}>
              <i className="fa-solid fa-plus" />
              Thêm thẻ
            </button>
          </form>

          {/* Danh sách thẻ đã thêm */}
          <div className={styles.cardList}>
            {cards.length > 0 ? (
              cards.map((c) => (
                <div key={c.id} className={styles.cardItem}>
                  <div>
                    <strong>{c.term}</strong> – {c.meaning}
                    {c.example && (
                      <p className={styles.example}>→ {c.example}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() =>
                      setCards((prev) => prev.filter((x) => x.id !== c.id))
                    }
                    aria-label="Xoá thẻ"
                  >
                    <i className="fa-solid fa-trash" />
                  </button>
                </div>
              ))
            ) : (
              <p className={styles.empty}>Chưa có thẻ nào được thêm.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Hủy
          </button>
          <button type="button" className={styles.saveBtn} onClick={handleSaveDeck}>
            <i className="fa-solid fa-floppy-disk" />
            Lưu bộ thẻ
          </button>
        </div>
      </div>
    </div>
  );

  // render ra body để tránh CSS bên ngoài ảnh hưởng
  return createPortal(modalUi, document.body);
};

export default AddWordModal;
