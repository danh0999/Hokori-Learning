// RejectModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Input,
  Tabs,
  Space,
  Button,
  Divider,
  Collapse,
  Checkbox,
  Tag,
} from "antd";
import {
  DownOutlined,
  RightOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import styles from "./RejectModal.module.scss";

/**
 * Props:
 *  - open
 *  - onCancel()
 *  - onSubmit(payload)   // ✅ payload structured theo guide BE
 *  - courseTitle
 *  - courseTree (optional) // để render tree
 *  - confirmLoading (optional)
 */

function toId(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function buildTree(courseTree) {
  // courseTree expected: {chapters:[{id,title,lessons:[{id,title,sections:[{id,title,studyType, ...}]}]}]}
  const chapters = Array.isArray(courseTree?.chapters)
    ? courseTree.chapters
    : [];

  return chapters.map((ch, chIdx) => {
    const chapterId = toId(ch?.id ?? ch?.chapterId);
    const chapterTitle = ch?.title ?? ch?.name ?? `Chapter ${chIdx + 1}`;

    const lessons = Array.isArray(ch?.lessons) ? ch.lessons : [];
    const mappedLessons = lessons.map((ls, lsIdx) => {
      const lessonId = toId(ls?.id ?? ls?.lessonId);
      const lessonTitle = ls?.title ?? ls?.name ?? `Lesson ${lsIdx + 1}`;

      const sections = Array.isArray(ls?.sections) ? ls.sections : [];
      const mappedSections = sections.map((sec, sIdx) => {
        const sectionId = toId(sec?.id ?? sec?.sectionId);
        const sectionTitle =
          sec?.title ?? sec?.name ?? sec?.studyType ?? `Section ${sIdx + 1}`;

        return {
          id: sectionId,
          title: sectionTitle,
          studyType: sec?.studyType,
        };
      });

      return {
        id: lessonId,
        title: lessonTitle,
        sections: mappedSections,
      };
    });

    return {
      id: chapterId,
      title: chapterTitle,
      lessons: mappedLessons,
    };
  });
}

export default function RejectModal({
  open,
  onCancel,
  onSubmit,
  courseTitle,
  courseTree,
  confirmLoading,
  simple = false,
}) {
  // ===== top-level reasons =====
  const [general, setGeneral] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [price, setPrice] = useState("");

  // ===== tree selection state (checked + reason) =====
  // maps: id -> { checked: boolean, reason: string }
  const [chapterMap, setChapterMap] = useState({});
  const [lessonMap, setLessonMap] = useState({});
  const [sectionMap, setSectionMap] = useState({});

  // collapse state
  const [openChapterKeys, setOpenChapterKeys] = useState([]);
  const [activeTab, setActiveTab] = useState("general");

  const tree = useMemo(() => buildTree(courseTree), [courseTree]);

  const hasTree = tree.length > 0;

  useEffect(() => {
    if (!open) return;
    // When open: set tab by mode
    setActiveTab(simple ? "general" : "tree");
  }, [open]);

  const clearAll = () => {
    setGeneral("");
    setTitle("");
    setSubtitle("");
    setDescription("");
    setCoverImage("");
    setPrice("");
    setChapterMap({});
    setLessonMap({});
    setSectionMap({});
    setOpenChapterKeys([]);
  };

  const setChecked = (type, id, checked) => {
    if (!id) return;
    const setter =
      type === "chapter"
        ? setChapterMap
        : type === "lesson"
        ? setLessonMap
        : setSectionMap;

    setter((prev) => {
      const cur = prev[id] || { checked: false, reason: "" };
      return { ...prev, [id]: { ...cur, checked } };
    });
  };

  const setReason = (type, id, reason) => {
    if (!id) return;
    const setter =
      type === "chapter"
        ? setChapterMap
        : type === "lesson"
        ? setLessonMap
        : setSectionMap;

    setter((prev) => {
      const cur = prev[id] || { checked: true, reason: "" };
      return { ...prev, [id]: { ...cur, reason } };
    });
  };

  const normalizeMapToItems = (mapObj) => {
    return Object.entries(mapObj)
      .map(([idStr, v]) => ({
        id: toId(idStr),
        checked: Boolean(v?.checked),
        reason: (v?.reason || "").trim(),
      }))
      .filter((x) => x.id && x.checked && x.reason)
      .map((x) => ({ id: x.id, reason: x.reason }));
  };

  const hasAnyReason = () => {
    const top =
      general.trim() ||
      title.trim() ||
      subtitle.trim() ||
      description.trim() ||
      coverImage.trim() ||
      price.trim();

    const ch = normalizeMapToItems(chapterMap).length > 0;
    const ls = normalizeMapToItems(lessonMap).length > 0;
    const sec = normalizeMapToItems(sectionMap).length > 0;

    return Boolean(top || ch || ls || sec);
  };

  const buildPayload = () => {
    const payload = {};

    if (general.trim()) payload.general = general.trim();
    if (title.trim()) payload.title = title.trim();
    if (subtitle.trim()) payload.subtitle = subtitle.trim();
    if (description.trim()) payload.description = description.trim();
    if (coverImage.trim()) payload.coverImage = coverImage.trim();
    if (price.trim()) payload.price = price.trim();

    const chapters = normalizeMapToItems(chapterMap);
    const lessons = normalizeMapToItems(lessonMap);
    const sections = normalizeMapToItems(sectionMap);

    if (chapters.length) payload.chapters = chapters;
    if (lessons.length) payload.lessons = lessons;
    if (sections.length) payload.sections = sections;

    return payload;
  };

  const handleOk = async () => {
    if (!hasAnyReason()) return; // BE sẽ 400, FE chặn trước
    const payload = buildPayload();
    await onSubmit?.(payload);
    clearAll();
  };

  // helpers: bulk tick
  const toggleAllInChapter = (chapter) => {
    const chId = chapter?.id;
    if (!chId) return;

    const chChecked = Boolean(chapterMap?.[chId]?.checked);
    const next = !chChecked;

    setChecked("chapter", chId, next);

    for (const ls of chapter.lessons || []) {
      if (ls?.id) setChecked("lesson", ls.id, next);
      for (const sec of ls.sections || []) {
        if (sec?.id) setChecked("section", sec.id, next);
      }
    }
  };

  const renderReasonBox = (type, id, valueObj) => {
    if (!id) return null;
    if (!valueObj?.checked) return null;

    return (
      <div className={styles.reasonBox}>
        <Input.TextArea
          rows={2}
          placeholder="Nhập lý do từ chối cho mục này..."
          value={valueObj?.reason || ""}
          onChange={(e) => setReason(type, id, e.target.value)}
        />
        <div className={styles.reasonHint}>
          <ExclamationCircleOutlined /> Bắt buộc nhập lý do nếu đã tick.
        </div>
      </div>
    );
  };

  const TreeTab = (
    <div className={styles.treeWrap}>
      {!hasTree ? (
        <div className={styles.noTree}>
          <div className={styles.noTreeTitle}>
            Không có dữ liệu curriculum để hiển thị dạng tree.
          </div>
          <div className={styles.noTreeSub}>
            Bạn vẫn có thể nhập lý do theo phần “Thông tin khóa học” (Chung/Tiêu
            đề/...) hoặc quay lại và đảm bảo API detail trả Chương/Bài học/Phần.
          </div>
        </div>
      ) : (
        <>
          <div className={styles.treeHelp}>
            Tick vào Chương/Bài học/Phần cần yêu cầu giáo viên sửa, rồi nhập lý
            do ngay bên dưới.
          </div>

          <Collapse
            className={styles.chapterCollapse}
            activeKey={openChapterKeys}
            onChange={(keys) =>
              setOpenChapterKeys(Array.isArray(keys) ? keys : [keys])
            }
            expandIcon={({ isActive }) =>
              isActive ? <DownOutlined /> : <RightOutlined />
            }
          >
            {tree.map((ch) => (
              <Collapse.Panel
                key={String(ch.id)}
                header={
                  <div className={styles.chapterHeader}>
                    <div className={styles.chapterHeaderLeft}>
                      <Checkbox
                        checked={Boolean(chapterMap?.[ch.id]?.checked)}
                        onChange={(e) =>
                          setChecked("chapter", ch.id, e.target.checked)
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className={styles.chapterTitle}>
                        <span className={styles.nodeName}>{ch.title}</span>
                        <Tag className={styles.idTag}>ID: {ch.id}</Tag>
                      </div>
                    </div>

                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAllInChapter(ch);
                      }}
                      className={styles.bulkBtn}
                    >
                      Tick toàn chapter
                    </Button>
                  </div>
                }
              >
                {renderReasonBox("chapter", ch.id, chapterMap?.[ch.id])}

                <div className={styles.lessonList}>
                  {(ch.lessons || []).map((ls) => (
                    <div key={String(ls.id)} className={styles.lessonCard}>
                      <div className={styles.lessonHeader}>
                        <Checkbox
                          checked={Boolean(lessonMap?.[ls.id]?.checked)}
                          onChange={(e) =>
                            setChecked("lesson", ls.id, e.target.checked)
                          }
                        />
                        <div className={styles.nodeLine}>
                          <span className={styles.nodeName}>{ls.title}</span>
                          <Tag className={styles.idTag}>ID: {ls.id}</Tag>
                        </div>
                      </div>

                      {renderReasonBox("lesson", ls.id, lessonMap?.[ls.id])}

                      <div className={styles.sectionList}>
                        {(ls.sections || []).map((sec) => (
                          <div
                            key={String(sec.id)}
                            className={styles.sectionRow}
                          >
                            <div className={styles.sectionHeader}>
                              <Checkbox
                                checked={Boolean(sectionMap?.[sec.id]?.checked)}
                                onChange={(e) =>
                                  setChecked(
                                    "section",
                                    sec.id,
                                    e.target.checked
                                  )
                                }
                              />
                              <div className={styles.nodeLine}>
                                <span className={styles.nodeName}>
                                  {sec.title}
                                </span>
                                {sec.studyType && (
                                  <Tag className={styles.typeTag}>
                                    {sec.studyType}
                                  </Tag>
                                )}
                                <Tag className={styles.idTag}>ID: {sec.id}</Tag>
                              </div>
                            </div>

                            {renderReasonBox(
                              "section",
                              sec.id,
                              sectionMap?.[sec.id]
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Collapse.Panel>
            ))}
          </Collapse>
        </>
      )}
    </div>
  );

  const GeneralTab = (
    <div className={styles.generalWrap}>
      <div className={styles.sectionTitle}>
        {simple ? "Lý do từ chối" : "Chung & thông tin khóa học"}
      </div>

      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <Input.TextArea
          rows={3}
          placeholder={
            simple
              ? "Nhập lý do từ chối (bắt buộc)"
              : "Lý do chung cho toàn bộ khóa học (optional)"
          }
          value={general}
          onChange={(e) => setGeneral(e.target.value)}
        />

        <Divider className={styles.hr} />

        <Input
          placeholder="Tiêu đề: Lý do cho tiêu đề (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          placeholder="Phụ đề: Lý do cho mô tả phụ (optional)"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
        />
        <Input.TextArea
          rows={3}
          placeholder="Mô tả: Lý do cho mô tả chi tiết (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Input
          placeholder="Ảnh bìa: Lý do cho ảnh bìa (optional)"
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
        />
        <Input
          placeholder="Giá: Lý do cho giá (optional)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </Space>
    </div>
  );

  return (
    <Modal
      open={open}
      onCancel={() => onCancel?.()}
      onOk={handleOk}
      okText="Từ chối"
      cancelText="Hủy"
      okButtonProps={{
        disabled: !hasAnyReason(),
        danger: true,
        loading: Boolean(confirmLoading),
      }}
      width={980}
      destroyOnClose
      title={<div className={styles.modalTitle}>Từ chối “{courseTitle}”</div>}
    >
      <div className={styles.modalIntro}>
        {simple
          ? "Nhập lý do từ chối để gửi cho giáo viên."
          : "Chọn các phần cần sửa và nhập lý do cụ thể. Giáo viên sẽ thấy lý do theo từng phần khi gọi API detail."}
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={
          simple
            ? [{ key: "general", label: "Lý do từ chối", children: GeneralTab }]
            : [
                { key: "tree", label: "Khung khóa học", children: TreeTab },
                {
                  key: "general",
                  label: "Thông tin khóa học",
                  children: GeneralTab,
                },
              ]
        }
      />

      <div className={styles.footerNote}>
        Lưu ý: Bạn cần nhập <b>ít nhất 1 lý do</b>. Không được bỏ trống hết.
      </div>

      <div className={styles.footerActions}>
        <Button onClick={clearAll}>Xóa toàn bộ</Button>
      </div>
    </Modal>
  );
}
