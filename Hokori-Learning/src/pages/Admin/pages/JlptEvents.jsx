import React, { useState } from "react";
import s from "./JlptEvents.module.scss";
import { toast } from "react-toastify";

// MOCK STORAGE
const JLPT_STORAGE = [
  { id: 101, level: "N3", title: "N3 - Đề 01 (2025)" },
  { id: 102, level: "N3", title: "N3 - Đề 02 (2025)" },
  { id: 201, level: "N2", title: "N2 - Đề 01 (2025)" },
  { id: 202, level: "N2", title: "N2 - Đề 02 (2025)" },
  { id: 301, level: "N1", title: "N1 - Đề luyện cao cấp" },
];

const MOCK_EVENTS = [
  {
    id: 1,
    name: "JLPT N3 kỳ tháng 12",
    level: "N3",
    openAt: "2025-10-01T07:00",
    closeAt: "2025-12-01T23:59",
    type: "ONLINE",
    testId: 101,
    participants: 42,
    status: "OPEN",
  },
  {
    id: 2,
    name: "JLPT N2 kỳ tháng 7",
    level: "N2",
    openAt: "2025-05-01T08:00",
    closeAt: "2025-06-30T23:59",
    type: "OFFLINE",
    testId: 201,
    participants: 122,
    status: "CLOSED",
  },
];

// =====================
// MODAL TẠO SỰ KIỆN
// =====================
const CreateEventModal = ({ open, onClose, onSubmit }) => {
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    level: "N3",
    openAt: "",
    closeAt: "",
    testId: "",
    type: "ONLINE", // mặc định online
  });

  const filteredTests = JLPT_STORAGE.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  const change = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const submit = (e) => {
    e.preventDefault();

    if (!form.name.trim()) return toast.error("Tên sự kiện là bắt buộc");
    if (!form.openAt) return toast.error("Thời gian mở đăng ký bắt buộc");
    if (!form.closeAt) return toast.error("Thời gian đóng đăng ký bắt buộc");
    if (new Date(form.openAt) >= new Date(form.closeAt))
      return toast.error("Thời gian mở phải trước thời gian đóng");
    if (!form.testId) return toast.error("Bạn phải chọn một đề thi");

    onSubmit(form);
  };

  if (!open) return null;

  return (
    <div className={s.modalOverlay}>
      <div className={s.modal}>
        <h2 className={s.modalTitle}>Tạo sự kiện JLPT</h2>

        <form className={s.formGrid} onSubmit={submit}>
          {/* LEFT */}
          <div className={s.col}>
            <label className={s.label}>
              Tên sự kiện
              <input
                className={s.input}
                value={form.name}
                onChange={change("name")}
              />
            </label>

            <label className={s.label}>
              Cấp độ
              <select
                className={s.select}
                value={form.level}
                onChange={change("level")}
              >
                {["N1", "N2", "N3", "N4", "N5"].map((lv) => (
                  <option key={lv}>{lv}</option>
                ))}
              </select>
            </label>

            <label className={s.label}>
              Mở đăng ký
              <input
                type="datetime-local"
                className={s.input}
                value={form.openAt}
                onChange={change("openAt")}
              />
            </label>
          </div>

          {/* RIGHT */}
          <div className={s.col}>
            <label className={s.label}>
              Đóng đăng ký
              <input
                type="datetime-local"
                className={s.input}
                value={form.closeAt}
                onChange={change("closeAt")}
              />
            </label>

            {/* ——— Sửa yêu cầu: Hình thức thi là Online mặc định, readonly ——— */}
            <label className={s.label}>
              Hình thức thi
              <input className={s.input} value="Online" readOnly />
            </label>

            {/* ——— KHO ĐỀ ——— */}
            <label className={s.label}>
              Chọn đề thi (Có thể tìm kiếm)
              <input
                className={s.input}
                placeholder="Tìm kiếm đề..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {/* LIST đẹp thay vì select[size=5] */}
              <div className={s.testList}>
                {filteredTests.length === 0 ? (
                  <p className={s.empty}>Không có đề phù hợp</p>
                ) : (
                  filteredTests.map((t) => (
                    <div
                      key={t.id}
                      className={`${s.testItem} ${
                        form.testId == t.id ? s.selected : ""
                      }`}
                      onClick={() => setForm((p) => ({ ...p, testId: t.id }))}
                    >
                      <span className={s.testTitle}>{t.title}</span>
                    </div>
                  ))
                )}
              </div>
            </label>
          </div>

          <div className={s.modalActions}>
            <button type="button" className={s.btnGhost} onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className={s.btnPrimary}>
              Tạo sự kiện
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =====================
// CONFIRM MODAL
// =====================
const ConfirmModal = ({ open, title, desc, onConfirm, onCancel }) => {
  if (!open) return null;

  return (
    <div className={s.modalOverlay}>
      <div className={s.modalSmall}>
        <h2 className={s.modalTitle}>{title}</h2>
        <p className={s.modalDesc}>{desc}</p>
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

// =====================
// MAIN PAGE
// =====================
export default function JlptEvents() {
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [modalOpen, setModalOpen] = useState(false);

  const [confirmCfg, setConfirmCfg] = useState({
    open: false,
    target: null,
    next: null,
  });

  const openCreate = () => {
    setModalOpen(true);
  };

  const createEvent = (form) => {
    const newEvent = {
      id: Date.now(),
      ...form,
      participants: Math.floor(Math.random() * 100),
      status: "OPEN",
    };
    setEvents((p) => [newEvent, ...p]);
    toast.success("Tạo sự kiện thành công!");
    setModalOpen(false);
  };

  const askToggle = (ev) => {
    setConfirmCfg({
      open: true,
      target: ev,
      next: ev.status === "OPEN" ? "CLOSED" : "OPEN",
    });
  };

  const toggleEvent = () => {
    const { target, next } = confirmCfg;
    setEvents((prev) =>
      prev.map((e) => (e.id === target.id ? { ...e, status: next } : e))
    );

    toast.success("Cập nhật trạng thái thành công!");
    setConfirmCfg({ open: false, target: null, next: null });
  };

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Sự kiện JLPT</h1>
        <button className={s.btnPrimary} onClick={openCreate}>
          + Tạo sự kiện
        </button>
      </div>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Tên sự kiện</th>
              <th>Cấp độ</th>
              <th>Thời gian mở</th>
              <th>Thời gian đóng</th>
              <th>Hình thức</th>
              <th>Người tham gia</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {events.map((ev) => (
              <tr key={ev.id}>
                <td>{ev.name}</td>
                <td>{ev.level}</td>
                <td>{new Date(ev.openAt).toLocaleString("vi-VN")}</td>
                <td>{new Date(ev.closeAt).toLocaleString("vi-VN")}</td>
                <td>{ev.type === "ONLINE" ? "Online" : "Offline"}</td>
                <td>{ev.participants}</td>
                <td>
                  <span
                    className={`${s.badge} ${
                      ev.status === "OPEN" ? s.open : s.closed
                    }`}
                  >
                    {ev.status === "OPEN" ? "Đang mở" : "Đã đóng"}
                  </span>
                </td>

                <td className={s.actions}>
                  <button className={s.btnSmall} onClick={() => askToggle(ev)}>
                    {ev.status === "OPEN" ? "Khóa" : "Mở lại"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateEventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={createEvent}
      />

      <ConfirmModal
        open={confirmCfg.open}
        title="Xác nhận thay đổi"
        desc="Bạn chắc chắn muốn thay đổi trạng thái sự kiện?"
        onConfirm={toggleEvent}
        onCancel={() =>
          setConfirmCfg({ open: false, target: null, next: null })
        }
      />
    </div>
  );
}
