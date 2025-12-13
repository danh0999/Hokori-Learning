// Revenue.jsx (Admin)
import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  DatePicker,
  Table,
  Tag,
  Modal,
  Descriptions,
  Input,
  Button,
  Space,
  Statistic,
  message,
} from "antd";
import dayjs from "dayjs";
import api from "../../../configs/axios.js";
import s from "./Revenue.module.scss";

const fmtVnd = (n) => Number(n || 0).toLocaleString("vi-VN");

export default function Revenue() {
  const [yearMonth, setYearMonth] = useState(dayjs().format("YYYY-MM"));
  const [loading, setLoading] = useState(false);

  const [commissionCents, setCommissionCents] = useState(0);
  const [rows, setRows] = useState([]);

  // detail modal
  const [openDetail, setOpenDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  // mark paid modal
  const [openPaid, setOpenPaid] = useState(false);
  const [paying, setPaying] = useState(false);
  const [note, setNote] = useState("");
  const [target, setTarget] = useState(null); // { teacherId, teacherName, yearMonth }

  const fetchCommission = async (ym) => {
    const res = await api.get("admin/payments/admin-commission", {
      params: { yearMonth: ym },
    });
    setCommissionCents(res?.data?.data ?? 0);
  };

  const fetchPending = async (ym) => {
    const res = await api.get("admin/payments/pending-payouts", {
      params: { yearMonth: ym },
    });
    setRows(Array.isArray(res?.data?.data) ? res.data.data : []);
  };

  const reload = async (ym = yearMonth) => {
    try {
      setLoading(true);
      await Promise.all([fetchCommission(ym), fetchPending(ym)]);
    } catch (e) {
      console.error(e);
      message.error(
        e?.response?.data?.message || "Không tải được dữ liệu payout."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openTeacherDetail = async (r) => {
    try {
      setOpenDetail(true);
      setDetail(null);
      setDetailLoading(true);

      const res = await api.get(
        `admin/payments/teacher/${r.teacherId}/pending-details`,
        {
          params: { yearMonth },
        }
      );
      setDetail(res?.data?.data || null);
    } catch (e) {
      console.error(e);
      message.error(
        e?.response?.data?.message || "Không tải được chi tiết teacher."
      );
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const openMarkPaid = (r) => {
    setTarget({
      teacherId: r.teacherId,
      teacherName: r.teacherName,
      yearMonth,
    });
    setNote("");
    setOpenPaid(true);
  };

  const submitMarkPaid = async () => {
    if (!target?.teacherId) return;
    try {
      setPaying(true);
      await api.post("admin/payments/mark-paid", {
        teacherId: target.teacherId,
        yearMonth: target.yearMonth,
        note: note?.trim() || null,
      });
      message.success("Đã đánh dấu đã chuyển tiền.");
      setOpenPaid(false);
      setTarget(null);
      await reload(yearMonth);
    } catch (e) {
      console.error(e);
      message.error(e?.response?.data?.message || "Mark-paid thất bại.");
    } finally {
      setPaying(false);
    }
  };

  const columns = [
    {
      title: "Teacher",
      dataIndex: "teacherName",
      key: "teacherName",
      render: (t) => <b>{t}</b>,
    },
    { title: "Email", dataIndex: "teacherEmail", key: "teacherEmail" },
    {
      title: "Tháng",
      dataIndex: "yearMonth",
      key: "yearMonth",
      render: (v) => <Tag>{v}</Tag>,
      width: 110,
    },
    {
      title: "Cần chuyển",
      dataIndex: "totalUnpaidRevenueCents",
      key: "totalUnpaidRevenueCents",
      render: (v) => `${fmtVnd((v || 0) / 100)} VNĐ`,
      align: "right",
    },
    {
      title: "Số khóa",
      dataIndex: "courseCount",
      key: "courseCount",
      align: "right",
      width: 90,
    },
    {
      title: "Ngân hàng",
      key: "bank",
      render: (_, r) =>
        r.bankName ? (
          <span>
            {r.bankName} - {r.bankAccountNumber}
          </span>
        ) : (
          <Tag color="warning">Chưa có</Tag>
        ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 210,
      render: (_, r) => (
        <Space>
          <Button onClick={() => openTeacherDetail(r)}>Xem chi tiết</Button>
          <Button type="primary" onClick={() => openMarkPaid(r)}>
            Đã chuyển tiền
          </Button>
        </Space>
      ),
    },
  ];

  const detailCourses = useMemo(() => detail?.courses || [], [detail]);

  const detailCourseColumns = [
    {
      title: "Khóa học",
      dataIndex: "courseTitle",
      key: "courseTitle",
      render: (t) => <b>{t}</b>,
    },
    {
      title: "Số GD",
      dataIndex: "transactionCount",
      key: "transactionCount",
      align: "right",
      width: 90,
    },
    {
      title: "Teacher nhận",
      dataIndex: "teacherRevenueCents",
      key: "teacherRevenueCents",
      render: (v) => `${fmtVnd((v || 0) / 100)} VNĐ`,
      align: "right",
      width: 160,
    },
    {
      title: "Commission admin",
      dataIndex: "adminCommissionCents",
      key: "adminCommissionCents",
      render: (v) => `${fmtVnd((v || 0) / 100)} VNĐ`,
      align: "right",
      width: 170,
    },
    {
      title: "Trạng thái",
      dataIndex: "isPaid",
      key: "isPaid",
      width: 120,
      render: (v) =>
        v ? (
          <Tag color="success">Đã trả</Tag>
        ) : (
          <Tag color="warning">Chưa trả</Tag>
        ),
    },
  ];

  return (
    <div className={s.page}>
      <div className={s.titleRow}>
        <h1 className={s.title}>Payout giáo viên</h1>

        <Space>
          <span>Chọn tháng</span>
          <DatePicker
            picker="month"
            value={dayjs(yearMonth + "-01")}
            onChange={(v) => {
              const ym = (v || dayjs()).format("YYYY-MM");
              setYearMonth(ym);
              reload(ym);
            }}
            format="MM/YYYY"
            allowClear={false}
          />
        </Space>
      </div>

      <div className={s.summaryGrid}>
        <Card className={s.summaryCard} loading={loading}>
          <Statistic
            title={`Admin commission (${yearMonth})`}
            value={fmtVnd((commissionCents || 0) / 100)}
            suffix="VNĐ"
          />
          <div className={s.summaryHint}>
            Commission = 20% doanh thu hệ thống.
          </div>
        </Card>

        <Card className={s.summaryCard} loading={loading}>
          <Statistic
            title={`Teacher cần payout (${yearMonth})`}
            value={rows.length}
          />
          <div className={s.summaryHint}>
            Danh sách teachers có revenue chưa trả.
          </div>
        </Card>
      </div>

      <Card className={s.tableWrap}>
        <Table
          loading={loading}
          columns={columns}
          dataSource={rows}
          rowKey={(r) => `${r.teacherId}-${r.yearMonth}`}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        open={openDetail}
        onCancel={() => {
          setOpenDetail(false);
          setDetail(null);
        }}
        footer={null}
        width={980}
        destroyOnClose
        title={
          detail ? `Chi tiết payout - ${detail.teacherName}` : "Chi tiết payout"
        }
      >
        <Card loading={detailLoading}>
          {detail && (
            <>
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="Teacher">
                  {detail.teacherName}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {detail.teacherEmail}
                </Descriptions.Item>
                <Descriptions.Item label="Tháng">
                  {detail.yearMonth}
                </Descriptions.Item>
                <Descriptions.Item label="Tổng chưa trả">
                  {fmtVnd((detail.totalUnpaidRevenueCents || 0) / 100)} VNĐ
                </Descriptions.Item>
                <Descriptions.Item label="Ngân hàng">
                  {detail.bankName || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Số TK">
                  {detail.bankAccountNumber || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Chủ TK">
                  {detail.bankAccountName || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Chi nhánh">
                  {detail.bankBranchName || "—"}
                </Descriptions.Item>
              </Descriptions>

              <div style={{ marginTop: 16 }}>
                <h3 style={{ marginBottom: 8 }}>Theo khóa học</h3>
                <Table
                  columns={detailCourseColumns}
                  dataSource={detailCourses}
                  rowKey={(r) => r.courseId}
                  pagination={false}
                />
              </div>
            </>
          )}
        </Card>
      </Modal>

      <Modal
        open={openPaid}
        onCancel={() => {
          setOpenPaid(false);
          setTarget(null);
          setNote("");
        }}
        title={
          target
            ? `Đánh dấu đã chuyển tiền - ${target.teacherName}`
            : "Đánh dấu đã chuyển tiền"
        }
        okText="Xác nhận"
        cancelText="Hủy"
        confirmLoading={paying}
        onOk={submitMarkPaid}
        destroyOnClose
      >
        <p>
          Tháng: <b>{target?.yearMonth}</b>
        </p>
        <Input.TextArea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ghi chú (vd: Đã chuyển khoản ngày ...)"
        />
      </Modal>
    </div>
  );
}
