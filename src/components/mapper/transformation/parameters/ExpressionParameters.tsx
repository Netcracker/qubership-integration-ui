import { Form } from "antd";
import { ExpressionEditor } from "./ExpressionEditor";

export type ExpressionParametersProps = {
    label?: string;
    offset?: number;
}

export const ExpressionParameters: React.FC<ExpressionParametersProps> = ({
    label,
    offset = 0,
}) => {
  return (
    <Form.Item
      name={["parameters", offset]}
      label={label}
      layout="vertical"
      labelCol={{ flex: "0" }}
      // TODO expression validation
      rules={[{ required: true, message: "Expression is required" }]}
    >
      <ExpressionEditor />
    </Form.Item>
  );
}