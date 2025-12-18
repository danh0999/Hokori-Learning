// src/pages/Moderator/JlptEventsPage/JlptEventsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Card, Table, Tag, Typography, Space, Alert } from "antd";
import { useSelector } from "react-redux";
import { selectTeacherApproved } from "../../../redux/features/teacherprofileSlice";

import api from "../../../configs/axios";
import styles from "./JlptEventsPage.module.scss";
import { toast } from "react-toastify";

const { Title } = Typography;

export default function JlptEventsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // nếu path bắt đầu bằng /teacher thì đang ở role teacher
  const isTeacherRoute = location.pathname.startsWith("/teacher");
  const basePath = isTeacherRoute ? "/teacher" : "/moderator";

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testCountMap, setTestCountMap] = useState({});

  // ✅ Redux source of truth
  const teacherApproved = useSelector(selectTeacherApproved);
  const teacherProfileLoading = useSelector(
    (state) => state.teacherProfile.loading
  );

  const isTeacherNotApproved =
    isTeacherRoute && !teacherProfileLoading && !teacherApproved;

  const canView =
    !isTeacherRoute || (!teacherProfileLoading && teacherApproved);

  const fetchEvents = async () => {
    if (!canView) return;

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
            .then((r) => ({ id: ev.id, count: r.data?.length || 0 }))
            .catch(() => ({ id: ev.id, count: 0 }))
        )
      );

      const map = {};
      results.forEach((item) => {
        map[item.id] = item.count;
      });
      setTestCountMap(map);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được danh sách sự kiện JLPT");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Auto load
  useEffect(() => {
    if (!isTeacherRoute) {
      fetchEvents();
      return;
    }

    if (teacherProfileLoading) return;

    if (!teacherApproved) {
      setEvents([]);
      setTestCountMap({});
      toast.warning(
        "Hồ sơ giáo viên của bạn chưa được phê duyệt nên chưa thể xem / tạo đề JLPT."
      );
      return;
    }

    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeacherRoute, teacherProfileLoading, teacherApproved]);

  const columns = useMemo(
    () => [
      {
        title: "#",
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

          const isClosed = record.status === "CLOSED";
          const disabled = isTeacherNotApproved || isClosed;

          return (
            <Button
              type={hasTest ? "default" : "primary"}
              className={styles.actionBtn}
              disabled={disabled}
              onClick={() => {
                if (isClosed) {
                  toast.info("Sự kiện này đã đóng, không thể truy cập.");
                  return;
                }

                if (isTeacherNotApproved) {
                  toast.warning(
                    "Hồ sơ giáo viên của bạn chưa được phê duyệt nên chưa thể xem / tạo đề JLPT."
                  );
                  return;
                }

                navigate(`${basePath}/jlptevents/${record.id}/tests`, {
                  state: { event: record },
                });
              }}
            >
              {isClosed ? "Đã đóng" : "Xem sự kiện"}
            </Button>
          );
        },
      },
    ],
    [basePath, isTeacherNotApproved, navigate, testCountMap]
  );

  return (
    <div className={styles.wrapper}>
      <Space className={styles.header} align="center">
        <Title level={3} className={styles.pageTitle}>
          Sự kiện JLPT
        </Title>

        <Button
          onClick={() => {
            if (isTeacherNotApproved) {
              toast.warning(
                "Hồ sơ giáo viên của bạn chưa được phê duyệt nên chưa thể xem / tạo đề JLPT."
              );
              return;
            }
            fetchEvents();
          }}
          loading={loading || teacherProfileLoading}
        >
          Refresh
        </Button>
      </Space>

      <Card className={styles.card}>
        {isTeacherRoute && teacherProfileLoading && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="Đang kiểm tra trạng thái hồ sơ giáo viên..."
          />
        )}

        {isTeacherNotApproved && (
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
