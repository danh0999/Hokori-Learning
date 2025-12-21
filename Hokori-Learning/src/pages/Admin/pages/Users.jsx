// src/pages/Admin/pages/Users.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
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

const PAGE_SIZE = 10;

const safeUnwrap = (res) => res?.data?.data ?? res?.data ?? null;
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

const ConfirmModal = ({ open, title, desc, onConfirm, onCancel }) => {
  if (!open) return null;

  return (
    <div className={s.modalOverlay}>
      <div className={s.modal}>
        <h2 className={s.modalTitle}>{title}</h2>
        {desc && <p className={s.modalDesc}>{desc}</p>}
        <div className={s.modalActions}>
          <button className={s.btnGhost} onClick={onCancel}>
            Hủy
          </button>
          <button className={s.btnPrimary} onClick={onConfirm}>
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

// User Form Modal (giữ lại như file bạn đang có – chưa gắn BE create/edit)
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
          <label className={s.label}>
            Tên hiển thị
            <input
              className={`${s.input} ${errors.displayName ? s.errorInput : ""}`}
              value={form.displayName}
              onChange={change("displayName")}
            />
            {errors.displayName && (
              <p className={s.errorText}>{errors.displayName}</p>
            )}
          </label>

          <label className={s.label}>
            Email
            <input
              className={`${s.input} ${errors.email ? s.errorInput : ""}`}
              value={form.email}
              onChange={change("email")}
            />
            {errors.email && <p className={s.errorText}>{errors.email}</p>}
          </label>

          {mode === "create" && (
            <>
              <label className={s.label}>
                Mật khẩu
                <input
                  type="password"
                  className={`${s.input} ${
                    errors.password ? s.errorInput : ""
                  }`}
                  value={form.password}
                  onChange={change("password")}
                />
                {errors.password && (
                  <p className={s.errorText}>{errors.password}</p>
                )}
              </label>

              <label className={s.label}>
                Xác nhận mật khẩu
                <input
                  type="password"
                  className={`${s.input} ${
                    errors.confirmPassword ? s.errorInput : ""
                  }`}
                  value={form.confirmPassword}
                  onChange={change("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className={s.errorText}>{errors.confirmPassword}</p>
                )}
              </label>
            </>
          )}

          <label className={s.label}>
            Vai trò
            <select
              className={s.select}
              value={form.role}
              onChange={change("role")}
            >
              <option value="LEARNER">Học viên</option>
              <option value="TEACHER">Giáo viên</option>
              <option value="MODERATOR">Moderator</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>

          <div className={s.modalActions}>
            <button type="button" className={s.btnGhost} onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className={s.btnPrimary}>
              {mode === "create" ? "Tạo" : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Users() {
  const [users, setUsers] = useState([]);

  const [filterRole, setFilterRole] = useState("ALL");
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);

  // dropdown (3 dots)
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuWrapRef = useRef(null);

  // detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailUser, setDetailUser] = useState(null);

  // create/edit modal (chưa gắn BE)
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [editingUser, setEditingUser] = useState(null);

  // confirm delete modal
  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    desc: "",
    onConfirm: () => {},
  });

  // GET /api/admin/users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/admin/users");
        const list = safeUnwrap(res) || [];

        const mapped = list.map((u) => ({
          id: u.id,
          displayName: u.displayName,
          email: u.email,
          role: u.roleName,
          // giữ lại để sau này gắn ban/unban
          status: u.isVerified
            ? u.isActive
              ? "ACTIVE"
              : "BLOCKED"
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

  // đóng dropdown khi click ra ngoài
  useEffect(() => {
    const onDocClick = (e) => {
      if (!openMenuId) return;
      if (!menuWrapRef.current) return;
      if (menuWrapRef.current.contains(e.target)) return;
      setOpenMenuId(null);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [openMenuId]);

  const openCreate = () => {
    setMode("create");
    setEditingUser(null);
    setModalOpen(true);
  };

  const submitUser = () => {
    toast.info("API create/edit user chưa gắn, mới cập nhật UI thôi.");
    setModalOpen(false);
  };

  // Ban/Unban placeholder
  const askLock = () => {
    toast.info("Chưa có API ban/unban. Bạn gắn sau nhé.");
  };

  const askDelete = (user) => {
    setConfirm({
      open: true,
      title: "Xóa người dùng",
      desc: `Bạn có chắc muốn xóa "${user.displayName}"?`,
      onConfirm: () => remove(user),
    });
  };

  const remove = async (user) => {
    try {
      await api.delete(`/admin/users/${user.id}`); // DELETE /api/admin/users/{userId}
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      toast.success("Đã xóa người dùng!");
    } catch (err) {
      console.error(err);
      toast.error("Xóa thất bại!");
    } finally {
      setConfirm((c) => ({ ...c, open: false }));
    }
  };

  const openDetail = async (userId) => {
    try {
      setDetailOpen(true);
      setDetailLoading(true);
      setDetailUser(null);

      const res = await api.get(`/admin/users/${userId}`); // GET /api/admin/users/{userId}
      setDetailUser(safeUnwrap(res));
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải chi tiết người dùng!");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // Filter
  const filtered = users.filter((u) => {
    const r = filterRole === "ALL" || u.role === filterRole;
    const q =
      !search.trim() ||
      (u.displayName || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase());
    return r && q;
  });

  // đổi filter/search -> reset page
  useEffect(() => setPage(1), [filterRole, search]);

  // sort userId ASC
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
  }, [filtered]);

  // pagination
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = clamp(page, 1, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safePage]);

  const paged = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, safePage]);

  // columns (đã bỏ Trạng thái + Ngày tạo)
  const columns = [
    { header: "User ID", accessor: "id" },
    { header: "Tên hiển thị", accessor: "displayName" },
    { header: "Email", accessor: "email" },
    {
      header: "Vai trò",
      render: (row) => ROLE_LABEL[row.role] || row.role,
    },
    {
      header: "Thao tác",
      render: (row) => (
        <div
          className={s.menuWrap}
          ref={openMenuId === row.id ? menuWrapRef : null}
        >
          <button
            className={s.menuBtn}
            onClick={() =>
              setOpenMenuId((cur) => (cur === row.id ? null : row.id))
            }
            aria-label="Hành động"
            type="button"
          >
            ⋯
          </button>

          {openMenuId === row.id && (
            <div className={s.menu}>
              <button
                type="button"
                className={s.menuItem}
                onClick={() => {
                  setOpenMenuId(null);
                  openDetail(row.id);
                }}
              >
                Xem chi tiết
              </button>

              <button
                type="button"
                className={s.menuItem}
                onClick={() => {
                  setOpenMenuId(null);
                  askLock(row);
                }}
              >
                {row.status === "BLOCKED" ? "Unban" : "Ban"}
              </button>

              <button
                type="button"
                className={`${s.menuItem} ${s.menuDanger}`}
                onClick={() => {
                  setOpenMenuId(null);
                  askDelete(row);
                }}
              >
                Xóa
              </button>
            </div>
          )}
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

        <input
          className={s.search}
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable data={paged} columns={columns} />

      {/* Pagination custom */}
      <div className={s.pagination}>
        <div className={s.pageInfo}>
          Hiển thị {(safePage - 1) * PAGE_SIZE + (total === 0 ? 0 : 1)}–
          {Math.min(safePage * PAGE_SIZE, total)} / {total}
        </div>

        <div className={s.pageControls}>
          <button
            className={s.pageBtn}
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
          >
            Trước
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .slice(
              Math.max(0, safePage - 3),
              Math.min(totalPages, Math.max(0, safePage - 3) + 5)
            )
            .map((p) => (
              <button
                key={p}
                type="button"
                className={`${s.pageBtn} ${p === safePage ? s.pageActive : ""}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}

          <button
            className={s.pageBtn}
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
          >
            Sau
          </button>
        </div>
      </div>

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

      {/* Detail modal */}
      {detailOpen && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <h2 className={s.modalTitle}>Chi tiết người dùng</h2>

            {detailLoading ? (
              <p className={s.modalDesc}>Đang tải…</p>
            ) : detailUser ? (
              <div className={s.detailGrid}>
                <div className={s.detailRow}>
                  <span className={s.detailLabel}>User ID</span>
                  <span className={s.detailValue}>{detailUser.id}</span>
                </div>
                <div className={s.detailRow}>
                  <span className={s.detailLabel}>Username</span>
                  <span className={s.detailValue}>
                    {detailUser.username || "—"}
                  </span>
                </div>
                <div className={s.detailRow}>
                  <span className={s.detailLabel}>Email</span>
                  <span className={s.detailValue}>
                    {detailUser.email || "—"}
                  </span>
                </div>
                <div className={s.detailRow}>
                  <span className={s.detailLabel}>Display name</span>
                  <span className={s.detailValue}>
                    {detailUser.displayName || "—"}
                  </span>
                </div>
                <div className={s.detailRow}>
                  <span className={s.detailLabel}>Role</span>
                  <span className={s.detailValue}>
                    {detailUser.roleName || "—"}
                  </span>
                </div>
              </div>
            ) : (
              <p className={s.modalDesc}>Không có dữ liệu.</p>
            )}

            <div className={s.modalActions}>
              <button
                className={s.btnGhost}
                type="button"
                onClick={() => {
                  setDetailOpen(false);
                  setDetailUser(null);
                }}
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
