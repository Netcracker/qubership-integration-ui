import { FieldProps } from "@rjsf/utils";
import { JSONSchema7 } from "json-schema";
import { FormContext } from "../../ChainElementModificationContext.ts";
import { SelectAndNavigateField } from "./SelectAndNavigateField.tsx";
import React, { useCallback, useEffect, useState } from "react";
import { MCPSystem } from "../../../../../api/apiTypes.ts";
import type { SelectProps } from "antd";
import { useNotificationService } from "../../../../../hooks/useNotificationService.tsx";
import { api } from "../../../../../api/api.ts";

export const MCPServiceField: React.FC<
  FieldProps<string, JSONSchema7, FormContext>
> = ({ id, formData, schema, required, uiSchema, registry }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [systems, setSystems] = useState<MCPSystem[]>([]);
  const [options, setOptions] = useState<SelectProps<string>["options"]>([]);
  const [systemId, setSystemId] = useState<string>("");
  const [navigationPath, setNavigationPath] = useState<string>("");
  const notificationService = useNotificationService();

  const loadSystems = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await api.getMcpSystems(true);
      setSystems(result);
    } catch (e) {
      notificationService.requestFailed("Failed to load MCP services", e);
      setSystems([]);
    } finally {
      setIsLoading(false);
    }
  }, [notificationService]);

  useEffect(() => {
    void loadSystems();
  }, [loadSystems]);

  useEffect(() => {
    setOptions(
      systems.map((system) => ({
        labelString: system.name,
        label: system.name,
        value: system.id,
      })),
    );
  }, [systems]);

  const title = uiSchema?.["ui:title"] ?? schema?.title ?? "";

  const handleChange = useCallback(
    (newValue: string) => {
      setSystemId(newValue);
      registry.formContext?.updateContext?.({
        mcpServiceId: newValue,
      });
    },
    [registry.formContext],
  );

  useEffect(() => {
    setNavigationPath(`/services/mcp/${systemId}/parameters`);
  }, [systemId]);

  return (
    <SelectAndNavigateField
      id={id}
      title={title}
      required={required}
      selectValue={formData}
      selectOptions={options}
      selectOnChange={handleChange}
      selectDisabled={isLoading}
      buttonTitle="Go to service"
      buttonDisabled={!systemId}
      buttonOnClick={navigationPath}
      selectOptionFilterProp="labelString"
    />
  );
};
