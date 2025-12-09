import React, { useEffect, useMemo } from "react";
import { Table, Card, Button, Tag, message, Space, Tooltip } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFlaggedCoursesThunk,
  moderatorFlagCourseThunk,
} from "../../../redux/features/moderatorCourseSlice.js";

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
      message.success("Course has been flagged and hidden from public.");
      // Sau khi flag xong, reload list để luôn sync với BE
      dispatch(fetchFlaggedCoursesThunk());
    } else {
      message.error(action.payload || "Flag failed. Try again.");
    }
  };

  const tableData = useMemo(
    () =>
      (flaggedList || []).map((item) => {
        const status = item.status || item.courseStatus;

        // Nếu BE có gửi canFlag / isModeratorFlagged thì dùng,
        // còn không thì tự tính theo status + flaggedByUserId
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
          flagCount:
            item.flagCount ?? item.totalFlags ?? item.flags?.length ?? 0,
          latestFlagAt:
            item.latestFlagAt ??
            item.lastFlagAt ??
            item.flags?.[0]?.latestFlagAt ??
            null,
          canFlag,
          isModeratorFlagged,
        };
      }),
    [flaggedList]
  );

  const columns = [
    {
      title: "Tiêu đề khóa học",
      dataIndex: "title",
    },
    {
      title: "Số báo cáo",
      dataIndex: "flagCount",
      width: 150,
      render: (v) => <Tag color="orange">{v}</Tag>,
    },
    {
      title: "Lần báo cáo cuối cùng",
      dataIndex: "latestFlagAt",
      width: 180,
      render: (v) => (v ? new Date(v).toLocaleString() : "-"),
    },
    {
      title: "Hành động",
      width: 220,
      render: (_, row) => (
        <Space>
          {row.isModeratorFlagged ? (
            <Tag color="green">Đã gửi ✓</Tag>
          ) : row.canFlag ? (
            <Button
              type="primary"
              danger
              onClick={() => handleFlagCourse(row.id)}
            >
              Ẩn khóa học
            </Button>
          ) : (
            <Tag color="default">Not allowed</Tag>
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
      />
    </Card>
  );
}
