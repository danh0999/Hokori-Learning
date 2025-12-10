// src/pages/Moderator/ManageQueues.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Table, Tag, Input, Space, Button, message, Spin, Empty } from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import api from "../../../configs/axios.js"; // <--- CHỈNH lại path nếu khác

import ApprovePublishModal from "../Queues/components/ApprovePublishModal";
import RejectModal from "../Queues/components/RejectModal";

import styles from "./styles.module.scss";
import { toast } from "react-toastify";

export default function ManageQueues() {
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [data, setData] = useState([]);

  const [loading, setLoading] = useState(false);
  const [approveLoadingId, setApproveLoadingId] = useState(null);

  // modal: approve & publish
  const [openApprovePublish, setOpenApprovePublish] = useState(false);
  const [approveTargetCourse, setApproveTargetCourse] = useState(null);

  // modal: reject
  const [openReject, setOpenReject] = useState(false);
  const [rejectTargetCourse, setRejectTargetCourse] = useState(null);

  /** FETCH PENDING QUEUE */
  const fetchPendingCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/moderator/courses/pending");
      // BE trả { status, message, data: [ {id, title, status, userId, ...} ] }
      const list = res.data?.data || [];
      setData(list);
    } catch (err) {
      console.error(err);
      message.error(
        err.response?.data?.message ||
          "Không tải được danh sách khoá học đang chờ duyệt."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingCourses();
  }, [fetchPendingCourses]);

  /** CALL API APPROVE */
  const approveCourse = async (courseId) => {
    setApproveLoadingId(courseId);
    try {
      await api.put(`/moderator/courses/${courseId}/approve`);
      // xoá course khỏi queue (đã publish rồi)
      setData((prev) => prev.filter((c) => c.id !== courseId));
      toast.success("Khoá học đã được phê duyệt và publish.");
      return true;
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Duyệt khoá học thất bại, thử lại sau."
      );
      return false;
    } finally {
      setApproveLoadingId(null);
    }
  };

  /** CALL API REJECT */
  const rejectCourseApi = async (courseId, reason) => {
    try {
      await api.put(`/moderator/courses/${courseId}/reject`, null, {
        params: { reason },
      });
      setData((prev) => prev.filter((c) => c.id !== courseId));
      toast.success("Khoá học đã bị từ chối.");
      return true;
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Từ chối khoá học thất bại, thử lại sau."
      );
      return false;
    }
  };

  /** APPROVE & PUBLISH confirm trong modal */
  const handleConfirmApprovePublish = async () => {
    if (!approveTargetCourse) return;
    const ok = await approveCourse(approveTargetCourse.id);
    if (ok) {
      setOpenApprovePublish(false);
      setApproveTargetCourse(null);
    }
  };

  /** REJECT confirm trong modal */
  const handleSubmitReject = async (reasonText) => {
    if (!rejectTargetCourse) return;
    const ok = await rejectCourseApi(rejectTargetCourse.id, reasonText);
    if (ok) {
      setOpenReject(false);
      setRejectTargetCourse(null);
    }
  };

  /** FILTER theo search query */
  const filtered = useMemo(() => {
    if (!q) return data;
    return data.filter((c) => {
      const query = q.toLowerCase();
      return (
        c.title?.toLowerCase().includes(query) || String(c.id).includes(query)
      );
    });
  }, [q, data]);

  /** COLUMNS */
  const columns = [
    {
      title: "Khoá học",
      dataIndex: "title",
      key: "title",
      render: (v, r) => (
        <div>
          <div className={styles.courseTitle}>{v}</div>
          <div className={styles.courseCode}>ID: {r.id}</div>
        </div>
      ),
    },
    {
      title: "Giáo viên",
      dataIndex: "teacherName",
      width: 180,
      render: (_, r) => r.teacherName || `User #${r.userId}` || "—",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 150,
      render: (s) => {
        const readable =
          s === "PENDING_APPROVAL"
            ? "Pending approval"
            : s === "PUBLISHED"
            ? "Published"
            : s === "DRAFT"
            ? "Draft"
            : s || "Unknown";
        const color =
          s === "PENDING_APPROVAL"
            ? "gold"
            : s === "PUBLISHED"
            ? "green"
            : s === "DRAFT"
            ? "default"
            : "default";
        return (
          <Tag color={color} className={styles.statusTag}>
            {readable}
          </Tag>
        );
      },
    },
    {
      title: "Hành động",
      key: "actions",
      width: 260,
      render: (_, row) => (
        <Space>
          {/* chuyển sang trang review riêng */}
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() =>
              navigate(`/moderator/courses/${row.id}/review`, {
                state: { course: row },
              })
            }
          >
            Review
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => {
              setApproveTargetCourse(row);
              setOpenApprovePublish(true);
            }}
            loading={approveLoadingId === row.id}
          >
            Duyệt
          </Button>
          <Button
            size="small"
            danger
            icon={<CloseOutlined />}
            onClick={() => {
              setRejectTargetCourse(row);
              setOpenReject(true);
            }}
          >
            Từ chối
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.headerBlock}>
        <div>
          <h2 className={styles.pageTitle}>Hàng đợi duyệt khoá học</h2>
        </div>

        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchPendingCourses}
            loading={loading}
          >
            Reload
          </Button>
        </Space>
      </div>

      {/* Filter row */}
      <div className={styles.filterRow}>
        <Space wrap size={12}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tìm theo tiêu đề hoặc ID khoá học"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={styles.searchInput}
          />
        </Space>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <Spin />
          </div>
        ) : (
          <Table
            rowKey="id"
            size="middle"
            columns={columns}
            dataSource={filtered}
            locale={{
              emptyText: (
                <Empty description="Hiện không có khoá học nào đang chờ duyệt." />
              ),
            }}
            pagination={{ defaultPageSize: 8, position: ["bottomRight"] }}
          />
        )}
      </div>

      {/* Approve & Publish modal */}
      {openApprovePublish && (
        <ApprovePublishModal
          open={openApprovePublish}
          onCancel={() => {
            setOpenApprovePublish(false);
            setApproveTargetCourse(null);
          }}
          onConfirm={handleConfirmApprovePublish}
          confirmLoading={approveLoadingId === approveTargetCourse?.id}
          courseSummary={approveTargetCourse}
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
