import React from "react";
import { Select } from "antd";
import { WidgetProps } from "@rjsf/utils";

const CustomSelectWidget: React.FC<WidgetProps> = ({
  value,
  name,
  onChange,
}) => {
  const optionsMap: Record<string, { value: string }[]> = {
    synchronousPullRetryableCodes: [
      { value: "ABORTED" },
      { value: "CANCELLED" },
      { value: "DEADLINE_EXCEEDED" },
      { value: "INTERNAL" },
      { value: "RESOURCE_EXHAUSTED" },
      { value: "UNKNOWN" },
      { value: "UNAVAILABLE" },
    ],
  };

  const modeMap: Record<string, "multiple" | "tags"> = {
    synchronousPullRetryableCodes: "multiple",
  };

  const options = optionsMap[name] ?? [];
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
      options={options}
    />
  );
};

export default CustomSelectWidget;
