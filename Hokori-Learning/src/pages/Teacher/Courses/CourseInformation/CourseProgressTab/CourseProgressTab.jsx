import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Progress,
  Statistic,
  Space,
  Input,
  Select,
  Table,
  Avatar,
  Button,
  Drawer,
  Collapse,
  Empty,
} from "antd";
import {
  UserOutlined,
  BookOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
// TODO: import API thật sau
// import { getTeacherCourseProgress, getLearnerProgressDetail } from "../../../../api/teacherProgress";
import styles from "./CourseProgressTab.module.scss";

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { Search } = Input;

const statusColorMap = {
  NOT_STARTED: "default",
  IN_PROGRESS: "processing",
  COMPLETED: "success",
};

export default function CourseProgressTab({ courseId, isActive }) {
  const [courseStats, setCourseStats] = useState(null);
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState(null);
  const [learnerDetail, setLearnerDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // chỉ load khi tab đang active
  useEffect(() => {
    if (!courseId || !isActive) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // const res = await getTeacherCourseProgress(courseId);
        // setCourseStats(res.data.course);
        // setLearners(res.data.learners);

        // MOCK tạm
        setCourseStats({
          id: courseId,
          title: "N5 Grammar & Vocab Full Course",
          subtitle: "Nền tảng vững chắc cho JLPT N5",
          level: "N5",
          enrollCount: 32,
          avgProgressPercent: 64,
          completedCount: 10,
          inProgressCount: 18,
          notStartedCount: 4,
        });

        setLearners([
          {
            learnerId: 1,
            name: "Nguyen Van A",
            email: "a@example.com",
            enrolledAt: "2025-12-01T10:00:00",
            progressPercent: 80,
            completedLessons: 20,
            totalLessons: 25,
            lastActivity: "2025-12-04T14:30:00",
            status: "IN_PROGRESS",
          },
          {
            learnerId: 2,
            name: "Tran Thi B",
            email: "b@example.com",
            enrolledAt: "2025-12-02T09:15:00",
            progressPercent: 100,
            completedLessons: 25,
            totalLessons: 25,
            lastActivity: "2025-12-03T18:10:00",
            status: "COMPLETED",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, isActive]);

  const filteredLearners = useMemo(
    () =>
      learners.filter((l) => {
        const matchesSearch =
          !searchValue ||
          l.name.toLowerCase().includes(searchValue.toLowerCase()) ||
          l.email.toLowerCase().includes(searchValue.toLowerCase());

        const matchesStatus =
          statusFilter === "ALL" ? true : l.status === statusFilter;

        return matchesSearch && matchesStatus;
      }),
    [learners, searchValue, statusFilter]
  );

  const handleViewDetail = async (record) => {
    setSelectedLearner(record);
    setDrawerOpen(true);
    setLoadingDetail(true);
    try {
      // const res = await getLearnerProgressDetail(courseId, record.learnerId);
      // setLearnerDetail(res.data);

      // MOCK
      setLearnerDetail({
        courseProgressPercent: record.progressPercent,
        chapters: [
          {
            chapterId: 1,
            title: "Chapter 1: Basic Grammar",
            progressPercent: 90,
            lessons: [
              {
                lessonId: 11,
                title: "Lesson 1: Particles",
                progressPercent: 100,
                completedContents: 5,
                totalContents: 5,
              },
              {
                lessonId: 12,
                title: "Lesson 2: Verb basic",
                progressPercent: 80,
                completedContents: 4,
                totalContents: 5,
              },
            ],
          },
        ],
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  const columns = [
    {
      title: "Learner",
      dataIndex: "name",
      key: "name",
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary" className={styles.email}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Enrolled at",
      dataIndex: "enrolledAt",
      key: "enrolledAt",
      render: (v) => <Text>{new Date(v).toLocaleDateString("vi-VN")}</Text>,
    },
    {
      title: "Progress",
      dataIndex: "progressPercent",
      key: "progressPercent",
      render: (v) => (
        <div className={styles.progressCell}>
          <Progress percent={v} size="small" />
        </div>
      ),
    },
    {
      title: "Lessons",
      key: "lessons",
      render: (_, r) => (
        <Text>
          {r.completedLessons}/{r.totalLessons}
        </Text>
      ),
    },
    {
      title: "Last activity",
      dataIndex: "lastActivity",
      key: "lastActivity",
      render: (v) => (
        <Space>
          <ClockCircleOutlined />
          <Text type="secondary">{new Date(v).toLocaleString("vi-VN")}</Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v) => <Tag color={statusColorMap[v]}>{v.replace("_", " ")}</Tag>,
    },
    {
      key: "action",
      render: (_, r) => (
        <Button type="link" onClick={() => handleViewDetail(r)}>
          View details
        </Button>
      ),
    },
  ];

  if (!courseStats) {
    return <Empty description="No data yet" />;
  }

  return (
    <div className={styles.wrapper}>
      {/* header + stats trong tab */}
      <Card className={styles.courseHeader}>
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Space align="start" size="large">
              <div className={styles.coverPlaceholder}>
                <BookOutlined />
              </div>
              <div>
                <Title level={4} className={styles.courseTitle}>
                  {courseStats.title}
                </Title>
                <Text type="secondary">{courseStats.subtitle}</Text>
                <div className={styles.metaRow}>
                  <Tag color="gold">{courseStats.level}</Tag>
                  <Tag>{courseStats.enrollCount} learners</Tag>
                </div>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Average progress"
                  value={courseStats.avgProgressPercent}
                  suffix="%"
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Completed"
                  value={courseStats.completedCount}
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="In progress"
                  value={courseStats.inProgressCount}
                  prefix={<UserOutlined />}
                />
              </Col>
            </Row>
            <Row gutter={16} className={styles.statRow}>
              <Col span={8}>
                <Statistic
                  title="Not started"
                  value={courseStats.notStartedCount}
                  prefix={<UserOutlined />}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* filters */}
      <Card className={styles.filterCard}>
        <Row gutter={16} align="middle">
          <Col xs={24} md={12}>
            <Search
              placeholder="Search learner by name or email"
              allowClear
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </Col>
          <Col xs={24} md={6}>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: "100%" }}
              options={[
                { value: "ALL", label: "All statuses" },
                { value: "NOT_STARTED", label: "Not started" },
                { value: "IN_PROGRESS", label: "In progress" },
                { value: "COMPLETED", label: "Completed" },
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* table */}
      <Card className={styles.tableCard}>
        <Table
          rowKey="learnerId"
          loading={loading}
          dataSource={filteredLearners}
          columns={columns}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: <Empty description="No learners yet" /> }}
        />
      </Card>

      {/* drawer detail */}
      <Drawer
        width={520}
        title={
          selectedLearner ? (
            <Space>
              <Avatar size="large" icon={<UserOutlined />} />
              <div>
                <Text strong>{selectedLearner.name}</Text>
                <br />
                <Text type="secondary">{selectedLearner.email}</Text>
              </div>
            </Space>
          ) : (
            "Learner progress"
          )
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {loadingDetail || !learnerDetail ? (
          <Empty description="Loading..." />
        ) : (
          <>
            <div className={styles.detailSummary}>
              <Title level={5}>Course progress</Title>
              <Progress
                type="circle"
                percent={learnerDetail.courseProgressPercent}
              />
              <div className={styles.detailStats}>
                <Text type="secondary">
                  Enrolled at:{" "}
                  {new Date(selectedLearner.enrolledAt).toLocaleString("vi-VN")}
                </Text>
                <br />
                <Text type="secondary">
                  Last activity:{" "}
                  {new Date(selectedLearner.lastActivity).toLocaleString(
                    "vi-VN"
                  )}
                </Text>
              </div>
            </div>

            <Title level={5} style={{ marginTop: 24 }}>
              Progress by chapter
            </Title>
            <Collapse accordion>
              {learnerDetail.chapters.map((ch) => (
                <Panel
                  key={ch.chapterId}
                  header={
                    <div className={styles.chapterHeader}>
                      <span>{ch.title}</span>
                      <Progress
                        percent={ch.progressPercent}
                        size="small"
                        style={{ width: 160 }}
                      />
                    </div>
                  }
                >
                  {ch.lessons.map((lesson) => (
                    <div key={lesson.lessonId} className={styles.lessonRow}>
                      <div className={styles.lessonInfo}>
                        <Text strong>{lesson.title}</Text>
                        <Text type="secondary">
                          {lesson.completedContents}/{lesson.totalContents}{" "}
                          contents
                        </Text>
                      </div>
                      <Progress
                        percent={lesson.progressPercent}
                        size="small"
                        style={{ width: 150 }}
                      />
                    </div>
                  ))}
                </Panel>
              ))}
            </Collapse>
          </>
        )}
      </Drawer>
    </div>
  );
}
