import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchNotificationsThunk,
  fetchUnreadCountThunk,
  markNotificationReadThunk,
  markAllNotificationsReadThunk,
} from "../../redux/features/notificationSlice.js";
import { Badge, Dropdown, Spin, Button } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import "./NotificationBell.scss";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const NotificationBell = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items, unreadCount, loading } = useSelector(
    (state) => state.notifications
  );
  const storeUser = useSelector((state) => state.user);

  const currentUser = storeUser?.current || storeUser || null;
  const role =
    currentUser?.role?.roleName ||
    currentUser?.roleName ||
    currentUser?.roles?.[0] ||
    null;

  useEffect(() => {
    dispatch(fetchNotificationsThunk());
    dispatch(fetchUnreadCountThunk());

    // Polling badge mỗi 45s
    const interval = setInterval(() => {
      dispatch(fetchUnreadCountThunk());
    }, 45000);

    return () => clearInterval(interval);
  }, [dispatch]);

  const handleClickNotification = (noti) => {
    if (!noti.isRead) {
      dispatch(markNotificationReadThunk(noti.id));
    }

    // Điều hướng theo type + role
    if (noti.relatedCourseId) {
      if (role === "TEACHER") {
        navigate(`/teacher/courseinfo/${noti.relatedCourseId}`);
      } else {
        // learner/admin/moderator xem course detail public
        navigate(`/course/${noti.relatedCourseId}`);
      }
    }

    // Nếu có relatedPaymentId thì tuỳ route của bạn
    // if (noti.relatedPaymentId) {
    //   navigate(`/user/payment/${noti.relatedPaymentId}`);
    // }
  };

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      dispatch(markAllNotificationsReadThunk());
    }
  };

  const renderIconByType = (type) => {
    switch (type) {
      case "COURSE_APPROVED":
      case "PROFILE_APPROVED":
        return "✅";
      case "COURSE_REJECTED":
      case "PROFILE_REJECTED":
        return "❌";
      case "COURSE_SUBMITTED":
        return "📤";
      case "COURSE_FLAGGED":
        return "⚠️";
      case "PAYMENT_SUCCESS":
        return "💳";
      case "AI_PACKAGE_ACTIVATED":
        return "🤖";
      case "COURSE_COMPLETED":
        return "🎓";
      default:
        return "🔔";
    }
  };

  const overlay = (
    <div className="notification-dropdown">
      <div className="notification-dropdown__header">
        <span>Thông báo</span>
        <Button
          type="link"
          size="small"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
        >
          Đánh dấu tất cả đã đọc
        </Button>
      </div>

      {loading ? (
        <div className="notification-dropdown__loading">
          <Spin />
        </div>
      ) : items.length === 0 ? (
        <div className="notification-dropdown__empty">
          Không có thông báo nào
        </div>
      ) : (
        <div className="notification-dropdown__list">
          {items.map((noti) => (
            <div
              key={noti.id}
              className={`notification-dropdown__item ${
                !noti.isRead ? "notification-dropdown__item--unread" : ""
              }`}
              onClick={() => handleClickNotification(noti)}
            >
              <div className="notification-dropdown__icon">
                {renderIconByType(noti.type)}
              </div>
              <div className="notification-dropdown__content">
                <div className="notification-dropdown__title">{noti.title}</div>
                <div className="notification-dropdown__message">
                  {noti.message}
                </div>
                <div className="notification-dropdown__time">
                  {dayjs(noti.createdAt).fromNow()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Dropdown overlay={overlay} trigger={["click"]} placement="bottomRight">
      <div className="notification-bell">
        <Badge count={unreadCount} size="small">
          <BellOutlined className="notification-bell__icon" />
        </Badge>
      </div>
    </Dropdown>
  );
};

export default NotificationBell;
