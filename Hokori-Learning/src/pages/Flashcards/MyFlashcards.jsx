import React, { useEffect, useMemo, useState } from "react";
import styles from "./MyFlashcards.module.scss";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";

import DeckCard from "./components/DeckCard";
import StudyModal from "./components/StudyModal";
import CreateDeckModal from "./components/CreateDeckModal";
import AddWordModal from "./components/AddWordModal";

import {
  fetchPersonalSetsWithCounts,
  createPersonalSet,
  addCardsBatchToSet,
  deleteSet,
} from "../../redux/features/flashcardLearnerSlice";

const MyFlashcards = () => {
  const dispatch = useDispatch();
  const { sets, loadingSets } = useSelector((state) => state.flashcards);

  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("Tất cả");

  const [selectedDeck, setSelectedDeck] = useState(null);
  const [editingDeck, setEditingDeck] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [showAddWord, setShowAddWord] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // FETCH SETS WHEN LOAD PAGE
  useEffect(() => {
    dispatch(fetchPersonalSetsWithCounts());
  }, [dispatch]);

  // FILTER DECKS
  const filteredDecks = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return sets.filter((d) => {
      const matchText = d.title.toLowerCase().includes(lower);
      const matchLevel = levelFilter === "Tất cả" || d.level === levelFilter;
      return matchText && matchLevel;
    });
  }, [sets, searchTerm, levelFilter]);

  const totalCards = useMemo(
    () => filteredDecks.reduce((sum, d) => sum + (d.totalCards || 0), 0),
    [filteredDecks]
  );

  // CREATE FLASHCARD SET
  const handleCreateDeck = async (formData) => {
    try {
      const payload = {
        title: formData.name,
        description: formData.description,
        level: formData.level,
      };

      const action = await dispatch(createPersonalSet(payload));

      if (createPersonalSet.fulfilled.match(action)) {
        toast.success("Tạo bộ thẻ thành công!");
        setShowCreate(false);
        setEditingDeck(null);
      } else {
        toast.error("Không tạo được bộ thẻ.");
      }
    } catch  {
      toast.error("Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  // SAVE ADDED CARDS
  const handleSaveWords = async (cards) => {
    if (!editingDeck) return;

    const action = await dispatch(
      addCardsBatchToSet({ setId: editingDeck.id, cards })
    );

    if (addCardsBatchToSet.fulfilled.match(action)) {
      toast.success(`Đã lưu ${cards.length} thẻ vào bộ "${editingDeck.title}"!`);
      setShowAddWord(false);
      setEditingDeck(null);
    } else {
      toast.error("Lưu thẻ thất bại.");
    }
  };

  // OPEN DELETE MODAL
  const handleDeleteDeck = (deck) => {
    setDeleteTarget(deck);
  };

  return (
    <div className={styles.wrapper}>
      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1>Bộ thẻ ghi nhớ của tôi</h1>
          <p className={styles.sub}>
            Ôn tập từ vựng, kanji và cụm câu tiếng Nhật do chính bạn tạo ra.
          </p>
        </div>

        <button className={styles.addBtn} onClick={() => setShowCreate(true)}>
          <i className="fa-solid fa-plus"></i> Tạo bộ mới
        </button>
      </div>

      {/* STATS */}
      <div className={styles.stats}>
        <div><span>{filteredDecks.length}</span><p>Bộ thẻ</p></div>
        <div><span>{totalCards}</span><p>Tổng số thẻ</p></div>
        <div><span>0</span><p>Đã ôn hôm nay</p></div>
        <div><span>0</span><p>Chuỗi ngày học</p></div>
      </div>

      {/* FILTERS */}
      <div className={styles.filters}>
        <input
          placeholder="Tìm kiếm bộ thẻ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
        >
          <option value="Tất cả">Tất cả cấp độ JLPT</option>
          <option value="N5">JLPT N5</option>
          <option value="N4">JLPT N4</option>
          <option value="N3">JLPT N3</option>
          <option value="N2">JLPT N2</option>
          <option value="N1">JLPT N1</option>
        </select>
      </div>

      {/* DECK LIST */}
      <div className={styles.grid}>
        {loadingSets && sets.length === 0 ? (
          <p>Đang tải bộ thẻ...</p>
        ) : filteredDecks.length > 0 ? (
          filteredDecks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onStudy={() => setSelectedDeck(deck)}
              onEdit={(d) => {
                setEditingDeck(d);
                setShowAddWord(true);
              }}
              onDelete={handleDeleteDeck}
            />
          ))
        ) : (
          <p>Không tìm thấy bộ thẻ nào.</p>
        )}
      </div>

      {/* DELETE CONFIRM MODAL */}
      {deleteTarget && (
        <div className={styles.deleteModalOverlay}>
          <div className={styles.deleteModal}>
            <button
              className={styles.deleteClose}
              onClick={() => setDeleteTarget(null)}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <h3>Xoá bộ thẻ “{deleteTarget.title}”?</h3>
            <p className={styles.deleteText}>
              Hành động này không thể hoàn tác.
            </p>

            <div className={styles.deleteActions}>
              <button
                className={styles.deleteConfirm}
                onClick={async () => {
                  const action = await dispatch(deleteSet(deleteTarget.id));

                  if (deleteSet.fulfilled.match(action)) {
                    toast.success("Đã xoá bộ thẻ!");
                  } else {
                    toast.error("Không xoá được bộ thẻ!");
                  }

                  setDeleteTarget(null);
                }}
              >
                Xoá
              </button>

              <button
                className={styles.deleteCancel}
                onClick={() => setDeleteTarget(null)}
              >
                Huỷ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTHER MODALS */}
      {selectedDeck && (
        <StudyModal deck={selectedDeck} onClose={() => setSelectedDeck(null)} />
      )}

      {showCreate && (
        <CreateDeckModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreateDeck}
        />
      )}

      {showAddWord && editingDeck && (
        <AddWordModal
          deck={editingDeck}
          onClose={() => {
            setShowAddWord(false);
            setEditingDeck(null);
          }}
          onSave={handleSaveWords}
        />
      )}
    </div>
  );
};

export default MyFlashcards;
