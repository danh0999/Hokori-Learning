import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Spin,
  List,
  Button,
  Drawer,
  Tree,
  Typography,
  Input,
  Select,
  Space,
  Tag,
  Empty,
} from "antd";
import api from "../../../configs/axios.js"; // sửa path nếu khác
import { buildFileUrl } from "../../../utils/fileUrl.js"; // sửa path nếu khác

const { Title, Text } = Typography;
const { Search } = Input;

const PAGE_SIZE = 9;

const ModeratorDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(0); // 0-based cho BE
  const [totalElements, setTotalElements] = useState(0);

  const [treeLoading, setTreeLoading] = useState(false);
  const [selectedCourseTitle, setSelectedCourseTitle] = useState(null);
  const [courseTree, setCourseTree] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);

  // filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState(undefined);

  // preview node (chapter / lesson / section)
  const [selectedNode, setSelectedNode] = useState(null);

  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));

  /* ---------------- Fetch PUBLIC courses (pagination) ---------------- */
  const fetchCourses = async (pageIndex = 0) => {
    try {
      setLoading(true);
      const res = await api.get("/courses", {
        params: { page: pageIndex, size: PAGE_SIZE },
      });

      const data = res.data || {};
      const list = Array.isArray(data.content) ? data.content : [];

      setCourses(list);
      setTotalElements(data.totalElements || list.length);
      setPage(pageIndex);
    } catch (e) {
      console.error("Failed to fetch courses", e);
      setCourses([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Fetch full tree of one course ---------------- */
  const fetchCourseTree = async (courseId, title) => {
    try {
      setTreeLoading(true);
      setSelectedCourseTitle(title);
      setSelectedNode(null);
      const res = await api.get(`/courses/${courseId}/tree`);
      setCourseTree(res.data);
      setOpenDrawer(true);
    } catch (e) {
      console.error("Failed to fetch course tree", e);
    } finally {
      setTreeLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses(0);
  }, []);

  /* ---------------- Level options ---------------- */
  const levelOptions = useMemo(() => {
    const list = Array.isArray(courses) ? courses : [];
    const levels = Array.from(
      new Set(list.map((c) => c.level).filter(Boolean))
    );
    return levels.map((lv) => ({ label: lv, value: lv }));
  }, [courses]);

  /* ---------------- Filter current page ---------------- */
  const filteredCourses = useMemo(() => {
    const list = Array.isArray(courses) ? courses : [];

    return list.filter((c) => {
      const title = (c.title || "").toLowerCase();
      const lvl = c.level;

      if (searchTerm && !title.includes(searchTerm.trim().toLowerCase())) {
        return false;
      }
      if (selectedLevel && lvl !== selectedLevel) return false;
      return true;
    });
  }, [courses, searchTerm, selectedLevel]);

  /* ---------------- Tree: course → chapters → lessons → sections ---------------- */
  const buildTreeData = (course) => {
    if (!course) return [];

    const chapters = course.chapters || [];

    return [
      {
        title: course.title,
        key: `course-${course.id}`,
        nodeType: "course",
        nodeData: course,
        children: chapters.map((ch) => ({
          title: ` ${ch.title}`,
          key: `chapter-${ch.id}`,
          nodeType: "chapter",
          nodeData: ch,
          children: (ch.lessons || []).map((les) => ({
            title: ` ${les.title}`,
            key: `lesson-${les.id}`,
            nodeType: "lesson",
            nodeData: les,
            children: (les.sections || []).map((sec) => ({
              title: ` ${sec.title} `,
              key: `section-${sec.id}`,
              nodeType: "section",
              nodeData: sec,
            })),
          })),
        })),
      },
    ];
  };

  const handleTreeSelect = (keys, info) => {
    if (!info || !info.node) return;
    const { nodeType, nodeData } = info.node;
    setSelectedNode({ nodeType, data: nodeData });
  };

  /* ---------------- Preview panel ---------------- */
  const renderContentPreview = () => {
    if (!selectedNode) {
      return (
        <div style={{ padding: 12 }}>
          <Text type="secondary">
            Chọn một chapter / lesson / section bên trái để xem preview.
          </Text>
        </div>
      );
    }

    const { nodeType, data } = selectedNode;

    if (nodeType === "course") {
      return (
        <div style={{ padding: 12 }}>
          <Title level={5}>{data.title}</Title>
          <p>
            <b>Level:</b> {data.level}
          </p>
          <p>
            <b>Price:</b> {data.priceCents}
          </p>
          <p>
            <b>Status:</b> {data.status}
          </p>
          <p>
            <b>Teacher:</b> {data.teacherName}
          </p>
          <p>
            <b>Subtitle:</b> {data.subtitle}
          </p>
          {data.description && (
            <p>
              <b>Description:</b> {data.description}
            </p>
          )}
        </div>
      );
    }

    if (nodeType === "chapter") {
      return (
        <div style={{ padding: 12 }}>
          <Title level={5}>Chapter: {data.title}</Title>
          {data.summary && <p>{data.summary}</p>}
          <p>
            <b>Số bài:</b> {(data.lessons || []).length}
          </p>
        </div>
      );
    }

    if (nodeType === "lesson") {
      return (
        <div style={{ padding: 12 }}>
          <Title level={5}>Lesson: {data.title}</Title>
          <p>
            <b>Số section:</b> {(data.sections || []).length}
          </p>
        </div>
      );
    }

    // Section: gom toàn bộ contents của 1 section thành 1 preview
    if (nodeType === "section") {
      const contents = data.contents || [];

      const mainAsset =
        contents.find((c) => c.contentFormat === "ASSET" && c.primaryContent) ||
        contents.find((c) => c.contentFormat === "ASSET");

      const richTexts = contents.filter(
        (c) => c.contentFormat === "RICH_TEXT" && c.richText
      );

      let assetBlock = null;
      if (mainAsset && mainAsset.filePath) {
        const url = buildFileUrl(mainAsset.filePath);
        const ext = mainAsset.filePath.split(".").pop()?.toLowerCase() || "";

        if (["mp4", "webm", "ogg"].includes(ext)) {
          assetBlock = (
            <>
              <Text strong>Video:</Text>
              <video
                src={url}
                style={{ width: "100%", marginTop: 8, borderRadius: 8 }}
                controls
              />
            </>
          );
        } else if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
          assetBlock = (
            <>
              <Text strong>Hình ảnh:</Text>
              <img
                src={url}
                alt="section-asset"
                style={{
                  width: "100%",
                  marginTop: 8,
                  borderRadius: 8,
                  objectFit: "contain",
                  maxHeight: 350,
                }}
              />
            </>
          );
        } else {
          assetBlock = (
            <>
              <Text strong>File:</Text>
              <div style={{ marginTop: 8 }}>
                <a href={url} target="_blank" rel="noreferrer">
                  {url}
                </a>
              </div>
            </>
          );
        }
      }

      return (
        <div style={{ padding: 12 }}>
          <Title level={5}>{data.title}</Title>
          <p>{data.studyType}</p>

          {assetBlock && (
            <div style={{ marginTop: 12, marginBottom: 16 }}>{assetBlock}</div>
          )}

          {richTexts.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <Text strong>Nội dung:</Text>
              <div
                style={{
                  marginTop: 8,
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #f0f0f0",
                  background: "#fafafa",
                  whiteSpace: "pre-wrap",
                }}
              >
                {richTexts.map((c) => (
                  <div key={c.id} style={{ marginBottom: 12 }}>
                    {c.richText}
                  </div>
                ))}
              </div>
            </div>
          )}

          {contents.length === 0 && (
            <Text type="secondary">
              Section này hiện chưa có nội dung (contents trống).
            </Text>
          )}
        </div>
      );
    }

    return (
      <div style={{ padding: 12 }}>
        <Text type="secondary">Không có nội dung preview.</Text>
      </div>
    );
  };

  return (
    <div style={{ padding: 20 }}>
      <Space
        style={{ width: "100%", justifyContent: "space-between" }}
        align="center"
      >
        <Title level={3} style={{ marginBottom: 0 }}>
          Moderator – Những khóa học đang được công khai trên hệ thống
        </Title>
      </Space>

      {/* FILTER BAR */}
      <Space style={{ marginTop: 16, marginBottom: 16 }} wrap>
        <Search
          placeholder="Search by course title"
          allowClear
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={(value) => setSearchTerm(value)}
          style={{ width: 260 }}
        />

        <Select
          allowClear
          placeholder="Filter by level"
          style={{ width: 160 }}
          options={levelOptions}
          value={selectedLevel}
          onChange={setSelectedLevel}
        />

        <Button onClick={() => fetchCourses(page)}>Tải lại</Button>
      </Space>

      {/* COURSE LIST + CUSTOM PAGINATION */}
      {loading ? (
        <Spin size="large" />
      ) : filteredCourses.length === 0 ? (
        <Empty description="Không tìm thấy khóa học nào" />
      ) : (
        <>
          <List
            grid={{ gutter: 16, column: 3 }}
            dataSource={filteredCourses}
            pagination={false}
            renderItem={(course) => (
              <List.Item style={{ display: "flex" }}>
                <Card
                  hoverable
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                  bodyStyle={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    padding: 16,
                  }}
                  cover={
                    <div
                      style={{
                        height: 180, // chỉnh 160 / 200 tuỳ bạn
                        overflow: "hidden",
                        background: "#f5f5f5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {course.coverImagePath ? (
                        <img
                          src={buildFileUrl(course.coverImagePath)}
                          alt={course.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <span style={{ color: "#999", fontSize: 12 }}>
                          No cover image
                        </span>
                      )}
                    </div>
                  }
                >
                  {/* Nội dung card – flex:1 để các card cao bằng nhau */}
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>{course.title}</Text>
                    </div>

                    <p>
                      <b>Level:</b> {course.level || "—"}
                    </p>
                    <p>
                      <b>Price:</b> {course.priceCents} {course.currency}
                    </p>
                    <p>
                      <b>Status:</b> {course.status}
                    </p>
                    <p>
                      <b>Teacher:</b> {course.teacherName}
                    </p>
                  </div>

                  {/* nút nằm sát đáy card */}
                  <div style={{ marginTop: 12, textAlign: "right" }}>
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => fetchCourseTree(course.id, course.title)}
                    >
                      Xem chi tiết
                    </Button>
                  </div>
                </Card>
              </List.Item>
            )}
          />

          {totalPages > 1 && (
            <div
              style={{
                marginTop: 16,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Button
                size="small"
                disabled={page === 0}
                onClick={() => page > 0 && fetchCourses(page - 1)}
              >
                Prev
              </Button>

              <span>
                Page <b>{page + 1}</b> / {totalPages}
              </span>

              <Button
                size="small"
                disabled={page + 1 >= totalPages}
                onClick={() => page + 1 < totalPages && fetchCourses(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* DRAWER: TREE + PREVIEW */}
      <Drawer
        title={`Course detail: ${selectedCourseTitle || ""}`}
        open={openDrawer}
        width={900}
        onClose={() => setOpenDrawer(false)}
      >
        {treeLoading ? (
          <Spin size="large" />
        ) : !courseTree ? (
          <Empty description="Không có dữ liệu cây khóa học" />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 1.9fr",
              gap: 16,
            }}
          >
            <Card
              title="Cấu trúc khóa học"
              size="small"
              bodyStyle={{ padding: 8 }}
            >
              <div style={{ maxHeight: "70vh", overflow: "auto" }}>
                <Tree
                  treeData={buildTreeData(courseTree)}
                  defaultExpandAll
                  onSelect={handleTreeSelect}
                />
              </div>
            </Card>

            <Card title="Xem trước" size="small">
              {renderContentPreview()}
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default ModeratorDashboard;
