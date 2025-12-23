// src/pages/Moderator/FlaggedCoursesPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Card,
  Button,
  Tag,
  message,
  Space,
  Tooltip,
  Modal,
  Divider,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFlaggedCoursesThunk,
  moderatorFlagCourseThunk,
} from "../../../redux/features/moderatorCourseSlice.js";

const FLAG_TYPE_LABELS = {
  INAPPROPRIATE_CONTENT: "Nội dung không phù hợp",
  COPYRIGHT_VIOLATION: "Vi phạm bản quyền",
  MISLEADING_INFO: "Thông tin sai lệch",
  SPAM: "Spam",
  HARASSMENT: "Quấy rối",
  OTHER: "Khác",
};

const FLAG_TYPE_COLORS = {
  INAPPROPRIATE_CONTENT: "red",
  COPYRIGHT_VIOLATION: "geekblue",
  MISLEADING_INFO: "volcano",
  SPAM: "orange",
  HARASSMENT: "magenta",
  OTHER: "default",
};

const STATUS_LABELS = {
  PUBLISHED: "Đã xuất bản",
  FLAGGED: "Đã ẩn ",
};

const STATUS_COLORS = {
  PUBLISHED: "green",
  FLAGGED: "red",
};

export default function FlaggedCoursesPage() {
  const dispatch = useDispatch();
  const { flaggedList, loadingFlagged } = useSelector(
    (state) => state.moderatorCourse
  );

  // modal
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [flagging, setFlagging] = useState(false);

  useEffect(() => {
    dispatch(fetchFlaggedCoursesThunk());
  }, [dispatch]);

  const openModal = (row) => {
    setSelected(row);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setSelected(null);
  };

  const handleFlag = async (courseId) => {
    setFlagging(true);
    const action = await dispatch(moderatorFlagCourseThunk(courseId));
    setFlagging(false);

    if (moderatorFlagCourseThunk.fulfilled.match(action)) {
      message.success("Đã ẩn khóa học (FLAGGED) và gửi lý do cho giáo viên.");
      // refetch để sync (vì list có cả PUBLISHED + FLAGGED)
      dispatch(fetchFlaggedCoursesThunk());
      closeModal();
    } else {
      message.error(action.payload || "Ẩn khóa học thất bại. Thử lại sau.");
    }
  };

  const tableData = useMemo(() => {
    return (flaggedList || []).map((item) => {
      const flagsSorted = [...(item.flags || [])].sort((a, b) => {
        const ta = new Date(a.createdAt || 0).getTime();
        const tb = new Date(b.createdAt || 0).getTime();
        return tb - ta;
      });

      const latest = flagsSorted[0];

      return {
        id: item.courseId ?? item.id,
        title: item.courseTitle ?? item.title,
        teacherName: item.teacherName,
        status: item.status,
        flagCount: item.flagCount ?? flagsSorted.length ?? 0,
        latestFlagAt: item.latestFlagAt ?? latest?.createdAt ?? null,
        latestFlagType: latest?.flagType ?? null,
        latestFlagReason: latest?.reason ?? null,
        flags: flagsSorted,

        // BE đã trả 2 field này
        isModeratorFlagged:
          typeof item.isModeratorFlagged === "boolean"
            ? item.isModeratorFlagged
            : item.status === "FLAGGED" || !!item.flaggedByUserId,
        canFlag:
          typeof item.canFlag === "boolean"
            ? item.canFlag
            : item.status === "PUBLISHED" && !item.flaggedByUserId,
      };
    });
  }, [flaggedList]);

  const columns = [
    {
      title: "Khóa học",
      dataIndex: "title",
      ellipsis: true,
    },
    {
      title: "GV",
      dataIndex: "teacherName",
      width: 140,
      ellipsis: true,
      render: (v) => v || "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 130,
      render: (v) => (
        <Tag color={STATUS_COLORS[v] || "default"}>
          {STATUS_LABELS[v] || v || "-"}
        </Tag>
      ),
    },
    {
      title: "Báo cáo",
      dataIndex: "flagCount",
      width: 110,
      render: (v) => <Tag color="orange">{v}</Tag>,
    },
    {
      title: "Loại (mới nhất)",
      dataIndex: "latestFlagType",
      width: 170,
      render: (v) => {
        if (!v) return "-";
        return (
          <Tag color={FLAG_TYPE_COLORS[v] || "default"}>
            {FLAG_TYPE_LABELS[v] || v}
          </Tag>
        );
      },
    },
    {
      title: "Lý do (mới nhất)",
      dataIndex: "latestFlagReason",
      ellipsis: true,
      width: 240,
      render: (text) =>
        text ? (
          <Tooltip title={text}>
            <span>{text.length > 28 ? `${text.slice(0, 28)}...` : text}</span>
          </Tooltip>
        ) : (
          "-"
        ),
    },
    {
      title: "Lần cuối",
      dataIndex: "latestFlagAt",
      width: 170,
      render: (v) => (v ? new Date(v).toLocaleString() : "-"),
    },
    {
      title: "Hành động",
      width: 220,
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => openModal(row)}>
            Xem báo cáo
          </Button>

          {row.isModeratorFlagged ? (
            <Tag color="green">Đã ẩn & gửi ✓</Tag>
          ) : row.canFlag ? (
            <Button
              size="small"
              type="primary"
              danger
              onClick={() => handleFlag(row.id)}
            >
              Ẩn & gửi
            </Button>
          ) : (
            <Tag color="default">Không thể ẩn</Tag>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card title="Khóa học bị báo cáo">
      <Table
        rowKey="id"
        columns={columns}
        dataSource={tableData}
        loading={loadingFlagged}
        pagination={false}
        size="small"
      />

      <Modal
        open={open}
        onCancel={closeModal}
        width={720}
        title={
          <div>
            <div style={{ fontWeight: 600 }}>
              {selected?.title || "Báo cáo khóa học"}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              GV: {selected?.teacherName || "-"} • Tổng báo cáo:{" "}
              {selected?.flagCount ?? selected?.flags?.length ?? 0}
            </div>
          </div>
        }
        footer={
          <Space>
            <Button onClick={closeModal}>Đóng</Button>

            {selected?.isModeratorFlagged ? (
              <Tag color="green" style={{ marginInlineStart: 8 }}>
                Đã ẩn & gửi cho GV ✓
              </Tag>
            ) : selected?.canFlag ? (
              <Button
                type="primary"
                danger
                loading={flagging}
                onClick={() => handleFlag(selected?.id)}
              >
                Ẩn & gửi cho teacher
              </Button>
            ) : (
              <Tag color="default">Không thể ẩn</Tag>
            )}
          </Space>
        }
      >
        {!selected?.flags?.length ? (
          <div style={{ opacity: 0.7 }}>Chưa có báo cáo chi tiết.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {selected.flags.map((f, idx) => (
              <div
                key={f.flagId || idx}
                style={{
                  border: "1px solid #f0f0f0",
                  borderRadius: 10,
                  padding: 12,
                  background: "#fff",
                }}
              >
                <Space wrap>
                  <Tag color={FLAG_TYPE_COLORS[f.flagType] || "default"}>
                    {FLAG_TYPE_LABELS[f.flagType] || f.flagType || "Khác"}
                  </Tag>
                  <Tag>
                    Người báo cáo:{" "}
                    <b>{f.userName || `User #${f.userId || "-"}`}</b>
                  </Tag>
                  <Tag>
                    Lúc:{" "}
                    <b>
                      {f.createdAt
                        ? new Date(f.createdAt).toLocaleString()
                        : "-"}
                    </b>
                  </Tag>
                </Space>

                <Divider style={{ margin: "10px 0" }} />

                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>
                  {f.reason || (
                    <span style={{ opacity: 0.6 }}>Không có lý do.</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </Card>
  );
}
