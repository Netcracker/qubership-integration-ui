import { Form, Input, Tabs } from "antd";
import React from "react";

export type DictionaryEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
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
          children: <></>, // TODO
        },
        {
          key: "text",
          label: "Text",
          children: <></>, // TODO
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
