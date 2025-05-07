import { NavLink } from "react-router-dom";
import styles from "./AdminToolsSidebar.module.css";
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
} from "@ant-design/icons";

export const AdminToolsSidebar = () => {
  return (
    <nav className={styles.sidebar}>
      <SidebarItem path="domains" icon={<AppstoreOutlined />} label="Domains" />

      <div className={styles.section}>
        <div className={styles.linkGroup}>
          <span className={styles.groupLabel}>
            <CodeOutlined className={styles.icon} />
            Variables
          </span>
          <div className={styles.subsection}>
            <SidebarItem path="variables/common" icon={<TableOutlined />} label="Common" small />
            <SidebarItem path="variables/secured" icon={<LockOutlined />} label="Secured" small />
          </div>
        </div>
      </div>

      <SidebarItem path="audit" icon={<AuditOutlined />} label="Audit" />
      <SidebarItem path="import-instructions" icon={<CloudUploadOutlined />} label="Import Instructions" />
      <SidebarItem path="sessions" icon={<UserOutlined />} label="Sessions" />
      <SidebarItem path="roles" icon={<SettingOutlined />} label="Roles" />
      <SidebarItem path="design-templates" icon={<FileTextOutlined />} label="Design Templates" />
    </nav>
  );
};

const SidebarItem = ({
                       path,
                       icon,
                       label,
                       small = false,
                     }: {
  path: string;
  icon: React.ReactNode;
  label: string;
  small?: boolean;
}) => (
  <NavLink
    to={path}
    className={({ isActive }) =>
      isActive ? `${styles.link} ${styles.activeLink}` : styles.link
    }
    style={{ paddingLeft: small ? 40 : 24 }}
  >
    <span className={styles.icon}>{icon}</span>
    {label}
  </NavLink>
);