// components/quiz/ImportQuizModal.jsx
import React, { useState } from "react";
import { Modal, List, Space, Typography, Tag } from "antd";
const { Text } = Typography;

export default function ImportQuizModal({
  open,
  onCancel,
  library = [],
  onPick,
}) {
  const [selected, setSelected] = useState(null);

  return (
    <Modal
      open={open}
      title="Import Quiz"
      okText="Import"
      onOk={() => selected && onPick?.(selected)}
      onCancel={onCancel}
      destroyOnClose
      width={720}
    >
      <List
        dataSource={library}
        locale={{ emptyText: "Chưa có quiz nào trong thư viện tạm" }}
        renderItem={(qz) => (
          <List.Item
            onClick={() => setSelected(qz)}
            style={{
              cursor: "pointer",
              background: selected?.id === qz.id ? "#e6f4ff" : undefined,
              borderRadius: 8,
            }}
          >
            <Space direction="vertical" size={2}>
              <Space>
                <Text strong>{qz.title}</Text>
                <Tag>{qz.questions?.length || 0} questions</Tag>
              </Space>
              <Text type="secondary">{qz.description || "—"}</Text>
            </Space>
          </List.Item>
        )}
      />
    </Modal>
  );
}
