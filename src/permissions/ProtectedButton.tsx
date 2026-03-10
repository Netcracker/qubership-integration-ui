import { RequiredPermissions } from "./types.ts";
import { TooltipProps } from "antd/es/tooltip";
import { ButtonProps } from "antd/es/button/button";
import React, { ReactNode } from "react";
import { Require } from "./Require.tsx";
import { Button, Tooltip } from "antd";

export type OnDenied = "hide" | "disable";

type ButtonWithTooltipProps = {
  tooltipProps: TooltipProps;
  buttonProps: ButtonProps;
};

type ProtectedButtonProps = ButtonWithTooltipProps & {
  permissions: RequiredPermissions;
  onDenied?: OnDenied;
};

const ButtonWithTooltip: React.FC<ButtonWithTooltipProps> = ({
  tooltipProps,
  buttonProps,
}): ReactNode => {
  return (
    <Tooltip {...tooltipProps}>
      <Button {...buttonProps} />
    </Tooltip>
  );
};

export const ProtectedButton: React.FC<ProtectedButtonProps> = ({
  permissions,
  onDenied = "hide",
  tooltipProps,
  buttonProps,
}): ReactNode => {
  return (
    <Require
      permissions={permissions}
      fallback={
        onDenied === "disable" ? (
          <ButtonWithTooltip
            buttonProps={{ ...buttonProps, disabled: true }}
            tooltipProps={tooltipProps}
          />
        ) : null
      }
    >
      <ButtonWithTooltip
        buttonProps={buttonProps}
        tooltipProps={tooltipProps}
      />
    </Require>
  );
};
