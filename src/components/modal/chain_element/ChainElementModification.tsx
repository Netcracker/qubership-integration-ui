import React, { useEffect, useState, useMemo, useRef } from "react";
import { Button, Modal, Tabs } from "antd";
import { useModalContext } from "../../../ModalContextProvider.tsx";
import styles from "./ChainElementModification.module.css";
import { Element, PatchElementRequest } from "../../../api/apiTypes.ts";
import { useLibraryElement } from "../../../hooks/useLibraryElement.tsx";
import Form from "@rjsf/antd";
import yaml from "js-yaml";
import { useElement } from "../../../hooks/useElement.tsx";
import { useNotificationService } from "../../../hooks/useNotificationService.tsx";
import {
  ObjectFieldTemplateProps,
  ErrorListProps,
  RegistryWidgetsType,
} from "@rjsf/utils";
import type { JSONSchema7 } from "json-schema";
import validator from "@rjsf/validator-ajv8";
import MultipleSelectWidget from "./widget/MultipleSelectWidget.tsx";
import TagsWidget from "./widget/TagsWidget.tsx";
import OneOfExpressionInputWidget from "./widget/OneOfExpressionInputWidget.tsx";

import {
  INITIAL_UI_SCHEMA,
  pathToTabMap,
  desiredTabOrder,
} from "./ChainElementModificationConstants.ts";
import { ChainGraphNode } from "../../graph/nodes/ChainGraphNodeTypes.ts";

type ElementModificationProps = {
  node: ChainGraphNode;
  chainId: string;
  elementId: string;
  onSubmit: (changedElement: Element, node: ChainGraphNode) => void;
  onClose?: () => void;
};

function constructTitle(name: string, type?: string): string {
  return type ? `${name} (${type})` : `${name}`;
}

export const ChainElementModification: React.FC<ElementModificationProps> = ({
  node,
  chainId,
  elementId,
  onSubmit,
  onClose,
}) => {
  const { isLoading: libraryElementIsLoading, libraryElement } =
    useLibraryElement(node.data.elementType);
  const [isLoading, setIsLoading] = useState(false);
  const { closeContainingModal } = useModalContext();
  const { updateElement } = useElement();
  const notificationService = useNotificationService();
  const constructTitle = (name: string, type?: string) => {
    return type ? `${name} (${type})` : `${name}`;
  };
  const [title, setTitle] = useState(constructTitle(`${node.data.label}`));
  const [schema, setSchema] = useState<any>(null);
  const formRef = useRef<any>(null);

  const { TabPane } = Tabs;

  function ErrorListTemplate(props: ErrorListProps) {
    return <div></div>;
  }

  useEffect(() => {
    setTitle(constructTitle(`${node.data.label}`, libraryElement?.title));
  }, [libraryElement, node]);

  //old way to fetch schema from public/schema/element
  useEffect(() => {
    fetch("/schema/element/" + node.data.elementType + ".schema.yaml")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.text();
      })
      .then((text) => {
        const parsed = yaml.load(text);
        console.log("parsed yaml:", parsed);
        setSchema(parsed);
        console.log("Node:", node);
        formDataRef.current = node.data;
        formDataRef.current.id = node.id;
      })
      .catch((err) => {
        console.error("ERROR:", err);
      });
  }, [node.type]);

  const handleOk = async () => {
    setIsLoading(true);
    try {
      console.log("formCurrent:", formRef.current);
      const request: PatchElementRequest = {
        name: formDataRef.current.name,
        description: formDataRef.current.description,
        type: node.data.elementType,
        parentElementId: node.parentId,
        properties: formDataRef.current.properties,
      };
      const changedElement: Element | undefined = await updateElement(
        chainId,
        elementId,
        request,
      );
      if (changedElement) {
        onSubmit?.(changedElement, node);
      }
    } catch (error) {
      notificationService.errorWithDetails(
        "Save element failed",
        "Failed to save element",
        error,
      );
    } finally {
      setIsLoading(false);
      handleClose();
    }
  };

  const handleClose = () => {
    closeContainingModal();
    onClose?.();
  };

  const [activeKey, setActiveKey] = useState<string>();

  const formDataRef = useRef({});

  const tabFields = useMemo(() => {
    if (!schema) return [];
    return collectTabFields(schema);
  }, [schema]);

  const uniqueTabs = useMemo(() => {
    const rawTabs = new Set(tabFields.map((f) => f.tab));
    return desiredTabOrder.filter(rawTabs.has.bind(rawTabs));
  }, [tabFields]);

  const CustomObjectFieldTemplate = ({
    properties,
  }: ObjectFieldTemplateProps) => {
    return (
      <div>
        {properties
          // WA to hide array properties
          .filter(
            (prop) =>
              !prop.content.props?.uiSchema?.["ui:widget"]?.includes("hidden"),
          )
          .map((prop) => prop.content)}
      </div>
    );
  };

  useEffect(() => {
    if (uniqueTabs.length > 0 && !activeKey) {
      setActiveKey(uniqueTabs[0]);
    }
  }, [uniqueTabs, activeKey]);

  function buildUiSchemaForTab(
    tabFields: TabField[],
    tab: string,
    schema: JSONSchema7,
    initialUiSchema: any,
  ): any {
    const hiddenUiSchema: any = {};

    function setPath(obj: any, path: string[], value: any) {
      let curr = obj;
      for (let i = 0; i < path.length - 1; i++) {
        curr[path[i]] = curr[path[i]] || {};
        curr = curr[path[i]];
      }
      curr[path[path.length - 1]] = value;
    }

    const visiblePaths = tabFields
      .filter((f) => f.tab === tab)
      .map((f) => f.path.map((p) => ["properties", p]).flat());

    function buildHiddenUiSchema(schema: any, path: string[] = []) {
      const combinators = ["allOf", "anyOf", "oneOf"] as const;
      for (const keyword of combinators) {
        if (Array.isArray(schema[keyword])) {
          for (const subSchema of schema[keyword]) {
            if (typeof subSchema === "object" && subSchema !== null) {
              buildHiddenUiSchema(subSchema, path);
            }
          }
        }
      }

      if (schema.if) {
        if (schema.then) {
          buildHiddenUiSchema(schema.then, path);
        }
        if (schema.else) {
          buildHiddenUiSchema(schema.else, path);
        }
      }

      if (schema && schema.properties) {
        for (const key of Object.keys(schema.properties)) {
          const currentPath = [...path, key];
          const fullPath = currentPath.map((p) => ["properties", p]).flat();

          const isVisible = visiblePaths.some(
            (v) => v.join(".") === fullPath.join("."),
          );

          if (
            (schema.properties[key].type === "object" && isVisible) ||
            key === "properties"
          ) {
            buildHiddenUiSchema(schema.properties[key], currentPath);
          } else if (!isVisible) {
            setPath(hiddenUiSchema, currentPath, { "ui:widget": "hidden" });
          }
        }
      }
    }

    buildHiddenUiSchema(schema);

    const finalUiSchema = structuredClone(initialUiSchema || {});
    applyHiddenUiSchema(finalUiSchema, hiddenUiSchema);
    return finalUiSchema;
  }

  const widgets: RegistryWidgetsType = {
    multipleSelectWidget: MultipleSelectWidget,
    tagsWidget: TagsWidget,
    oneOfExpressionInputWidget: OneOfExpressionInputWidget,
  };

  type TabField = {
    tab: string;
    path: string[];
    schema: JSONSchema7;
  };

  function collectTabFields(
    schema: JSONSchema7,
    path: string[] = [],
    acc: TabField[] = [],
  ): TabField[] {
    const currentPath = path.join(".");

    if (schema.properties && typeof schema.properties === "object") {
      for (const [key, subSchema] of Object.entries(schema.properties)) {
        collectTabFields(subSchema as JSONSchema7, [...path, key], acc);
      }
    }

    const combinators = ["allOf", "anyOf", "oneOf"] as const;
    for (const keyword of combinators) {
      if (Array.isArray(schema[keyword])) {
        for (const subSchema of schema[keyword]) {
          if (typeof subSchema === "object" && subSchema !== null) {
            collectTabFields(subSchema, path, acc);
          }
        }
      }
    }

    if (schema.type === "array" && schema.items) {
      if (Array.isArray(schema.items)) {
        for (let i = 0; i < schema.items.length; i++) {
          collectTabFields(
            schema.items[i] as JSONSchema7,
            [...path, `${i}`],
            acc,
          );
        }
      } else {
        collectTabFields(schema.items as JSONSchema7, [...path, "items"], acc);
      }
    }

    if (schema.if) {
      if (schema.then) {
        collectTabFields(schema.then as JSONSchema7, path, acc);
      }
      if (schema.else) {
        collectTabFields(schema.else as JSONSchema7, path, acc);
      }
    }

    if (path.length > 0) {
      const tab = pathToTabMap[currentPath] || "Parameters";
      acc.push({ tab, path, schema });
    }

    return acc;
  }

  function applyHiddenUiSchema(target: any, hidden: any) {
    for (const key in hidden) {
      if (
        hidden[key] &&
        typeof hidden[key] === "object" &&
        !Array.isArray(hidden[key])
      ) {
        if (!target[key]) target[key] = {};
        applyHiddenUiSchema(target[key], hidden[key]);
      } else {
        target[key] = hidden[key];
      }
    }
  }

  const uiSchema = useMemo(() => {
    if (!schema) return [];
    return buildUiSchemaForTab(
      tabFields,
      activeKey ?? "",
      schema,
      INITIAL_UI_SCHEMA,
    );
  }, [tabFields, activeKey, schema, INITIAL_UI_SCHEMA]);

  const handleTabChange = (newTab: string) => {
    setActiveKey(newTab);
  };

  return (
    <Modal
      open
      title={title}
      onCancel={handleClose}
      maskClosable={false}
      loading={libraryElementIsLoading}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          form="elementModificationForm"
          htmlType={"submit"}
          loading={isLoading}
          onClick={handleOk}
        >
          Save
        </Button>,
      ]}
      classNames={{
        content: styles["modal"],
      }}
    >
      {schema && activeKey && (
        <>
          <Tabs activeKey={activeKey} onChange={handleTabChange} type="card">
            {uniqueTabs.map((tab) => (
              <TabPane tab={tab} key={tab} />
            ))}
          </Tabs>
          <Form
            id="elementModificationForm"
            ref={formRef}
            schema={schema}
            formData={formDataRef.current}
            validator={validator}
            uiSchema={uiSchema}
            liveValidate={true}
            experimental_defaultFormStateBehavior={{
              allOf: "populateDefaults",
              mergeDefaultsIntoFormData: "useFormDataIfPresent",
            }}
            templates={{
              ObjectFieldTemplate: CustomObjectFieldTemplate,
              ErrorListTemplate,
            }}
            widgets={widgets}
            onChange={(e) => {
              formDataRef.current = e.formData;
            }}
          />
        </>
      )}
    </Modal>
  );
};
