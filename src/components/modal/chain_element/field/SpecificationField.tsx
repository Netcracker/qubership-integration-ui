import React, { useEffect, useState } from "react";
import { FieldProps } from "@rjsf/utils";
import { Select, SelectProps } from "antd";
import { FormContext } from "../ChainElementModification";
import { api } from "../../../../api/api";
import { useNotificationService } from "../../../../hooks/useNotificationService";
import { Specification, SpecificationGroup } from "../../../../api/apiTypes";

const SpecificationField: React.FC<FieldProps> = ({
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
  const [specIdToGroupIdMap, setSpecIdToGroupIdMap] = useState<Map<string, string>>(new Map());
  const systemId = (formContext as FormContext).integrationSystemId;

  const buildSpecificationOptions = (
    specifications: Specification[] | undefined,
  ): SelectProps["options"] => {
    return (
      specifications?.map((spec) => ({
        label: spec.name,
        value: spec.id,
      })) ?? []
    );
  };

  const buildSpecToGroupMap = (
    groups: SpecificationGroup[],
  ): Map<string, string> => {
    const result: Map<string, string> = new Map();
    for (const group of groups) {
      for (const spec of group.specifications) {
        result.set(spec.id, group.id);
      }
    }
    return result;
  };

  useEffect(() => {
    console.log(`load specification groups, systemId = ${systemId}`);
    const loadSpecificationGroups = async () => {
      if (systemId) {
        try {
          const groups = await api.getApiSpecifications(systemId);

          const groupOptions: SelectProps["options"] =
            groups?.map((group) => ({
              label: <span>{group.name}</span>,
              title: group.name,
              options: buildSpecificationOptions(group.specifications),
            })) ?? [];
          setOptions(groupOptions);
          setSpecIdToGroupIdMap(buildSpecToGroupMap(groups));
        } catch (error) {
          notificationService.requestFailed(
            "Failed to load specification groups",
            error,
          );
        }
      }
    };

    void loadSpecificationGroups();
  }, []);

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
    const context = formContext as FormContext;
    context.integrationOperationId = undefined;
    context.integrationSpecificationId = newValue;
    context.integrationSpecificationGroupId = specIdToGroupIdMap.get(newValue);

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

export default SpecificationField;
