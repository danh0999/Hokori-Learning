import SectionTitle from "../components/SectionTitle";
import DataTable from "../components/DataTable";
import s from "./Moderation.module.scss";

export default function Moderation() {
  // TODO(API): /api/admin/courses?status=REVIEW hoặc /api/admin/approvals
  const columns = [
    { header: "Tên khóa học", accessor: "title" },
    { header: "Giáo viên", accessor: "teacher" },
    { header: "Ngày gửi duyệt", accessor: "submittedAt" },
    { header: "Trạng thái", accessor: "status" },
    {
      header: "Thao tác",
      render: () => (
        <div className={s.actions}>
          <button className={s.btnApprove}>Duyệt</button>
          <button className={s.btnReject}>Từ chối</button>
        </div>
      ),
    },
  ];

  return (
    <div className={s.page}>
      <SectionTitle>Kiểm duyệt khóa học</SectionTitle>
      <DataTable columns={columns} data={[]} />
    </div>
  );
}
