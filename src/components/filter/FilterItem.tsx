import { CopyOutlined, DeleteOutlined, EllipsisOutlined } from "@ant-design/icons";
import { Button, Col, Dropdown, Form, MenuProps, Row, Select } from "antd"
import { ItemType } from "antd/es/menu/interface";

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

  return <Row>
    <Col span={7}>
      <Form.Item>
        <Select placeholder="Column">
          <Option value="male">male</Option>
          <Option value="female">female</Option>
          <Option value="other">other</Option>
        </Select>
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