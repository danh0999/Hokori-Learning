export default function Unauthorized() {
  return (
    <div style={{ padding: 40 }}>
      <h1>403 – Không có quyền truy cập</h1>
      <p>Bạn không có quyền vào trang này.</p>
      <a href="/login">Đăng nhập bằng tài khoản khác</a>
    </div>
  );
}
