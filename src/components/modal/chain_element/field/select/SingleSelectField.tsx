import React, { useEffect, useState } from "react";
import { Select } from "antd";
import { FieldProps } from "@rjsf/utils";
import { api } from "../../../../../api/api.ts";
import { JSONSchema7 } from "json-schema";
import { FormContext } from "../../ChainElementModification.tsx";
import { SelectTag } from "./SelectTag.tsx";
import { ElementWithChainName } from "../../../../../api/apiTypes.ts";

type OptionType = {
  value: string;
  label: React.ReactNode;
};

const SingleSelectField: React.FC<
  FieldProps<string, JSONSchema7, FormContext>
> = ({
  id,
  name,
  formData,
  required,
  onChange,
  schema,
  uiSchema,
  registry,
  fieldPathId,
}) => {
  const [options, setOptions] = useState<OptionType[]>([]);

  const chainId = registry.formContext.chainId;
  const title = uiSchema?.["ui:title"] ?? schema?.title ?? "";

  useEffect(() => {
    async function load() {
      let list: ElementWithChainName[] = [];

      if (name === "elementId") {
        list = await api.getElementsByType("any-chain", "chain-trigger-2");
        setOptions(
          list.map((element) => ({
            value: element.id,
            label: (
              <>
                <SelectTag value={element.chainName} />
                {element.name}
              </>
            ),
          })),
        );
      }

      if (name === "reuseElementId") {
        list = await api.getElementsByType(chainId ?? "", "reuse");
        setOptions(
          list.map((element) => ({
            value: element.id,
            label: element.name,
          })),
        );
      }
    }

    void load();
  }, [name, chainId]);

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 6,
    fontWeight: 500,
  };

  const requiredMark = required ? (
    <span style={{ color: "#ff4d4f", marginRight: 4 }}>*</span>
  ) : null;

  const handleChange = (selected: string) => {
    onChange(selected, fieldPathId.path);
  };

  return (
    <div>
      <label htmlFor={id} style={labelStyle}>
        {requiredMark}
        {title}
      </label>

      <Select
        style={{ width: "100%" }}
        placeholder="Select element"
        value={formData}
        onChange={handleChange}
        options={options}
      />
    </div>
  );
};

export default SingleSelectField;
