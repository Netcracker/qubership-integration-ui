import { CopyOutlined, DeleteOutlined, EllipsisOutlined } from "@ant-design/icons";
import { Button, Col, Dropdown, Form, MenuProps, Row, Select, SelectProps } from "antd"
import { ItemType } from "antd/es/menu/interface";
import { FilterConditionNew, FilterValueType, TableFilter, FilterTypeConditions } from "./tableFilter";
import { useState } from "react";

const { Option } = Select;

const actionItems: ItemType[] = [
  {
    key: 'remove',
    label: <><DeleteOutlined /> Remove</>,
  },
  {
    key: 'duplicate',
    label: <><CopyOutlined /> Duplicate</>,
  },
];

export type FilterItemProps = {
  id: string;
  tableFilters: TableFilter[];
  onRemove: (key: string) => void;
  onDuplicate: (key: string) => void;
}

export const FilterItem = (props: FilterItemProps) => {
  const [conditionOptions, setConditionOptions] = useState<SelectProps["options"]>([]);
  const [condition, setCondition] = useState<FilterTypeConditions | null>(null);
  const [valueType, setValueType] = useState<FilterValueType | null>(null);

  const onActionClick: MenuProps['onClick'] = ({ item, key }) => {
    switch (key) {
      case 'remove':
        props.onRemove(props.id);
        break;
      case 'duplicate':
        props.onDuplicate(props.id);
        break;
    }
  };

  const actionProps: MenuProps = {
    items: actionItems,
    onClick: onActionClick,
  };

  const columnOptions = (): SelectProps["options"] => {
    return props.tableFilters.map(filter => ({value: filter.id, label: filter.name}));
  }

  const changeColumn = (value: string) => {
    const columnFilter = props.tableFilters.find((filter: TableFilter) => filter.id === value);
    const conditionOptions = columnFilter!.type.conditions.allowedConditions
      .map((condition: FilterConditionNew) => ({ value: condition.id, label: condition.name }));

    setConditionOptions(conditionOptions);
  };

  const changeCondition = (value: string) => {
    //alert('change condition');
    setCondition();
    setValueType();
  }

  return <Row gutter={8}>
    <Col span={7}>
      <Form.Item>
        <Select placeholder="Column" options={columnOptions()} onChange={changeColumn}/>
      </Form.Item>
    </Col>
    <Col span={7}>
      <Form.Item>
        <Select placeholder="Condition" options={conditionOptions} onChange={changeCondition}/>
      </Form.Item>
    </Col>
    <Col span={7}>
      <Form.Item>
        <Select placeholder="Value">
          <Option value="222">male</Option>
        </Select>
      </Form.Item>
    </Col>
    <Col span={3}>
      <Dropdown menu={actionProps}>
        <Button icon={<EllipsisOutlined />} />
      </Dropdown>
    </Col>
  </Row>
}