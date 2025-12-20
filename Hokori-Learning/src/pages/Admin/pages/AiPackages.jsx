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

/* ================= FORMAT PRICE ================= */
const formatPrice = (value) => {
  if (!value && value !== 0) return "0";
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

/* ================= RULE HELPERS ================= */
const getPurchaseCount = (pkg) => Number(pkg.purchaseCount || 0);
const getUsageCount = (pkg) => Number(pkg.usageCount || 0);

const canEditPackage = (pkg) =>
  !pkg.isActive &&
  getPurchaseCount(pkg) === 0 &&
  getUsageCount(pkg) === 0;

const canDeletePackage = (pkg) =>
  !pkg.isActive &&
  getPurchaseCount(pkg) === 0 &&
  getUsageCount(pkg) === 0;

/* ================= PACKAGE MODAL ================= */
const PackageModal = ({ open, mode, initial, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    name: "",
    durationDays: "",
    priceCents: "",
    description: "",
    totalRequests: "",
    isActive: true,
    displayOrder: 1,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name,
        durationDays: initial.durationDays,
        priceCents: initial.priceCents,
        description: initial.description,
        totalRequests: initial.totalRequests,
        isActive: initial.isActive,
        displayOrder: initial.displayOrder || 1,
      });
    }
  }, [initial]);

  if (!open) return null;

  const change = (field) => (e) => {
    const v = e.target.value;
    setForm((p) => ({ ...p, [field]: v }));
  };

  const submit = (e) => {
    e.preventDefault();

    const nextErrors = {};
    const setMsg = (f, m) => (nextErrors[f] = m);

    if (!form.name.trim()) setMsg("name", "Tên gói là bắt buộc");
    if (!form.durationDays || Number(form.durationDays) <= 0)
      setMsg("durationDays", "Thời hạn phải > 0");
    if (!form.priceCents || Number(form.priceCents) <= 0)
      setMsg("priceCents", "Giá tiền phải > 0");
    if (!form.totalRequests || Number(form.totalRequests) <= 0)
      setMsg("totalRequests", "Tổng lượt AI phải > 0");
    if (form.description.trim().length < 10)
      setMsg("description", "Mô tả tối thiểu 10 ký tự");

    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      durationDays: Number(form.durationDays),
      priceCents: Number(form.priceCents),
      currency: "VND",
      totalRequests: Number(form.totalRequests),
      isActive: form.isActive,
      displayOrder: form.displayOrder,
    };

    onSubmit(payload);
  };

  return (
    <div className={s.modalOverlay}>
      <div className={s.modal}>
        <h2 className={s.modalTitle}>
          {mode === "create" ? "Tạo gói AI" : "Chỉnh sửa gói AI"}
        </h2>

        <form className={s.form} onSubmit={submit}>
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
                className={`${s.input} ${
                  errors.durationDays ? s.errorInput : ""
                }`}
                value={form.durationDays}
                onChange={change("durationDays")}
              />
              {errors.durationDays && (
                <p className={s.errorText}>{errors.durationDays}</p>
              )}
            </label>

            <label className={s.label}>
              Giá tiền (VND)
              <input
                type="number"
                className={`${s.input} ${
                  errors.priceCents ? s.errorInput : ""
                }`}
                value={form.priceCents}
                onChange={change("priceCents")}
              />
              {errors.priceCents && (
                <p className={s.errorText}>{errors.priceCents}</p>
              )}
            </label>

            <label className={s.label}>
              Tổng lượt AI (dùng chung)
              <input
                type="number"
                min={1}
                className={`${s.input} ${
                  errors.totalRequests ? s.errorInput : ""
                }`}
                value={form.totalRequests}
                onChange={change("totalRequests")}
              />
              {errors.totalRequests && (
                <p className={s.errorText}>{errors.totalRequests}</p>
              )}
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

/* ================= MAIN PAGE ================= */
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
    if (!canEditPackage(pkg)) {
      toast.warning(
        "Không thể chỉnh sửa: gói đang bán hoặc đã có người mua / sử dụng"
      );
      return;
    }
    setMode("edit");
    setEditing(pkg);
    setModalOpen(true);
  };

  const submit = (form) => {
    const action =
      mode === "create"
        ? createAdminAiPackage(form)
        : updateAdminAiPackage({ id: editing.id, data: form });

    dispatch(action)
      .unwrap()
      .then(() =>
        toast.success(
          mode === "create"
            ? "Tạo gói AI thành công!"
            : "Cập nhật gói AI thành công!"
        )
      )
      .catch(() => toast.error("Thao tác thất bại!"));

    setModalOpen(false);
  };

  const toggleStatus = (pkg) => {
    dispatch(
      updateAdminAiPackage({
        id: pkg.id,
        data: {
          name: pkg.name,
          description: pkg.description,
          priceCents: pkg.priceCents,
          currency: pkg.currency || "VND",
          durationDays: pkg.durationDays,
          totalRequests: pkg.totalRequests,
          isActive: !pkg.isActive,
          displayOrder: pkg.displayOrder || 1,
        },
      })
    )
      .unwrap()
      .then(() => toast.success("Đã thay đổi trạng thái gói AI"))
      .catch(() =>
        toast.error("Không thể thay đổi trạng thái (vi phạm điều kiện)")
      );
  };

  const handleDelete = (pkg) => {
    if (!canDeletePackage(pkg)) {
      toast.warning(
        "Không thể xoá: gói đang bán hoặc đã có người mua / sử dụng"
      );
      return;
    }

    dispatch(deleteAdminAiPackage(pkg.id))
      .unwrap()
      .then(() => toast.success("Đã xoá gói AI"))
      .catch(() => toast.error("Không thể xoá gói AI"));
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
              <th>Quota AI</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {list.map((pkg) => (
              <tr key={pkg.id}>
                <td>{pkg.name}</td>
                <td>{pkg.durationDays} ngày</td>
                <td>{formatPrice(pkg.priceCents)} đ</td>
                <td>{pkg.totalRequests} lượt</td>

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
                  <button
                    className={s.btnSmall}
                    disabled={!canEditPackage(pkg)}
                    onClick={() => openEdit(pkg)}
                  >
                    Sửa
                  </button>

                  <button
                    className={s.btnSmall}
                    onClick={() => toggleStatus(pkg)}
                  >
                    {pkg.isActive ? "Tạm dừng" : "Kích hoạt"}
                  </button>

                  <button
                    className={s.btnSmallDanger}
                    disabled={!canDeletePackage(pkg)}
                    onClick={() => handleDelete(pkg)}
                  >
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
