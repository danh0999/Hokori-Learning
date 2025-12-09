// src/pages/Admin/pages/AiPackages.jsx
import React, { useEffect, useState } from "react";
import s from "./AiPackages.module.scss";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchAdminAiPackages,
  createAdminAiPackage,
  updateAdminAiPackage,
  deleteAdminAiPackage,
} from "../../../redux/features/adminAiPackageSlice";

// ================= FORMAT PRICE (KHÔNG ĐỤNG TOÁN HỌC) ==================
const formatPrice = (value) => {
  if (!value && value !== 0) return "0";
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// ================= SERVICE OPTIONS ==================
const SERVICE_OPTIONS = [
  { key: "kaiwa", label: "AI Kaiwa" },
  { key: "grammar", label: "Grammar Fix" },
  { key: "pronunciation", label: "Pronunciation Analysis" },
];

// ================= PACKAGE MODAL ==================
const PackageModal = ({ open, mode, initial, onClose, onSubmit }) => {
  const [form, setForm] = useState(
    initial || {
      name: "",
      durationDays: "",
      priceCents: "",
      description: "",
      grammarQuota: 0,
      kaiwaQuota: 0,
      pronunQuota: 0,
      isActive: true,
      displayOrder: 1,
    }
  );

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name,
        durationDays: initial.durationDays,
        priceCents: initial.priceCents / 100, // hiển thị dạng VND bình thường
        description: initial.description,
        grammarQuota: initial.grammarQuota,
        kaiwaQuota: initial.kaiwaQuota,
        pronunQuota: initial.pronunQuota,
        isActive: initial.isActive,
        displayOrder: initial.displayOrder || 1,
      });
    }
  }, [initial]);

  if (!open) return null;

  const validate = (field, value) => {
    let msg = "";
    if (field === "name" && !value.trim()) msg = "Tên gói là bắt buộc";
    if (field === "durationDays" && (+value <= 0 || !value)) msg = "Thời hạn phải > 0";
    if (field === "priceCents" && (+value <= 0 || !value)) msg = "Giá tiền phải > 0";
    if (field === "description" && value.trim().length < 10) msg = "Mô tả tối thiểu 10 ký tự";

    setErrors((prev) => ({ ...prev, [field]: msg }));
  };

  const change = (field) => (e) => {
    const v = e.target.value;
    setForm((p) => ({ ...p, [field]: v }));
    validate(field, v);
  };

  const changeQuota = (field) => (e) => {
    const v = Number(e.target.value);
    setForm((p) => ({ ...p, [field]: v }));
  };

  const submit = (e) => {
    e.preventDefault();

    Object.keys(form).forEach((key) => validate(key, form[key]));
    if (Object.values(errors).some((m) => m)) return;

    const processedForm = {
      ...form,
      priceCents: Number(form.priceCents), // KHÔNG nhân 100
    };

    onSubmit(processedForm);
  };

  return (
    <div className={s.modalOverlay}>
      <div className={s.modal}>
        <h2 className={s.modalTitle}>{mode === "create" ? "Tạo gói AI" : "Chỉnh sửa gói AI"}</h2>

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
                className={`${s.input} ${errors.durationDays ? s.errorInput : ""}`}
                value={form.durationDays}
                onChange={change("durationDays")}
              />
              {errors.durationDays && <p className={s.errorText}>{errors.durationDays}</p>}
            </label>

            <label className={s.label}>
              Giá tiền (VND)
              <input
                type="number"
                className={`${s.input} ${errors.priceCents ? s.errorInput : ""}`}
                value={form.priceCents}
                onChange={change("priceCents")}
              />
              {errors.priceCents && <p className={s.errorText}>{errors.priceCents}</p>}
            </label>

            <label className={s.label}>
              Mô tả gói
              <textarea
                className={`${s.textarea} ${errors.description ? s.errorInput : ""}`}
                value={form.description}
                onChange={change("description")}
              />
              {errors.description && <p className={s.errorText}>{errors.description}</p>}
            </label>
          </div>

          {/* RIGHT */}
          <div className={s.col}>
            <h4 className={s.serviceTitle}>Quota dịch vụ AI</h4>

            <label className={s.label}>
              Grammar Fix
              <input type="number" min={0} className={s.input} value={form.grammarQuota} onChange={changeQuota("grammarQuota")} />
            </label>

            <label className={s.label}>
              AI Kaiwa
              <input type="number" min={0} className={s.input} value={form.kaiwaQuota} onChange={changeQuota("kaiwaQuota")} />
            </label>

            <label className={s.label}>
              Pronunciation Analysis
              <input type="number" min={0} className={s.input} value={form.pronunQuota} onChange={changeQuota("pronunQuota")} />
            </label>
          </div>

          <div className={s.modalActions}>
            <button type="button" className={s.btnGhost} onClick={onClose}>Hủy</button>
            <button type="submit" className={s.btnPrimary}>{mode === "create" ? "Tạo" : "Lưu thay đổi"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ======================================================
// MAIN PAGE
// ======================================================

export default function AiPackages() {
  const dispatch = useDispatch();
  const { list, loading } = useSelector((state) => state.adminAiPackages);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    dispatch(fetchAdminAiPackages());
  }, [dispatch]);

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
      dispatch(createAdminAiPackage(form))
        .unwrap()
        .then(() => toast.success("Tạo gói AI thành công!"))
        .catch(() => toast.error("Không thể tạo gói AI"));
    } else {
      dispatch(updateAdminAiPackage({ id: editing.id, data: form }))
        .unwrap()
        .then(() => toast.success("Cập nhật thành công!"))
        .catch(() => toast.error("Không thể cập nhật!"));
    }
    setModalOpen(false);
  };

  const toggleStatus = (pkg) => {
    const newData = { ...pkg, isActive: !pkg.isActive };
    dispatch(updateAdminAiPackage({ id: pkg.id, data: newData }))
      .unwrap()
      .then(() => toast.success("Đã thay đổi trạng thái!"))
      .catch(() => toast.error("Không thể thay đổi trạng thái!"));
  };

  const handleDelete = (id) => {
    dispatch(deleteAdminAiPackage(id))
      .unwrap()
      .then(() => toast.success("Đã xoá gói AI!"))
      .catch(() => toast.error("Không thể xoá gói AI (có người đang sử dụng)!"));
  };

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Quản lý gói AI</h1>
        <button className={s.btnPrimary} onClick={openCreate}>
          + Tạo gói AI
        </button>
      </div>

      {loading && <p>Đang tải dữ liệu...</p>}

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
                <td>{pkg.durationDays} ngày</td>

                {/* FIXED: FORMAT PRICE */}
                <td>{formatPrice(pkg.priceCents)} đ</td>

                <td>
                  {[
                    pkg.grammarQuota > 0 && `grammar (${pkg.grammarQuota})`,
                    pkg.kaiwaQuota > 0 && `kaiwa (${pkg.kaiwaQuota})`,
                    pkg.pronunQuota > 0 && `pronun (${pkg.pronunQuota})`,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </td>

                <td>
                  <span
                    className={`${s.statusBadge} ${
                      pkg.isActive ? s.active : s.inactive
                    }`}
                  >
                    {pkg.isActive ? "Đang bán" : "Tạm dừng"}
                  </span>
                </td>

                <td className={s.actions}>
                  <button className={s.btnSmall} onClick={() => openEdit(pkg)}>Sửa</button>

                  <button className={s.btnSmall} onClick={() => toggleStatus(pkg)}>
                    {pkg.isActive ? "Tạm dừng" : "Kích hoạt"}
                  </button>

                  <button className={s.btnSmallDanger} onClick={() => handleDelete(pkg.id)}>
                    Xoá
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
