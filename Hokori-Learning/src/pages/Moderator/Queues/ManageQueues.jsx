import React, { useMemo, useState } from "react";
import {
  Table,
  Tag,
  Input,
  Select,
  Space,
  Button,
  Dropdown,
  Modal,
  message,
} from "antd";
import {
  SearchOutlined,
  MoreOutlined,
  ExclamationCircleFilled,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  UserAddOutlined,
} from "@ant-design/icons";

import CourseReviewModal from "../Queues/CourseReviewModal";
import RequestRevisionModal from "../Queues/components/RequestRevisionModal";
import ApprovePublishModal from "../Queues/components/ApprovePublishModal";
import RejectModal from "../Queues/components/RejectModal";

import styles from "./styles.module.scss";
//eslint-disable-next-line
const { confirm } = Modal;

const CURRENT_MOD = "Moderator A";

const initialCourses = [
  {
    id: 1,
    title: "JLPT N5 Grammar Basics",
    code: "N5-GR-101",
    teacher: "Nguyen Van A",
    submittedAt: "2025-10-20",
    status: "Review",
    assignee: null,
    price: "199,000 VND",
    visibility: "Public",
  },
  {
    id: 2,
    title: "Kanji 200 – Intermediate",
    code: "KJ-200",
    teacher: "Tran Thi B",
    submittedAt: "2025-10-22",
    status: "Request Revision",
    assignee: "Moderator A",
    price: "249,000 VND",
    visibility: "Public",
  },
  {
    id: 3,
    title: "N3 Listening Practice",
    code: "N3-LS-501",
    teacher: "Nguyen Van C",
    submittedAt: "2025-10-18",
    status: "Review",
    assignee: "Moderator B",
    price: "Free",
    visibility: "Unlisted",
  },
];

export default function ManageQueues() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [data, setData] = useState(initialCourses);

  // modal: course inspector
  const [selectedCourse, setSelectedCourse] = useState(null);

  // modal: request changes
  const [openRequestRevision, setOpenRequestRevision] = useState(false);
  const [requestTargetCourse, setRequestTargetCourse] = useState(null);

  // modal: approve & publish
  const [openApprovePublish, setOpenApprovePublish] = useState(false);
  const [approveTargetCourse, setApproveTargetCourse] = useState(null);

  // modal: reject
  const [openReject, setOpenReject] = useState(false);
  const [rejectTargetCourse, setRejectTargetCourse] = useState(null);

  /** FILTER LOGIC */
  const filtered = useMemo(() => {
    return data.filter((c) => {
      const okQuery =
        !q ||
        c.title.toLowerCase().includes(q.toLowerCase()) ||
        c.code.toLowerCase().includes(q.toLowerCase());

      const okStatus = status === "All" || c.status === status;

      let okAssignee = true;
      if (assigneeFilter === "Unassigned") okAssignee = !c.assignee;
      else if (assigneeFilter === "Mine")
        okAssignee = c.assignee === CURRENT_MOD;
      else if (assigneeFilter === "Assigned")
        okAssignee = !!c.assignee && c.assignee !== CURRENT_MOD;

      return okQuery && okStatus && okAssignee;
    });
  }, [q, status, assigneeFilter, data]);

  /** TAKE OWNERSHIP */
  const takeOwnership = (id) => {
    setData((prev) =>
      prev.map((c) => (c.id === id ? { ...c, assignee: CURRENT_MOD } : c))
    );
    message.success("Bạn đã nhận xử lý khóa học này");
  };

  /** AFTER REQUEST CHANGES */
  //eslint-disable-next-line
  const handleSubmitRequestRevision = async (feedbackText) => {
    // Gửi feedbackText -> API (notify teacher)
    setData(
      (prev) =>
        prev.map((c) =>
          c.id === requestTargetCourse.id
            ? {
                ...c,
                status: "Request Revision",
                assignee: CURRENT_MOD,
              }
            : c
        )
      // vẫn giữ course trong queue vì nó chưa được giáo viên sửa xong
    );

    message.success("Đã gửi yêu cầu chỉnh sửa cho giáo viên.");
    setOpenRequestRevision(false);
    setRequestTargetCourse(null);
    setSelectedCourse(null);
  };

  /** APPROVE & PUBLISH confirm */
  const handleConfirmApprovePublish = async () => {
    // Audit log + publish -> API ở đây sau này
    const approvedId = approveTargetCourse.id;

    // Xoá course khỏi queue vì nó đã publish
    setData((prev) => prev.filter((c) => c.id !== approvedId));

    message.success("Khóa học đã được phê duyệt và công khai.");
    setOpenApprovePublish(false);
    setApproveTargetCourse(null);
    setSelectedCourse(null);
  };

  /** REJECT confirm */
  //eslint-disable-next-line
  const handleSubmitReject = async (reasonText) => {
    // Gửi reasonText -> API (notify teacher + audit log)
    const rejectedId = rejectTargetCourse.id;

    // Xoá course khỏi queue vì submission này đóng lại
    setData((prev) => prev.filter((c) => c.id !== rejectedId));

    message.success("Khóa học đã bị từ chối. Giáo viên sẽ được thông báo.");
    setOpenReject(false);
    setRejectTargetCourse(null);
    setSelectedCourse(null);
  };

  /** TABLE ACTION MENU */
  const buildActionsMenu = (row) => {
    const mine = row.assignee === CURRENT_MOD;
    const unassigned = !row.assignee;

    const items = [
      {
        key: "review",
        label: "Review Submission",
        icon: <EyeOutlined />,
        onClick: () => setSelectedCourse(row),
      },
    ];

    if (unassigned) {
      items.push({
        key: "take",
        label: "Take ownership",
        icon: <UserAddOutlined />,
        onClick: () => takeOwnership(row.id),
      });
    }

    if (mine || unassigned) {
      items.push({ type: "divider" });
      items.push({
        key: "approve",
        label: "Approve & Publish",
        icon: <CheckOutlined />,
        onClick: () => {
          setApproveTargetCourse(row);
          setOpenApprovePublish(true);
        },
      });
      items.push({
        key: "reject",
        label: "Reject",
        icon: <CloseOutlined />,
        danger: true,
        onClick: () => {
          setRejectTargetCourse(row);
          setOpenReject(true);
        },
      });
    }

    return items;
  };

  /** COLUMNS (unchanged except we don't call onApprove/onReject directly anymore) */
  const columns = [
    {
      title: "Course Title",
      dataIndex: "title",
      key: "title",
      render: (v, r) => (
        <div>
          <div className={styles.courseTitle}>{v}</div>
          <div className={styles.courseCode}>{r.code}</div>
        </div>
      ),
    },
    { title: "Teacher", dataIndex: "teacher", width: 180 },
    { title: "Submitted", dataIndex: "submittedAt", width: 140 },
    {
      title: "Status",
      dataIndex: "status",
      width: 160,
      render: (s) => (
        <Tag
          color={
            s === "Review"
              ? "gold"
              : s === "Request Revision"
              ? "orange"
              : s === "Approved" || s === "Published"
              ? "green"
              : s === "Rejected"
              ? "red"
              : "default"
          }
          className={styles.statusTag}
        >
          {s}
        </Tag>
      ),
    },
    {
      title: "Assignee",
      dataIndex: "assignee",
      width: 160,
      render: (a) => {
        if (!a) return <span className={styles.unassigned}>Unassigned</span>;
        return (
          <span
            className={
              a === CURRENT_MOD ? styles.meAssignee : styles.otherAssignee
            }
          >
            {a === CURRENT_MOD ? "You" : a}
          </span>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      align: "right",
      render: (_, row) => (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: buildActionsMenu(row).map((i) =>
              i.type ? { type: i.type } : i
            ),
          }}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  /** FILTER ROW / TABLE RENDER (giống bản trước, chỉ thêm assigneeFilter dropdown) */
  return (
    <div className={styles.page}>
      {/* header */}
      {/* ... giữ nguyên headerBlock từ bản trước ... */}

      {/* filter bar */}
      <div className={styles.filterRow}>
        <Space wrap size={12}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tìm theo tiêu đề hoặc mã khóa học"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={styles.searchInput}
          />

          <Select
            className={styles.statusSelect}
            value={status}
            onChange={setStatus}
            options={[
              "All",
              "Review",
              "Request Revision",
              "Approved",
              "Rejected",
            ].map((v) => ({ label: v, value: v }))}
          />

          <Select
            className={styles.statusSelect}
            value={assigneeFilter}
            onChange={setAssigneeFilter}
            options={[
              { label: "Assignee: All", value: "All" },
              { label: "Unassigned", value: "Unassigned" },
              { label: "Mine", value: "Mine" },
              { label: "Assigned (others)", value: "Assigned" },
            ]}
          />
        </Space>
      </div>

      {/* table */}
      <div className={styles.tableCard}>
        <Table
          rowKey="id"
          size="middle"
          columns={columns}
          dataSource={filtered}
          pagination={{ defaultPageSize: 8, position: ["bottomRight"] }}
        />
      </div>

      {/* inspector modal */}
      {selectedCourse && (
        <CourseReviewModal
          open
          course={selectedCourse}
          currentModerator={CURRENT_MOD}
          onClose={() => setSelectedCourse(null)}
          onRequestRevisionClick={(course) => {
            setRequestTargetCourse(course);
            setOpenRequestRevision(true);
          }}
          onApprove={() => {
            setApproveTargetCourse(selectedCourse);
            setOpenApprovePublish(true);
          }}
          onReject={() => {
            setRejectTargetCourse(selectedCourse);
            setOpenReject(true);
          }}
        />
      )}

      {/* Request Changes modal */}
      {openRequestRevision && (
        <RequestRevisionModal
          open={openRequestRevision}
          onCancel={() => {
            setOpenRequestRevision(false);
            setRequestTargetCourse(null);
          }}
          onSubmit={handleSubmitRequestRevision}
          courseTitle={requestTargetCourse?.title}
        />
      )}

      {/* Approve & Publish modal */}
      {openApprovePublish && (
        <ApprovePublishModal
          open={openApprovePublish}
          onCancel={() => {
            setOpenApprovePublish(false);
            setApproveTargetCourse(null);
          }}
          onConfirm={handleConfirmApprovePublish}
          courseSummary={{
            title: approveTargetCourse?.title,
            price: approveTargetCourse?.price,
            visibility: approveTargetCourse?.visibility ?? "Public",
          }}
        />
      )}

      {/* Reject modal */}
      {openReject && (
        <RejectModal
          open={openReject}
          onCancel={() => {
            setOpenReject(false);
            setRejectTargetCourse(null);
          }}
          onSubmit={handleSubmitReject}
          courseTitle={rejectTargetCourse?.title}
        />
      )}
    </div>
  );
}
