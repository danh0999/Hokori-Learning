// src/pages/JLPT/JLPTEventTests.jsx
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

  useEffect(() => {
    if (!eventId) return;
    dispatch(fetchTestsByEvent(eventId));
  }, [dispatch, eventId]);

  const tests = Array.isArray(allTests) ? allTests : [];

  const errorText =
    typeof testsError === "string" ? testsError : testsError?.message || "";

  const handleStart = (testId) => {
    navigate(`/jlpt/test/${testId}/grammar`);
  };

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Danh sách đề thi của sự kiện</h1>

      {loadingAllTests && <p className={styles.loading}>Đang tải...</p>}

      {!loadingAllTests && testsError && (
        <p className={styles.error}>
          Có lỗi xảy ra khi tải đề thi: {errorText}
        </p>
      )}

      {!loadingAllTests && !testsError && tests.length === 0 && (
        <p className={styles.empty}>Sự kiện này chưa có đề thi.</p>
      )}

      <div className={styles.list}>
        {tests.map((test) => (
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
