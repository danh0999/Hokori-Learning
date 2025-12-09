// src/pages/Moderator/FlaggedCoursesPage.jsx
import React, { useEffect, useMemo } from "react";
import { Table, Card, Button, Tag, message, Space, Tooltip } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFlaggedCoursesThunk,
  moderatorFlagCourseThunk,
} from "../../../redux/features/moderatorCourseSlice.js";

// Map loại report → tiếng Việt
const FLAG_TYPE_LABELS = {
  INAPPROPRIATE_CONTENT: "Nội dung không phù hợp",
  COPYRIGHT_VIOLATION: "Vi phạm bản quyền",
  MISLEADING_INFO: "Thông tin sai lệch",
  SPAM: "Spam",
  HARASSMENT: "Quấy rối",
  OTHER: "Khác",
};

// (optional) Màu theo loại report (nếu muốn gọn thì dùng chung 1 màu cũng được)
const FLAG_TYPE_COLORS = {
  INAPPROPRIATE_CONTENT: "red",
  COPYRIGHT_VIOLATION: "geekblue",
  MISLEADING_INFO: "volcano",
  SPAM: "orange",
  HARASSMENT: "magenta",
  OTHER: "default",
};

// Map status → tiếng Việt
const STATUS_LABELS = {
  PUBLISHED: "Đã xuất bản",
  FLAGGED: "Đã ẩn (bị báo cáo)",
  PENDING_APPROVAL: "Đang chờ duyệt",
  DRAFT: "Bản nháp",
  REJECTED: "Bị từ chối",
};

// Màu Tag theo status
const STATUS_COLORS = {
  PUBLISHED: "green",
  FLAGGED: "red",
  PENDING_APPROVAL: "gold",
  DRAFT: "default",
  REJECTED: "volcano",
};

export default function FlaggedCoursesPage() {
  const dispatch = useDispatch();
  const { flaggedList, loadingFlagged } = useSelector(
    (state) => state.moderatorCourse
  );

  useEffect(() => {
    dispatch(fetchFlaggedCoursesThunk());
  }, [dispatch]);

  const handleFlagCourse = async (courseId) => {
    const action = await dispatch(moderatorFlagCourseThunk(courseId));

    if (moderatorFlagCourseThunk.fulfilled.match(action)) {
      message.success("Khóa học đã được ẩn khỏi public.");
      // Reload lại list cho sync với BE
      dispatch(fetchFlaggedCoursesThunk());
    } else {
      message.error(action.payload || "Ẩn khóa học thất bại. Thử lại sau.");
    }
  };

  const tableData = useMemo(
    () =>
      (flaggedList || []).map((item) => {
        const status = item.status || item.courseStatus;
        const latestFlag = item.flags?.[0];

        const canFlag =
          typeof item.canFlag === "boolean"
            ? item.canFlag
            : status === "PUBLISHED" && !item.flaggedByUserId;

        const isModeratorFlagged =
          typeof item.isModeratorFlagged === "boolean"
            ? item.isModeratorFlagged
            : status === "FLAGGED" && !!item.flaggedByUserId;

        return {
          id: item.courseId ?? item.id,
          title: item.courseTitle ?? item.title,
          slug: item.courseSlug,
          teacherName: item.teacherName,
          teacherId: item.teacherId,

          status,
          flagCount: item.flagCount ?? item.flags?.length ?? 0,

          latestFlagAt: item.latestFlagAt,
          latestFlagType: latestFlag?.flagType || null,
          latestFlagReason: latestFlag?.reason || null,
          latestFlaggedBy: latestFlag?.userName || null,

          canFlag,
          isModeratorFlagged,
        };
      }),
    [flaggedList]
  );

  const columns = [
    {
      title: "Khóa học",
      dataIndex: "title",
      ellipsis: true,
    },
    {
      title: "GV",
      dataIndex: "teacherName",
      width: 120,
      ellipsis: true,
    },
    {
      title: "Báo cáo",
      dataIndex: "flagCount",
      width: 100,
      render: (v) => <Tag color="orange">{v}</Tag>,
    },
    {
      title: "Loại",
      dataIndex: "latestFlagType",
      width: 180,
      ellipsis: true,
      render: (v) => {
        if (!v) return "-";
        const label = FLAG_TYPE_LABELS[v] || v;
        const color = FLAG_TYPE_COLORS[v] || "red";
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Lý do",
      dataIndex: "latestFlagReason",
      ellipsis: true,
      width: 180,
      render: (text) =>
        text ? (
          <Tooltip title={text}>
            <span>{text.length > 20 ? `${text.slice(0, 20)}...` : text}</span>
          </Tooltip>
        ) : (
          "-"
        ),
    },
    {
      title: "Lần cuối",
      dataIndex: "latestFlagAt",
      width: 150,
      render: (v) => (v ? new Date(v).toLocaleString() : "-"),
    },
    {
      title: "Hành động",
      width: 150,
      render: (_, row) => (
        <Space>
          {row.isModeratorFlagged ? (
            <Tag color="green">Đã gửi ✓</Tag>
          ) : row.canFlag ? (
            <Button
              size="small"
              type="primary"
              danger
              onClick={() => handleFlagCourse(row.id)}
            >
              Ẩn
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
        size="small" // bảng gọn hơn
      />
    </Card>
  );
}
