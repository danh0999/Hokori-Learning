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
      title: "Title",
      dataIndex: "title",
    },
    {
      title: "Reports",
      dataIndex: "flagCount",
      width: 110,
      render: (v) => <Tag color="orange">{v}</Tag>,
    },
    {
      title: "Last Report",
      dataIndex: "latestFlagAt",
      width: 180,
      render: (v) => (v ? new Date(v).toLocaleString() : "-"),
    },
    {
      title: "Actions",
      width: 220,
      render: (_, row) => (
        <Space>
          {row.isModeratorFlagged ? (
            <Tag color="green">Sent ✓</Tag>
          ) : row.canFlag ? (
            <Button
              type="primary"
              danger
              onClick={() => handleFlagCourse(row.id)}
            >
              Flag Course
            </Button>
          ) : (
            <Tag color="default">Not allowed</Tag>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card title="Flagged Courses from Learners">
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
