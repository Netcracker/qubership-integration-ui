import { Flex } from "antd";
import { SnippetsOutlined } from "@ant-design/icons";
import React from "react";
import "../styles/page-section.css";
import Title from "antd/lib/typography/Title";
import { Sessions } from "./Sessions.tsx";

export const SessionsPage: React.FC = () => {
  return (
    <Flex vertical className="page-container">
      <div className="page-header">
        <Title level={4} className="page-title">
          <SnippetsOutlined className="page-icon" />
          Sessions
        </Title>
        <div className="page-actions" />
      </div>
      <Sessions />
    </Flex>
  );
};
