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
  // lưu số lượng test cho từng eventId
  const [testCountMap, setTestCountMap] = useState({});

  // Fetch events & test count
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get("jlpt/events");
      const list = res.data || [];
      setEvents(list);

      // Lấy số lượng test cho từng event
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
        map[item.id] = item.count; // lưu thẳng số lượng
      });
      setTestCountMap(map);
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
      width: 140,
      render: (_, record) => {
        const count = testCountMap[record.id] ?? 0;
        return count > 0 ? (
          <Tag color="green">{count} đề</Tag>
        ) : (
          <Tag>Chưa có đề</Tag>
        );
      },
    },
    {
      title: "Thao tác",
      width: 180,
      render: (_, record) => {
        const count = testCountMap[record.id] ?? 0;
        const hasTest = count > 0;

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
            Xem sự kiện
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
