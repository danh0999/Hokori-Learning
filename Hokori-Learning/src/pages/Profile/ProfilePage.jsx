import React, { useEffect, useState } from "react";
import styles from "./ProfilePage.module.scss";

import { useDispatch, useSelector } from "react-redux";

import {
  fetchMe,
  updateMe,
  changePassword,
  resetPwState,
} from "../../redux/features/profileSlice";

import ProfileHeader from "./components/ProfileHeader";
import PersonalInfoForm from "./components/PersonalInfoForm";
import ChangePasswordModal from "./components/ChangePasswordModal";

const ProfilePage = () => {
  const dispatch = useDispatch();
  const {
    data: user,
    loading,
    error,
    saving,
    changingPw,
    pwError,
    pwSuccess,
  } = useSelector((s) => s.profile);

  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  useEffect(() => {
    if (pwSuccess) {
      alert("🔒 Đổi mật khẩu thành công!");
      setOpenModal(false);
      dispatch(resetPwState());
    }
    if (pwError) {
      alert(`❌ ${pwError}`);
      dispatch(resetPwState());
    }
  }, [pwSuccess, pwError, dispatch]);

  const handleSave = (values) => {
    dispatch(updateMe(values))
      .unwrap()
      .then(() => alert("✅ Cập nhật thành công!"))
      .catch((e) => alert(`❌ ${e}`));
  };

  const handleChangePassword = (values) => {
    dispatch(changePassword(values));
  };

  if (loading) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>Đang tải dữ liệu…</div>
      </main>
    );
  }

  if (error && !user) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>Lỗi: {error}</div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {user ? (
          <>
            <ProfileHeader user={user} onOpenModal={() => setOpenModal(true)} />
            <PersonalInfoForm user={user} saving={saving} onSave={handleSave} />
            <ChangePasswordModal
              open={openModal}
              onClose={() => setOpenModal(false)}
              onSubmit={handleChangePassword}
              loading={changingPw}
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
