import React, { useRef, useEffect } from "react";
import {
  Table,
  Input,
  Button,
  Popconfirm,
} from "antd";
import type { InputRef } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { Resizable } from "react-resizable";
import "react-resizable/css/styles.css";
import "./Resizable.css";
import { NEW_VARIABLE_KEY } from "./useVariablesState";
import styles from "./VariablesTable.module.css";
import { TextColumnFilterDropdown, getTextColumnFilterFn } from "../../table/TextColumnFilterDropdown";
import type { FilterDropdownProps } from "antd/lib/table/interface";
import { Variable } from "../../../api/admin-tools/variables/types";
import { TableScroll } from '../../table/TableScroll';

interface VariablesTableProps {
  variables: Variable[];
  selectedKeys: string[];
  onSelectedChange: (keys: string[]) => void;
  isValueHidden: boolean;
  isAddingNew: boolean;
  onAdd: (key: string, value: string) => void;
  onDelete: (key: string) => void;
  onStartEditing: (key: string, value: string) => void;
  onCancelEditing: () => void;
  editingKey: string | null;
  editingValue: string;
  onChangeEditingValue: (value: string) => void;
  onConfirmEdit: (key: string, newValue: string) => void;
  columnsWidth: { [key: string]: number };
  onResize: (dataIndex: string) => (_: any, { size }: any) => void;
  enableKeySort?: boolean;
  enableValueSort?: boolean;
  enableKeyFilter?: boolean;
  enableValueFilter?: boolean;
  calculateScrollHeight?: () => number;
  enableScroll?: boolean;
}

const ResizableTitle = (props: any) => {
  const { onResize, width, ...restProps } = props;

  if (!width) {
    return <th {...restProps} />;
  }

  return (
    <Resizable
      width={width}
      height={0}
      handle={
        <span
          className="react-resizable-handle"
          onClick={(e) => e.stopPropagation()}
        />
      }
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} style={{ ...restProps.style, width }} />
    </Resizable>
  );
};

const VariablesTable: React.FC<VariablesTableProps> = ({
                                                         variables,
                                                         selectedKeys,
                                                         onSelectedChange,
                                                         isValueHidden,
                                                         isAddingNew,
                                                         onAdd,
                                                         onDelete,
                                                         onStartEditing,
                                                         onCancelEditing,
                                                         editingKey,
                                                         editingValue,
                                                         onChangeEditingValue,
                                                         onConfirmEdit,
                                                         columnsWidth,
                                                         onResize,
                                                         enableKeySort,
                                                         enableValueSort,
                                                         enableKeyFilter,
                                                         enableValueFilter,
                                                         enableScroll = true,
                                                       }) => {
  const newKeyInputRef = useRef<InputRef>(null);
  const newValueInputRef = useRef<HTMLTextAreaElement>(null);

  const newRecord = useRef<{ key: string; value: string }>({ key: "", value: "" });

  useEffect(() => {
    if (isAddingNew && newKeyInputRef.current) {
      newKeyInputRef.current.focus();
    }
  }, [isAddingNew]);

  const handleAddKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    newRecord.current.key = e.target.value;
  };

  const handleAddKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (newRecord.current.key && newRecord.current.value && newRecord.current.key !== NEW_VARIABLE_KEY) {
        onAdd(newRecord.current.key, newRecord.current.value);
      }
    }
  };

  const totalColumnsWidth = Object.values(columnsWidth).reduce((acc, width) => acc + width, 0);

  const columns = [
    {
      title: "Key",
      dataIndex: "key",
      key: "key",
      width: columnsWidth.key,
      onHeaderCell: () => ({
        width: columnsWidth.key,
        onResize: onResize("key"),
      }),
      sorter: enableKeySort ? (a: Variable, b: Variable) => a.key.localeCompare(b.key) : undefined,
      filterDropdown: enableKeyFilter ? (props: FilterDropdownProps) => <TextColumnFilterDropdown {...props} /> : undefined,
      onFilter: enableKeyFilter ? getTextColumnFilterFn((record) => record.key) : undefined,
      render: (_: string, record: Variable) =>
        record.key === NEW_VARIABLE_KEY ? (
          <Input
            ref={newKeyInputRef}
            placeholder="Key"
            size="small"
            onChange={handleAddKeyChange}
            onKeyDown={handleAddKeyDown}
          />
        ) : (
          <span>{record.key}</span>
        ),
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      width: columnsWidth.value,
      onHeaderCell: () => ({
        width: columnsWidth.value,
        onResize: onResize("value"),
      }),
      sorter: enableValueSort ? (a: Variable, b: Variable) => a.value.localeCompare(b.value) : undefined,
      filterDropdown: enableValueFilter ? (props: FilterDropdownProps) => <TextColumnFilterDropdown {...props} /> : undefined,
      onFilter: enableValueFilter ? getTextColumnFilterFn((record) => record.value) : undefined,
      render: (_: string, record: Variable) => {
        const isEditing = editingKey === record.key;

        if (isEditing) {
          const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Escape") {
              e.preventDefault();
              onCancelEditing();
            } else if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onConfirmEdit(record.key, editingValue);
            }
          };

          return (
            <div className={styles["editing-wrapper"]}>
              <Input.TextArea
                autoFocus
                value={editingValue}
                onChange={(e) => onChangeEditingValue(e.target.value)}
                onKeyDown={onKeyDown}
                rows={isValueHidden ? 1 : 3}
              />
              <div className={styles["editing-buttons"]}>
                <Button
                  icon={<CheckOutlined />}
                  type="text"
                  onClick={() => onConfirmEdit(record.key, editingValue)}
                />
                <Button
                  icon={<CloseOutlined />}
                  type="text"
                  onClick={onCancelEditing}
                />
              </div>
            </div>
          );
        }

        if (record.key === NEW_VARIABLE_KEY) {
          const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (newRecord.current.key && newRecord.current.value && newRecord.current.key !== NEW_VARIABLE_KEY) {
                onAdd(newRecord.current.key, newRecord.current.value);
              }
            } else if (e.key === "Escape") {
              e.preventDefault();
              onCancelEditing();
            }
          };

          return (
            <div className={styles["editing-wrapper"]}>
              <Input.TextArea
                ref={newValueInputRef}
                autoFocus
                placeholder="Value"
                defaultValue={record.value}
                onChange={(e) => (newRecord.current.value = e.target.value)}
                onKeyDown={onKeyDown}
                rows={isValueHidden ? 1 : 3}
              />
              <div className={styles["editing-buttons"]}>
                <Button
                  icon={<CheckOutlined />}
                  type="text"
                  onClick={() => {
                    if (newRecord.current.key && newRecord.current.value && newRecord.current.key !== NEW_VARIABLE_KEY) {
                      onAdd(newRecord.current.key, newRecord.current.value);
                    }
                  }}
                />
                <Button
                  icon={<CloseOutlined />}
                  type="text"
                  onClick={onCancelEditing}
                />
              </div>
            </div>
          );
        }

        return (
          <div
            className={styles["editable-cell-wrapper"]}
            onClick={() => onStartEditing(record.key, record.value)}
          >
            <div className={styles["value-text"]}>
              {isValueHidden
                ? "*****"
                : `${record.value.split('\n')[0]}${record.value.includes('\n') || record.value.length > 40 ? '...' : ''}`}
            </div>
            {record.value.includes('\n') && (
              <FileTextOutlined className={`${styles["inline-icon"]} ${styles["multiline-icon"]}`} />
            )}
            <EditOutlined className={`${styles["inline-icon"]} ${styles["edit-icon"]}`} />
          </div>
        );
      },
    },
    {
      title: "",
      key: "actions",
      width: 50,
      fixed: "right" as const,
      align: "right" as const,
      render: (_: any, record: Variable) =>
        record.key !== NEW_VARIABLE_KEY && (
          <Popconfirm title="Delete variable?" onConfirm={() => onDelete(record.key)}>
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
    ...(isAddingNew ? [{ key: NEW_VARIABLE_KEY, value: "" }] : []),
    ...variables,
  ];

  return (
    <TableScroll enableScroll={enableScroll} className={styles["sub-table-wrapper"]}>
      <Table
        className={styles["secret-sub-table"]}
        dataSource={dataWithNewRow}
        columns={columns as any}
        components={{
          header: {
            cell: ResizableTitle,
          },
        }}
        rowKey="key"
        pagination={false}
        size="small"
        rowClassName={() => styles["secret-row"]}
        scroll={{ x: totalColumnsWidth }}
        rowSelection={{
          selectedRowKeys: selectedKeys,
          onChange: (newSelectedKeys) =>
            onSelectedChange(newSelectedKeys as string[]),
        }}
      />
    </TableScroll>
  );
};

export default VariablesTable;
