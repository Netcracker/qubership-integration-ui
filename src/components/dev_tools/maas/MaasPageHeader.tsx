import React from "react";
import { Button, Flex } from "antd";
import Title from "antd/lib/typography/Title";
import { OverridableIcon } from "../../../icons/IconProvider.tsx";
import { MaasPageHeaderProps } from "./types.ts";
import styles from "./Maas.module.css";

export const MaasPageHeader: React.FC<MaasPageHeaderProps> = ({
  title,
  exportInProgress,
  isFormValid,
  onExport,
}) => {
  return (
    <Flex vertical={false} justify="space-between" align="center" className={styles["header"]}>
      <Title level={4} className={styles["titleHeader"]}>
        {title}
      </Title>
      <Button
        size="small"
        icon={<OverridableIcon name="cloudDownload" />}
        loading={exportInProgress}
        disabled={exportInProgress || !isFormValid}
        onClick={onExport}
      >
        Export
      </Button>
    </Flex>
  );
};
