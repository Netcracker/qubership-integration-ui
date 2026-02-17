import React, { useCallback, useEffect, useState } from "react";
import { Table, Button, Typography, Space, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EngineTable } from "./EngineTable";
import { useEngines } from "./hooks/useEngines";
import tableStyles from "./Tables.module.css";
import { DomainType, EngineDomain } from "../../../api/apiTypes.ts";
import { OverridableIcon } from "../../../icons/IconProvider.tsx";
import { useNotificationService } from "../../../hooks/useNotificationService.tsx";
import { api } from "../../../api/api.ts";

interface Props {
  domains: EngineDomain[];
  isLoading?: boolean;
}

const EnginesForDomain: React.FC<{ domain: EngineDomain }> = ({ domain }) => {
  const { engines, isLoading, error, retry } = useEngines(domain.name);

  if (error) {
    return (
      <Typography.Text type="danger">
        Error while loading list of engines
        <Button onClick={() => void retry()}>Retry</Button>
      </Typography.Text>
    );
  }

  return (
    <EngineTable
      engines={engines}
      isLoading={isLoading}
      domainName={domain.name}
    />
  );
};

const DomainsTable: React.FC<Props> = ({ domains, isLoading = false }) => {
  const notificationsService = useNotificationService();
  const [tableData, setTableData] = useState<EngineDomain[]>([]);

  useEffect(() => {
    setTableData(domains);
  }, [domains]);

  const deleteMicroDomain = useCallback(
    async (name: string) => {
      try {
        await api.deleteMicroDomain(name);
        setTableData((items) => items.filter((domain) => domain.name !== name));
      } catch (e) {
        notificationsService.requestFailed(
          `Failed to delete micro domain ${name}`,
          e,
        );
      }
    },
    [notificationsService],
  );

  const columns: ColumnsType<EngineDomain> = [
    {
      title: <span className={tableStyles.columnHeader}>Domain</span>,
      dataIndex: "name",
      key: "name",
      render: (_: unknown, domain: EngineDomain) => {
        return domain.type === DomainType.MICRO ? (
          <Space size={"small"}>
            {domain.name}
            <Tag>micro</Tag>
            <Button
              size={"small"}
              type={"text"}
              icon={<OverridableIcon name="delete" />}
              onClick={() => void deleteMicroDomain(domain.name)}
            />
          </Space>
        ) : (
          domain.name
        );
      },
    },
    {
      title: <span className={tableStyles.columnHeader}>Version</span>,
      dataIndex: "version",
      key: "version",
      align: "right",
    },
    {
      title: <span className={tableStyles.columnHeader}>Desired engines</span>,
      dataIndex: "replicas",
      key: "replicas",
      align: "right",
      width: "12%",
    },
    {
      title: <span className={tableStyles.columnHeader}>Namespace</span>,
      dataIndex: "namespace",
      key: "namespace",
      align: "right",
      width: "25%",
    },
  ];

  const [expandedRowKeys, setExpandedRowKeys] = React.useState<React.Key[]>([]);

  useEffect(() => {
    if (domains.length > 0) {
      setExpandedRowKeys(domains.map((domain) => domain.id));
    }
  }, [domains]);

  return (
    <Table
      columns={columns}
      dataSource={tableData}
      loading={isLoading}
      pagination={false}
      className={tableStyles.mainTable}
      expandable={{
        expandedRowRender: (record) => <EnginesForDomain domain={record} />,
        expandedRowKeys: expandedRowKeys,
        onExpandedRowsChange: (expandedKeys) =>
          setExpandedRowKeys(expandedKeys as React.Key[]),
        rowExpandable: () => true,
      }}
      rowKey="id"
    />
  );
};

export default DomainsTable;
