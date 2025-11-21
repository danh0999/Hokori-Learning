// src/layouts/RoleSidebar.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Layout } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { sidebarMenusByRole } from "../menu.jsx";
import styles from "./styles.module.scss";

const { Sider } = Layout;

const norm = (p) =>
  p && p.endsWith("/") && p !== "/" ? p.slice(0, -1) : p || "/";

// ---- helpers ----
function buildIndex(nodes) {
  const keyToPath = new Map();
  const keyToParent = new Map();

  const dfs = (arr, parent = null) => {
    arr?.forEach((n) => {
      if (n.path) keyToPath.set(n.key, n.path);
      if (parent) keyToParent.set(n.key, parent);
      if (n.children?.length) dfs(n.children, n.key);
    });
  };
  dfs(nodes);
  return { keyToPath, keyToParent };
}

function bestMatchKeyByPath(nodes, pathname) {
  const cur = norm(pathname);
  let best = null;

  const walk = (arr) => {
    arr?.forEach((n) => {
      if (n.path && cur.startsWith(norm(n.path))) {
        if (!best || norm(n.path).length > norm(best.path).length) best = n;
      }
      if (n.children?.length) walk(n.children);
    });
  };

  walk(nodes);
  return best?.key || null;
}

function collectParents(key, keyToParent) {
  const res = [];
  let k = key;
  while (keyToParent.has(k)) {
    const p = keyToParent.get(k);
    res.unshift(p);
    k = p;
  }
  return res;
}

// ---- component ----
export default function RoleSidebar({
  role = "teacher",
  collapsed,
  onCollapse,
  width = 240,
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const tree = sidebarMenusByRole[role] || [];
  const { keyToPath, keyToParent } = useMemo(() => buildIndex(tree), [tree]);

  const selectedKey = useMemo(
    () => bestMatchKeyByPath(tree, pathname),
    [tree, pathname]
  );

  const [openKeys, setOpenKeys] = useState([]);

  useEffect(() => {
    if (!selectedKey) return;
    setOpenKeys(collectParents(selectedKey, keyToParent));
  }, [selectedKey, keyToParent]);

  const handleToggleCollapse = () => {
    if (onCollapse) onCollapse(!collapsed);
  };

  const handleItemClick = (key) => {
    const path = keyToPath.get(key);
    if (path) navigate(path);
  };

  const handleToggleSubmenu = (key, e) => {
    // tránh trigger click item
    e.stopPropagation();
    setOpenKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const renderNodes = (nodes, level = 0) =>
    nodes?.map((node) => {
      const isSelected = node.key === selectedKey;
      const isOpen = openKeys.includes(node.key);
      const hasChildren = node.children && node.children.length > 0;

      return (
        <li
          key={node.key}
          className={[
            styles.menuItem,
            isSelected ? styles.active : "",
            hasChildren ? styles.hasChildren : "",
            styles[`level${level}`] || "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div
            className={styles.menuItemContent}
            onClick={() => handleItemClick(node.key)}
          >
            <div className={styles.leftPart}>
              {node.icon && (
                <span className={styles.iconWrapper}>{node.icon}</span>
              )}
              {!collapsed && <span className={styles.label}>{node.label}</span>}
            </div>

            {hasChildren && (
              <button
                className={styles.arrowBtn}
                onClick={(e) => handleToggleSubmenu(node.key, e)}
              >
                <span
                  className={`${styles.arrow} ${
                    isOpen ? styles.arrowOpen : ""
                  }`}
                >
                  ▶
                </span>
              </button>
            )}
          </div>

          {hasChildren && isOpen && (
            <ul className={styles.submenu}>
              {renderNodes(node.children, level + 1)}
            </ul>
          )}
        </li>
      );
    });

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={width}
      trigger={null}
      className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}
    >
      <div className={styles.sidebarInner}>
        <div className={styles.header}>
          <button
            className={styles.collapseToggle}
            onClick={handleToggleCollapse}
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>

        <nav className={styles.menu}>
          <ul className={styles.menuList}>{renderNodes(tree)}</ul>
        </nav>
      </div>
    </Sider>
  );
}
