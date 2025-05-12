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
} from "@ant-design/icons";
import {
  getCommonVariables,
  createCommonVariable,
  updateCommonVariable,
  deleteCommonVariables,
  exportVariables
} from "../../../api/admin-tools/variables";
import { CommonVariable } from "../../../api/admin-tools/commonVariablesApi.ts";

export const CommonVariables = () => {
  const [variables, setVariables] = useState<CommonVariable[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [filter, setFilter] = useState({ key: "", value: "" });
  const [newVariable, setNewVariable] = useState<CommonVariable | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editedValue, setEditedValue] = useState<string>("");

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

  const filteredVariables = variables.filter(
    (v) =>
      v.key.toLowerCase().includes(filter.key.toLowerCase()) &&
      v.value.toLowerCase().includes(filter.value.toLowerCase())
  );

  const columns = [
    {
      title: "Key",
      dataIndex: "key",
      key: "key",
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
            <Button icon={<CheckOutlined />} type="primary" onClick={saveEdit} />
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
    ...filteredVariables,
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, flexWrap: 'wrap' }}>
        <Space style={{ flexWrap: "wrap" }}>
          <Input
            placeholder="Filter by key"
            value={filter.key}
            onChange={(e) => setFilter({ ...filter, key: e.target.value })}
          />
          <Input
            placeholder="Filter by value"
            value={filter.value}
            onChange={(e) => setFilter({ ...filter, value: e.target.value })}
          />
        </Space>
        <Space wrap>
          {/*<Button icon={<UploadOutlined />} onClick={handleImport}>Import</Button>*/}
          <Button icon={<DownloadOutlined />} onClick={() => handleExport(selectedRowKeys as string[])}>Export</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setNewVariable({ key: "", value: "" })} disabled={!!newVariable}>Add Variable</Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDeleteSelected} disabled={!selectedRowKeys.length}>Delete Selected</Button>
        </Space>
      </div>

      <div style={{ flexGrow: 1 }}>
        <Table
          rowKey="key"
          scroll={{ x: 'max-content' }}
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
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
};