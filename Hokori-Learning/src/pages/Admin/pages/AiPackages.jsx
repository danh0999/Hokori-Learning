// src/pages/Admin/pages/AiPackages.jsx
import React, { useState } from "react";
import s from "./AiPackages.module.scss";
import { toast } from "react-toastify";

// ================= MOCK ==================
const MOCK_PACKAGES = [
  {
    id: 1,
    name: "AI Basic (30 ngày)",
    duration: 30,
    price: 99000,
    description: "Gói AI cơ bản phù hợp cho người mới bắt đầu.",
    services: {
      kaiwa: 100,
      grammar: 200,
      pronunciation: 150,
      vocabulary: 0,
    },
    status: "ACTIVE",
  },
  {
    id: 2,
    name: "AI Pro (90 ngày)",
    duration: 90,
    price: 249000,
    description: "Gói AI nâng cao với đầy đủ các tính năng mạnh nhất.",
    services: {
      kaiwa: 300,
      grammar: 400,
      pronunciation: 300,
      vocabulary: 500,
    },
    status: "INACTIVE",
  },
];

const SERVICE_OPTIONS = [
  { key: "kaiwa", label: "AI Kaiwa" },
  { key: "grammar", label: "Grammar Fix" },
  { key: "pronunciation", label: "Pronunciation Analysis" },
  { key: "vocabulary", label: "Vocabulary Generator" },
];


// PACKAGE MODAL

const PackageModal = ({ open, mode, initial, onClose, onSubmit }) => {
  const [form, setForm] = useState(
    initial || {
      name: "",
      duration: "",
      price: "",
      description: "",
      services: {
        kaiwa: 0,
        grammar: 0,
        pronunciation: 0,
        vocabulary: 0,
      },
    }
  );

  const [errors, setErrors] = useState({});

  if (!open) return null;

  // VALIDATION
  const validate = (field, value) => {
    let msg = "";

    if (field === "name" && !value.trim()) msg = "Tên gói là bắt buộc";
    if (field === "duration" && (+value <= 0 || !value))
      msg = "Thời hạn phải > 0";
    if (field === "price" && (+value <= 0 || !value))
      msg = "Giá tiền phải > 0";
    if (field === "description" && value.trim().length < 10)
      msg = "Mô tả tối thiểu 10 ký tự";

    setErrors((p) => ({ ...p, [field]: msg }));
  };

  const change = (field) => (e) => {
    const v = e.target.value;
    setForm((prev) => ({ ...prev, [field]: v }));
    validate(field, v);
  };

  const changeService = (key) => (e) => {
    const v = Number(e.target.value);
    setForm((prev) => ({
      ...prev,
      services: { ...prev.services, [key]: v },
    }));
  };

  const submit = (e) => {
    e.preventDefault();

    Object.keys(form).forEach((key) => validate(key, form[key]));
    if (Object.values(errors).some((m) => m)) return;

    onSubmit(form);
  };

  return (
    <div className={s.modalOverlay}>
      <div className={s.modal}>
        <h2 className={s.modalTitle}>
          {mode === "create" ? "Tạo gói AI" : "Chỉnh sửa gói AI"}
        </h2>

        <form className={s.form} onSubmit={submit}>
          {/* LEFT */}
          <div className={s.col}>
            <label className={s.label}>
              Tên gói
              <input
                className={`${s.input} ${errors.name ? s.errorInput : ""}`}
                value={form.name}
                onChange={change("name")}
              />
              {errors.name && <p className={s.errorText}>{errors.name}</p>}
            </label>

            <label className={s.label}>
              Thời hạn (ngày)
              <input
                type="number"
                className={`${s.input} ${errors.duration ? s.errorInput : ""}`}
                value={form.duration}
                onChange={change("duration")}
              />
              {errors.duration && (
                <p className={s.errorText}>{errors.duration}</p>
              )}
            </label>

            <label className={s.label}>
              Giá tiền (VND)
              <input
                type="number"
                className={`${s.input} ${errors.price ? s.errorInput : ""}`}
                value={form.price}
                onChange={change("price")}
              />
              {errors.price && <p className={s.errorText}>{errors.price}</p>}
            </label>

            <label className={s.label}>
              Mô tả gói
              <textarea
                className={`${s.textarea} ${
                  errors.description ? s.errorInput : ""
                }`}
                value={form.description}
                onChange={change("description")}
              />
              {errors.description && (
                <p className={s.errorText}>{errors.description}</p>
              )}
            </label>
          </div>

          {/* RIGHT */}
          <div className={s.col}>
            <h4 className={s.serviceTitle}>Quota dịch vụ AI</h4>

            {SERVICE_OPTIONS.map((sv) => (
              <label key={sv.key} className={s.label}>
                {sv.label}
                <input
                  type="number"
                  min={0}
                  className={s.input}
                  value={form.services[sv.key]}
                  onChange={changeService(sv.key)}
                />
              </label>
            ))}
          </div>

          <div className={s.modalActions}>
            <button type="button" className={s.btnGhost} onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className={s.btnPrimary}>
              {mode === "create" ? "Tạo" : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// MAIN PAGE

export default function AiPackages() {
  const [list, setList] = useState(MOCK_PACKAGES);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [editing, setEditing] = useState(null);

  const openCreate = () => {
    setMode("create");
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (pkg) => {
    setMode("edit");
    setEditing(pkg);
    setModalOpen(true);
  };

  const submit = (form) => {
    if (mode === "create") {
      const newPkg = { id: Date.now(), ...form, status: "ACTIVE" };
      setList((p) => [newPkg, ...p]);
      toast.success("Tạo gói AI thành công!");
    } else {
      setList((p) =>
        p.map((item) => (item.id === editing.id ? { ...item, ...form } : item))
      );
      toast.success("Cập nhật gói AI thành công!");
    }
    setModalOpen(false);
  };

  const toggleStatus = (pkg) => {
    setList((prev) =>
      prev.map((p) =>
        p.id === pkg.id
          ? { ...p, status: p.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }
          : p
      )
    );
    toast.success("Đã thay đổi trạng thái gói");
  };

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Quản lý gói AI</h1>
        <button className={s.btnPrimary} onClick={openCreate}>
          + Tạo gói AI
        </button>
      </div>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Tên gói</th>
              <th>Thời hạn</th>
              <th>Giá</th>
              <th>Dịch vụ</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {list.map((pkg) => (
              <tr key={pkg.id}>
                <td>{pkg.name}</td>
                <td>{pkg.duration} ngày</td>
                <td>{pkg.price.toLocaleString()} đ</td>

                <td>
                  {Object.entries(pkg.services)
                    .filter(([, v]) => v > 0)
                    .map(([k, v]) => `${k} (${v})`)
                    .join(", ")}
                </td>

                <td>
                  <span
                    className={`${s.statusBadge} ${
                      pkg.status === "ACTIVE" ? s.active : s.inactive
                    }`}
                  >
                    {pkg.status === "ACTIVE" ? "Đang bán" : "Tạm dừng"}
                  </span>
                </td>

                <td className={s.actions}>
                  <button className={s.btnSmall} onClick={() => openEdit(pkg)}>
                    Sửa
                  </button>
                  <button className={s.btnSmall} onClick={() => toggleStatus(pkg)}>
                    {pkg.status === "ACTIVE" ? "Tạm dừng" : "Kích hoạt"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PackageModal
        open={modalOpen}
        mode={mode}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={submit}
      />
    </div>
  );
}
