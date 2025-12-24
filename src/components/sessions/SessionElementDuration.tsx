import React from "react";
import { ExecutionStatus } from "../../api/apiTypes.ts";
import { theme, GlobalToken, Progress } from "antd";

type SessionElementDurationProps = {
  duration: number;
  sessionDuration: number;
  status: ExecutionStatus;
};

function getStrokeColor(token: GlobalToken, status: ExecutionStatus) {
  switch (status) {
    case ExecutionStatus.IN_PROGRESS:
      return token.colorInfo;
    case ExecutionStatus.COMPLETED_NORMALLY:
      return token.colorSuccess;
    case ExecutionStatus.COMPLETED_WITH_ERRORS:
      return token.colorError;
    case ExecutionStatus.COMPLETED_WITH_WARNINGS:
      return token.colorWarning;
    case ExecutionStatus.CANCELLED_OR_UNKNOWN:
      return token.colorWarning;
    default:
      return token.colorInfo;
  }
}

export const SessionElementDuration: React.FC<SessionElementDurationProps> = ({
  duration,
  sessionDuration,
  status,
}) => {
  const { token } = theme.useToken();

  const percent = 10 + (duration * 90) / sessionDuration;
  return (
    <Progress
      strokeColor={getStrokeColor(token, status)}
      format={() => `${duration} ms`}
      percent={percent}
      percentPosition={{ align: "center", type: "outer" }}
      size="small"
    />
  );
};
