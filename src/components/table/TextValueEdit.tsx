import React, { useContext } from "react";
import { InlineEditContext } from "../InlineEdit.tsx";
import { Form, Input } from "antd";
import { Rule } from "antd/lib/form/index";

export type TextValueEditorProps = {
  name: string;
  rules?: Rule[];
};

export const TextValueEdit: React.FC<TextValueEditorProps> = ({
  name,
  rules,
}) => {
  const inlineEditContext = useContext(InlineEditContext);
  const form = Form.useFormInstance();

  return (
    <Form.Item
      name={name}
      rules={rules ?? [{ required: true, message: "Value is required." }]}
      style={{ marginBottom: 0 }}
    >
      <Input
        autoFocus
        onPressEnter={() => form.submit()}
        onBlur={() => inlineEditContext?.toggle()}
      />
    </Form.Item>
  );
};
