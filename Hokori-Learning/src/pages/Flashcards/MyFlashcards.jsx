import React, { useEffect, useMemo, useState } from "react";
import styles from "./MyFlashcards.module.scss";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";

import DeckCard from "./components/DeckCard";
import StudyModal from "./components/StudyModal";
import CreateDeckModal from "./components/CreateDeckModal";
import AddWordModal from "./components/AddWordModal";

import {
  fetchPersonalSetsWithCounts,
  createPersonalSet,
  addCardsBatchToSet,
  removeDeckLocally,
} from "../../redux/features/flashcardLearnerSlice";

const MyFlashcards = () => {
  const dispatch = useDispatch();
  const { sets, loadingSets } = useSelector((state) => state.flashcards);

  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("Tất cả");

  const [selectedDeck, setSelectedDeck] = useState(null); // học
  const [editingDeck, setEditingDeck] = useState(null); // thêm thẻ

  const [showCreate, setShowCreate] = useState(false);
  const [showAddWord, setShowAddWord] = useState(false);

  // ============ Fetch sets lần đầu ============
  useEffect(() => {
    dispatch(fetchPersonalSetsWithCounts());
  }, [dispatch]);

  // ============ Filter ============
  const filteredDecks = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return (sets || []).filter((deck) => {
      const matchSearch = deck.title.toLowerCase().includes(lowerSearch);
      const matchLevel = levelFilter === "Tất cả" || deck.level === levelFilter;
      return matchSearch && matchLevel;
    });
  }, [sets, searchTerm, levelFilter]);

  const totalCards = useMemo(
    () => filteredDecks.reduce((sum, d) => sum + (d.totalCards || 0), 0),
    [filteredDecks]
  );

  // ============ Tạo set ============
  const handleCreateDeck = async (formData) => {
    try {
      const payload = {
        title: formData.name,
        description: formData.description,
        level: formData.level,
      };

      const action = await dispatch(createPersonalSet(payload));
      if (createPersonalSet.fulfilled.match(action)) {
        const newDeck = action.payload;
        toast.success("Tạo bộ thẻ thành công!");

        setEditingDeck(newDeck);
        setShowCreate(false);
        setShowAddWord(true);
      } else {
        toast.error("Không tạo được bộ thẻ.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  // ============ Lưu các thẻ từ AddWordModal ============
  const handleSaveWords = async (cards) => {
    if (!editingDeck) return;
    try {
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
        toast.error("Lưu thẻ thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi lưu thẻ.");
    }
  };

  // ============ Xoá deck (FE-only) ============
  const handleDeleteDeck = (deck) => {
    if (!window.confirm(`Bạn có chắc muốn xóa bộ "${deck.title}"?`)) return;
    dispatch(removeDeckLocally(deck.id));
    toast.success("Đã xóa bộ thẻ khỏi danh sách hiển thị (FE-only).");
  };

  // ============ Render ============
  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>Bộ thẻ ghi nhớ của tôi</h1>
          <p className={styles.sub}>
            Ôn tập từ vựng, kanji và cụm câu tiếng Nhật do chính bạn tạo ra.
          </p>
        </div>
        <button
          className={styles.addBtn}
          onClick={() => {
            setShowCreate(true);
          }}
        >
          <i className="fa-solid fa-plus"></i> Tạo bộ mới
        </button>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div>
          <span>{filteredDecks.length}</span>
          <p>Bộ thẻ</p>
        </div>
        <div>
          <span>{totalCards}</span>
          <p>Tổng số thẻ</p>
        </div>
        <div>
          <span>0</span>
          <p>Đã ôn hôm nay</p>
        </div>
        <div>
          <span>0</span>
          <p>Chuỗi ngày học</p>
        </div>
      </div>

      {/* Filters */}
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

      {/* Deck list */}
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

      {/* Study modal */}
      {selectedDeck && (
        <StudyModal deck={selectedDeck} onClose={() => setSelectedDeck(null)} />
      )}

      {/* Create deck modal */}
      {showCreate && (
        <CreateDeckModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreateDeck}
        />
      )}

      {/* Add word modal */}
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
