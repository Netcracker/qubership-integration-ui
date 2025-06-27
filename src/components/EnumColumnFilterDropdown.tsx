import { Select, Button, Flex } from "antd";
import type { FilterDropdownProps } from "antd/es/table/interface";
import React from "react";
import Row from "exceljs/index";

export const makeEnumColumnFilterDropdown = (
  options: { label: React.ReactNode; value: string }[],
  field: string,
  multiple = false,
) => {
  const filterDropdown = ({
    setSelectedKeys,
    selectedKeys,
    confirm,
    clearFilters,
  }: FilterDropdownProps) => (
    <Flex vertical gap={8} style={{ padding: 8, width: 350 }}>
      <Select
        mode={multiple ? "multiple" : undefined}
        placeholder="Select value"
        value={multiple ? (selectedKeys as string[]) : selectedKeys[0]}
        onChange={(val) => {
          const keys: React.Key[] = Array.isArray(val) ? val : val ? [val] : [];
          setSelectedKeys(keys);
        }}
        allowClear
        style={{ width: "100%" }}
        options={options}
      />

      <Flex justify="end" gap={8}>
        <Button
          size="small"
          onClick={() => {
            clearFilters?.();
            confirm();
          }}
        >
          Reset
        </Button>
        <Button type="primary" size="small" onClick={() => confirm()}>
          Filter
        </Button>
      </Flex>
    </Flex>
  );

  const onFilter = (value: boolean | React.Key, record: Row) =>
    record[field] === value;

  return { filterDropdown, onFilter };
};
