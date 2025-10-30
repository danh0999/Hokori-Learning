import React, { useState } from "react";
import styles from "./JLPTList.module.scss";
import FilterBar from "./components/FilterBar";
import JLPTCard from "./components/JLPTCard";
import Pagination from "./components/Pagination";

const JLPTList = () => {
  // ===============================
  // Mock data KHỚP ERD
  // Đây là kết quả JOIN giữa JLPT_Event và JLPT_Test
  // Một item đại diện cho 1 đề thi JLPT người học có thể vào thi
  // ===============================
  const jlptTests = [
    {
      // JLPT_Event
      event_id: 101,
      title: "JLPT N5 Mock Test #1",
      level: "N5",
      status: "ACTIVE",
      description: "Đề luyện thi N5 cơ bản cho người mới bắt đầu.",
      start_at: "2025-10-01T08:00:00Z",
      end_at: "2025-12-31T23:59:59Z",

      // JLPT_Test (cấu hình thi thuộc event này)
      test_id: 5001,
      duration_min: 105,
      max_participants: 500,
    },
    {
      event_id: 102,
      title: "JLPT N4 Mock Test #2",
      level: "N4",
      status: "ACTIVE",
      description: "Ôn tập tổng hợp ngữ pháp và từ vựng trình độ N4.",
      start_at: "2025-10-10T08:00:00Z",
      end_at: "2025-12-31T23:59:59Z",

      test_id: 5002,
      duration_min: 125,
      max_participants: 400,
    },
    {
      event_id: 103,
      title: "JLPT N3 Grammar & Vocabulary Focus",
      level: "N3",
      status: "ACTIVE",
      description: "Bài luyện chuyên sâu ngữ pháp và từ vựng N3.",
      start_at: "2025-10-15T08:00:00Z",
      end_at: "2025-12-31T23:59:59Z",

      test_id: 5003,
      duration_min: 120,
      max_participants: 300,
    },
    {
      event_id: 104,
      title: "JLPT N2 Practice Test",
      level: "N2",
      status: "ACTIVE",
      description:
        "Đề luyện tổng hợp N2 bao gồm Nghe hiểu, Đọc hiểu và Ngữ pháp.",
      start_at: "2025-10-20T08:00:00Z",
      end_at: "2025-12-31T23:59:59Z",

      test_id: 5004,
      duration_min: 155,
      max_participants: 200,
    },
    {
      event_id: 105,
      title: "JLPT N1 Advanced Challenge",
      level: "N1",
      status: "ACTIVE",
      description:
        "Đề thử thách N1 với độ khó tương đương đề thật, phù hợp ôn nước rút.",
      start_at: "2025-10-25T08:00:00Z",
      end_at: "2025-12-31T23:59:59Z",

      test_id: 5005,
      duration_min: 170,
      max_participants: 150,
    },
  ];

  // ===============================
  // State filter
  // ===============================
  const [filterLevel, setFilterLevel] = useState("Tất cả cấp độ");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTests = jlptTests.filter((item) => {
    const matchLevel =
      filterLevel === "Tất cả cấp độ" || item.level === filterLevel;
    const matchSearch = item.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchLevel && matchSearch;
  });

  return (
    <main id="main-content" className={styles.wrapper}>
      <div className={styles.container}>
        {/* Bộ lọc cấp độ & tìm kiếm */}
        <FilterBar
          filterLevel={filterLevel}
          setFilterLevel={setFilterLevel}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        {/* Grid danh sách đề thi */}
        <section className={styles.gridSection}>
          <div className={styles.grid}>
            {filteredTests.map((test) => (
              <JLPTCard key={test.event_id} test={test} />
            ))}

            {filteredTests.length === 0 && (
              <p className={styles.emptyState}>
                Không tìm thấy đề thi phù hợp.
              </p>
            )}
          </div>
        </section>

        {/* Phân trang */}
        <Pagination />
      </div>
    </main>
  );
};

export default JLPTList;
