import { Select, Space } from "antd";
import { WidgetProps } from "@rjsf/utils";

function StringAsMultipleSelectWidget(props: WidgetProps) {
  const { value, name, onChange } = props;

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

export default StringAsMultipleSelectWidget;
