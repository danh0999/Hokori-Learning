// src/pages/Moderator/JlptEventsPage.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Table, Tag, Spin } from "antd";
import { useNavigate } from "react-router-dom";
import { fetchJlptEventsThunk } from "../../../redux/features/jlptModeratorSlice.js";

export default function JlptEventsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { events, eventsLoading } = useSelector((state) => state.jlptModerator);

  useEffect(() => {
    dispatch(fetchJlptEventsThunk());
  }, [dispatch]);

  const columns = [
    { title: "ID", dataIndex: "id" },
    { title: "Title", dataIndex: "title" },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => (
        <Tag color={status === "OPEN" ? "green" : "gold"}>{status}</Tag>
      ),
    },
    {
      title: "Action",
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() => navigate(`/moderator/jlpt/events/${record.id}/tests`)}
        >
          Build JLPT Test
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>Sự kiện JLPT</h2>
      {eventsLoading ? (
        <Spin />
      ) : (
        <Table rowKey="id" dataSource={events} columns={columns} />
      )}
    </div>
  );
}
