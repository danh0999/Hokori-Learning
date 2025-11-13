import s from "../styles/table.module.scss";

export default function DataTable({ columns, data = [], toolbar }) {
  return (
    <div className={s.tableWrap}>
      {toolbar && <div className={s.toolbar}>{toolbar}</div>}
      <table className={s.table}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.header}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ color: "#9ca3af" }}>
                Chưa có dữ liệu
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={row.id ?? i}>
                {columns.map((c) => (
                  <td key={c.header}>
                    {c.render ? c.render(row) : row[c.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
