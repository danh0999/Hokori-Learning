import React, { useState } from "react";
import { Button, Card, Input, List, Modal, Form, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import styles from "./styles.module.scss";

export default function QuizList({ value = [], onChange }) {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const add = async () => {
    const v = await form.validateFields();
    onChange?.([
      ...(value || []),
      { id: Date.now(), title: v.title, questions: 0 },
    ]);
    setOpen(false);
    form.resetFields();
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h3 className={styles.title}>Quizzes</h3>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpen(true)}
        >
          New quiz
        </Button>
      </div>

      <Card>
        <List
          dataSource={value}
          locale={{ emptyText: "No quizzes yet" }}
          renderItem={(qz) => (
            <List.Item className={styles.item}>
              <Space>
                <b>{qz.title}</b>
                <span className={styles.muted}>· {qz.questions} questions</span>
              </Space>
            </List.Item>
          )}
        />
      </Card>

      <Modal
        open={open}
        title="New Quiz"
        onCancel={() => setOpen(false)}
        onOk={add}
        okText="Add"
        destroyOnClose
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Enter quiz title" }]}
          >
            <Input placeholder="e.g., N5 Grammar Check 01" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
