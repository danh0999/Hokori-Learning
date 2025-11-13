import SectionTitle from "../components/SectionTitle";
import DataTable from "../components/DataTable";

export default function Policies(){
  // TODO(API): /admin/policies
  const columns = [
    { header:"Tiêu đề", accessor:"title" },
    { header:"Phiên bản", accessor:"version" },
    { header:"Hiệu lực từ", accessor:"effectiveFrom" },
    { header:"Hiệu lực đến", accessor:"effectiveTo" },
    { header:"Trạng thái", accessor:"status" },
    { header:"Thao tác", render: () => <><button>Xem</button> <button>Sửa</button></> },
  ];

  return (
    <div>
      <SectionTitle right={<button>Tạo chính sách mới</button>}>Chính sách</SectionTitle>
      <DataTable columns={columns} data={[]} />
    </div>
  );
}
