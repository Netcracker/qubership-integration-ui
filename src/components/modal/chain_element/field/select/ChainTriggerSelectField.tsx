import { FieldProps } from "@rjsf/utils";
import { JSONSchema7 } from "json-schema";
import React, { useCallback, useEffect, useState } from "react";
import { FormContext } from "../../ChainElementModification";
import { SelectAndNavigateField } from "./SelectAndNavigateField";
import { SelectProps } from "antd";
import { useNotificationService } from "../../../../../hooks/useNotificationService";
import { api } from "../../../../../api/api";
import { ElementWithChainName } from "../../../../../api/apiTypes";
import { VSCodeExtensionApi } from "../../../../../api/rest/vscodeExtensionApi";

const ChainTriggerSelectField: React.FC<
  FieldProps<string, JSONSchema7, FormContext>
> = ({ id, formData, schema, required, uiSchema, onChange, fieldPathId }) => {
  const [elementId, setElementId] = useState<string | undefined>(formData);
  const [elementsMap, setElementsMap] = useState<
    Map<string, ElementWithChainName>
  >(new Map());
  const [options, setOptions] = useState<SelectProps["options"]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const notificationService = useNotificationService();

  const title = uiSchema?.["ui:title"] ?? schema?.title ?? "";

  useEffect(() => {
    const loadHttpTriggerElements = async () => {
      setIsLoading(true);

      try {
        const elements: ElementWithChainName[] =
          await api.getAllElementsByType("chain-trigger-2");
        setElementsMap(
          new Map(elements.map((element) => [element.id, element])),
        );
        const options: SelectProps["options"] = elements.map((element) => ({
          value: element.id,
          label: (
            <>
              {element.chainName} - {element.name}
            </>
          ),
        }));
        setOptions(options);
      } catch (error) {
        notificationService.requestFailed(
          "Failed to load chain trigger elements",
          error,
        );
      } finally {
        setIsLoading(false);
      }
    };
    void loadHttpTriggerElements();
  }, []);

  const handleChange = useCallback((newValue: string) => {
    setElementId(newValue);
    onChange(newValue, fieldPathId.path);
  }, []);

  const onNavigationButtonClick = useCallback(() => {
    if (elementId) {
      const chainId = elementsMap.get(elementId)?.chainId;
      const path = `/chains/${chainId}`;
      if (api instanceof VSCodeExtensionApi) {
        void api.navigateInNewTab(path);
      } else {
        window.open(path, "_blank");
      }
    }
  }, [elementId, elementsMap]);

  return (
    <SelectAndNavigateField
      id={id}
      title={title}
      required={required}
      selectValue={elementId}
      selectOptions={options}
      selectOnChange={handleChange}
      selectDisabled={isLoading}
      buttonTitle="Go to specification"
      buttonDisabled={!elementId}
      buttonOnClick={onNavigationButtonClick}
    />
  );
};

export default ChainTriggerSelectField;
