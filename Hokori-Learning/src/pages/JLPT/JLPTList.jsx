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

  const { events, loadingEvents, eventsError } = useSelector(
    (state) => state.jlptLearner
  );

  // FILTER UI
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  // Load list events OPEN
  useEffect(() => {
    dispatch(fetchOpenEvents());
  }, [dispatch]);

  const errorText =
    typeof eventsError === "string"
      ? eventsError
      : eventsError?.message || JSON.stringify(eventsError || "");

  let filteredEvents = events || [];

  if (levelFilter) {
    filteredEvents = filteredEvents.filter(
      (ev) => ev.level?.toLowerCase() === levelFilter.toLowerCase()
    );
  }

  if (searchTerm.trim()) {
    const lower = searchTerm.toLowerCase();
    filteredEvents = filteredEvents.filter((ev) =>
      ev.title?.toLowerCase().includes(lower)
    );
  }

  return (
    <main id="main-content" className={styles.wrapper}>
      <div className={styles.container}>
        
        {/* FILTER BAR */}
        <FilterBar
          levelFilter={levelFilter}
          onChangeLevel={setLevelFilter}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        {/* EVENT GRID */}
        <section className={styles.gridSection}>
          {loadingEvents && (
            <p className={styles.loading}>Đang tải danh sách đợt thi...</p>
          )}

          {eventsError && (
            <p className={styles.error}>
              Lỗi khi tải danh sách: {errorText}
            </p>
          )}

          <div className={styles.grid}>
            {filteredEvents.map((event) => (
              <JLPTCard key={event.id} event={event} />
            ))}

            {!loadingEvents &&
              !eventsError &&
              filteredEvents.length === 0 && (
                <p className={styles.emptyState}>
                  Không có đợt thi phù hợp.
                </p>
              )}
          </div>
        </section>

        <Pagination />
      </div>
    </main>
  );
};

export default JLPTList;
