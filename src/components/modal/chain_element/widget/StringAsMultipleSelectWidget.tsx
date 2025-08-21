import React from "react";
import { Select } from "antd";
import { WidgetProps } from "@rjsf/utils";

const StringAsMultipleSelectWidget: React.FC<WidgetProps> = ({
  value,
  name,
  onChange,
}) => {
  const options =
    name === "httpMethodRestrict"
      ? [
          { value: "GET" },
          { value: "POST" },
          { value: "PUT" },
          { value: "PATCH" },
          { value: "DELETE" },
          { value: "OPTIONS" },
        ]
      : [];

  const handleChange = (selected: string[]) => {
    onChange(selected.join(","));
  };

  return (
    <Select
      mode="multiple"
      allowClear
      style={{ width: "100%" }}
      placeholder="Please select"
      options={options}
      onChange={handleChange}
      value={typeof value === "string" ? value.split(",").filter(Boolean) : []}
    />
  );
};

export default StringAsMultipleSelectWidget;
