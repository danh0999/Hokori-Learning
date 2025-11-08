import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMockPolicy } from "../../redux/features/policiesSlice";
import styles from "./Policies.module.scss";
import { Spin } from "antd";

const Policies = () => {
  const dispatch = useDispatch();
  const { currentPolicy, loading } = useSelector((state) => state.policies);

  useEffect(() => {
    //  Lúc này chỉ dùng mock data (giả lập API)
    // TODO: Replace this dispatch with fetchLatestPolicy() when API is ready
    dispatch(fetchMockPolicy());
  }, [dispatch]);

  if (loading || !currentPolicy) return <Spin className={styles.loader} />;

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <h1 className={styles.title}>{currentPolicy.title}</h1>
        <p className={styles.version}>
          Phiên bản: {currentPolicy.version} – Hiệu lực từ{" "}
          {currentPolicy.effective_from}
        </p>

        {currentPolicy.content.map((section, idx) => (
          <section key={idx} className={styles.section}>
            <h2 className={styles.heading}>{section.heading}</h2>
            <p className={styles.body}>{section.body}</p>
          </section>
        ))}

  
      </div>
    </div>
  );
};

export default Policies;
