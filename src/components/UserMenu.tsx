import { Button, Dropdown, Typography } from "antd";
import {
  LogoutOutlined,
  ReloadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import styles from "./UserMenu.module.css";
import { getConfig, onConfigChange, UserInfo } from "../appConfig.ts";

const { Text } = Typography;

type UserMenuState = {
  userInfo: UserInfo;
  onLogout?: () => void;
};

function readState(): UserMenuState {
  const cfg = getConfig();
  return { userInfo: cfg.userInfo ?? {}, onLogout: cfg.onLogout };
}

function isSameState(a: UserMenuState, b: UserMenuState): boolean {
  return (
    a.onLogout === b.onLogout &&
    a.userInfo.userName === b.userInfo.userName &&
    a.userInfo.email === b.userInfo.email &&
    a.userInfo.tenantName === b.userInfo.tenantName &&
    a.userInfo.tenantId === b.userInfo.tenantId
  );
}

export const UserMenu: React.FC = () => {
  const [state, setState] = useState<UserMenuState>(readState);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    return onConfigChange(() => {
      setState((prev) => {
        const next = readState();
        return isSameState(prev, next) ? prev : next;
      });
    });
  }, []);

  const { userInfo, onLogout } = state;
  const displayName = userInfo.userName?.trim() || "Unknown user";
  const tenantName = userInfo.tenantName?.trim();
  const tenantId = userInfo.tenantId?.trim();

  const handleResetPreferences = () => {
    setOpen(false);
  };

  const handleLogout = () => {
    setOpen(false);
    onLogout?.();
  };

  const card = (
    <div className={styles.card} role="menu">
      <div className={styles.header}>
        <span className={styles.userName} title={displayName}>
          {displayName}
        </span>
        {userInfo.email && (
          <span className={styles.userEmail} title={userInfo.email}>
            {userInfo.email}
          </span>
        )}
      </div>

      {(tenantName || tenantId) && (
        <>
          <div className={styles.divider} />
          <div className={styles.info}>
            {tenantName && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Tenant name</span>
                <span className={styles.infoValue} title={tenantName}>
                  {tenantName}
                </span>
              </div>
            )}
            {tenantId && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Tenant ID</span>
                <Text
                  className={`${styles.infoValue} ${styles.infoValueMono}`}
                  title={tenantId}
                  copyable
                >
                  {tenantId}
                </Text>
              </div>
            )}
          </div>
        </>
      )}

      <div className={styles.divider} />
      <div className={styles.actions}>
        <Button
          type="text"
          block
          className={styles.actionButton}
          icon={<ReloadOutlined />}
          onClick={handleResetPreferences}
        >
          Reset UI preferences
        </Button>
        {onLogout && (
          <Button
            type="text"
            block
            className={`${styles.actionButton} ${styles.actionDanger}`}
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            Log out
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Dropdown
      trigger={["click"]}
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      popupRender={() => card}
    >
      <Button
        type="text"
        aria-label="User menu"
        title={displayName}
        icon={<UserOutlined />}
      />
    </Dropdown>
  );
};

export default UserMenu;
