// src/pages/Moderator/JlptEventsPage/JlptEventsPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  Card,
  Table,
  Tag,
  message,
  Typography,
  Space,
  Alert,
} from "antd";

import api from "../../../configs/axios";
import styles from "./JlptEventsPage.module.scss";

const { Title } = Typography;

export default function JlptEventsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // nếu path bắt đầu bằng /teacher thì đang ở role teacher
  const isTeacherRoute = location.pathname.startsWith("/teacher");
  const basePath = isTeacherRoute ? "/teacher" : "/moderator";

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  // lưu số lượng test cho từng eventId
  const [testCountMap, setTestCountMap] = useState({});

  const [teacherApprovalStatus, setTeacherApprovalStatus] = useState(null);
  const [checkingTeacher, setCheckingTeacher] = useState(false);

  // Fetch events & test count
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get("jlpt/events");
      let list = res.data || [];
      list = [...list].sort((a, b) => Number(b.id) - Number(a.id));

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

  // Chỉ cho teacher đã APPROVED mới được load event JLPT
  const validateTeacherAndFetch = async () => {
    if (!isTeacherRoute) {
      // Moderator thì bỏ qua check
      fetchEvents();
      return;
    }

    setCheckingTeacher(true);
    try {
      const res = await api.get("/profile/me");
      const user = res.data?.data || res.data;

      const approval = user?.teacher?.approvalStatus || null;
      setTeacherApprovalStatus(approval);

      if (approval !== "APPROVED") {
        setEvents([]);
        setTestCountMap({});
        message.warning(
          "Hồ sơ giáo viên của bạn chưa được phê duyệt nên chưa thể xem / tạo đề JLPT."
        );
        return;
      }

      // Đã approve thì load event
      fetchEvents();
    } catch (err) {
      console.error(err);
      message.error("Không kiểm tra được trạng thái giáo viên hiện tại");
    } finally {
      setCheckingTeacher(false);
    }
  };
  useEffect(() => {
    validateTeacherAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeacherRoute]);

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
              navigate(`${basePath}/jlptevents/${record.id}/tests`, {
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

        <Button
          onClick={validateTeacherAndFetch}
          loading={loading || checkingTeacher}
        >
          Refresh
        </Button>
      </Space>

      <Card className={styles.card}>
        {isTeacherRoute &&
          teacherApprovalStatus &&
          teacherApprovalStatus !== "APPROVED" && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message="Hồ sơ giáo viên chưa được phê duyệt"
              description="Vui lòng hoàn thiện hồ sơ và chờ được duyệt trước khi tạo / chỉnh sửa đề JLPT. Bạn có thể xem trạng thái duyệt trong trang Hồ sơ giáo viên."
            />
          )}
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
