import { Select } from "antd";
import { WidgetProps } from "@rjsf/utils";

function CustomSelectWidget(props: WidgetProps) {
  const { value, name, onChange } = props;

  console.log("11WIDGET -> val to onChange:", value, "type:", typeof value);

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
    console.log("isArray", Array.isArray(selected));
    onChange(Array.isArray(selected) ? selected : []);
  };

  return (
    <Select
      mode={mode}
      allowClear
      style={{ width: "100%" }}
      placeholder="Please input"
      onChange={(val: string[]) => {
        console.log("WIDGET -> val to onChange:", val, "type:", typeof val);
        handleChange(val);
      }}
      value={value}
      options={options}
    />
  );
}

export default CustomSelectWidget;
