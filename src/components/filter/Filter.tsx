import { Button, Form, Modal } from "antd"
import { useModalContext } from "../../ModalContextProvider";
import { FilterItem, FilterItemProps } from "./FilterItem";
import { ClearOutlined, PlusOutlined } from "@ant-design/icons";
import { useState } from "react";
import { FilterModel } from "./tableFilter";

export type FilterProps = {
  filterModel: FilterModel
}
export const Filter = (props: FilterProps) => {
  const { closeContainingModal } = useModalContext();
  const [form] = Form.useForm();

  const removeFilterItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  }

  const duplicateFilterItem = (id: string) => {
    alert(`Duplicate item: ${id}`);
  }

  const [items, setItems] = useState([
    { id: crypto.randomUUID() },
    { id: 'sdfsdf1' }
  ]);

  const filterItems = items.map(item =>
    <FilterItem key={item.id} id={item.id}
      filterModel={props.filterModel}
      onRemove={() => removeFilterItem(item.id)}
      onDuplicate={() => duplicateFilterItem(item.id)}
    ></FilterItem>
  );

  const addFilterItem = () => {
    const newProp: FilterItemProps = {
      id: crypto.randomUUID(),
      filterModel: props.filterModel,
      onRemove: removeFilterItem,
      onDuplicate: duplicateFilterItem
    };
    setItems([...items, newProp]);
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