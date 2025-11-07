import React, { useEffect, useState } from "react";
import { Table, Button, Space } from "antd";
import { useNavigate } from "react-router-dom";
import styles from "./QuizTable.module.scss";

export default function QuizTable() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);

  // load list từ localStorage
  useEffect(() => {
    const raw = localStorage.getItem("hokori_quizzes");
    const list = raw ? JSON.parse(raw) : [];
    setData(list);
  }, []);

  const columns = [
    {
      title: "Tên quiz",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Tổng số câu hỏi",
      dataIndex: "questions",
      key: "total_questions",
      width: 150,
      render: (qs) => (Array.isArray(qs) ? qs.length : 0),
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (value) => {
        if (!value) return "";
        const d = new Date(value);
        return d.toLocaleString();
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 220,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            onClick={() =>
              navigate("/teacher/create-quiz", { state: { quizId: record.id } })
            }
          >
            Edit
          </Button>
          <Button size="small" onClick={() => console.log("Questions", record)}>
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

  const handleCreateQuiz = () => {
    navigate("/teacher/create-quiz", {
      state: { returnTo: "/teacher/manage-documents" },
    });
  };

  return (
    <>
      <div style={{ marginBottom: 16, textAlign: "right" }}>
        <Button type="primary" onClick={handleCreateQuiz}>
          + Create quiz
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        pagination={{
          pageSize: 10,
          className: styles.quizPagination,
        }}
      />
    </>
  );
}
