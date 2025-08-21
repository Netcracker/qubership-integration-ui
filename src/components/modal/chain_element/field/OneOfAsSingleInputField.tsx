import React from "react";
import { FieldProps } from "@rjsf/utils";
import { Input } from "antd";

const OneOfAsSingleInputField: React.FC<FieldProps<string>> = ({
  id,
  formData,
  onChange,
  schema,
  uiSchema,
  required,
}) => {
  const title = uiSchema?.["ui:title"] ?? schema?.title ?? "";

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 6,
    fontWeight: 500,
  };
  const requiredStyle: React.CSSProperties = {
    color: "#ff4d4f",
    marginRight: 4,
    fontFamily: "SimSun, sans-serif",
  };

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
        onChange={(e) => onChange(e.target.value || undefined)}
        placeholder={schema.default as string | undefined}
      />
    </div>
  );
};

export default OneOfAsSingleInputField;
