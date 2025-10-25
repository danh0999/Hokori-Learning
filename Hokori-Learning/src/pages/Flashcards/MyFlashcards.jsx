import React, { useState, useEffect } from "react";
import styles from "./MyFlashcards.module.scss";
import DeckCard from "./components/DeckCard";
import StudyModal from "./components/StudyModal";
import CreateDeckModal from "./components/CreateDeckModal";

const MyFlashcards = () => {
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

  //  State
  const [decks, _setDecks] = useState(mockDecks);
  const [filteredDecks, setFilteredDecks] = useState(mockDecks);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("Tất cả");
  const [typeFilter, setTypeFilter] = useState("Tất cả");

  const [selectedDeck, setSelectedDeck] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  //  Lọc dữ liệu theo 3 điều kiện
  useEffect(() => {
    const lowerSearch = searchTerm.toLowerCase();
    const result = decks.filter((deck) => {
      const matchSearch = deck.tenBo.toLowerCase().includes(lowerSearch);
      const matchLevel =
        levelFilter === "Tất cả" || deck.capDo === levelFilter;
      const matchType = typeFilter === "Tất cả" || deck.loai === typeFilter;

      return matchSearch && matchLevel && matchType;
    });
    setFilteredDecks(result);
  }, [searchTerm, levelFilter, typeFilter, decks]);

  const handleCreateDeck = (formData) => {
    console.log("Bộ thẻ mới được tạo:", formData);
    setShowCreate(false);
  };

  return (
    <div className={styles.wrapper}>
      {/* Header */}
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

      {/* Thống kê */}
      <div className={styles.stats}>
        <div>
          <span>{filteredDecks.length}</span>
          <p>Bộ thẻ</p>
        </div>
        <div>
          <span>155</span>
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

      {/* Bộ lọc */}
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

      {/* Danh sách bộ thẻ */}
      <div className={styles.grid}>
        {filteredDecks.length > 0 ? (
          filteredDecks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onStudy={() => setSelectedDeck(deck)}
            />
          ))
        ) : (
          <p>Không tìm thấy bộ thẻ nào</p>
        )}
      </div>

      {/* Modal học thẻ */}
      {selectedDeck && (
        <StudyModal deck={selectedDeck} onClose={() => setSelectedDeck(null)} />
      )}

      {/* Modal tạo bộ thẻ mới */}
      {showCreate && (
        <CreateDeckModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreateDeck}
        />
      )}
    </div>
  );
};

export default MyFlashcards;
