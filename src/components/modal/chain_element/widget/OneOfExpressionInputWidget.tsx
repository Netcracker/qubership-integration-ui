import { WidgetProps } from "@rjsf/utils";
import { Input } from "antd";

function OneOfExpressionInputWidget(props: WidgetProps) {
  const {
    value,
    onChange,
    disabled,
    readonly,
    schema,
    id,
  } = props;
  return (
    <Input
      id={id}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || readonly}
      placeholder={schema?.default?.toString() ?? ""}
    />
  );
}

export default OneOfExpressionInputWidget;
