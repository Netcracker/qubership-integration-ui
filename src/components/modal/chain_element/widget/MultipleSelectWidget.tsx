import { Select, Space } from "antd";
import { WidgetProps } from "@rjsf/utils";

function MultipleSelectWidget(props: WidgetProps) {
  const { value, name, onChange } = props;

  const options =
    name === "httpMethodRestrict"
      ? [
          { label: "GET", value: "GET" },
          { label: "POST", value: "POST" },
          { label: "PUT", value: "PUT" },
          { label: "PATCH", value: "PATCH" },
          { label: "DELETE", value: "DELETE" },
          { label: "OPTIONS", value: "OPTIONS" },
        ]
      : [];

  const handleChange = (selected: any[]) => {
    onChange(Array.isArray(selected) ? selected.join(",") : "");
  };

  return (
    <Space style={{ width: "100%" }} direction="vertical">
      <Select
        mode="multiple"
        allowClear
        style={{ width: "100%" }}
        placeholder="Please select"
        options={options}
        onChange={handleChange}
        value={
          typeof value === "string" ? value.split(",").filter(Boolean) : []
        }
      />
    </Space>
  );
}

export default MultipleSelectWidget;
