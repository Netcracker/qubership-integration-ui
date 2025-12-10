import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Dropdown,
  Flex,
  FloatButton,
  InputNumber,
  MenuProps,
  Space,
  Table,
  TableProps,
  Tooltip,
  Typography,
} from "antd";
import { OverridableIcon } from "../../../icons/IconProvider.tsx";
import { LiveExchange, SessionsLoggingLevel } from "../../../api/apiTypes.ts";
import { ResizableTitle } from "../../ResizableTitle.tsx";
import commonStyles from "../CommonStyle.module.css";
import {
  getTextColumnFilterFn,
  TextColumnFilterDropdown,
} from "../../table/TextColumnFilterDropdown.tsx";
import { FilterDropdownProps } from "antd/lib/table/interface";
import {
  getTimestampColumnFilterFn,
  TimestampColumnFilterDropdown,
} from "../../table/TimestampColumnFilterDropdown.tsx";
import { useNotificationService } from "../../../hooks/useNotificationService.tsx";
import { api } from "../../../api/api.ts";
import {
  formatDuration,
  formatTimestamp,
  PLACEHOLDER,
} from "../../../misc/format-utils.ts";
import { useNavigate } from "react-router";
import {
  EnumColumnFilterDropdown,
  getEnumColumnFilterFn,
} from "../../table/EnumColumnFilterDropdown.tsx";
import {
  getNumberColumnFilterFn,
  NumberColumnFilterDropdown,
} from "../../table/NumberColumnFilterDropdown.tsx";

const { Title } = Typography;

export const LiveExchanges: React.FC = () => {
  const notificationService = useNotificationService();
  const navigate = useNavigate();

  const [exchanges, setExchanges] = useState<LiveExchange[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [limit, setLimit] = useState<number>(10);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "sessionId",
    "chainName",
    "sessionDuration",
    "duration",
    "sessionStartTime",
    "main",
    "podIp",
  ]);

  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({
    sessionId: 200,
    chainName: 200,
    sessionDuration: 200,
    duration: 200,
    sessionStartTime: 200,
    main: 100,
    podIp: 100,
    actions: 40,
  });

  const handleResize =
    (dataIndex: string) =>
    (
      _: React.SyntheticEvent<Element>,
      { size }: { size: { width: number } },
    ) => {
      requestAnimationFrame(() => {
        setColumnWidths((prev) => ({
          ...prev,
          [dataIndex]: size.width,
        }));
      });
    };

  const terminateExchange = useCallback(
    async (liveExchange: LiveExchange) => {
      try {
        await api.terminateExchange(
          liveExchange.podIp,
          liveExchange.deploymentId,
          liveExchange.exchangeId,
        );
        setExchanges((exchanges) =>
          exchanges.filter((e) => e.exchangeId !== liveExchange.exchangeId),
        );
      } catch (error) {
        notificationService.requestFailed(
          "Failed to terminate exchange",
          error,
        );
      }
    },
    [notificationService],
  );

  const columns: TableProps<LiveExchange>["columns"] = [
    {
      title: "Session ID",
      key: "sessionId",
      dataIndex: "sessionId",
      hidden: !visibleColumns.includes("sessionId"),
      sorter: (a: LiveExchange, b: LiveExchange) =>
        (b.sessionId ?? "").localeCompare(a.sessionId ?? ""),
      filterDropdown: (props: FilterDropdownProps) => (
        <TextColumnFilterDropdown {...props} />
      ),
      onFilter: getTextColumnFilterFn(
        (liveExchange) => liveExchange?.sessionId ?? "",
      ),
      onHeaderCell: () => ({
        width: columnWidths.sessionId,
        onResize: handleResize("sessionId"),
      }),
      render: (_, liveExchange) =>
        liveExchange.sessionLogLevel === SessionsLoggingLevel.DEBUG ||
        liveExchange.sessionLogLevel === SessionsLoggingLevel.INFO ? (
          <a
            onClick={() =>
              void navigate(
                `/chains/${liveExchange.chainId}/sessions/${liveExchange.sessionId}`,
              )
            }
          >
            {liveExchange.sessionId}
          </a>
        ) : (
          liveExchange.sessionId
        ),
    },
    {
      title: "Chain",
      key: "chainName",
      dataIndex: "chainName",
      hidden: !visibleColumns.includes("chainName"),
      sorter: (a: LiveExchange, b: LiveExchange) =>
        (b.chainName ?? b.chainId ?? "").localeCompare(
          a.chainName ?? a.chainId ?? "",
        ),
      filterDropdown: (props: FilterDropdownProps) => (
        <TextColumnFilterDropdown {...props} />
      ),
      onFilter: getTextColumnFilterFn(
        (liveExchange) => liveExchange?.chainName ?? liveExchange.chainId ?? "",
      ),
      onHeaderCell: () => ({
        width: columnWidths.chainName,
        onResize: handleResize("chainName"),
      }),
      render: (_, liveExchange) => (
        <a onClick={() => void navigate(`/chains/${liveExchange.chainId}`)}>
          {liveExchange?.chainName ?? liveExchange.chainId}
        </a>
      ),
    },
    {
      title: "Session Duration",
      key: "sessionDuration",
      dataIndex: "sessionDuration",
      hidden: !visibleColumns.includes("sessionDuration"),
      sorter: (a: LiveExchange, b: LiveExchange) =>
        (b.sessionDuration ?? 0) - (a.sessionDuration ?? 0),
      filterDropdown: (props: FilterDropdownProps) => (
        <NumberColumnFilterDropdown minValue={0} {...props} />
      ),
      onFilter: getNumberColumnFilterFn(
        (liveExchange) => liveExchange.sessionDuration,
      ),
      onHeaderCell: () => ({
        width: columnWidths.sessionDuration,
        onResize: handleResize("sessionDuration"),
      }),
      render: (_, liveExchange) => (
        <>{formatDuration(liveExchange.sessionDuration)}</>
      ),
    },
    {
      title: "Exchange Duration",
      key: "duration",
      dataIndex: "duration",
      hidden: !visibleColumns.includes("duration"),
      sorter: (a: LiveExchange, b: LiveExchange) =>
        (b.duration ?? 0) - (a.duration ?? 0),
      filterDropdown: (props: FilterDropdownProps) => (
        <NumberColumnFilterDropdown minValue={0} {...props} />
      ),
      onFilter: getNumberColumnFilterFn(
        (liveExchange) => liveExchange.duration,
      ),
      onHeaderCell: () => ({
        width: columnWidths.duration,
        onResize: handleResize("duration"),
      }),
      render: (_, liveExchange) => <>{formatDuration(liveExchange.duration)}</>,
    },
    {
      title: "Session Started",
      key: "sessionStartTime",
      dataIndex: "sessionStartTime",
      hidden: !visibleColumns.includes("sessionStartTime"),
      sorter: (a: LiveExchange, b: LiveExchange) =>
        (b.sessionStartTime ?? 0) - (a.sessionStartTime ?? 0),
      filterDropdown: (props: FilterDropdownProps) => (
        <TimestampColumnFilterDropdown {...props} />
      ),
      onFilter: getTimestampColumnFilterFn(
        (liveExchange) => liveExchange.sessionStartTime ?? 0,
      ),
      onHeaderCell: () => ({
        width: columnWidths.sessionStartTime,
        onResize: handleResize("sessionStartTime"),
      }),
      render: (_, liveExchange) => (
        <>
          {liveExchange.sessionStartTime
            ? formatTimestamp(liveExchange.sessionStartTime, true)
            : PLACEHOLDER}
        </>
      ),
    },
    {
      title: "Main thread",
      key: "main",
      dataIndex: "main",
      hidden: !visibleColumns.includes("main"),
      sorter: (a: LiveExchange, b: LiveExchange) =>
        (b.main ? 1 : 0) - (a.main ? 1 : 0),
      filterDropdown: (props: FilterDropdownProps) => (
        <EnumColumnFilterDropdown
          options={[
            { value: "true", label: "true" },
            { value: "false", label: "false" },
          ]}
          {...props}
        />
      ),
      onFilter: getEnumColumnFilterFn((liveExchange) =>
        (liveExchange.main ?? false).toString(),
      ),
      onHeaderCell: () => ({
        width: columnWidths.main,
        onResize: handleResize("main"),
      }),
      render: (_, liveExchange) =>
        liveExchange.main ? <OverridableIcon name="check" /> : "",
    },
    {
      title: "Pod IP",
      key: "podIp",
      dataIndex: "podIp",
      hidden: !visibleColumns.includes("podIp"),
      sorter: (a: LiveExchange, b: LiveExchange) =>
        (b.podIp ?? "").localeCompare(a.podIp ?? ""),
      filterDropdown: (props: FilterDropdownProps) => (
        <TextColumnFilterDropdown {...props} />
      ),
      onFilter: getTextColumnFilterFn(
        (liveExchange) => liveExchange?.podIp ?? "",
      ),
      onHeaderCell: () => ({
        width: columnWidths.podIp,
        onResize: handleResize("podIp"),
      }),
    },
    {
      title: "",
      key: "actions",
      width: columnWidths.actions,
      className: "actions-column",
      render: (_, liveExchange) => (
        <Tooltip title={"Terminate exchange"}>
          <Button
            type="text"
            icon={<OverridableIcon name="stop" />}
            onClick={() => void terminateExchange(liveExchange)}
          />
        </Tooltip>
      ),
    },
  ];

  const columnVisibilityMenuItems: MenuProps["items"] = columns.map(
    (column, index) => ({
      label:
        typeof column.title === "string"
          ? column.title
          : (column.key?.toString() ?? index),
      key: column.key ?? index,
      disabled: column.key === "sessionId",
    }),
  );

  const totalColumnsWidth = Object.values(columnWidths).reduce(
    (acc, width) => acc + width,
    0,
  );

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await api.getExchanges(limit);
      setExchanges(result);
    } catch (error) {
      notificationService.requestFailed("Failed to get live exchanges", error);
    } finally {
      setIsLoading(false);
    }
  }, [notificationService, limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <Flex vertical className={commonStyles["container"]}>
      <Flex className={commonStyles["header"]}>
        <Title level={4} className={commonStyles["title"]}>
          <OverridableIcon
            name="unorderedList"
            className={commonStyles["icon"]}
          />
          Live Exchanges
        </Title>
        <Flex
          vertical={false}
          gap={8}
          className={commonStyles["actions"]}
          align={"center"}
        >
          <Space direction="horizontal">
            <p>Exchanges per engine:</p>
            <InputNumber
              min={1}
              defaultValue={10}
              onChange={(value) => {
                if (value !== null) setLimit(value);
              }}
            />
          </Space>
          <Dropdown
            menu={{
              items: columnVisibilityMenuItems,
              selectable: true,
              multiple: true,
              selectedKeys: visibleColumns,
              onSelect: ({ selectedKeys }) => setVisibleColumns(selectedKeys),
              onDeselect: ({ selectedKeys }) => setVisibleColumns(selectedKeys),
            }}
          >
            <Button type="text" icon={<OverridableIcon name="settings" />} />
          </Dropdown>
        </Flex>
      </Flex>
      <Flex
        style={{
          flex: "1 1 auto",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          borderRadius: "8px",
          overflowY: "auto",
        }}
      >
        <Table<LiveExchange>
          className="flex-table"
          size="small"
          columns={columns}
          dataSource={exchanges}
          scroll={{ x: totalColumnsWidth, y: "" }}
          pagination={false}
          rowKey="exchangeId"
          loading={isLoading}
          components={{
            header: {
              cell: ResizableTitle,
            },
          }}
        />
        <FloatButton
          tooltip={{ title: "Refresh", placement: "left" }}
          icon={<OverridableIcon name="redo" />}
          onClick={() => void refresh()}
        />
      </Flex>
    </Flex>
  );
};
