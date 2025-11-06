// src/pages/Teacher/ManageDocument/Quiz/QuizTable.jsx
import React from "react";
import { Table, Button, Space } from "antd";

export default function QuizTable() {
  const columns = [
    {
      title: "Tên quiz",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Tổng số câu hỏi",
      dataIndex: "total_questions",
      key: "total_questions",
      width: 150,
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (value) => {
        if (!value) return "";
        const d = new Date(value);
        return d.toLocaleString(); // sau này cần thì format lại cho đẹp
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 220,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => console.log("Edit", record.id)}>
            Edit
          </Button>
          <Button
            size="small"
            onClick={() => console.log("Questions", record.id)}
          >
            Questions
          </Button>
          <Button
            size="small"
            danger
            onClick={() => console.log("Delete", record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  // dummy data: giả sử BE trả created_at dạng ISO string
  const data = [
    {
      id: 1,
      title: "JLPT N5 – Lesson 1",
      total_questions: 10,
      created_at: "2025-11-01T09:30:00Z",
    },
    {
      id: 2,
      title: "Kanji N5 – Bộ Thủ",
      total_questions: 15,
      created_at: "2025-11-03T14:15:00Z",
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16, textAlign: "right" }}>
        <Button type="primary" onClick={() => console.log("Create new quiz")}>
          + Create quiz
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 10 }}
      />
    </>
  );
}
