import { FieldProps } from "@rjsf/utils";
import { Input } from "antd";
import { FormContext } from "../../ChainElementModification";
import { useEffect, useState } from "react";

export const ServiceTypeField: React.FC<FieldProps> = ({
  id,
  formData,
  onChange,
  schema,
  required,
  uiSchema,
  registry,
  formContext,
}) => {
  //const valueFromContext = formContext.systemType;
  //const [value, setValue] = useState<string | undefined>(formData /* formContext.systemType */);
  const value = (formContext as FormContext).systemType;

  /* useEffect(() => {
    setValue(formContext.systemType);
    console.log(`Service Type value from context: ${value}`);
  }, [formContext.systemType]); */

  //const valueFromContext = (formContext as FormContext).systemType;

  return (<Input value={value} onChange={onChange}/>);
};
