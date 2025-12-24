import React from "react";
import { Result } from "antd";
import type { ResultProps } from "antd";

export const NotImplemented: React.FC<ResultProps> = (props: ResultProps) => {
  return <Result {...props} title="Not implemented yet" />;
};
