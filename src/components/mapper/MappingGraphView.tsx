import React from "react";
import { MappingDescription } from "../../mapper/model/model.ts";
import { Col, Row } from "antd";

export type MappingGraphViewProps = Omit<
  React.HTMLAttributes<HTMLElement>,
  "onChange"
> & {
  elementId: string;
  mapping?: MappingDescription;
  readonlySource?: boolean;
  readonlyTarget?: boolean;
  onChange?: (mapping: MappingDescription) => void;
};

export const MappingGraphView: React.FC<MappingGraphViewProps> = ({
  elementId,
  mapping,
  readonlySource,
  readonlyTarget,
  onChange,
  ...props
}): React.ReactNode => {
  return (
    <>
      <Row gutter={[16, 16]}>
        <Col span={8}></Col>
        <Col span={8}></Col>
        <Col span={8}></Col>
      </Row>
    </>
  );
};
