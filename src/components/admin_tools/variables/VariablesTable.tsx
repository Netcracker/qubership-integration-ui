import React from "react";
import { Button, Input, Popconfirm, Table } from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { JSX } from "react/jsx-runtime";
import { FilterDropdownProps } from "antd/lib/table/interface";
import {
  getTextColumnFilterFn,
  TextColumnFilterDropdown,
  TextColumnFilterDropdownProps,
} from "../../table/TextColumnFilterDropdown.tsx";
import { Variable } from "../../../api/admin-tools/variables.ts";
import styles from "./VariablesTable.module.css";

type VariablesTableProps = {
  variables: Variable[];
  isAddingNew: boolean;
  selectedKeys: string[];
  onSelectedChange: (keys: string[]) => void;
  editingKey: string | null;
  editingValue: string;
  onStartEditing: (key: string, value: string) => void;
  onChangeEditingValue: (value: string) => void;
  onCancelEditing: () => void;
  onConfirmEdit: (key: string, newValue: string) => void;
  onDelete: (key: string) => void;
  onAdd: (key: string, value: string) => void;
  enableKeySort: boolean;
  enableKeyFilter: boolean;
  enableValueSort: boolean;
  enableValueFilter: boolean;
  isValueHidden: boolean;
};

const VariablesTable: React.FC<VariablesTableProps> = ({
                                                         variables,
                                                         isAddingNew,
                                                         selectedKeys,
                                                         onSelectedChange,
                                                         editingKey,
                                                         editingValue,
                                                         onStartEditing,
                                                         onChangeEditingValue,
                                                         onCancelEditing,
                                                         onConfirmEdit,
                                                         onDelete,
                                                         onAdd,
                                                         enableKeySort,
                                                         enableKeyFilter,
                                                         enableValueSort,
                                                         enableValueFilter,
                                                         isValueHidden,
                                                       }) => {
  const columns = [
    {
      title: "Key",
      dataIndex: "key",
      key: "key",
      ...(enableKeySort && {
        sorter: (a: Variable, b: Variable) => a.key.localeCompare(b.key),
        ...(enableKeyFilter && {
          filterDropdown: (
            props: JSX.IntrinsicAttributes &
              FilterDropdownProps &
              TextColumnFilterDropdownProps
          ) => <TextColumnFilterDropdown {...props} enableExact />,
        }),
        onFilter: getTextColumnFilterFn<Variable>((r) => r.key),
        filterIcon: (filtered: boolean) => (
          <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
        ),
      }),
      width: "40%",
      render: (_: string, record: Variable) =>
        record.key === "__new__" ? (
          <Input
            placeholder="Key"
            size="small"
            onChange={(e) => (record.key = e.target.value)}
          />
        ) : (
          <span>{record.key}</span>
        ),
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      ...(enableValueSort && {
        sorter: (a: Variable, b: Variable) => a.value.localeCompare(b.value),
        ...(enableValueFilter && {
          filterDropdown: (
            props: JSX.IntrinsicAttributes &
              FilterDropdownProps &
              TextColumnFilterDropdownProps
          ) => <TextColumnFilterDropdown {...props} enableExact />,
        }),
        onFilter: getTextColumnFilterFn<Variable>((r) => r.value),
        filterIcon: (filtered: boolean) => (
          <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
        ),
      }),
      render: (_: string, record: Variable) => {
        const isEditing = editingKey === record.key;

        if (isEditing) {
          const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") onConfirmEdit(record.key, editingValue);
            else if (e.key === "Escape") onCancelEditing();
          };

          const EditingInput = isValueHidden ? Input.Password : Input;

          return (
            <div className={`${styles["editable-cell-wrapper"]} ${styles["focused"]}`}>
              <EditingInput
                size="small"
                autoFocus
                value={editingValue}
                onChange={(e) => onChangeEditingValue(e.target.value)}
                onKeyDown={onKeyDown}
                style={{ width: "70%" }}
              />
              <div className={styles["editing-controls"]}>
                <Popconfirm
                  title="Save changes?"
                  onConfirm={() => onConfirmEdit(record.key, editingValue)}
                >
                  <Button icon={<CheckOutlined />} type="text" size="small" />
                </Popconfirm>
                <Button
                  icon={<CloseOutlined />}
                  type="text"
                  size="small"
                  onClick={onCancelEditing}
                />
              </div>
            </div>
          );
        }

        if (record.key === "__new__") {
          const NewValueInput = isValueHidden ? Input.Password : Input;
          return (
            <NewValueInput
              placeholder="Value"
              size="small"
              onChange={(e) => (record.value = e.target.value)}
            />
          );
        }

        return (
          <div
            className={styles["editable-cell-wrapper"]}
            onClick={() => onStartEditing(record.key, record.value)}
          >
            {isValueHidden ? "*****" : record.value}
            <EditOutlined className={`${styles["inline-icon"]} ${styles["edit-icon"]}`} />
          </div>
        );
      },
    },
    {
      title: "",
      key: "actions",
      width: 40,
      align: "right" as const,
      render: (_: any, record: Variable) =>
        record.key === "__new__" ? (
          <Button
            size="small"
            type="primary"
            onClick={() => onAdd(record.key, record.value)}
          >
            Save
          </Button>
        ) : (
          <Popconfirm
            title="Delete variable?"
            onConfirm={() => onDelete(record.key)}
          >
            <Button
              icon={<DeleteOutlined />}
              size="small"
              type="text"
              className={styles["delete-button"]}
            />
          </Popconfirm>
        ),
    },
  ];

  const dataWithNewRow = [
    ...variables,
    ...(isAddingNew ? [{ key: "__new__", value: "" }] : []),
  ];

  return (
    <div className={styles["sub-table-wrapper"]}>
      <Table
        className={styles["secret-sub-table"]}
        dataSource={dataWithNewRow}
        columns={columns}
        rowKey="key"
        pagination={false}
        size="small"
        rowClassName={() => styles["secret-row"]}
        rowSelection={{
          selectedRowKeys: selectedKeys,
          onChange: (newSelectedKeys) =>
            onSelectedChange(newSelectedKeys as string[]),
        }}
      />
    </div>
  );
};

export default VariablesTable;