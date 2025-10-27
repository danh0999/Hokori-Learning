import React, { useEffect, useState } from "react";
import styles from "./ProfilePage.module.scss";
import ProfileHeader from "./components/ProfileHeader";
import PersonalInfoForm from "./components/PersonalInfoForm";
import ChangePasswordModal from "./components/ChangePasswordModal";
import { getCurrentProfile, updateProfile, changePassword } from "../../redux/features/profileApi";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Gọi API lấy thông tin hồ sơ
  const fetchProfile = async () => {
    try {
      const res = await getCurrentProfile();
      setUser(res);
    } catch (err) {
      console.error("❌ Lỗi khi tải hồ sơ:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Cập nhật hồ sơ
  const handleSave = async (values) => {
    try {
      await updateProfile(values);
      alert("✅ Cập nhật thành công!");
      fetchProfile();
    } catch (err) {
      alert("❌ Lỗi khi cập nhật hồ sơ!");
    }
  };

  // Đổi mật khẩu
  const handleChangePassword = async (values) => {
    try {
      await changePassword(values);
      alert("🔒 Đổi mật khẩu thành công!");
      setOpenModal(false);
    } catch {
      alert("❌ Đổi mật khẩu thất bại!");
    }
  };

  if (loading) return <p className={styles.loading}>Đang tải dữ liệu...</p>;

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {user ? (
          <>
            <ProfileHeader user={user} onOpenModal={() => setOpenModal(true)} />
            <PersonalInfoForm user={user} onSave={handleSave} />
            <ChangePasswordModal
              open={openModal}
              onClose={() => setOpenModal(false)}
              onSubmit={handleChangePassword}
            />
          </>
        ) : (
          <p className={styles.empty}>
            Không tìm thấy hồ sơ hoặc bạn chưa đăng nhập.
          </p>
        )}
      </div>
    </main>
  );
};

export default ProfilePage;
