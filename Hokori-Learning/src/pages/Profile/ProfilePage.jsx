import React, { useEffect, useState } from "react";
import styles from "./ProfilePage.module.scss";
import { useDispatch, useSelector } from "react-redux";

import { fetchMe } from "../../redux/features/profileSlice";

import ProfileHeader from "./components/ProfileHeader";
import PersonalInfoForm from "./components/PersonalInfoForm";
import ChangePasswordModal from "./components/ChangePasswordModal";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { data: user, loading } = useSelector((state) => state.profile);
  const [openPwModal, setOpenPwModal] = useState(false);

  //  Lấy thông tin user khi mở trang
  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  if (loading && !user) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>Đang tải dữ liệu hồ sơ...</div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {user ? (
          <>
            {/* Header hiển thị avatar, role, email */}
            <ProfileHeader
              user={user}
              onOpenChangePassword={() => setOpenPwModal(true)}
            />

            {/* Truyền user xuống để PersonalInfoForm hiển thị đúng */}
            <PersonalInfoForm user={user} />

            {/* Modal đổi mật khẩu */}
            <ChangePasswordModal
              open={openPwModal}
              onClose={() => setOpenPwModal(false)}
            />
          </>
        ) : (
          <div className={styles.empty}>
            Không tìm thấy hồ sơ hoặc bạn chưa đăng nhập.
          </div>
        )}
      </div>
    </main>
  );
};

export default ProfilePage;
