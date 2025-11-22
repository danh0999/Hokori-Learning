import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";

import {
  fetchCardsBySet,
  updateCardInSet,
  deleteCardInSet,
} from "../../../redux/features/flashcardLearnerSlice";

import styles from "./FlashcardCardListModal.module.scss";

const FlashcardCardListModal = ({ deck, onClose }) => {
  const dispatch = useDispatch();
  const cards = useSelector((s) => s.flashcards.cardsBySet[deck.id] || []);

  const [editingCard, setEditingCard] = useState(null);
  const [editFields, setEditFields] = useState({
    frontText: "",
    backText: "",
    exampleSentence: "",
  });

  const [errors, setErrors] = useState({});
  const [confirmDeleteCard, setConfirmDeleteCard] = useState(null); // ⭐ MODAL XÓA

  useEffect(() => {
    document.body.style.overflow = "hidden";
    dispatch(fetchCardsBySet(deck.id));
    return () => (document.body.style.overflow = "auto");
  }, [deck.id]);

  const openEdit = (card) => {
    setEditingCard(card);
    setEditFields({
      frontText: card.frontText,
      backText: card.backText,
      exampleSentence: card.exampleSentence || "",
    });
    setErrors({});
  };

  const validate = () => {
    let e = {};

    if (!editFields.frontText.trim()) e.frontText = "Vui lòng nhập từ vựng!";

    if (!editFields.backText.trim()) e.backText = "Vui lòng nhập nghĩa!";

    if (!editFields.exampleSentence.trim())
      e.exampleSentence = "Vui lòng nhập ví dụ!";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveEdit = async () => {
    if (!validate()) return;

    const payload = {
      frontText: editFields.frontText,
      backText: editFields.backText,
      reading: editingCard.reading || "",
      exampleSentence: editFields.exampleSentence,
      orderIndex: editingCard.orderIndex ?? 0,
    };

    const action = await dispatch(
      updateCardInSet({
        setId: deck.id,
        cardId: editingCard.id,
        data: payload,
      })
    );

    if (updateCardInSet.fulfilled.match(action)) {
      toast.success("Đã cập nhật thẻ!");
      setEditingCard(null);
    } else {
      toast.error("Cập nhật thất bại!");
    }
  };

  /* =============================
      XÓA THẺ (SAU KHI XÁC NHẬN)
  ============================= */
  const confirmDelete = async () => {
    if (!confirmDeleteCard) return;

    const action = await dispatch(
      deleteCardInSet({
        setId: deck.id,
        cardId: confirmDeleteCard.id,
      })
    );

    if (deleteCardInSet.fulfilled.match(action)) {
      toast.success("Đã xoá thẻ!");
    } else {
      toast.error("Không thể xoá thẻ!");
    }

    setConfirmDeleteCard(null);
  };

  return createPortal(
    <>
      {/* ====================== MAIN MODAL ====================== */}
      <div
        className={styles.overlay}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className={styles.modal}>
          <div className={styles.header}>
            <h2>Danh sách thẻ – {deck.title}</h2>
            <button className={styles.closeBtn} onClick={onClose}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          <div className={styles.body}>
            {cards.length === 0 ? (
              <p className={styles.empty}>
                Chưa có thẻ nào ! Hãy thêm ở ngoài bộ thẻ.
              </p>
            ) : (
              cards.map((c) => (
                <div key={c.id} className={styles.cardItem}>
                  <div>
                    <strong>{c.frontText}</strong> – {c.backText}
                    {c.exampleSentence && (
                      <p className={styles.example}>→ {c.exampleSentence}</p>
                    )}
                  </div>

                  <div className={styles.actions}>
                    <button
                      className={styles.editBtn}
                      onClick={() => openEdit(c)}
                    >
                      <i className="fa-solid fa-pen" />
                    </button>

                    <button
                      className={styles.deleteBtn}
                      onClick={() => setConfirmDeleteCard(c)} //  mở modal xác nhận
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className={styles.modalFooter}>
            <button className={styles.doneBtn} onClick={onClose}>
              Xong
            </button>
          </div>
        </div>
      </div>

      {/* ====================== EDIT POPUP ====================== */}
      {editingCard && (
        <div className={styles.editPopup}>
          <div className={styles.popupBox}>
            <h3>Chỉnh sửa thẻ</h3>

            <label>Từ vựng *</label>
            <input
              value={editFields.frontText}
              onChange={(e) =>
                setEditFields({ ...editFields, frontText: e.target.value })
              }
            />
            {errors.frontText && (
              <p className={styles.error}>{errors.frontText}</p>
            )}

            <label>Nghĩa *</label>
            <input
              value={editFields.backText}
              onChange={(e) =>
                setEditFields({ ...editFields, backText: e.target.value })
              }
            />
            {errors.backText && (
              <p className={styles.error}>{errors.backText}</p>
            )}

            <label>Ví dụ</label>
            <textarea
              rows={2}
              value={editFields.exampleSentence}
              onChange={(e) =>
                setEditFields({
                  ...editFields,
                  exampleSentence: e.target.value,
                })
              }
            />
            {errors.exampleSentence && (
              <p className={styles.error}>{errors.exampleSentence}</p>
            )}  

            <div className={styles.popupActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setEditingCard(null)}
              >
                Hủy
              </button>
              <button className={styles.saveBtn} onClick={handleSaveEdit}>
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================== CONFIRM DELETE MODAL ====================== */}
      {confirmDeleteCard && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmBox}>
            <h3>Xác nhận xoá</h3>
            <p>
              Bạn có chắc muốn xoá thẻ:{" "}
              <strong>{confirmDeleteCard.frontText}</strong>?
            </p>

            <div className={styles.confirmActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setConfirmDeleteCard(null)}
              >
                Hủy
              </button>

              <button
                className={styles.deleteConfirmBtn}
                onClick={confirmDelete}
              >
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

export default FlashcardCardListModal;
