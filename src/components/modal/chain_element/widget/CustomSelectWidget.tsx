import React from "react";
import { Select } from "antd";
import { WidgetProps } from "@rjsf/utils";
import { JSONSchema7 } from "json-schema";

const CustomSelectWidget: React.FC<WidgetProps> = ({
  value,
  name,
  onChange,
  schema,
}) => {
  console.log("value", value);
  function collectOptions(schema: JSONSchema7): { value: string }[] {
    const values: string[] = [];

    if (
      schema.type === "array" &&
      typeof schema.items === "object" &&
      schema.items !== null &&
      Array.isArray((schema.items as JSONSchema7).enum)
    ) {
      values.push(...((schema.items as JSONSchema7).enum as string[]));
    }

    return [...new Set(values)].map((val) => ({ value: val }));
  }

  const modeMap: Record<string, "multiple" | "tags"> = {
    synchronousPullRetryableCodes: "multiple",
  };

  const mode = modeMap[name] ?? "tags";

  const handleChange = (selected: string[]) => {
    onChange(selected);
  };

  return (
    <Select
      mode={mode}
      allowClear
      style={{ width: "100%" }}
      placeholder="Please input"
      onChange={handleChange}
      value={Array.isArray(value) ? value : []}
      options={collectOptions(schema)}
    />
  );
};

export default CustomSelectWidget;
