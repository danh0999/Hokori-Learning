// src/pages/Moderator/JlptEventsPage/JlptEventsPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Table, Tag, message, Typography, Space } from "antd";

import api from "../../../configs/axios";
import styles from "./JlptEventsPage.module.scss";

const { Title } = Typography;

export default function JlptEventsPage() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasTestMap, setHasTestMap] = useState({});

  // Fetch events & test status
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get("jlpt/events");
      const list = res.data || [];
      setEvents(list);

      // Kiểm tra test cho từng event
      const results = await Promise.all(
        list.map((ev) =>
          api
            .get(`jlpt/events/${ev.id}/tests`)
            .then((r) => ({
              id: ev.id,
              count: r.data?.length || 0,
            }))
            .catch(() => ({ id: ev.id, count: 0 }))
        )
      );

      const map = {};
      results.forEach((item) => {
        map[item.id] = item.count > 0;
      });
      setHasTestMap(map);
    } catch (err) {
      console.error(err);
      message.error("Không tải được danh sách sự kiện JLPT");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 80,
      render: (id) => <b>{id}</b>,
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      ellipsis: true,
    },
    {
      title: "Cấp độ",
      dataIndex: "level",
      width: 100,
      render: (level) => <Tag color="blue">{level}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      render: (st) => {
        const color =
          st === "OPEN" ? "green" : st === "DRAFT" ? "default" : "red";
        return <Tag color={color}>{st}</Tag>;
      },
    },
    {
      title: "Đề thi",
      width: 120,
      render: (_, record) =>
        hasTestMap[record.id] ? (
          <Tag color="green">READY</Tag>
        ) : (
          <Tag>No test</Tag>
        ),
    },
    {
      title: "Thao tác",
      width: 180,
      render: (_, record) => {
        const hasTest = hasTestMap[record.id];
        return (
          <Button
            type={hasTest ? "default" : "primary"}
            className={styles.actionBtn}
            onClick={() =>
              navigate(`/moderator/jlptevents/${record.id}/tests`, {
                state: { event: record },
              })
            }
          >
            {hasTest ? "Edit Test" : "Build Test"}
          </Button>
        );
      },
    },
  ];

  return (
    <div className={styles.wrapper}>
      <Space className={styles.header} align="center">
        <Title level={3} className={styles.pageTitle}>
          Sự kiện JLPT
        </Title>

        <Button onClick={fetchEvents} loading={loading}>
          Refresh
        </Button>
      </Space>

      <Card className={styles.card}>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={events}
          pagination={{ pageSize: 8 }}
        />
      </Card>
    </div>
  );
}
