import React, { useEffect, useState, useCallback } from "react";
import api from "../../../configs/axios";
import s from "./AdPolicies.module.scss";

export default function AdPolicies() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);

  const [viewingPolicy, setViewingPolicy] = useState(null);

  const [form, setForm] = useState({
    roleName: "",
    title: "",
    content: "",
  });

  const ROLE_OPTIONS = ["ADMIN", "MODERATOR", "TEACHER", "STAFF", "LEARNER"];

  // LOAD LIST
  const loadPolicies = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.get("admin/policies");
      setPolicies(res.data?.data || []);
    } catch (err) {
      console.error(err);
      setError("Không tải được danh sách chính sách.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  // OPEN CREATE
  const openCreate = () => {
    setEditingPolicy(null);
    setForm({
      roleName: "",
      title: "",
      content: "",
    });
    setShowForm(true);
  };

  // OPEN EDIT
  const openEdit = (p) => {
    setEditingPolicy(p);
    setForm({
      roleName: p.roleName,
      title: p.title,
      content: p.content,
    });
    setShowForm(true);
  };

  // DELETE
  const handleDelete = async (p) => {
    if (!window.confirm(`Xoá chính sách "${p.title}"?`)) return;

    try {
      await api.delete(`admin/policies/${p.id}`);
      await loadPolicies();
    } catch (err) {
      console.error(err);
      alert("Xoá thất bại.");
    }
  };

  // SAVE CREATE / UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.roleName || !form.title || !form.content) {
      alert("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    setSaving(true);
    try {
      const body = { ...form };

      if (editingPolicy) {
        await api.put(`admin/policies/${editingPolicy.id}`, body);
      } else {
        await api.post("admin/policies", body);
      }

      setShowForm(false);
      await loadPolicies();
    } catch (err) {
      console.error(err);
      alert("Lưu thất bại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={s.container}>
      {/* HEADER */}
      <div className={s.header}>
        <div className={s.headerText}>
          <h1 className={s.title}>Quản lý chính sách</h1>
          <p className={s.subtitle}>
            Tạo và quản lý các chính sách áp dụng cho từng vai trò trong hệ
            thống.
          </p>
        </div>

        <button className={s.primaryBtn} onClick={openCreate}>
          + Tạo chính sách mới
        </button>
      </div>

      {error && <div className={s.error}>{error}</div>}

      {/* TABLE */}
      <div className={s.card}>
        <div className={s.cardHeader}>
          <h2 className={s.cardTitle}>Danh sách chính sách</h2>
          <span className={s.badgeCount}>{policies.length} policy</span>
        </div>

        <div className={s.tableWrapper}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Role</th>
                <th>Tiêu đề</th>
                <th>Người tạo</th>
                <th>Tạo lúc</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className={s.loading}>
                    Đang tải...
                  </td>
                </tr>
              ) : policies.length === 0 ? (
                <tr>
                  <td colSpan="5" className={s.loading}>
                    Chưa có policy nào.
                  </td>
                </tr>
              ) : (
                policies.map((p) => (
                  <tr key={p.id} className={s.row}>
                    <td>
                      <span
                        className={`${s.roleBadge} ${
                          p.roleName
                            ? s[`roleBadge__${p.roleName.toLowerCase()}`]
                            : ""
                        }`}
                      >
                        {p.roleName}
                      </span>
                    </td>
                    <td className={s.textCell}>{p.title}</td>
                    <td className={s.textCell}>{p.createdByEmail}</td>
                    <td className={s.textCell}>
                      {new Date(p.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className={s.actions}>
                      <button
                        className={s.actionBtn}
                        onClick={() => setViewingPolicy(p)}
                        type="button"
                      >
                        Xem
                      </button>

                      <button
                        className={s.actionBtn}
                        onClick={() => openEdit(p)}
                        type="button"
                      >
                        Sửa
                      </button>

                      <button
                        className={`${s.actionBtn} ${s.deleteBtn}`}
                        onClick={() => handleDelete(p)}
                        type="button"
                      >
                        Xoá
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {showForm && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <h2 className={s.modalTitle}>
                {editingPolicy ? "Sửa chính sách" : "Tạo chính sách mới"}
              </h2>
              <p className={s.modalDesc}>
                Gắn chính sách với role tương ứng, mô tả rõ phạm vi áp dụng và
                điều kiện.
              </p>
            </div>

            <form onSubmit={handleSubmit} className={s.form}>
              <div className={s.formGroup}>
                <label>Role áp dụng</label>
                <select
                  value={form.roleName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, roleName: e.target.value }))
                  }
                >
                  <option value="">-- Chọn role --</option>
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className={s.formGroup}>
                <label>Tiêu đề</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="VD: Chính sách chia sẻ doanh thu cho Teacher"
                />
              </div>

              <div className={s.formGroup}>
                <label>Nội dung</label>
                <textarea
                  rows={6}
                  value={form.content}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, content: e.target.value }))
                  }
                  placeholder="Mô tả chi tiết điều kiện, phạm vi áp dụng, ngoại lệ..."
                />
              </div>

              <div className={s.formActions}>
                <button
                  type="button"
                  className={s.cancelBtn}
                  onClick={() => setShowForm(false)}
                >
                  Huỷ
                </button>

                <button type="submit" className={s.saveBtn} disabled={saving}>
                  {saving
                    ? "Đang lưu..."
                    : editingPolicy
                    ? "Lưu thay đổi"
                    : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {viewingPolicy && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <h2 className={s.modalTitle}>Chi tiết chính sách</h2>
              <p className={s.modalDesc}>
                Policy dành cho role: <strong>{viewingPolicy.roleName}</strong>
              </p>
            </div>

            <div className={s.viewContentBox}>
              <h3 className={s.viewTitle}>{viewingPolicy.title}</h3>

              <div
                className={s.viewBody}
                dangerouslySetInnerHTML={{
                  __html: (viewingPolicy.content || "").replace(
                    /\n/g,
                    "<br />"
                  ),
                }}
              />
            </div>

            <div className={s.formActions}>
              <button
                className={s.cancelBtn}
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
