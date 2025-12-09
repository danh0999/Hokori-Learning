import React, { useEffect, useState, useCallback } from "react";
import api from "../../../configs/axios";
import s from "./AdPolicies.module.scss";
import { toast } from "react-toastify";

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
      toast.error("Không tải được danh sách chính sách!");
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
    toast.info(
      <div>
        <div style={{ marginBottom: "8px" }}>
          Xác nhận xoá policy "<b>{p.title}</b>"?
        </div>
        <button
          style={{
            padding: "6px 12px",
            background: "#dc2626",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginRight: "8px",
          }}
          onClick={async () => {
            try {
              await api.delete(`admin/policies/${p.id}`);
              await loadPolicies();
              toast.success("Đã xoá thành công!");
            } catch (err) {
              console.error(err);
              toast.error("Xoá thất bại!");
            }
          }}
        >
          Xoá ngay
        </button>
      </div>,
      { autoClose: 5000 }
    );
  };

  // SAVE CREATE / UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.roleName || !form.title || !form.content) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    setSaving(true);
    try {
      const body = { ...form };

      if (editingPolicy) {
        await api.put(`admin/policies/${editingPolicy.id}`, body);
        toast.success("Cập nhật chính sách thành công!");
      } else {
        await api.post("admin/policies", body);
        toast.success("Tạo chính sách mới thành công!");
      }

      setShowForm(false);
      await loadPolicies();
    } catch (err) {
      console.error(err);
      toast.error("Lưu thất bại!");
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
            Tạo và quản lý các chính sách áp dụng cho từng vai trò trong hệ thống.
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
                          p.roleName ? s[`roleBadge__${p.roleName.toLowerCase()}`] : ""
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

      {/* FORM MODAL */}
      {showForm && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <h2 className={s.modalTitle}>
                {editingPolicy ? "Sửa chính sách" : "Tạo chính sách mới"}
              </h2>
              <p className={s.modalDesc}>Điền thông tin chi tiết của policy.</p>
            </div>

            <form onSubmit={handleSubmit} className={s.form}>
              <div className={s.formGroup}>
                <label>Role áp dụng</label>
                <select
                  value={form.roleName}
                  onChange={(e) => setForm((prev) => ({ ...prev, roleName: e.target.value }))}
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
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className={s.formGroup}>
                <label>Nội dung</label>
                <textarea
                  rows={6}
                  value={form.content}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
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
                  {saving ? "Đang lưu..." : editingPolicy ? "Lưu thay đổi" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewingPolicy && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <h2 className={s.modalTitle}>Chi tiết chính sách</h2>
            </div>

            <div className={s.viewContentBox}>
              <h3 className={s.viewTitle}>{viewingPolicy.title}</h3>

              <div
                className={s.viewBody}
                dangerouslySetInnerHTML={{
                  __html: (viewingPolicy.content || "").replace(/\n/g, "<br />"),
                }}
              />
            </div>

            <div className={s.formActions}>
              <button className={s.cancelBtn} onClick={() => setViewingPolicy(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
