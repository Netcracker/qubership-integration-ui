import React, { useEffect, useMemo, useState } from "react";
import { Button, Select, List } from "antd";
import { MappingDescription } from "../../../../mapper/model/model.ts";
import { MappingUtil } from "../../../../mapper/util/mapping.ts";
import { Mapping } from "../../../mapper/Mapping.tsx";
import { api } from "../../../../api/api.ts";
import { Script } from "../../../Script.tsx";
import { FormContext } from "../ChainElementModification.tsx";
import styles from "./CustomArrayField.module.css";
import { Icon } from "../../../../IconProvider.tsx";

type BaseItem = {
  id: string;
  code: string;
  type: string;
  label: string;
  wildcard: boolean;
  script?: string;
  mappingDescription?: MappingDescription;
};

export type AfterValidation = BaseItem & {
  type: "responseValidation";
  schema: string;
  contentType: string;
};

export type HandleResponse = BaseItem;

type ArrayItem = AfterValidation | HandleResponse;

const actionOptions = [
  { value: "none", label: "None" },
  { value: "script", label: "Scripting" },
  { value: "mapper-2", label: "Mapper" },
];

const defaultCodeOptions = [
  { value: "1xx" },
  { value: "2xx" },
  { value: "3xx" },
  { value: "4xx" },
  { value: "5xx" },
  { value: "Default" },
];

type Props = {
  name?: string;
  formData?: ArrayItem[];
  onChange: (data: ArrayItem[]) => void;
  disabled?: boolean;
  readonly?: boolean;
  formContext?: FormContext;
};

const CustomArrayField: React.FC<Props> = ({
  name,
  formData = [],
  onChange,
  disabled,
  readonly,
  formContext,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    formData.length > 0 ? 0 : null,
  );

  const readOnlyMode = useMemo(() => {
    if (formContext?.elementType === "async-api-trigger") {
      return true;
    }

    return name === "afterValidation";
  }, [name, formContext]);

  const [availableCodes, setAvailableCodes] = useState<{ value: string }[]>(
    readOnlyMode || formContext?.integrationOperationProtocolType !== "http"
      ? []
      : defaultCodeOptions,
  );

  const [selectedCode, setSelectedCode] = useState<string | undefined>();
  const [validationSchemas, setValidationSchemas] = useState<
    Record<string, AfterValidation>
  >({});

  const operationId = formContext?.operationId;

  useEffect(() => {
    let cancelled = false;

    const loadOperationInfo = async () => {
      if (!operationId) return;
      try {
        const operationInfo = await api.getOperationInfo(operationId);
        if (cancelled) return;

        const responseSchemas = operationInfo?.responseSchemas || {};
        if (readOnlyMode) {
          setValidationSchemas(
            Object.entries(responseSchemas).reduce(
              (acc, [code, mediaTypes]) => {
                Object.entries(mediaTypes as Record<string, object>).forEach(
                  ([contentType, schema]) => {
                    const id = `${code}-${contentType}`;
                    acc[id] = {
                      id,
                      code,
                      type: "responseValidation",
                      label: id,
                      schema: JSON.stringify(schema, null, 2),
                      wildcard: false,
                      contentType,
                    };
                  },
                );
                return acc;
              },
              {} as Record<string, AfterValidation>,
            ),
          );

          const usedIds = formData.map((f) => f.id);

          setAvailableCodes(
            Object.keys(validationSchemas)
              .filter((id) => !usedIds.includes(id))
              .map((id) => ({ value: id })),
          );
        } else {
          const responseCodes = Object.keys(responseSchemas).map((c) => ({
            value: c,
          }));

          const freshCodes = [...availableCodes, ...responseCodes].filter(
            (codes, idx, arr) =>
              arr.findIndex((cc) => cc.value === codes.value) === idx &&
              formData.find((item) => item.code === codes.value) === undefined,
          );

          setAvailableCodes(freshCodes);
        }
      } catch (err) {
        console.error("Failed to fetch operation info:", err);
      }
    };

    void loadOperationInfo();

    return () => {
      cancelled = true;
    };
  }, [operationId]);

  const handleAdd = () => {
    if (!selectedCode) return;
    if (formData.some((f) => f.code === selectedCode)) return;

    let newItem;
    if (readOnlyMode) {
      newItem = {
        code: validationSchemas[selectedCode].code,
        id: selectedCode,
        label: selectedCode,
        type: "responseValidation",
        wildcard: false,
        contentType: validationSchemas[selectedCode].contentType,
        schema: validationSchemas[selectedCode].schema,
      } as AfterValidation;
    } else {
      newItem = {
        code: selectedCode,
        id: selectedCode,
        label: selectedCode,
        type: "none",
        wildcard: false,
      } as HandleResponse;
    }

    const newArray = [...formData, newItem];
    onChange(newArray);
    setSelectedIndex(newArray.length - 1);
    setSelectedCode(undefined);
    setAvailableCodes(
      availableCodes.filter((codes) => codes.value !== selectedCode),
    );
  };

  const handleDelete = (index: number) => {
    setAvailableCodes([
      ...availableCodes,
      {
        value: readOnlyMode ? formData[index].id : formData[index].code,
      },
    ]);
    const newArray = [...formData];
    newArray.splice(index, 1);
    onChange(newArray);

    if (selectedIndex === index) {
      setSelectedIndex(newArray.length > 0 ? 0 : null);
    } else if ((selectedIndex ?? 0) > index) {
      setSelectedIndex((prev) => (prev ?? 1) - 1);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftColumn}>
        <div className={styles.leftToolbar}>
          <Select
            value={selectedCode}
            onChange={(v) => setSelectedCode(v)}
            disabled={disabled || readonly || availableCodes.length === 0}
            placeholder="Select code"
            options={availableCodes}
          />
          <Button
            type="primary"
            icon={<Icon name="plus" />}
            onClick={handleAdd}
            disabled={
              !selectedCode ||
              disabled ||
              readonly ||
              availableCodes.length === 0
            }
          >
            Add
          </Button>
        </div>

        <List
          dataSource={formData}
          renderItem={(item, idx) => {
            const active = selectedIndex === idx;
            return (
              <List.Item
                onClick={() => setSelectedIndex(idx)}
                style={{
                  cursor: "pointer",
                  padding: "6px 8px",
                  background: active ? "#f0f6ff" : undefined,
                  borderLeft: active
                    ? "3px solid #0b66ff"
                    : "3px solid transparent",
                  marginBottom: 6,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>{item.label}</span>
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<Icon name="delete" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(idx);
                  }}
                  disabled={disabled || readonly}
                />
              </List.Item>
            );
          }}
        />
      </div>

      <div className={styles.rightColumn}>
        {selectedIndex != null && formData[selectedIndex] && (
          <>
            {!readOnlyMode && (
              <>
                <div className={styles.sectionTitle}>Action</div>
                <Select
                  style={{ marginBottom: 8 }}
                  value={formData[selectedIndex].type}
                  onChange={(value) => {
                    onChange(
                      formData.map((item, i) =>
                        i === selectedIndex
                          ? ({ ...item, type: value } as object)
                          : (item as object),
                      ) as [],
                    );
                  }}
                  options={actionOptions}
                />
              </>
            )}
            {formData[selectedIndex].type === "script" && (
              <div>
                <div className={styles.sectionTitle}>Script</div>
                <Script
                  value={formData[selectedIndex].script ?? ""}
                  onChange={(value) => {
                    formData[selectedIndex].script = value;
                    onChange(formData);
                  }}
                />
              </div>
            )}
            {readOnlyMode && (
              <div>
                <div className={styles.sectionTitle}>Schema</div>
                <Script
                  value={
                    (formData[selectedIndex] as AfterValidation).schema ?? ""
                  }
                  readOnly={true}
                  mode={"json"}
                />
              </div>
            )}
            {formData[selectedIndex].type === "mapper-2" && !readOnlyMode && (
              <div>
                <div className={styles.sectionTitle}>Mapper</div>
                <Mapping
                  elementId={"mapping"}
                  mapping={
                    formData[selectedIndex].mappingDescription &&
                    typeof formData[selectedIndex].mappingDescription ===
                      "object"
                      ? formData[selectedIndex].mappingDescription
                      : MappingUtil.emptyMapping()
                  }
                  onChange={(value) => {
                    formData[selectedIndex].mappingDescription = value;
                    onChange(formData);
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CustomArrayField;
