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

  const fetchProfile = async () => {
    try {
      const res = await getCurrentProfile();
      setUser(res);
    } catch (err) {
      console.error("❌ Lỗi khi tải hồ sơ:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (values) => {
    try {
      await updateProfile(values);
      alert(" Cập nhật thành công!");
      fetchProfile();
    } catch (err) {
      alert(" Lỗi khi cập nhật!");
    }
  };

  const handleChangePassword = async (values) => {
    try {
      await changePassword(values);
      alert("🔒 Đổi mật khẩu thành công!");
      setOpenModal(false);
    } catch {
      alert("❌ Đổi mật khẩu thất bại!");
    }
  };

  if (loading) return <p>Đang tải dữ liệu...</p>;

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <ProfileHeader user={user} onOpenModal={() => setOpenModal(true)} />
        <PersonalInfoForm user={user} onSave={handleSave} />
        <ChangePasswordModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          onSubmit={handleChangePassword}
        />
      </div>
    </main>
  );
};

export default ProfilePage;
