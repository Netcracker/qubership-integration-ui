import { Select, Space } from "antd";
import { WidgetProps } from "@rjsf/utils";

function TagsWidget(props: WidgetProps) {
  const {
    value,
    onChange,
  } = props;

  const handleChange = (selected: any[]) => {
    onChange(Array.isArray(selected) ? selected.join(",") : "");
  };

  return (
    <Space style={{ width: "100%" }} direction="vertical">
      <Select
        mode="tags"
        allowClear
        style={{ width: "100%" }}
        placeholder="Please input"
        onChange={handleChange}
        value={
          typeof value === "string" ? value.split(",").filter(Boolean) : []
        }
      />
    </Space>
  );
}

export default TagsWidget;
