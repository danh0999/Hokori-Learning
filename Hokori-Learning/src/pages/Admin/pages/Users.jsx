// src/pages/Admin/pages/Users.jsx
import React, { useState, useEffect } from "react";
import s from "./Users.module.scss";
import DataTable from "../components/DataTable";
import { toast } from "react-toastify";
import api from "../../../configs/axios"; 

const ROLE_LABEL = {
  LEARNER: "Học viên",
  TEACHER: "Giáo viên",
  MODERATOR: "Moderator",
  ADMIN: "Admin",
};

const STATUS_CLASS = {
  ACTIVE: "active",
  PENDING: "pending",
  BLOCKED: "blocked",
};

const ConfirmModal = ({ open, title, desc, onConfirm, onCancel }) => {
  if (!open) return null;

  return (
    <div className={s.modalOverlay}>
      <div className={s.modal}>
        <h2 className={s.modalTitle}>{title}</h2>
        {desc && <p className={s.modalDesc}>{desc}</p>}
        <div className={s.modalActions}>
          <button className={s.btnGhost} onClick={onCancel}>Hủy</button>
          <button className={s.btnPrimary} onClick={onConfirm}>Xác nhận</button>
        </div>
      </div>
    </div>
  );
};

//  User Form Modal 
const UserFormModal = ({ open, mode, initial, onSubmit, onClose }) => {
  const [form, setForm] = useState(
    initial || {
      displayName: "",
      email: "",
      role: "LEARNER",
      password: "",
      confirmPassword: "",
    }
  );

  const [errors, setErrors] = useState({});

  const validate = (field, value) => {
    let msg = "";

    if (field === "displayName" && !value.trim())
      msg = "Tên hiển thị là bắt buộc";

    if (field === "email" && (!value.trim() || !/\S+@\S+\.\S+/.test(value)))
      msg = "Email không hợp lệ";

    if (field === "password" && mode === "create" && value.length < 6)
      msg = "Mật khẩu phải ≥ 6 ký tự";

    if (
      field === "confirmPassword" &&
      mode === "create" &&
      value !== form.password
    )
      msg = "Mật khẩu xác nhận không khớp";

    setErrors((prev) => ({ ...prev, [field]: msg }));
  };

  const change = (field) => (e) => {
    const v = e.target.value;
    setForm((prev) => ({ ...prev, [field]: v }));
    validate(field, v);
  };

  const submit = (e) => {
    e.preventDefault();
    Object.keys(form).forEach((key) => validate(key, form[key]));
    if (Object.values(errors).some((m) => m)) return;

    onSubmit(form);
  };

  if (!open) return null;

  return (
    <div className={s.modalOverlay}>
      <div className={s.modal}>
        <h2 className={s.modalTitle}>
          {mode === "create" ? "Thêm người dùng mới" : "Chỉnh sửa người dùng"}
        </h2>

        <form onSubmit={submit} className={s.form}>
          {/* Display Name */}
          <label className={s.label}>
            Tên hiển thị
            <input
              className={`${s.input} ${errors.displayName ? s.errorInput : ""}`}
              value={form.displayName}
              onChange={change("displayName")}
            />
            {errors.displayName && <p className={s.errorText}>{errors.displayName}</p>}
          </label>

          {/* Email */}
          <label className={s.label}>
            Email
            <input
              className={`${s.input} ${errors.email ? s.errorInput : ""}`}
              value={form.email}
              onChange={change("email")}
            />
            {errors.email && <p className={s.errorText}>{errors.email}</p>}
          </label>

          {/* Password - only create */}
          {mode === "create" && (
            <>
              <label className={s.label}>
                Mật khẩu
                <input
                  type="password"
                  className={`${s.input} ${errors.password ? s.errorInput : ""}`}
                  value={form.password}
                  onChange={change("password")}
                />
                {errors.password && <p className={s.errorText}>{errors.password}</p>}
              </label>

              <label className={s.label}>
                Xác nhận mật khẩu
                <input
                  type="password"
                  className={`${s.input} ${errors.confirmPassword ? s.errorInput : ""}`}
                  value={form.confirmPassword}
                  onChange={change("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className={s.errorText}>{errors.confirmPassword}</p>
                )}
              </label>
            </>
          )}

          {/* Role */}
          <label className={s.label}>
            Vai trò
            <select className={s.select} value={form.role} onChange={change("role")}>
              <option value="LEARNER">Học viên</option>
              <option value="TEACHER">Giáo viên</option>
              <option value="MODERATOR">Moderator</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>

          <div className={s.modalActions}>
            <button type="button" className={s.btnGhost} onClick={onClose}>Hủy</button>
            <button type="submit" className={s.btnPrimary}>
              {mode === "create" ? "Tạo" : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =====================================================
// 🔶 MAIN PAGE
// =====================================================
export default function Users() {
  const [users, setUsers] = useState([]);

  const [filterRole, setFilterRole] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [editingUser, setEditingUser] = useState(null);

  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    desc: "",
    onConfirm: () => {},
  });

  // ================= GET /api/admin/users =================
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/admin/users");
        const list = res.data?.data || [];

        const mapped = list.map((u) => ({
          id: u.id,
          displayName: u.displayName,
          email: u.email,
          role: u.roleName,
          status: u.isVerified
            ? (u.isActive ? "ACTIVE" : "BLOCKED")
            : "PENDING",
          createdAt: u.createdAt,
        }));

        setUsers(mapped);
      } catch (err) {
        console.error(err);
        toast.error("Không thể tải danh sách người dùng!");
      }
    };

    fetchUsers();
  }, []);

  // ============ Create / Edit (local state, chưa call BE) ============
  const openCreate = () => {
    setMode("create");
    setEditingUser(null);
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setMode("edit");
    setEditingUser(user);
    setModalOpen(true);
  };

  const submitUser = (data) => {
    if (mode === "create") {
      toast.info("API tạo user chưa gắn, mới cập nhật local state.");
    } else {
      toast.info("API update user chưa gắn, mới cập nhật local state.");
    }
    setModalOpen(false);
  };

  // ============ Lock / Delete (local thôi, chưa call BE) ============
  const askLock = (user) => {
    setConfirm({
      open: true,
      title: user.status === "BLOCKED" ? "Mở khóa" : "Khóa tài khoản",
      desc: `Bạn có chắc muốn thực hiện hành động này với "${user.displayName}"?`,
      onConfirm: () => toggleLock(user),
    });
  };

  const toggleLock = (user) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id
          ? { ...u, status: u.status === "BLOCKED" ? "ACTIVE" : "BLOCKED" }
          : u
      )
    );
    toast.success("Đã đổi trạng thái (local)!");
    setConfirm((c) => ({ ...c, open: false }));
  };

  const askDelete = (user) => {
    setConfirm({
      open: true,
      title: "Xóa người dùng",
      desc: `Bạn có chắc muốn xóa "${user.displayName}"?`,
      onConfirm: () => remove(user),
    });
  };

  const remove = (user) => {
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    toast.success("Đã xóa (local)!");
    setConfirm((c) => ({ ...c, open: false }));
  };

  // ================= Filter =================
  const filtered = users.filter((u) => {
    const r = filterRole === "ALL" || u.role === filterRole;
    const st = filterStatus === "ALL" || u.status === filterStatus;
    const q =
      !search.trim() ||
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());

    return r && st && q;
  });

  // ================= Columns =================
  const columns = [
    { header: "Tên hiển thị", accessor: "displayName" },
    { header: "Email", accessor: "email" },
    {
      header: "Vai trò",
      render: (row) => ROLE_LABEL[row.role] || row.role,
    },
    {
      header: "Trạng thái",
      render: (row) => (
        <span className={`${s.status} ${s[STATUS_CLASS[row.status]]}`}>
          {row.status}
        </span>
      ),
    },
    {
      header: "Ngày tạo",
      render: (row) => new Date(row.createdAt).toLocaleString("vi-VN"),
    },
    {
      header: "Thao tác",
      render: (row) => (
        <div className={s.actions}>
          <button className={s.btnSmall} onClick={() => openEdit(row)}>
            Sửa
          </button>
          <button className={s.btnSmall} onClick={() => askLock(row)}>
            {row.status === "BLOCKED" ? "Mở khóa" : "Khóa"}
          </button>
          <button className={s.btnDanger} onClick={() => askDelete(row)}>
            Xóa
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Quản lý người dùng</h1>
        <button className={s.btnPrimary} onClick={openCreate}>
          + Thêm mới
        </button>
      </div>

      <div className={s.toolbar}>
        <select
          className={s.select}
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="ALL">Tất cả vai trò</option>
          <option value="LEARNER">Học viên</option>
          <option value="TEACHER">Giáo viên</option>
          <option value="MODERATOR">Moderator</option>
          <option value="ADMIN">Admin</option>
        </select>

        <select
          className={s.select}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
          <option value="BLOCKED">Blocked</option>
        </select>

        <input
          className={s.search}
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable data={filtered} columns={columns} />

      {/* Modals */}
      <UserFormModal
        open={modalOpen}
        mode={mode}
        initial={editingUser}
        onSubmit={submitUser}
        onClose={() => setModalOpen(false)}
      />

      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        desc={confirm.desc}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm((c) => ({ ...c, open: false }))}
      />
    </div>
  );
}
