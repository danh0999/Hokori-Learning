import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./AddWordModal.module.scss";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";

import {
  deleteCardInSet,
  updateCardInSet,
} from "../../../redux/features/flashcardLearnerSlice";

const AddWordModal = ({ deck, onClose, onSave }) => {
  const dispatch = useDispatch();

  const [word, setWord] = useState({ term: "", meaning: "", example: "" });
  const [cards, setCards] = useState([]);

  // Validation errors
  const [errors, setErrors] = useState({
    term: "",
    meaning: "",
    example: "",
  });

  // card đang được edit
  const [editingCard, setEditingCard] = useState(null);
  const [editFields, setEditFields] = useState({
    term: "",
    meaning: "",
    example: "",
  });

  const [editErrors, setEditErrors] = useState({
    term: "",
    meaning: "",
  });

  /* ======================================================
      LOCK SCROLL
  ====================================================== */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  /* ======================================================
      HANDLE CHANGE + CLEAR ERROR
  ====================================================== */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setWord((prev) => ({ ...prev, [name]: value }));

    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  /* ======================================================
      VALIDATE FOR ADD
  ====================================================== */
  const validateAdd = () => {
    let e = {};
    if (!word.term.trim()) e.term = "Vui lòng nhập từ vựng!";
    if (!word.meaning.trim()) e.meaning = "Vui lòng nhập nghĩa!";
    if (!word.example.trim()) e.example = "Vui lòng nhập ví dụ!";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ======================================================
      ADD NEW CARD
  ====================================================== */
  const handleAdd = (e) => {
    e.preventDefault();

    if (!validateAdd()) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    const newCard = {
      id: Date.now(),
      term: word.term,
      meaning: word.meaning,
      example: word.example,
      isLocal: true,
    };

    setCards((prev) => [...prev, newCard]);
    setWord({ term: "", meaning: "", example: "" });
    toast.success("Đã thêm thẻ!");
  };

  /* ======================================================
      DELETE CARD
  ====================================================== */
  const handleDeleteCard = async (card) => {
    toast(
      (t) => (
        <div>
          <p style={{ fontWeight: 600 }}>Xoá thẻ này?</p>

          <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
            <button
              onClick={async () => {
                toast.dismiss(t.id);

                // Local delete
                if (card.isLocal) {
                  setCards((prev) => prev.filter((c) => c.id !== card.id));
                  return toast.success("Đã xoá thẻ!");
                }

                // Backend delete
                const action = await dispatch(
                  deleteCardInSet({
                    setId: deck.id,
                    cardId: card.id,
                  })
                );

                if (deleteCardInSet.fulfilled.match(action)) {
                  setCards((prev) => prev.filter((c) => c.id !== card.id));
                  toast.success("Đã xoá thẻ!");
                } else {
                  toast.error("Xoá thất bại!");
                }
              }}
              style={{
                padding: "6px 12px",
                background: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
              }}
            >
              Xoá
            </button>

            <button
              onClick={() => toast.dismiss(t.id)}
              style={{
                padding: "6px 12px",
                background: "#e5e7eb",
                borderRadius: "6px",
              }}
            >
              Hủy
            </button>
          </div>
        </div>
      ),
      { duration: 6000 }
    );
  };

  /* ======================================================
      OPEN EDIT
  ====================================================== */
  const openEditCard = (card) => {
    setEditingCard(card);
    setEditErrors({ term: "", meaning: "" });
    setEditFields({
      term: card.term,
      meaning: card.meaning,
      example: card.example || "",
    });
  };

  /* ======================================================
      VALIDATE EDIT
  ====================================================== */
  const validateEdit = () => {
    let e = {};
    if (!editFields.term.trim()) e.term = "Không được để trống!";
    if (!editFields.meaning.trim()) e.meaning = "Không được để trống!";

    setEditErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ======================================================
      SAVE EDIT
  ====================================================== */
  const handleSaveEditCard = async () => {
    if (!validateEdit()) {
      toast.error("Vui lòng điền đầy đủ!");
      return;
    }

    // LOCAL
    if (editingCard.isLocal) {
      setCards((prev) =>
        prev.map((c) =>
          c.id === editingCard.id
            ? {
                ...c,
                term: editFields.term,
                meaning: editFields.meaning,
                example: editFields.example,
              }
            : c
        )
      );

      toast.success("Đã cập nhật (local)");
      return setEditingCard(null);
    }

    // BACKEND
    const payload = {
      frontText: editFields.term,
      backText: editFields.meaning,
      exampleSentence: editFields.example,
    };

    const action = await dispatch(
      updateCardInSet({
        setId: deck.id,
        cardId: editingCard.id,
        data: payload,
      })
    );

    if (updateCardInSet.fulfilled.match(action)) {
      toast.success("Cập nhật thành công!");
    } else {
      toast.error("Cập nhật thất bại!");
    }

    setEditingCard(null);
  };

  /* ======================================================
      SAVE ALL CARDS
  ====================================================== */
  const handleSaveDeck = () => {
    if (cards.length === 0) {
      return toast.error("Bạn chưa thêm thẻ nào!");
    }
    onSave?.(cards);
  };

  /* ======================================================
      RENDER UI
  ====================================================== */
  const modalUi = (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        {/* HEADER */}
        <div className={styles.header}>
          <div className={styles.titleBox}>
            <i className="fa-solid fa-book" />
            <h2>Thêm từ vựng vào bộ “{deck?.title || "Mới tạo"}”</h2>
          </div>

          <button className={styles.closeBtn} onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* BODY */}
        <div className={styles.body}>
          <form className={styles.form} onSubmit={handleAdd}>
            <div className={styles.formGroup}>
              <label>Từ vựng *</label>
              <input
                name="term"
                value={word.term}
                onChange={handleChange}
                placeholder="Nhập từ vựng..."
              />
              {errors.term && <p className={styles.error}>{errors.term}</p>}
            </div>

            <div className={styles.formGroup}>
              <label>Nghĩa *</label>
              <input
                name="meaning"
                value={word.meaning}
                onChange={handleChange}
                placeholder="Nghĩa tiếng Việt..."
              />
              {errors.meaning && (
                <p className={styles.error}>{errors.meaning}</p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>Ví dụ</label>
              <textarea
                name="example"
                value={word.example}
                onChange={handleChange}
                placeholder="Ví dụ..."
                rows={2}
              />
              {errors.example && (
                <p className={styles.error}>{errors.example}</p>
              )}
            </div>

            <button type="submit" className={styles.addBtn}>
              <i className="fa-solid fa-plus" />
              Thêm thẻ
            </button>
          </form>

          {/* LIST */}
          <div className={styles.cardList}>
            {cards.length ? (
              cards.map((c) => (
                <div key={c.id} className={styles.cardItem}>
                  <div className={styles.cardInfo}>
                    <strong>{c.term}</strong> – {c.meaning}
                    {c.example && (
                      <p className={styles.example}>→ {c.example}</p>
                    )}
                  </div>

                  <div className={styles.rBtns}>
                    <button
                      className={styles.editBtn}
                      onClick={() => openEditCard(c)}
                    >
                      <i className="fa-solid fa-pen" />
                    </button>

                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteCard(c)}
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.empty}>Chưa có thẻ.</p>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Hủy
          </button>

          <button className={styles.saveBtn} onClick={handleSaveDeck}>
            <i className="fa-solid fa-floppy-disk" />
            Lưu bộ thẻ
          </button>
        </div>
      </div>

      {/* EDIT POPUP */}
      {editingCard && (
        <div className={styles.editPopup}>
          <div className={styles.popupBox}>
            <h3>Chỉnh sửa thẻ</h3>

            <label>Từ vựng *</label>
            <input
              value={editFields.term}
              onChange={(e) =>
                setEditFields((p) => ({ ...p, term: e.target.value }))
              }
            />
            {editErrors.term && (
              <p className={styles.error}>{editErrors.term}</p>
            )}

            <label>Nghĩa *</label>
            <input
              value={editFields.meaning}
              onChange={(e) =>
                setEditFields((p) => ({ ...p, meaning: e.target.value }))
              }
            />
            {editErrors.meaning && (
              <p className={styles.error}>{editErrors.meaning}</p>
            )}

            <label>Ví dụ</label>
            <textarea
              rows={2}
              value={editFields.example}
              onChange={(e) =>
                setEditFields((p) => ({ ...p, example: e.target.value }))
              }
            />

            <div className={styles.popupActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setEditingCard(null)}
              >
                Hủy
              </button>

              <button className={styles.saveBtn} onClick={handleSaveEditCard}>
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalUi, document.body);
};

export default AddWordModal;
