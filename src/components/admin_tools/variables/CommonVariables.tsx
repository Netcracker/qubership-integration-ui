import { useEffect, useState } from "react";
import {
  Table,
  Input,
  Button,
  Space,
  Popconfirm,
  Typography,
  message,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  CheckOutlined,
  PlusOutlined,
  CloseOutlined,
  DownloadOutlined,
  UploadOutlined,
  SearchOutlined
} from "@ant-design/icons";
import {
  getCommonVariables,
  createCommonVariable,
  updateCommonVariable,
  deleteCommonVariables,
  exportVariables
} from "../../../api/admin-tools/variables";
import {
  getTextColumnFilterFn,
  TextColumnFilterDropdown,
  TextColumnFilterDropdownProps,
} from "../../table/TextColumnFilterDropdown.tsx";
import { CommonVariable } from "../../../api/admin-tools/commonVariablesApi.ts";
import ImportVariablesModal from "./ImportVariablesModal.tsx";
import { useModalsContext } from "../../../Modals.tsx";
import { FilterDropdownProps } from "antd/lib/table/interface";
import { JSX } from "react/jsx-runtime";

export const CommonVariables = () => {
  const [variables, setVariables] = useState<CommonVariable[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [newVariable, setNewVariable] = useState<CommonVariable | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editedValue, setEditedValue] = useState<string>("");
  const { showModal } = useModalsContext();

  useEffect(() => {
    fetchVariables();
  }, []);

  const fetchVariables = async () => {
    try {
      const data = await getCommonVariables();
      setVariables(data);
    } catch {
      message.error("Failed to load variables");
    }
  };

  const handleSaveNew = async () => {
    if (!newVariable?.key.trim()) return;
    try {
      await createCommonVariable(newVariable);
      message.success("Variable created");
      setNewVariable(null);
      fetchVariables();
    } catch {
      message.error("Failed to create variable");
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedRowKeys.length) return;
    try {
      await deleteCommonVariables(selectedRowKeys as string[]);
      message.success("Deleted selected variables");
      setSelectedRowKeys([]);
      fetchVariables();
    } catch {
      message.error("Failed to delete selected variables");
    }
  };

  const handleDeleteOne = async (key: string) => {
    try {
      await deleteCommonVariables([key]);
      message.success(`Deleted ${key}`);
      fetchVariables();
    } catch {
      message.error(`Failed to delete ${key}`);
    }
  };

  const startEdit = (key: string, value: string) => {
    setEditingKey(key);
    setEditedValue(value);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditedValue("");
  };

  const saveEdit = async () => {
    if (!editingKey) return;
    try {
      await updateCommonVariable({ key: editingKey, value: editedValue });
      message.success("Updated variable");
      setEditingKey(null);
      setEditedValue("");
      fetchVariables();
    } catch {
      message.error("Failed to update variable");
    }
  };

  const handleExport = async (keys: string[]) => {
    try {
      const keysToExport = keys ? keys : [];
      await exportVariables(keysToExport, true);
    } catch {
      message.error("Failed to export variable");
    }
  };

  const columns = [
    {
      title: "Key",
      dataIndex: "key",
      key: "key",
      sorter: (a: CommonVariable, b: CommonVariable) =>
        a.key.localeCompare(b.key),
      filterDropdown: (
        props: JSX.IntrinsicAttributes &
          FilterDropdownProps &
          TextColumnFilterDropdownProps,
      ) => <TextColumnFilterDropdown {...props} enableExact />,
      onFilter: getTextColumnFilterFn<CommonVariable>((r) => r.key),
      filterIcon: (filtered: any) => (
        <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      render: (_: string, record: CommonVariable) => {
        if (record.key === "__new__row__") {
          return (
            <Input
              placeholder="Key"
              value={newVariable?.key || ""}
              onChange={(e) =>
                setNewVariable({ ...newVariable!, key: e.target.value })
              }
            />
          );
        }
        return <Typography.Text>{record.key}</Typography.Text>;
      },
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      sorter: (a: CommonVariable, b: CommonVariable) =>
        a.value.localeCompare(b.value),
      filterDropdown: (
        props: JSX.IntrinsicAttributes &
          FilterDropdownProps &
          TextColumnFilterDropdownProps,
      ) => <TextColumnFilterDropdown {...props} enableExact />,
      onFilter: getTextColumnFilterFn<CommonVariable>((r) => r.value),
      filterIcon: (filtered: any) => (
        <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      render: (_: string, record: CommonVariable) => {
        if (record.key === "__new__row__") {
          return (
            <Input
              placeholder="Value"
              value={newVariable?.value || ""}
              onChange={(e) =>
                setNewVariable({ ...newVariable!, value: e.target.value })
              }
            />
          );
        }

        return editingKey === record.key ? (
          <Input
            value={editedValue}
            onChange={(e) => setEditedValue(e.target.value)}
          />
        ) : (
          record.value
        );
      },
    },
    {
      key: "actions",
      width: 100,
      render: (_: any, record: CommonVariable) => {
        if (record.key === "__new__row__") {
          return (
            <Space>
              <Button
                icon={<CheckOutlined />}
                type="primary"
                onClick={handleSaveNew}
              />
              <Button
                icon={<CloseOutlined />}
                onClick={() => setNewVariable(null)}
              />
            </Space>
          );
        }

        return editingKey === record.key ? (
          <Space>
            <Button
              icon={<CheckOutlined />}
              type="primary"
              onClick={saveEdit}
            />
            <Button icon={<CloseOutlined />} onClick={cancelEdit} />
          </Space>
        ) : (
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() => startEdit(record.key, record.value)}
            />
            <Popconfirm
              title="Delete this variable?"
              onConfirm={() => handleDeleteOne(record.key)}
            >
              <Button icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const tableData = [
    ...(newVariable ? [{ key: "__new__row__", value: "" }] : []),
    ...variables,
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ marginLeft: "auto", display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Button
            icon={<UploadOutlined />}
            onClick={() =>
              showModal({ component: <ImportVariablesModal onSuccess={fetchVariables} /> })
            }
          >
            Import
          </Button>
          <Button icon={<DownloadOutlined />} onClick={() => handleExport(selectedRowKeys as string[])}>Export</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setNewVariable({ key: "", value: "" })} disabled={!!newVariable}>Add Variable</Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDeleteSelected} disabled={!selectedRowKeys.length}>Delete Selected</Button>
        </div>
      </div>

      <div style={{ flexGrow: 1 }}>
        <Table
          rowKey="key"
          scroll={{ x: "max-content" }}
          columns={columns}
          dataSource={tableData}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record) => ({
              disabled: record.key === "__new__row__",
            }),
          }}
          pagination={false}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
};