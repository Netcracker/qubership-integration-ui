import React from "react";
import { FieldProps } from "@rjsf/utils";
import { Input } from "antd";
import { labelStyle, requiredStyle } from "./select/Select";

const OneOfAsSingleInputField: React.FC<FieldProps<string>> = ({
  id,
  formData,
  onChange,
  schema,
  uiSchema,
  required,
  fieldPathId,
}) => {
  const title = uiSchema?.["ui:title"] ?? schema?.title ?? "";

  return (
    <div>
      {title ? (
        <label htmlFor={id} style={labelStyle}>
          {required ? <span style={requiredStyle}> *</span> : null}
          {title}
        </label>
      ) : null}

      <Input
        id={id}
        value={formData ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val, fieldPathId.path);
        }}
        placeholder={schema.default as string | undefined}
      />
    </div>
  );
};

export default OneOfAsSingleInputField;
