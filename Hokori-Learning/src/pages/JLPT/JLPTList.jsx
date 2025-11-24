// src/pages/JLPT/JLPTList.jsx
import { useEffect, useState } from "react";
import styles from "./JLPTList.module.scss";
import FilterBar from "./components/FilterBar";
import JLPTCard from "./components/JLPTCard";
import Pagination from "./components/Pagination";
import { useDispatch, useSelector } from "react-redux";
import { fetchOpenEvents } from "../../redux/features/jlptLearnerSlice";

const JLPTList = () => {
  const dispatch = useDispatch();

  const {
    events,
    loadingEvents,
    levelFilter,
  } = useSelector((state) => state.jlptLearner);

  // Search local FE
  const [searchTerm, setSearchTerm] = useState("");

  // Lần đầu load → lấy danh sách EVENT OPEN
  useEffect(() => {
    dispatch(fetchOpenEvents());
  }, [dispatch]);

  // Lọc theo searchTerm
  let filteredEvents = events || [];
  if (searchTerm.trim()) {
    filteredEvents = filteredEvents.filter((ev) =>
      ev.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  return (
    <main id="main-content" className={styles.wrapper}>
      <div className={styles.container}>

        {/* Filter + Search */}
        <FilterBar
          levelFilter={levelFilter}
          onChangeLevel={(level) => dispatch(fetchOpenEvents(level))}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        {/* EVENTS LIST */}
        <section className={styles.gridSection}>
          {loadingEvents && (
            <p className={styles.loading}>Đang tải dữ liệu...</p>
          )}

          <div className={styles.grid}>
            {filteredEvents.map((event) => (
              <JLPTCard key={event.id} event={event} />   
            ))}

            {!loadingEvents && filteredEvents.length === 0 && (
              <p className={styles.emptyState}>Không có đợt thi nào phù hợp.</p>
            )}
          </div>
        </section>

        <Pagination />
      </div>
    </main>
  );
};

export default JLPTList;
