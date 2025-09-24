import React from "react";
import { FieldProps } from "@rjsf/utils";
import { Select, SelectProps } from "antd";
import { useServices } from "../../../../hooks/useServices";
import { IntegrationSystem } from "../../../../api/apiTypes";
import { FormContext } from "../ChainElementModification";

const ServiceField: React.FC<FieldProps> = ({
  id,
  formData,
  onChange,
  schema,
  required,
  uiSchema,
  registry,
  formContext,
}) => {
  const { services } = useServices();
  const servicesMap: Map<string, IntegrationSystem> = new Map(
    services.map((service) => [service.id, service]),
  );

  const serviceOptions: SelectProps["options"] =
    services?.map((service: IntegrationSystem) => ({
      label: `${service.type} ${service.name}`,
      value: service.id,
    })) ?? [];

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

  const handleChange = (newFormData: string) => {
    //registry.formContext.formData.systemType = "EXT1";
    //console.log(JSON.stringify(registry.formContext));
    //(formContext as FormContext).systemType = "IMPLEMENTED";

    const newService: IntegrationSystem = servicesMap.get(newFormData)!;
    const customContext = formContext as FormContext;
    console.log(`service changed, newFormData: ${newFormData}`);
    customContext.systemType = newService.type.toString();
    customContext.integrationSystemId = newFormData;
    customContext.integrationSpecificationGroupId = undefined;
    customContext.integrationSpecificationId = undefined;
    customContext.integrationOperationId = undefined;
    onChange(newFormData);
  };

  return (
    <div>
      <label htmlFor={id} style={labelStyle}>
        {required ? <span style={requiredStyle}> *</span> : null}
        {title}
      </label>
      <Select
        value={formData}
        options={serviceOptions}
        onChange={handleChange}
      />
    </div>
  );
};

export default ServiceField;
