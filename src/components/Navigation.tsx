import { Menu, Switch } from "antd";
import styles from "./Navigation.module.css";
import type { MenuProps } from "antd";
import { DesktopOutlined, UnorderedListOutlined, AppstoreOutlined } from "@ant-design/icons";
import { NotificationBar } from "./notifications/NotificationBar.tsx";
import { useThemeContext } from "../contexts/ThemeContext";

type MenuItem = Required<MenuProps>["items"][number];

const items: MenuItem[] = [
  {
    label: <a href="/chains">Chains</a>,
    key: "chains",
    icon: <UnorderedListOutlined />,
  },
  {
    label: <a href="/services">Services</a>,
    key: "services",
    icon: <AppstoreOutlined />,
  },
  {
    label: <a href="/admintools">Admin Tools</a>,
    key: "admintools",
    icon: <DesktopOutlined />,
  },
];

const Navigation = () => {
  const { isDarkMode, toggleTheme } = useThemeContext();

  return (
    <nav className={styles.navigation}>
      <Menu
        style={{ border: "none", background: "transparent", color: "var(--table-header-text-color)" }}
        items={items}
        key="menu"
        mode="horizontal"
        theme={isDarkMode ? "dark" : "light"}
        className={styles.menu}
      ></Menu>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>🌞</span>
        <Switch
          checked={isDarkMode}
          onChange={toggleTheme}
          size="small"
          style={{ backgroundColor: isDarkMode ? undefined : 'var(--table-border-color)' }}
        />
        <span>🌙</span>
      </div>
      <NotificationBar />
    </nav>
  );
};

export default Navigation;
