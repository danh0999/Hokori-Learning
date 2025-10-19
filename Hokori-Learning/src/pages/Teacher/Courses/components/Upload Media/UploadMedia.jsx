import React from "react";
import { Upload, Card, Row, Col, Typography } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import styles from "./styles.module.scss";

const { Dragger } = Upload;
const { Paragraph } = Typography;

export default function UploadMedia({
  value = { videos: [], files: [] },
  onChange,
}) {
  const props = {
    multiple: true,
    beforeUpload: () => false, // prevent auto-upload, let BE handle later
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Card title="Videos" className={styles.card}>
          <Dragger {...props}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Click or drag video files to this area
            </p>
            <Paragraph type="secondary">Supported: mp4, webm, mov…</Paragraph>
          </Dragger>
        </Card>
      </Col>
      <Col xs={24} md={12}>
        <Card title="Files" className={styles.card}>
          <Dragger {...props}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Click or drag resources (PDF, slides…)
            </p>
            <Paragraph type="secondary">
              Supported: pdf, pptx, docx, images…
            </Paragraph>
          </Dragger>
        </Card>
      </Col>
    </Row>
  );
}
