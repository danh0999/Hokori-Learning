import React, { useState, useEffect } from "react";
import styles from "./MyFlashcards.module.scss";
import { toast } from "react-hot-toast";

import DeckCard from "./components/DeckCard";
import StudyModal from "./components/StudyModal";
import CreateDeckModal from "./components/CreateDeckModal";
import AddWordModal from "./components/AddWordModal";

const MyFlashcards = () => {
  //  Mock data (sẽ thay bằng API sau)
  const mockDecks = [
    {
      id: 1,
      tenBo: "Từ vựng JLPT N4",
      capDo: "N4",
      loai: "Từ vựng",
      tongThe: 45,
      tienDo: 80,
      lanCuoi: "2 giờ trước",
      mau: "xanh",
    },
    {
      id: 2,
      tenBo: "Kanji cơ bản",
      capDo: "N3",
      loai: "Kanji",
      tongThe: 80,
      tienDo: 52,
      lanCuoi: "Hôm qua",
      mau: "xanhLa",
    },
    {
      id: 3,
      tenBo: "Cụm giao tiếp hàng ngày",
      capDo: "N5",
      loai: "Cụm từ",
      tongThe: 30,
      tienDo: 95,
      lanCuoi: "30 phút trước",
      mau: "tim",
    },
  ];

  // State
  const [decks, setDecks] = useState(mockDecks);
  const [filteredDecks, setFilteredDecks] = useState(mockDecks);

  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("Tất cả");
  const [typeFilter, setTypeFilter] = useState("Tất cả");

  const [selectedDeck, setSelectedDeck] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddWord, setShowAddWord] = useState(false);
  const [newDeck, setNewDeck] = useState(null);

  // 🔍 Lọc danh sách bộ thẻ theo 3 điều kiện
  useEffect(() => {
    const lowerSearch = searchTerm.toLowerCase();

    const result = decks.filter((deck) => {
      const matchSearch = deck.tenBo.toLowerCase().includes(lowerSearch);
      const matchLevel = levelFilter === "Tất cả" || deck.capDo === levelFilter;
      const matchType = typeFilter === "Tất cả" || deck.loai === typeFilter;
      return matchSearch && matchLevel && matchType;
    });

    setFilteredDecks(result);
  }, [searchTerm, levelFilter, typeFilter, decks]);

  // 🪄 Khi tạo bộ thẻ mới
  const handleCreateDeck = (formData) => {
    const newDeckObj = {
      id: Date.now(),
      tenBo: formData.name,
      capDo: formData.level,
      loai: formData.type,
      tongThe: 0,
      tienDo: 0,
      lanCuoi: "Chưa có",
      mau: "xanh",
    };

    setDecks([...decks, newDeckObj]);
    setNewDeck(newDeckObj);
    toast.success("Tạo bộ thẻ thành công!");

    setShowCreate(false);
    setShowAddWord(true); // Mở modal thêm từ ngay sau khi tạo
  };

  //  Khi lưu các thẻ trong AddWordModal
  const handleSaveWords = (cards) => {
    console.log("Các thẻ đã lưu:", cards);
    // Sau này gọi API: POST /api/flashcards/cards
    toast.success(`Đã lưu ${cards.length} thẻ vào bộ "${newDeck.tenBo}"!`);

    // Cập nhật tổng số thẻ của deck đó
    setDecks((prev) =>
      prev.map((deck) =>
        deck.id === newDeck.id
          ? { ...deck, tongThe: cards.length, lanCuoi: "Vừa tạo" }
          : deck
      )
    );

    setShowAddWord(false);
  };

  return (
    <div className={styles.wrapper}>
      {/* ================= Header ================= */}
      <div className={styles.header}>
        <div>
          <h1>Bộ thẻ ghi nhớ của tôi</h1>
          <p className={styles.sub}>
            Ôn tập từ vựng, kanji và cụm câu tiếng Nhật của riêng bạn
          </p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowCreate(true)}>
          <i className="fa-solid fa-plus"></i> Tạo bộ mới
        </button>
      </div>

      {/* ================= Thống kê ================= */}
      <div className={styles.stats}>
        <div>
          <span>{filteredDecks.length}</span>
          <p>Bộ thẻ</p>
        </div>
        <div>
          <span>
            {filteredDecks.reduce((sum, d) => sum + (d.tongThe || 0), 0)}
          </span>
          <p>Tổng số thẻ</p>
        </div>
        <div>
          <span>20</span>
          <p>Đã ôn hôm nay</p>
        </div>
        <div>
          <span>7</span>
          <p>Chuỗi ngày học</p>
        </div>
      </div>

      {/* ================= Bộ lọc ================= */}
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

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="Tất cả">Tất cả loại thẻ</option>
          <option value="Từ vựng">Từ vựng</option>
          <option value="Kanji">Kanji</option>
          <option value="Cụm từ">Cụm từ</option>
        </select>
      </div>

      {/* ================= Danh sách bộ thẻ ================= */}
      <div className={styles.grid}>
        {filteredDecks.length > 0 ? (
          filteredDecks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onStudy={() => setSelectedDeck(deck)}
              onEdit={(deck) => {
                setNewDeck(deck);
                setShowAddWord(true); // mở modal thêm/sửa từ vựng
              }}
              onDelete={(deck) => {
                if (confirm(`Bạn có chắc muốn xóa bộ "${deck.tenBo}"?`)) {
                  setDecks((prev) => prev.filter((d) => d.id !== deck.id));
                }
              }}
            />
          ))
        ) : (
          <p>Không tìm thấy bộ thẻ nào.</p>
        )}
      </div>

      {/* ================= Modal học thẻ ================= */}
      {selectedDeck && (
        <StudyModal deck={selectedDeck} onClose={() => setSelectedDeck(null)} />
      )}

      {/* ================= Modal tạo bộ thẻ mới ================= */}
      {showCreate && (
        <CreateDeckModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreateDeck}
        />
      )}

      {/* ================= Modal thêm từ vựng ================= */}
      {showAddWord && (
        <AddWordModal
          deck={newDeck}
          onClose={() => setShowAddWord(false)}
          onSave={handleSaveWords}
        />
      )}
    </div>
  );
};

export default MyFlashcards;
