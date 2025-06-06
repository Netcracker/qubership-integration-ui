import { CopyOutlined, DeleteOutlined, EllipsisOutlined } from "@ant-design/icons";
import { Button, Col, Dropdown, Form, MenuProps, Row, Select, SelectProps } from "antd"
import { ItemType } from "antd/es/menu/interface";
import { FilterModel } from "./tableFilter";

const { Option } = Select;

const items: ItemType[] = [
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
  filterModel: FilterModel;
  onRemove: (key: string) => void;
  onDuplicate: (key: string) => void;
}

export const FilterItem = (props: FilterItemProps) => {
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
    items,
    onClick: onActionClick,
  };

  /* const columnOptions: SelectProps["options"] = [
    {value: "sdf", label: "sdf"}
  ]; */

  return <Row gutter={8}>
    <Col span={7}>
      <Form.Item>
        <Select placeholder="Column" options={props.filterModel.columnOptions} />
      </Form.Item>
    </Col>
    <Col span={7}>
      <Form.Item>
        <Select placeholder="Condition">
          <Option value="222">male</Option>
        </Select>
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