import React, { useEffect, useState } from "react";
import api from "../../configs/axios";
import s from "./RolePolicies.module.scss";

export default function RolePoliciesPage({ roleName, title, subtitle }) {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Format nội dung BE trả về (vì không có HTML)
  const formatContent = (text) => {
    if (!text) return "";

    return text
      .replace(/\n/g, "<br/>")        // xuống dòng BE trả
      .replace(/- /g, "• ");          // bullet đẹp hơn
  };

  const fetchPolicies = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.get(`/public/policies/role/${roleName}`);
      setPolicies(res.data?.data || []);
    } catch (err) {
      console.error(err);
      setError("Không tải được chính sách. Vui lòng thử lại sau.");
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [roleName]);

  return (
    <div className={s.page}>
      {/* HEADER */}
      <header className={s.header}>
        <h1 className={s.title}>{title}</h1>
        {subtitle && <p className={s.subtitle}>{subtitle}</p>}
      </header>

      {/* CONTENT */}
      <section className={s.contentSection}>
        {error && <div className={s.errorBox}>{error}</div>}

        {loading ? (
          <div className={s.loading}>Đang tải chính sách...</div>
        ) : policies.length === 0 ? (
          <div className={s.empty}>Hiện chưa có chính sách.</div>
        ) : (
          <div className={s.policyListFull}>
            {policies.map((p, index) => (
              <article key={p.id} className={s.policyBlock}>
                <h2 className={s.policyHeading}>
                  {index + 1}. {p.title}
                </h2>

                <div
                  className={s.policyContent}
                  dangerouslySetInnerHTML={{
                    __html: formatContent(p.content),
                  }}
                />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
