import React, { useEffect, useState } from "react";
import api from "../../configs/axios";
import s from "./RolePolicies.module.scss";

export default function RolePoliciesPage({ roleName, title, subtitle }) {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewingPolicy, setViewingPolicy] = useState(null);

  const fetchPolicies = async () => {
    setLoading(true);
    setError("");
    try {
      // baseURL axios đã có /api nên chỉ cần "public/..."
      const res = await api.get(`public/policies/role/${roleName}`);
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

      {/* LIST */}
      <section className={s.contentSection}>
        {error && <div className={s.errorBox}>{error}</div>}

        {loading ? (
          <div className={s.loading}>Đang tải chính sách...</div>
        ) : policies.length === 0 ? (
          <div className={s.empty}>
            Hiện chưa có chính sách công khai cho role này.
          </div>
        ) : (
          <div className={s.policyList}>
            {policies.map((p) => (
              <article key={p.id} className={s.policyCard}>
                <h3 className={s.policyTitle}>{p.title}</h3>
                <p className={s.policySnippet}>
                  {p.content?.slice(0, 180) || ""}{" "}
                  {p.content && p.content.length > 180 ? "…" : ""}
                </p>
                <button
                  type="button"
                  className={s.viewBtn}
                  onClick={() => setViewingPolicy(p)}
                >
                  Xem chi tiết
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* MODAL XEM CHI TIẾT */}
      {viewingPolicy && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <h2 className={s.modalTitle}>Chi tiết chính sách</h2>
            </div>

            <div className={s.modalBody}>
              <h3 className={s.modalPolicyTitle}>{viewingPolicy.title}</h3>
              <div
                className={s.modalContent}
                dangerouslySetInnerHTML={{
                  __html: (viewingPolicy.content || "").replace(
                    /\n/g,
                    "<br />"
                  ),
                }}
              />
            </div>

            <div className={s.modalFooter}>
              <button
                type="button"
                className={s.closeBtn}
                onClick={() => setViewingPolicy(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
