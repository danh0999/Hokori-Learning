import SectionTitle from "../components/SectionTitle";
import DataTable from "../components/DataTable";
import { useState } from "react";
import t from "../styles/table.module.scss";

export default function Complaints(){
  const [state, setState] = useState("ALL");
  const [q, setQ] = useState("");

  // TODO(API): admin/complaints?state=&q=
  const columns = [
    { header:"ID", accessor:"id" },
    { header:"Người gửi", accessor:"by" },
    { header:"Đối tượng", accessor:"target" },
    { header:"Tóm tắt", accessor:"summary" },
    { header:"Ngày gửi", accessor:"createdAt" },
    { header:"Trạng thái", render: r => <span className={t.badge}>{r?.state ?? "—"}</span> },
    { header:"Người xử lý", accessor:"assignee" },
    { header:"Thao tác", render: () => <button>Chi tiết</button> },
  ];

  return (
    <div>
      <SectionTitle>Khiếu nại & Báo cáo</SectionTitle>
      <DataTable
        columns={columns}
        data={[]}
        toolbar={
          <>
            <select value={state} onChange={e=>setState(e.target.value)}>
              <option value="ALL">Tất cả</option>
              <option value="OPEN">Mới</option>
              <option value="PROCESSING">Đang xử lý</option>
              <option value="CLOSED">Đã đóng</option>
            </select>
            <input placeholder="Từ khóa..." value={q} onChange={e=>setQ(e.target.value)} />
          </>
        }
      />
    </div>
  );
}
