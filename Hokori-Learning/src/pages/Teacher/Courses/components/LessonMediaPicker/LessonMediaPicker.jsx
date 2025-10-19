import React, { useMemo, useState } from "react";
import {
  Modal,
  Tabs,
  List,
  Button,
  Upload,
  Tag,
  Space,
  Typography,
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import styles from "./styles.module.scss";

const { Dragger } = Upload;
const { Text } = Typography;

/**
 * Props:
 * - open, onClose
 * - library: { videos: [{id,name,duration?}], files: [{id,name,size?}] }
 * - onSelect: (items) => void   // items: [{id,type:'video'|'file', name, url?}]
 * - onUpload: (fileList, type) => Promise<uploadedItems> // optional
 */
export default function LessonMediaPicker({
  open,
  onClose,
  library = { videos: [], files: [] },
  onSelect,
  onUpload,
}) {
  const [tab, setTab] = useState("library");
  const [uploadType, setUploadType] = useState("video");
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState([]);

  const libItems = useMemo(
    () => [
      ...library.videos.map((v) => ({ ...v, _type: "video" })),
      ...library.files.map((f) => ({ ...f, _type: "file" })),
    ],
    [library]
  );

  const togglePick = (item) => {
    setSelected((prev) => {
      const hit = prev.find((p) => p.id === item.id && p._type === item._type);
      if (hit)
        return prev.filter(
          (p) => !(p.id === item.id && p._type === item._type)
        );
      return [...prev, item];
    });
  };

  const confirmPick = () => {
    const items = selected.map((it) => ({
      id: it.id,
      type: it._type,
      name: it.name,
      url: it.url,
    }));
    onSelect?.(items);
    setSelected([]);
    onClose?.();
  };

  const doUpload = async ({ fileList }) => {
    if (!onUpload) return;
    setUploading(true);
    try {
      const uploaded = await onUpload(
        fileList.map((f) => f.originFileObj),
        uploadType
      );
      // Normalize: [{id,type,name,url}]
      onSelect?.(
        uploaded.map((u) => ({
          id: u.id,
          type: uploadType,
          name: u.name,
          url: u.url,
        }))
      );
      onClose?.();
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Attach media to lesson"
      width={720}
      okText={tab === "library" ? "Attach selected" : "Done"}
      onOk={tab === "library" ? confirmPick : onClose}
      confirmLoading={uploading}
      destroyOnClose
      className={styles.modalRoot}
    >
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: "library",
            label: "Library",
            children: (
              <List
                itemLayout="horizontal"
                dataSource={libItems}
                locale={{ emptyText: "No media in library" }}
                renderItem={(it) => {
                  const picked = !!selected.find(
                    (s) => s.id === it.id && s._type === it._type
                  );
                  return (
                    <List.Item
                      className={`${styles.item} ${
                        picked ? styles.picked : ""
                      }`}
                      onClick={() => togglePick(it)}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            <b>{it.name}</b>
                            <Tag
                              color={
                                it._type === "video" ? "processing" : "default"
                              }
                            >
                              {it._type}
                            </Tag>
                          </Space>
                        }
                        description={
                          <Text type="secondary">
                            {it.duration
                              ? `Duration: ${it.duration}`
                              : it.size
                              ? `Size: ${it.size}`
                              : null}
                          </Text>
                        }
                      />
                      <Button type={picked ? "primary" : "default"}>
                        {picked ? "Selected" : "Select"}
                      </Button>
                    </List.Item>
                  );
                }}
              />
            ),
          },
          {
            key: "upload",
            label: "Upload",
            children: (
              <div className={styles.uploadPane}>
                <Space wrap>
                  <Button
                    type={uploadType === "video" ? "primary" : "default"}
                    onClick={() => setUploadType("video")}
                  >
                    Video
                  </Button>
                  <Button
                    type={uploadType === "file" ? "primary" : "default"}
                    onClick={() => setUploadType("file")}
                  >
                    File
                  </Button>
                </Space>
                <Dragger
                  multiple
                  beforeUpload={() => false}
                  customRequest={({ file, onSuccess }) =>
                    setTimeout(() => onSuccess?.("ok"), 0)
                  } // bypass antd warning
                  onChange={doUpload}
                  className={styles.dragger}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">
                    Click or drag {uploadType} to upload
                  </p>
                  <p className="ant-upload-hint">
                    Supported: mp4/webm… for video; pdf/pptx/docx… for files
                  </p>
                </Dragger>
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
}
