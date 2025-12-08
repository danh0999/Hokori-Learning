import React, { useEffect, useMemo } from "react";
import { Table, Card, Button, Tag, message, Space } from "antd";
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
      dispatch(fetchFlaggedCoursesThunk());
    } else {
      message.error("Flag failed. Try again.");
    }
  };

  // 🔹 Chuẩn hoá data từ BE → FE dùng thống nhất
  const tableData = useMemo(
    () =>
      (flaggedList || []).map((item) => ({
        id: item.courseId ?? item.id,
        title: item.courseTitle ?? item.title,
        flagCount: item.flagCount ?? item.totalFlags ?? 0,
        latestFlagAt: item.latestFlagAt ?? item.lastFlagAt,
      })),
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
      width: 150,
      render: (_, row) => (
        <Space>
          <Button
            type="primary"
            danger
            onClick={() => handleFlagCourse(row.id)}
          >
            Flag Course
          </Button>
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
