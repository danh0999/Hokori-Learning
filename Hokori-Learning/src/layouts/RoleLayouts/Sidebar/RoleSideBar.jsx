// src/layouts/rolesidebar.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Layout, Menu } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { sidebarMenusByRole } from "../menu.jsx";
import styles from "./styles.module.scss";

const { Sider } = Layout;

const norm = (p) =>
  p && p.endsWith("/") && p !== "/" ? p.slice(0, -1) : p || "/";

// ---- helpers ----
function convertToAntdItems(nodes) {
  return (
    nodes?.map(({ key, label, icon, children }) => ({
      key,
      label,
      icon,
      children: children?.length ? convertToAntdItems(children) : undefined,
    })) || []
  );
}

function buildIndex(nodes) {
  const keyToPath = new Map();
  const keyToParent = new Map();
  const flat = [];

  const dfs = (arr, parent = null) => {
    arr?.forEach((n) => {
      if (n.path) keyToPath.set(n.key, n.path);
      if (parent) keyToParent.set(n.key, parent);
      flat.push(n);
      if (n.children?.length) dfs(n.children, n.key);
    });
  };
  dfs(nodes);
  return { keyToPath, keyToParent, flat };
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
  const antdItems = useMemo(() => convertToAntdItems(tree), [tree]);
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

  const onClick = ({ key }) => {
    const path = keyToPath.get(key);
    if (path) navigate(path);
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      className={styles.sider}
      width={width}
    >
      <Menu
        mode="inline"
        items={antdItems} //  giữ children
        selectedKeys={selectedKey ? [selectedKey] : []}
        openKeys={openKeys} //  tự mở đúng parent
        onOpenChange={setOpenKeys}
        onClick={onClick} //  điều hướng cả item con
      />
    </Sider>
  );
}
