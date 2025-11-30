// src/pages/JLPT/JLPTEventTests.jsx
// :contentReference[oaicite:3]{index=3}
import React, { useEffect } from "react";
import styles from "./JLPTEventTests.module.scss";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { fetchTestsByEvent } from "../../redux/features/jlptLearnerSlice";
import TestCard from "./components/TestCard";

const JLPTEventTests = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { allTests, loadingAllTests, testsError } = useSelector(
    (state) => state.jlptLearner
  );

  /* ============================================================
     FETCH TEST LIST FOR EVENT
  ============================================================ */
  useEffect(() => {
    if (!eventId) return;
    dispatch(fetchTestsByEvent(eventId));
  }, [dispatch, eventId]);

  /* ============================================================
     START TEST
  ============================================================ */
  const handleStart = (testId) => {
    navigate(`/jlpt/test/${testId}/grammar?eventId=${eventId}`);
  };

  const errorText =
    typeof testsError === "string" ? testsError : testsError?.message || "";

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Danh sách đề thi</h1>

      {loadingAllTests && <p className={styles.loading}>Đang tải...</p>}

      {!loadingAllTests && testsError && (
        <p className={styles.error}>
          Có lỗi xảy ra khi tải đề thi: {errorText}
        </p>
      )}

      {!loadingAllTests && !testsError && allTests.length === 0 && (
        <p className={styles.empty}>Không có đề thi hợp lệ.</p>
      )}

      <div className={styles.list}>
        {allTests.map((test) => (
          <TestCard
            key={test.id}
            test={test}
            onStart={() => handleStart(test.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default JLPTEventTests;
