import { TextValueEdit } from "../table/TextValueEdit.tsx";
import { DeleteOutlined } from "@ant-design/icons";
import { Button, Form } from "antd";
import { SelectEdit } from "../table/SelectEdit.tsx";
import { PLACEHOLDER } from "../../misc/format-utils.ts";
import { NumberValueEdit } from "../table/NumberValueEdit.tsx";
import React from "react";

type DefaultValueEditProps = {
  name: string;
  type: "string" | "number" | "boolean";
};

export const DefaultValueEdit: React.FC<DefaultValueEditProps> = ({
  name,
  type,
}) => {
  const form = Form.useFormInstance();

  return type === "string" ? (
    <TextValueEdit
      name={name}
      rules={[]}
      inputProps={{
        allowClear: true,
        addonAfter: (
          <DeleteOutlined
            onClick={() => {
              form.setFieldValue(name, undefined);
              form.submit();
            }}
          />
        ),
      }}
    />
  ) : type === "number" ? (
    <NumberValueEdit
      name={name}
      rules={[]}
    />
  ) : (
    <SelectEdit<string>
      name={name}
      options={[
        { value: "", label: PLACEHOLDER },
        {
          value: "false",
          label: "false",
        },
        { value: "true", label: "true" },
      ]}
    />
  );
};
