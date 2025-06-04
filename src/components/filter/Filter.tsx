import { Button, Form, Modal } from "antd"
import { useModalContext } from "../../ModalContextProvider";
import { FilterItem, FilterItemProps } from "./FilterItem";
import { ClearOutlined, PlusOutlined } from "@ant-design/icons";
import { useState } from "react";

export const Filter = () => {
  const { closeContainingModal } = useModalContext();
  const [form] = Form.useForm();

  const removeFilterItem = (id: string) => {
    setProps(props.filter((item) => item.id !== id));
  }

  const duplicateFilterItem = (id: string) => {
    alert(`Duplicate item: ${id}`);
  }

  const [props, setProps] = useState([
    { id: crypto.randomUUID() },
    { id: 'sdfsdf1' }
  ]);

  const filterItems = props.map(prop =>
    <FilterItem key={prop.id} id={prop.id}
      onRemove={() => removeFilterItem(prop.id)}
      onDuplicate={() => duplicateFilterItem(prop.id)}
    ></FilterItem>
  );

  const addFilterItem = () => {
    const newProp: FilterItemProps = { id: crypto.randomUUID(), onRemove: removeFilterItem, onDuplicate: duplicateFilterItem };
    setProps([...props, newProp]);
  }

  return <Modal
    title="Filter"
    open={true}
    onCancel={closeContainingModal}
    footer={[
      <Button key="cancel" onClick={closeContainingModal}>
        Cancel
      </Button>,
      <Button
        key="apply"
        type="primary"
      >
        Apply
      </Button>
    ]}
  >
    <Form
      form={form}
    >
      {filterItems}
      <Button type="link" onClick={addFilterItem}><PlusOutlined /> Add Filter</Button>
      <Button type="link"><ClearOutlined /> Clear All</Button>
    </Form>
  </Modal>
};