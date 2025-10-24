// src/pages/Flashcards/MyFlashcards.jsx
import React, { useState } from "react";
import styles from "./MyFlashcards.module.scss";
import DeckCard from "./components/DeckCard";
import StudyModal from "./components/StudyModal";

const MyFlashcards = () => {
  // ⚠️ MOCK DATA — sẽ xóa khi gắn API thật
  const decks = [
    {
      id: 1,
      tenBo: "Từ vựng JLPT N4",
      capDo: "N4",
      tongThe: 45,
      tienDo: 80,
      lanCuoi: "2 giờ trước",
      mau: "xanh",
    },
    {
      id: 2,
      tenBo: "Kanji cơ bản",
      capDo: "N3",
      tongThe: 80,
      tienDo: 52,
      lanCuoi: "Hôm qua",
      mau: "xanhLa",
    },
    {
      id: 3,
      tenBo: "Cụm giao tiếp hàng ngày",
      capDo: "N5",
      tongThe: 30,
      tienDo: 95,
      lanCuoi: "30 phút trước",
      mau: "tim",
    },
  ];

  const [chonBo, setChonBo] = useState(null);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h1>Bộ thẻ ghi nhớ của tôi</h1>
          <p className={styles.sub}>Ôn tập từ vựng, kanji và cụm câu tiếng Nhật của riêng bạn</p>
        </div>
        <button className={styles.addBtn}>
          <i className="fa-solid fa-plus"></i> Tạo bộ mới
        </button>
      </div>

      {/* Thống kê */}
      <div className={styles.stats}>
        <div><span>3</span><p>Bộ thẻ</p></div>
        <div><span>155</span><p>Tổng số thẻ</p></div>
        <div><span>20</span><p>Đã ôn hôm nay</p></div>
        <div><span>7</span><p>Chuỗi ngày học</p></div>
      </div>

      {/* Bộ lọc */}
      <div className={styles.filters}>
        <input placeholder="Tìm kiếm bộ thẻ..." />
        <select>
          <option>Tất cả cấp độ JLPT</option>
          <option>JLPT N5</option>
          <option>JLPT N4</option>
          <option>JLPT N3</option>
          <option>JLPT N2</option>
          <option>JLPT N1</option>
        </select>
        <select>
          <option>Tất cả loại thẻ</option>
          <option>Từ vựng</option>
          <option>Kanji</option>
          <option>Cụm từ</option>
        </select>
      </div>

      {/* Danh sách bộ thẻ */}
      <div className={styles.grid}>
        {decks.map((deck) => (
          <DeckCard key={deck.id} deck={deck} onStudy={() => setChonBo(deck)} />
        ))}
      </div>

      {/* Modal học */}
      {chonBo && <StudyModal deck={chonBo} onClose={() => setChonBo(null)} />}
    </div>
  );
};

export default MyFlashcards;
