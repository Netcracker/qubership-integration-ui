import { DeleteOutlined, PlusCircleOutlined } from "@ant-design/icons";
import {
  Button,
  Flex,
  Form,
  Input,
  message,
  Table,
  TableProps,
  Tabs,
} from "antd";
import TextArea from "antd/lib/input/TextArea";
import React, { useCallback, useEffect, useState } from "react";
import { InlineEdit } from "../../../InlineEdit";
import { KeyValuePair, makeString, parse } from "./key-value-text-util";
import { TextValueEdit } from "../../../table/TextValueEdit";

export type DictionaryEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
};

const DictionaryTableEditor: React.FC<DictionaryEditorProps> = ({
  onChange,
  value,
}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [tableData, setTableData] = useState<
    TableProps<KeyValuePair>["dataSource"]
  >([]);

  useEffect(() => {
    try {
      setTableData(parse(value ?? ""));
    } catch (error) {
      messageApi.error(`Invalid dictionary: ${error}`);
      setTableData([]);
    }
  }, [value]);

  const updateRecord = useCallback(
    (index: number, changes: Partial<KeyValuePair>) => {
      setTableData((data) => {
        const result =
          data?.map((r, idx) => (idx === index ? { ...r, ...changes } : r)) ??
          [];
        onChange?.(makeString(result));
        return result;
      });
    },
    [onChange],
  );

  const addRecord = useCallback(() => {
    setTableData((data) => {
      if (tableData?.some((r) => r.key === "")) {
        return data;
      }
      const result = [...(data ?? []), { key: "", value: "" }];
      onChange?.(makeString(result));
      return result;
    });
  }, [onChange]);

  const deleteRecord = useCallback(
    (index: number) => {
      setTableData((data) => {
        const result =
          data?.slice(0, index)?.concat(data?.slice(index + 1)) ?? [];
        onChange?.(makeString(result));
        return result;
      });
    },
    [onChange],
  );

  const clearRecords = useCallback(() => {
    setTableData([]);
    onChange?.(makeString([]));
  }, [onChange]);

  return (
    <>
      {contextHolder}
      <Flex style={{ height: "100%" }} vertical gap={8}>
        <Flex wrap="wrap" vertical={false} gap={8}>
          <Button
            size="small"
            icon={<PlusCircleOutlined />}
            onClick={() => addRecord()}
          >
            Add rule
          </Button>
          <Button
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => clearRecords()}
          >
            Clear rules
          </Button>
        </Flex>
        <Table
          className="flex-table"
          size="small"
          style={{ height: "100%" }}
          scroll={{ y: "" }}
          virtual={true}
          columns={[
            {
              key: "key",
              title: "Input",
              dataIndex: "key",
              sorter: true,
              render: (value: string, _record: KeyValuePair, index: number) => {
                return (
                  <InlineEdit<{ value: string }>
                    values={{ value }}
                    editor={<TextValueEdit name="value" />}
                    viewer={value}
                    initialActive={value === ""}
                    onSubmit={({ value }) => {
                      if (tableData?.some((r) => r.key === value)) {
                        messageApi.error(`Already exists: ${value}`);
                      } else {
                        updateRecord(index, { key: value });
                      }
                    }}
                  />
                );
              },
            },
            {
              key: "value",
              title: "Result",
              dataIndex: "value",
              sorter: true,
              render: (value: string, _record: KeyValuePair, index: number) => {
                return (
                  <InlineEdit<{ value: string }>
                    values={{ value }}
                    editor={<TextValueEdit name="value" rules={[]} />}
                    viewer={value}
                    onSubmit={({ value }) => {
                      updateRecord(index, { value });
                    }}
                  />
                );
              },
            },
            {
              key: "actions",
              className: "actions-column",
              width: 40,
              align: "right",
              render: (_, record: KeyValuePair, index: number) => {
                return (
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={() => deleteRecord(index)}
                  />
                );
              },
            },
          ]}
          dataSource={tableData}
          pagination={false}
          rowKey={(record) => record.key}
        />
      </Flex>
    </>
  );
};

const DictionaryTextEditor: React.FC<DictionaryEditorProps> = ({
  onChange,
  value,
}) => {
  const [text, setText] = useState<string>("");

  useEffect(() => {
    setText(value ?? "");
  }, [value]);

  return (
    <TextArea
      style={{ height: "100%", resize: "none" }}
      autoSize={false}
      value={text}
      onChange={(e) => {
        const v = e.target.value;
        setText(v);
        try {
          parse(v);
          onChange?.(v);
        } catch (_) {}
      }}
    />
  );
};

const DictionaryEditor: React.FC<DictionaryEditorProps> = ({
  onChange,
  value,
}) => {
  return (
    <Tabs
      style={{ height: "100%" }}
      className={"flex-tabs"}
      tabPosition="bottom"
      size="small"
      defaultActiveKey="table"
      items={[
        {
          key: "table",
          label: "Table",
          children: <DictionaryTableEditor value={value} onChange={onChange} />,
        },
        {
          key: "text",
          label: "Text",
          children: <DictionaryTextEditor value={value} onChange={onChange} />,
        },
      ]}
    />
  );
};

export const DictionaryParameters: React.FC = () => {
  return (
    <>
      <Form.Item name={["parameters", 0]} label="Default">
        <Input />
      </Form.Item>
      <Form.Item className={"flex-form-item"} name={["parameters", 1]}>
        <DictionaryEditor />
      </Form.Item>
    </>
  );
};
