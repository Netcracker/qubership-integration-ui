import Spin from "antd/lib/spin";
import Title from "antd/lib/typography/Title";
import DomainsTable from "./DomainsTable";
import { useDomains } from "../../../hooks/useDomains";
import { AppstoreOutlined } from "@ant-design/icons";
import React from "react";
import { Flex } from "antd";

export const Domains: React.FC = () => {
  const { domains, isLoading } = useDomains();

  return (
    <Flex vertical className="page-container">
      <div className="page-header">
        <Title level={4} className="page-title">
          <AppstoreOutlined className="page-icon" />
          Domains
        </Title>
        <div className="page-actions" />
      </div>
      {isLoading ? (
        <Spin size="large" />
      ) : (
        <DomainsTable domains={domains || []} isLoading={isLoading} />
      )}
    </Flex>
  );
};
