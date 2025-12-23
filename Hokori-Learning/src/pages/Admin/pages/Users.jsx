// src/pages/Admin/pages/Users.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";

import s from "./Users.module.scss";
import DataTable from "../components/DataTable";
import api from "../../../configs/axios";

const ROLE_LABEL = {
  LEARNER: "Học viên",
  TEACHER: "Giáo viên",
  MODERATOR: "Moderator",
  ADMIN: "Admin",
};

const PAGE_SIZE = 10;
const MENU_WIDTH = 200;
const MENU_ESTIMATED_HEIGHT = 140;

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
          <button className={s.btnGhost} onClick={onCancel} type="button">
            Hủy
          </button>
          <button className={s.btnPrimary} onClick={onConfirm} type="button">
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

const UserDetailModal = ({ open, loading, user, onClose }) => {
  if (!open) return null;

  return (
    <div className={s.modalOverlay}>
      <div className={s.modal}>
        <h2 className={s.modalTitle}>Chi tiết người dùng</h2>

        {loading ? (
          <p className={s.modalDesc}>Đang tải…</p>
        ) : user ? (
          <div className={s.detailGrid}>
            <div className={s.detailRow}>
              <span className={s.detailLabel}>User ID</span>
              <span className={s.detailValue}>{user.id}</span>
            </div>
            <div className={s.detailRow}>
              <span className={s.detailLabel}>Username</span>
              <span className={s.detailValue}>{user.username || "—"}</span>
            </div>
            <div className={s.detailRow}>
              <span className={s.detailLabel}>Email</span>
              <span className={s.detailValue}>{user.email || "—"}</span>
            </div>
            <div className={s.detailRow}>
              <span className={s.detailLabel}>Display name</span>
              <span className={s.detailValue}>{user.displayName || "—"}</span>
            </div>
            <div className={s.detailRow}>
              <span className={s.detailLabel}>Role</span>
              <span className={s.detailValue}>{user.roleName || "—"}</span>
            </div>
          </div>
        ) : (
          <p className={s.modalDesc}>Không có dữ liệu.</p>
        )}

        <div className={s.modalActions}>
          <button className={s.btnGhost} type="button" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

function MenuPortal({
  open,
  anchorRect,
  onClose,
  onView,
  onBanToggle,
  banLabel,
  onDelete,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const onDoc = (e) => {
      if (menuRef.current?.contains(e.target)) return;
      onClose();
    };
    const onEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    const onScroll = () => onClose();
    const onResize = () => onClose();

    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, onClose]);

  if (!open || !anchorRect) return null;

  const padding = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left = Math.min(anchorRect.right - MENU_WIDTH, vw - MENU_WIDTH - padding);
  left = Math.max(padding, left);

  let top = anchorRect.bottom + 8;
  if (top + MENU_ESTIMATED_HEIGHT > vh - padding) {
    top = anchorRect.top - MENU_ESTIMATED_HEIGHT - 8;
  }
  top = Math.max(padding, top);

  return createPortal(
    <div
      ref={menuRef}
      className={s.menu}
      style={{ position: "fixed", top, left, width: MENU_WIDTH }}
      role="menu"
    >
      <button type="button" className={s.menuItem} onClick={onView}>
        Xem chi tiết
      </button>

      <button type="button" className={s.menuItem} onClick={onBanToggle}>
        {banLabel}
      </button>

      <button
        type="button"
        className={`${s.menuItem} ${s.menuDanger}`}
        onClick={onDelete}
      >
        Xóa
      </button>
    </div>,
    document.body
  );
}

const CreateUserModal = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    roleName: "LEARNER",
    isActive: true,
    isVerified: true,
    // optional fields from swagger (để trống cũng ok nếu BE cho)
    currentJlptLevel: "",
    firstName: "",
    lastName: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    // reset khi mở
    setForm({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      displayName: "",
      roleName: "LEARNER",
      isActive: true,
      isVerified: true,
      currentJlptLevel: "",
      firstName: "",
      lastName: "",
    });
    setErrors({});
    setSubmitting(false);
  }, [open]);

  const validateAll = (f) => {
    const e = {};
    if (!f.username.trim()) e.username = "Username là bắt buộc";
    if (!f.displayName.trim()) e.displayName = "Tên hiển thị là bắt buộc";
    if (!f.email.trim() || !/\S+@\S+\.\S+/.test(f.email))
      e.email = "Email không hợp lệ";
    if (!f.password || f.password.length < 6)
      e.password = "Mật khẩu phải ≥ 6 ký tự";
    if (f.confirmPassword !== f.password)
      e.confirmPassword = "Mật khẩu xác nhận không khớp";
    if (!f.roleName) e.roleName = "Role là bắt buộc";
    return e;
  };

  const change = (key) => (e) => {
    const v =
      e?.target?.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: v }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const eAll = validateAll(form);
    setErrors(eAll);
    if (Object.keys(eAll).length > 0) return;

    const payload = {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      roleName: form.roleName,
      displayName: form.displayName.trim(),
      isActive: !!form.isActive,
      isVerified: !!form.isVerified,
    };

    // optional fields: chỉ gửi nếu có nhập
    if (form.currentJlptLevel.trim())
      payload.currentJlptLevel = form.currentJlptLevel.trim();
    if (form.firstName.trim()) payload.firstName = form.firstName.trim();
    if (form.lastName.trim()) payload.lastName = form.lastName.trim();

    try {
      setSubmitting(true);
      const res = await api.post("/admin/users", payload); // POST /api/admin/users
      const created = safeUnwrap(res) || null;

      toast.success("Tạo user mới thành công!");
      onCreated?.(created, payload);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Tạo user thất bại!");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className={s.modalOverlay}>
      <div className={s.modal}>
        <h2 className={s.modalTitle}>Thêm người dùng mới</h2>

        <form onSubmit={submit} className={s.form}>
          <div className={s.formRow}>
            <label className={s.label}>
              Tên đăng nhập
              <input
                className={`${s.input} ${errors.username ? s.errorInput : ""}`}
                value={form.username}
                onChange={change("username")}
              />
              {errors.username && (
                <p className={s.errorText}>{errors.username}</p>
              )}
            </label>

            <label className={s.label}>
              Vai trò
              <select
                className={`${s.select} ${errors.roleName ? s.errorInput : ""}`}
                value={form.roleName}
                onChange={change("roleName")}
              >
                <option value="LEARNER">Học viên</option>
                <option value="TEACHER">Giáo viên</option>
                <option value="MODERATOR">Moderator</option>
                <option value="ADMIN">Admin</option>
              </select>
              {errors.roleName && (
                <p className={s.errorText}>{errors.roleName}</p>
              )}
            </label>
          </div>

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

          <div className={s.formRow}>
            <label className={s.label}>
              Mật khẩu
              <input
                type="password"
                className={`${s.input} ${errors.password ? s.errorInput : ""}`}
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
          </div>

          <div className={s.formRow}>
            <label className={s.label}>
              Tên
              <input
                className={s.input}
                value={form.firstName}
                onChange={change("firstName")}
              />
            </label>

            <label className={s.label}>
              Họ
              <input
                className={s.input}
                value={form.lastName}
                onChange={change("lastName")}
              />
            </label>
          </div>

          <label className={s.label}>
            Trình độ JLPT hiện tại
            <select
              className={s.select}
              value={form.currentJlptLevel}
              onChange={change("currentJlptLevel")}
            >
              <option value="">Trình độ</option>
              <option value="N5">N5</option>
              <option value="N4">N4</option>
              <option value="N3">N3</option>
              <option value="N2">N2</option>
              <option value="N1">N1</option>
            </select>
          </label>

          <div className={s.switchRow}>
            <label className={s.switch}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={change("isActive")}
              />
              <span className={s.switchLabel}>Kích hoạt tài khoản</span>
            </label>

            <label className={s.switch}>
              <input
                type="checkbox"
                checked={form.isVerified}
                onChange={change("isVerified")}
              />
              <span className={s.switchLabel}>Đã xác minh</span>
            </label>
          </div>

          <div className={s.modalActions}>
            <button
              type="button"
              className={s.btnGhost}
              onClick={onClose}
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={s.btnPrimary}
              disabled={submitting}
            >
              {submitting ? "Đang tạo..." : "Tạo user"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterRole, setFilterRole] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // dropdown state
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuAnchorRect, setMenuAnchorRect] = useState(null);
  const openMenuRowRef = useRef(null);

  // detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailUser, setDetailUser] = useState(null);

  // create modal
  const [createOpen, setCreateOpen] = useState(false);

  // confirm delete
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
        setLoading(true);
        const res = await api.get("/admin/users");
        const list = safeUnwrap(res) || [];

        const mapped = list.map((u) => ({
          id: u.id,
          displayName: u.displayName,
          email: u.email,
          role: u.roleName,
          status: u.isVerified
            ? u.isActive
              ? "ACTIVE"
              : "BLOCKED"
            : "PENDING",
        }));
        setUsers(mapped);
      } catch (err) {
        console.error(err);
        toast.error("Không thể tải danh sách người dùng!");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // reset page when filter/search changes
  useEffect(() => setPage(1), [filterRole, search]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const roleOk = filterRole === "ALL" || u.role === filterRole;
      const textOk =
        !q ||
        (u.displayName || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q);
      return roleOk && textOk;
    });
  }, [users, filterRole, search]);

  // sort by userId ASC
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => (a.id ?? 0) - (b.id ?? 0)),
    [filtered]
  );

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

  const closeMenu = () => {
    setOpenMenuId(null);
    setMenuAnchorRect(null);
    openMenuRowRef.current = null;
  };

  const openMenu = (row, btnEl) => {
    if (!btnEl) return;
    const rect = btnEl.getBoundingClientRect();
    setMenuAnchorRect(rect);
    setOpenMenuId((cur) => (cur === row.id ? null : row.id));
    openMenuRowRef.current = row;
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

  const askDelete = (user) => {
    setConfirm({
      open: true,
      title: "Xóa người dùng",
      desc: `Bạn có chắc muốn xóa "${
        user.displayName || user.email || user.id
      }"?`,
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

  // ✅ BAN / UNBAN
  const toggleBan = async (row) => {
    if (!row?.id) return;

    const willUnban = row.status === "BLOCKED";
    const endpoint = willUnban
      ? `/admin/users/${row.id}/unban`
      : `/admin/users/${row.id}/ban`;

    try {
      // POST /api/admin/users/{userId}/ban OR /unban
      await api.post(endpoint);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === row.id
            ? {
                ...u,
                status: willUnban ? "ACTIVE" : "BLOCKED",
              }
            : u
        )
      );

      toast.success(willUnban ? "Đã unban user!" : "Đã ban user!");
    } catch (err) {
      console.error(err);
      toast.error(willUnban ? "Unban thất bại!" : "Ban thất bại!");
    }
  };

  // columns
  const columns = useMemo(
    () => [
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
          <div className={s.menuWrap}>
            <button
              type="button"
              className={s.menuBtn}
              aria-label="Hành động"
              onClick={(e) => openMenu(row, e.currentTarget)}
            >
              ⋯
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const currentRow = openMenuRowRef.current;

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Quản lý người dùng</h1>
        <button
          className={s.btnPrimary}
          type="button"
          onClick={() => setCreateOpen(true)}
        >
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

      <div className={s.tableWrap}>
        {loading ? (
          <div className={s.tableLoading}>Đang tải danh sách…</div>
        ) : (
          <DataTable data={paged} columns={columns} />
        )}

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
                  className={`${s.pageBtn} ${
                    p === safePage ? s.pageActive : ""
                  }`}
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
      </div>

      {/* Dropdown menu (portal) */}
      <MenuPortal
        open={!!openMenuId}
        anchorRect={menuAnchorRect}
        onClose={closeMenu}
        banLabel={currentRow?.status === "BLOCKED" ? "Unban" : "Ban"}
        onView={() => {
          const id = currentRow?.id;
          closeMenu();
          if (id) openDetail(id);
        }}
        onBanToggle={() => {
          const row = currentRow;
          closeMenu();
          if (row) toggleBan(row);
        }}
        onDelete={() => {
          const row = currentRow;
          closeMenu();
          if (row) askDelete(row);
        }}
      />

      {/* Create user modal */}
      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(created, payload) => {
          // nếu BE trả created object có id thì dùng luôn; nếu không thì fallback bằng payload
          const item = created?.id
            ? {
                id: created.id,
                displayName: created.displayName ?? payload.displayName,
                email: created.email ?? payload.email,
                role: created.roleName ?? payload.roleName,
                status:
                  created.isVerified ?? payload.isVerified
                    ? created.isActive ?? payload.isActive
                      ? "ACTIVE"
                      : "BLOCKED"
                    : "PENDING",
              }
            : {
                id: Date.now(), // fallback tạm nếu BE không trả id (hiếm)
                displayName: payload.displayName,
                email: payload.email,
                role: payload.roleName,
                status: payload.isVerified
                  ? payload.isActive
                    ? "ACTIVE"
                    : "BLOCKED"
                  : "PENDING",
              };

          setUsers((prev) => [...prev, item]);
        }}
      />

      {/* Confirm delete */}
      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        desc={confirm.desc}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm((c) => ({ ...c, open: false }))}
      />

      {/* Detail modal */}
      <UserDetailModal
        open={detailOpen}
        loading={detailLoading}
        user={detailUser}
        onClose={() => {
          setDetailOpen(false);
          setDetailUser(null);
        }}
      />
    </div>
  );
}
