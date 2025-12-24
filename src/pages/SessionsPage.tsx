import { Flex, Typography } from "antd";
import React from "react";
import commonStyles from "../components/admin_tools/CommonStyle.module.css";
import { Sessions } from "./Sessions.tsx";
import { OverridableIcon } from "../icons/IconProvider.tsx";

export const SessionsPage: React.FC = () => {
  return (
    <Flex vertical className={commonStyles["container"]}>
      <Flex vertical={false}>
        <Typography.Title level={4} className={commonStyles["title"]}>
          <OverridableIcon name="snippets" className={commonStyles["icon"]} />
          Sessions
        </Typography.Title>
      </Flex>
      <Sessions />
    </Flex>
  );
};
