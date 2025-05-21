import {
  AppstoreOutlined,
  FileTextOutlined,
  LockOutlined,
  SettingOutlined,
  TableOutlined,
  UserOutlined,
  CloudUploadOutlined,
  AuditOutlined,
  CodeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Menu, Button } from "antd";
import Sider from "antd/es/layout/Sider";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import styles from "./AdminToolsSidebar.module.css";

const menuItems = [
  {
    key: "/admin-tools/domains",
    icon: <AppstoreOutlined />,
    label: "Domains",
  },
  {
    key: "variables",
    icon: <CodeOutlined />,
    label: "Variables",
    children: [
      {
        key: "/admin-tools/variables/common",
        icon: <TableOutlined />,
        label: "Common",
      },
      {
        key: "/admin-tools/variables/secured",
        icon: <LockOutlined />,
        label: "Secured",
      },
    ],
  },
  {
    key: "/admin-tools/audit",
    icon: <AuditOutlined />,
    label: "Audit",
  },
  {
    key: "/admin-tools/import-instructions",
    icon: <CloudUploadOutlined />,
    label: "Import Instructions",
  },
  {
    key: "/admin-tools/sessions",
    icon: <UserOutlined />,
    label: "Sessions",
  },
  {
    key: "/admin-tools/roles",
    icon: <SettingOutlined />,
    label: "Roles",
  },
  {
    key: "/admin-tools/design-templates",
    icon: <FileTextOutlined />,
    label: "Design Templates",
  },
];

export const AdminToolsSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>(
    location.pathname.includes("variables") ? ["variables"] : []
  );

  const handleClick = ({ key }: { key: string }) => {
    if (!key.startsWith("variables")) {
      navigate(key);
    } else if (key.startsWith("/admin-tools/variables")) {
      navigate(key);
    }
  };

  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  const selectedKeys = [location.pathname];

  return (
    <Sider
      width={240}
      collapsed={collapsed}
      style={{
        background: "#fff",
        height: "100vh",
        borderRight: "1px solid #f0f0f0",
        position: "relative",
      }}
    >
      <div className={styles.toggleButton}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
        />
      </div>

      <Menu
        mode="inline"
        selectedKeys={selectedKeys}
        openKeys={collapsed ? [] : openKeys}
        onOpenChange={handleOpenChange}
        onClick={handleClick}
        items={menuItems}
        style={{ height: "100%", borderRight: 0 }}
      />
    </Sider>
  );
};