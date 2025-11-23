// src/pages/JLPT/JLPTList.jsx
import { useEffect, useState } from "react";
import styles from "./JLPTList.module.scss";
import FilterBar from "./components/FilterBar";
import JLPTCard from "./components/JLPTCard";
import Pagination from "./components/Pagination";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchOpenEvents,
  fetchTestsByEvent,
} from "../../redux/features/jlptLearnerSlice";

const JLPTList = () => {
  const dispatch = useDispatch();
  const {
    events,
    selectedEventId,
    testsByEvent,
    loadingEvents,
    loadingTests,
    levelFilter,
  } = useSelector((state) => state.jlptLearner);

  // 🟦 Thêm searchTerm local (FE filter tên đề)
  const [searchTerm, setSearchTerm] = useState("");

  // 🟦 Lần đầu vào trang: lấy event OPEN (không filter)
  useEffect(() => {
    dispatch(fetchOpenEvents());
  }, [dispatch]);

  // 🟦 Khi chọn event khác → load test của event đó (nếu chưa có cache)
  useEffect(() => {
    if (selectedEventId && !testsByEvent[selectedEventId]) {
      dispatch(fetchTestsByEvent(selectedEventId));
    }
  }, [selectedEventId, testsByEvent, dispatch]);

  // 🟦 Danh sách test theo sự kiện
  let tests = testsByEvent[selectedEventId] || [];

  // 🟦 Lọc tìm kiếm bằng FE (chỉ lọc tên)
  if (searchTerm.trim()) {
    tests = tests.filter((t) =>
      t.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  return (
    <main id="main-content" className={styles.wrapper}>
      <div className={styles.container}>
        {/* Filter level + search */}
        <FilterBar
          levelFilter={levelFilter}
          onChangeLevel={(level) => dispatch(fetchOpenEvents(level))}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        {/* Danh sách đề thi */}
        <section className={styles.gridSection}>
          {(loadingEvents || loadingTests) && (
            <p className={styles.loading}>Đang tải dữ liệu...</p>
          )}

          <div className={styles.grid}>
            {tests.map((test) => (
              <JLPTCard key={test.id} test={test} />
            ))}

            {!loadingTests && tests.length === 0 && (
              <p className={styles.emptyState}>Không có đề thi phù hợp.</p>
            )}
          </div>
        </section>

        {/* Pagination (tạm thời static) */}
        <Pagination />
      </div>
    </main>
  );
};

export default JLPTList;
