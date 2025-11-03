// src/pages/Teacher/Courses/Create-Course/components/SidebarWizardNav.jsx
import React, { useMemo } from "react";
import { Menu, Badge } from "antd";
import {
  BulbOutlined,
  BookOutlined,
  RocketOutlined,
  FileTextOutlined,
  DollarOutlined,
  CloudUploadOutlined,
} from "@ant-design/icons";

/**
 * Props:
 * - step: number (0..3)
 * - onChangeStep: (nextStep: number) => void
 * - status: {
 *     basicsDone: boolean,
 *     curriculumDone: boolean,
 *     pricingDone: boolean,
 *     readyToPublish: boolean
 *   }
 */
export default function SidebarWizardNav({ step, onChangeStep, status }) {
  // map sub-item key -> index step
  const keyToStep = useMemo(
    () => ({
      "plan:course-info": 0,
      "create:curriculum": 1,
      "publish:pricing": 2,
      "publish:review-submit": 3,
    }),
    []
  );

  const selectedKey = useMemo(() => {
    switch (step) {
      case 0:
        return "plan:course-info";
      case 1:
        return "create:curriculum";
      case 2:
        return "publish:pricing";
      default:
        return "publish:review-submit";
    }
  }, [step]);

  const items = useMemo(
    () => [
      {
        key: "plan",
        icon: <BulbOutlined />,
        label: "Plan your course",
        children: [
          {
            key: "plan:course-info",
            icon: <FileTextOutlined />,
            label: (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <span>Course Info</span>
                {status?.basicsDone ? (
                  <Badge status="success" />
                ) : (
                  <Badge status="default" />
                )}
              </div>
            ),
          },
        ],
      },
      {
        key: "create",
        icon: <BookOutlined />,
        label: "Create your content",
        children: [
          {
            key: "create:curriculum",
            icon: <BookOutlined />,
            label: (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <span>Curriculum</span>
                {status?.curriculumDone ? (
                  <Badge status="success" />
                ) : (
                  <Badge status="default" />
                )}
              </div>
            ),
          },
        ],
      },
      {
        key: "publish",
        icon: <RocketOutlined />,
        label: "Publish your course",
        children: [
          {
            key: "publish:pricing",
            icon: <DollarOutlined />,
            label: (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <span>Pricing</span>
                {status?.pricingDone ? (
                  <Badge status="success" />
                ) : (
                  <Badge status="default" />
                )}
              </div>
            ),
          },
          {
            key: "publish:review-submit",
            icon: <CloudUploadOutlined />,
            label: (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <span>Review & Submit</span>
                {status?.readyToPublish ? (
                  <Badge status="success" />
                ) : (
                  <Badge status="processing" />
                )}
              </div>
            ),
          },
        ],
      },
    ],
    [status]
  );

  const defaultOpenKeys = useMemo(() => {
    if (selectedKey.startsWith("plan")) return ["plan"];
    if (selectedKey.startsWith("create")) return ["create"];
    return ["publish"];
  }, [selectedKey]);

  const handleClick = ({ key }) => {
    const next = keyToStep[key];
    if (typeof next === "number") onChangeStep(next);
  };

  return (
    <Menu
      mode="inline"
      items={items}
      selectedKeys={[selectedKey]}
      defaultOpenKeys={defaultOpenKeys}
      onClick={handleClick}
      style={{ borderInlineEnd: "none" }}
    />
  );
}
