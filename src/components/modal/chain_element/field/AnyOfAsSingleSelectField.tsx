import React from "react";
import { Select } from "antd";
import { FieldProps } from "@rjsf/utils";

const AnyOfAsSingleSelectField: React.FC<FieldProps<string>> = ({
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

  const options: { value: string }[] = [
    { value: "org.apache.kafka.common.serialization.ByteArraySerializer" },
    { value: "org.apache.kafka.common.serialization.ByteBufferSerializer" },
    { value: "org.apache.kafka.common.serialization.BytesSerializer" },
    { value: "org.apache.kafka.common.serialization.DoubleSerializer" },
    { value: "org.apache.kafka.common.serialization.FloatSerializer" },
    { value: "org.apache.kafka.common.serialization.IntegerSerializer" },
    { value: "org.apache.kafka.common.serialization.LongSerializer" },
    { value: "org.apache.kafka.common.serialization.ShortSerializer" },
    { value: "org.apache.kafka.common.serialization.StringSerializer" },
    { value: "org.apache.kafka.common.serialization.UUIDSerializer" },
    { value: "org.apache.kafka.common.serialization.VoidSerializer" },
  ];

  const handleChange = (selected: string[]) => {
    onChange(Array.isArray(selected) ? selected[0] : "");
  };

  return (
    <div>
      {title ? (
        <label htmlFor={id} style={labelStyle}>
          {required ? <span style={requiredStyle}> *</span> : null}
          {title}
        </label>
      ) : null}
      <Select
        mode="tags"
        allowClear={false}
        maxCount={1}
        style={{ width: "100%" }}
        placeholder={schema.default as string | undefined}
        value={formData ? [String(formData)] : []}
        onChange={handleChange}
        options={options}
      />
    </div>
  );
};
export default AnyOfAsSingleSelectField;
