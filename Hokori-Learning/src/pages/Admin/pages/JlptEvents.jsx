// src/pages/Admin/JlptEvents/JlptEvents.jsx
import React, { useEffect, useState } from "react";
import s from "./JlptEvents.module.scss";
import { toast } from "react-toastify";
import api from "../../../configs/axios";

// =====================
// MODAL TẠO SỰ KIỆN
// =====================
const CreateEventModal = ({ open, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    title: "",
    level: "N3",
    description: "",
    startAt: "",
    endAt: "",
  });
  const [minDateTime, setMinDateTime] = useState("");
  const change = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const submit = (e) => {
    e.preventDefault();

    if (!form.title.trim()) return toast.error("Tiêu đề sự kiện là bắt buộc");
    if (!form.startAt) return toast.error("Thời gian bắt đầu là bắt buộc");
    if (!form.endAt) return toast.error("Thời gian kết thúc là bắt buộc");
    if (new Date(form.startAt) >= new Date(form.endAt))
      return toast.error("Thời gian bắt đầu phải trước thời gian kết thúc");

    onSubmit(form);
  };

  useEffect(() => {
    if (!open) {
      setForm({
        title: "",
        level: "N3",
        description: "",
        startAt: "",
        endAt: "",
      });
      return;
    }

    // Khi mở modal: set min = thời điểm hiện tại (local) cho datetime-local
    const now = new Date();
    // Chuyển về local ISO string dạng YYYY-MM-DDTHH:mm cho input datetime-local
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const localISO = now.toISOString().slice(0, 16);
    setMinDateTime(localISO);
  }, [open]);

  if (!open) return null;

  return (
    <div className={s.modalOverlay}>
      <div className={s.modal}>
        <h2 className={s.modalTitle}>Tạo sự kiện JLPT</h2>

        <form className={s.formGrid} onSubmit={submit}>
          <div className={s.col}>
            <label className={s.label}>
              Tiêu đề (title)
              <input
                className={s.input}
                value={form.title}
                onChange={change("title")}
              />
            </label>

            <label className={s.label}>
              Cấp độ (level)
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
              Bắt đầu (startAt)
              <input
                type="datetime-local"
                className={s.input}
                value={form.startAt}
                onChange={change("startAt")}
                min={minDateTime}
              />
            </label>
          </div>

          <div className={s.col}>
            <label className={s.label}>
              Kết thúc (endAt)
              <input
                type="datetime-local"
                className={s.input}
                value={form.endAt}
                onChange={change("endAt")}
                min={form.startAt || minDateTime}
              />
            </label>

            <label className={s.label}>
              Mô tả (description)
              <textarea
                className={s.textarea}
                rows={3}
                value={form.description}
                onChange={change("description")}
              />
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
// MODAL XEM LIST TEST
// =====================
const TestListModal = ({ open, event, tests, loading, onClose }) => {
  if (!open) return null;

  return (
    <div className={s.modalOverlay}>
      <div className={s.modal}>
        <h2 className={s.modalTitle}>
          Danh sách đề thi – Event #{event?.id} ({event?.title})
        </h2>
        <p className={s.modalDesc}>
          Level: <b>{event?.level}</b> · Số đề: <b>{tests?.length || 0}</b>
        </p>

        {loading ? (
          <p>Đang tải danh sách đề thi...</p>
        ) : tests && tests.length > 0 ? (
          <table className={s.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Level</th>
                <th>Thời lượng (phút)</th>
                <th>Tổng điểm</th>
                <th>Ghi chú kết quả</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.level}</td>
                  <td>{t.durationMin}</td>
                  <td>{t.totalScore}</td>
                  <td>{t.resultNote || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Event này chưa có đề thi nào.</p>
        )}

        <div className={s.modalActions}>
          <button className={s.btnPrimary} onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================
// MAIN PAGE – ADMIN
// =====================
export default function JlptEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  // testStatus: eventId -> số đề
  const [testStatus, setTestStatus] = useState({});

  const [confirmCfg, setConfirmCfg] = useState({
    open: false,
    target: null,
    next: null,
  });

  // modal xem list test
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testModalEvent, setTestModalEvent] = useState(null);
  const [testModalTests, setTestModalTests] = useState([]);
  const [loadingTestsModal, setLoadingTestsModal] = useState(false);

  // ------ GET /api/jlpt/events ------
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get("jlpt/events");
      let list = (res.data || []).sort((a, b) => b.id - a.id);

      const now = new Date();

      // 1) Auto close các event đã hết hạn (UI)
      const needCloseIds = [];

      list = list.map((ev) => {
        const isExpired =
          ev.endAt && new Date(ev.endAt) < now && ev.status !== "CLOSED";

        if (isExpired) {
          needCloseIds.push(ev.id);
          return { ...ev, status: "CLOSED" };
        }
        return ev;
      });

      setEvents(list);

      // PATCH CLOSE trên BE nếu cần
      if (needCloseIds.length > 0) {
        await Promise.all(
          needCloseIds.map((id) =>
            api
              .patch(`jlpt/events/${id}/status`, { status: "CLOSED" })
              .catch((err) => {
                console.error("Auto close event failed: ", id, err);
              })
          )
        );
      }

      // 2) Lấy số đề thi cho từng event
      const results = await Promise.all(
        list.map((ev) =>
          api
            .get(`jlpt/events/${ev.id}/tests`)
            .then((r) => ({ id: ev.id, count: r.data?.length || 0 }))
            .catch(() => ({ id: ev.id, count: 0 }))
        )
      );

      const map = {};
      results.forEach((item) => {
        map[item.id] = item.count; // lưu số đề, không phải boolean
      });
      setTestStatus(map);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được danh sách sự kiện JLPT");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const openCreate = () => setModalOpen(true);

  // ------ POST /api/jlpt/events ------
  const createEvent = async (form) => {
    try {
      const payload = {
        title: form.title,
        level: form.level,
        description: form.description,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        status: "DRAFT",
      };

      await api.post("jlpt/events", payload);
      toast.success("Tạo sự kiện thành công!");
      setModalOpen(false);
      fetchEvents();
    } catch (err) {
      console.error(err);
      toast.error("Tạo sự kiện thất bại");
    }
  };

  const askToggle = (ev) => {
    let nextStatus = "OPEN";
    if (ev.status === "OPEN") nextStatus = "CLOSED";
    if (ev.status === "CLOSED") nextStatus = "OPEN";

    const count = testStatus[ev.id] ?? 0;
    // không cho OPEN nếu chưa có đề
    if (nextStatus === "OPEN" && count === 0) {
      return toast.error("Sự kiện chưa có đề thi – không thể OPEN");
    }

    setConfirmCfg({
      open: true,
      target: ev,
      next: nextStatus,
    });
  };

  // ------ PATCH /api/jlpt/events/{eventId}/status ------
  const toggleEvent = async () => {
    const { target, next } = confirmCfg;
    if (!target) return;

    try {
      await api.patch(`jlpt/events/${target.id}/status`, {
        status: next,
      });

      toast.success("Cập nhật trạng thái thành công!");
      setConfirmCfg({ open: false, target: null, next: null });
      fetchEvents();
    } catch (err) {
      console.error(err);
      toast.error("Cập nhật trạng thái thất bại");
      setConfirmCfg({ open: false, target: null, next: null });
    }
  };

  // mở modal xem list đề
  const openTestList = async (ev) => {
    setTestModalEvent(ev);
    setTestModalOpen(true);
    setLoadingTestsModal(true);
    try {
      const res = await api.get(`jlpt/events/${ev.id}/tests`);
      setTestModalTests(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được danh sách đề thi");
    } finally {
      setLoadingTestsModal(false);
    }
  };

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Sự kiện JLPT (Admin)</h1>
        <button className={s.btnPrimary} onClick={openCreate}>
          + Tạo sự kiện
        </button>
      </div>

      <div className={s.tableWrap}>
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Cấp độ</th>
                <th>Mô tả</th>
                <th>Bắt đầu</th>
                <th>Kết thúc</th>
                <th>Đề thi</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {events.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 16 }}>
                    Chưa có sự kiện JLPT nào
                  </td>
                </tr>
              )}

              {events.map((ev) => {
                const testCount = testStatus[ev.id] ?? 0;
                const hasTest = testCount > 0;

                return (
                  <tr key={ev.id}>
                    <td>{ev.title}</td>
                    <td>{ev.level}</td>
                    <td>{ev.description}</td>
                    <td>
                      {ev.startAt
                        ? new Date(ev.startAt).toLocaleString("vi-VN")
                        : "-"}
                    </td>
                    <td>
                      {ev.endAt
                        ? new Date(ev.endAt).toLocaleString("vi-VN")
                        : "-"}
                    </td>

                    {/* Cột số đề */}
                    <td>
                      {hasTest ? (
                        <span className={s.ready}>{testCount} đề</span>
                      ) : (
                        <span className={s.notReady}>0 đề</span>
                      )}
                    </td>

                    <td>
                      <span
                        className={`${s.badge} ${
                          ev.status === "OPEN"
                            ? s.open
                            : ev.status === "DRAFT"
                            ? s.draft
                            : s.closed
                        }`}
                      >
                        {ev.status}
                      </span>
                    </td>

                    <td className={s.actions}>
                      <button
                        className={s.btnSmall}
                        onClick={() => openTestList(ev)}
                      >
                        Xem list đề
                      </button>
                      <button
                        className={s.btnSmall}
                        onClick={() => askToggle(ev)}
                      >
                        {ev.status === "OPEN" ? "Đóng (CLOSED)" : "Mở (OPEN)"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
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

      <TestListModal
        open={testModalOpen}
        event={testModalEvent}
        tests={testModalTests}
        loading={loadingTestsModal}
        onClose={() => setTestModalOpen(false)}
      />
    </div>
  );
}
