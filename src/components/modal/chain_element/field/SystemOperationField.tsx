import React, { useEffect, useState } from "react";
import { FieldProps } from "@rjsf/utils";
import { Select, SelectProps } from "antd";
import { FormContext } from "../ChainElementModification";
import { api } from "../../../../api/api";
import { useNotificationService } from "../../../../hooks/useNotificationService";

const SystemOperationField: React.FC<FieldProps> = ({
  id,
  formData,
  onChange,
  schema,
  required,
  uiSchema,
  formContext,
}) => {
  const notificationService = useNotificationService();
  const [options, setOptions] = useState<SelectProps["options"]>([]);
  const specificationId = (formContext as FormContext).integrationSpecificationId;

  useEffect(() => {
    const loadOperations = async () => {
      if (specificationId) {
        try {
          const operations = await api.getOperations(specificationId);

          const operationOptions: SelectProps["options"] =
            operations?.map((operation) => ({
              label: `${operation.name} ${operation.method} ${operation.path}`,
              value: operation.id,
            })) ?? [];
          setOptions(operationOptions);
        } catch (error) {
          notificationService.requestFailed(
            "Failed to load operations",
            error,
          );
        }
      }
    };

    void loadOperations();
  }, [specificationId]);

  const title = uiSchema?.["ui:title"] ?? schema?.title ?? "";

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 6,
    fontWeight: 500,
  };

  const requiredStyle: React.CSSProperties = {
    color: "#ff4d4f",
    marginRight: 4,
  };

  const handleChange = (newValue: string) => {
    onChange(newValue);
  };

  return (
    <div>
      <label htmlFor={id} style={labelStyle}>
        {required ? <span style={requiredStyle}> *</span> : null}
        {title}
      </label>
      <Select value={formData} options={options} onChange={handleChange} />
    </div>
  );
};

export default SystemOperationField;
