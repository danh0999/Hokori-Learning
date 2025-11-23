// src/pages/Flashcards/MyFlashcards.jsx
import React, { useEffect, useMemo, useState } from "react";
import styles from "./MyFlashcards.module.scss";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";

import DeckCard from "./components/DeckCard";
import StudyModal from "./components/StudyModal";
import CreateDeckModal from "./components/CreateDeckModal";
import AddWordModal from "./components/AddWordModal";
import FlashcardEditModal from "./components/FlashcardEditModal";

import {
  fetchPersonalSetsWithCounts,
  createPersonalSet,
  addCardsBatchToSet,
  deleteSet,
  fetchDashboardFlashcards,
} from "../../redux/features/flashcardLearnerSlice";

const MyFlashcards = () => {
  const dispatch = useDispatch();

  const { sets, loadingSets, dashboard } = useSelector((state) => ({
    sets: state.flashcards.sets,
    loadingSets: state.flashcards.loadingSets,
    dashboard: state.flashcards.dashboard,
  }));

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("Tất cả");

  // Modal states
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [editingDeck, setEditingDeck] = useState(null);
  const [editingMeta, setEditingMeta] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [showAddWord, setShowAddWord] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Load sets
  useEffect(() => {
    dispatch(fetchPersonalSetsWithCounts());
  }, [dispatch]);

  //  Load Dashboard mỗi khi đổi level (hoặc khi load trang)
  useEffect(() => {
    dispatch(
      fetchDashboardFlashcards(levelFilter === "Tất cả" ? "" : levelFilter)
    );
  }, [dispatch, levelFilter]);

  // ----------------------------------------------------------
  // NORMALIZE DATA
  // ----------------------------------------------------------
  const normalizedDecks = useMemo(() => {
    return sets.map((d) => ({
      id: d.id || d.setId,
      title: d.title || d.name || d.setTitle || "Bộ thẻ",
      description: d.description || "",
      level: d.level || d.jlptLevel || "N5",
      totalCards: d.totalCards || d.cardCount || 0,
      progressPercent: d.progressPercent || d.progress || 0,
      lastReviewText: d.lastReviewText || d.updatedAt || "",
      colorClass: d.colorClass || "default",
    }));
  }, [sets]);

  // ----------------------------------------------------------
  //  FILTERED DATA
  // ----------------------------------------------------------
  const filteredDecks = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return normalizedDecks.filter((d) => {
      const matchText = d.title.toLowerCase().includes(lower);
      const matchLevel = levelFilter === "Tất cả" || d.level === levelFilter;
      return matchText && matchLevel;
    });
  }, [normalizedDecks, searchTerm, levelFilter]);

  const totalCards = useMemo(
    () => filteredDecks.reduce((sum, d) => sum + (d.totalCards || 0), 0),
    [filteredDecks]
  );

  // ----------------------------------------------------------
  // CREATE NEW DECK
  // ----------------------------------------------------------
  const handleCreateDeck = async (formData) => {
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
  };

  // ----------------------------------------------------------
  // SAVE CARDS
  // ----------------------------------------------------------
  const handleSaveWords = async (cards) => {
    if (!editingDeck) return;

    const action = await dispatch(
      addCardsBatchToSet({ setId: editingDeck.id, cards })
    );

    if (addCardsBatchToSet.fulfilled.match(action)) {
      toast.success(
        `Đã lưu ${cards.length} thẻ vào bộ "${editingDeck.title}"!`
      );
      setShowAddWord(false);
      setEditingDeck(null);
    } else {
      toast.error("Lưu thẻ thất bại.");
    }
  };

  // ----------------------------------------------------------
  // DELETE DECK
  // ----------------------------------------------------------
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
            Ôn tập từ vựng, kanji và cụm câu tiếng Nhật do bạn tự tạo.
          </p>
        </div>

        <button className={styles.addBtn} onClick={() => setShowCreate(true)}>
          <i className="fa-solid fa-plus"></i> Tạo bộ mới
        </button>
      </div>

      {/* STATS */}
      <div className={styles.stats}>
        <div>
          <p>Bộ thẻ</p>
          <span>{filteredDecks.length}</span>
        </div>

        <div>
          <p>Tổng số thẻ</p>
          <span>{totalCards}</span>
        </div>

        {/* Replace hardcoded numbers with BE dashboard */}
        <div>
          <p>Đã ôn hôm nay</p>
          <span>{dashboard?.reviewedToday ?? 0}</span>
        </div>

        <div>
          <p>Chuỗi ngày học</p>
          <span>{dashboard?.streakDays ?? 0}</span>
        </div>
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
              onEdit={() => setEditingMeta(deck)}
              onAddCard={() => {
                setEditingDeck(deck);
                setShowAddWord(true);
              }}
              onDelete={handleDeleteDeck}
            />
          ))
        ) : (
          <p>Không tìm thấy bộ thẻ nào.</p>
        )}
      </div>

      {/* DELETE MODAL */}
      {deleteTarget && (
        <div className={styles.deleteModalOverlay}>
          <div className={styles.deleteModal}>
            <button
              className={styles.deleteClose}
              onClick={() => setDeleteTarget(null)}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <h3>Xoá bộ thẻ {deleteTarget.title}?</h3>
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

      {/* STUDY MODAL */}
      {selectedDeck && (
        <StudyModal deck={selectedDeck} onClose={() => setSelectedDeck(null)} />
      )}

      {/* CREATE NEW DECK */}
      {showCreate && (
        <CreateDeckModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreateDeck}
        />
      )}

      {/* ADD CARDS */}
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

      {/* EDIT DECK */}
      {editingMeta && (
        <FlashcardEditModal
          deck={editingMeta}
          onClose={() => setEditingMeta(null)}
        />
      )}
    </div>
  );
};

export default MyFlashcards;
