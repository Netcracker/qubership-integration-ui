import { Constant, DataType, GivenValue } from "../../mapper/model/model.ts";
import { Button, Flex, Form, Input, Modal, Select } from "antd";
import { DataTypes } from "../../mapper/util/types.ts";
import Checkbox from "antd/lib/checkbox";
import React, { useEffect, useState } from "react";
import { useModalContext } from "../../ModalContextProvider.tsx";
import { buildTypeOptions } from "./InlineTypeEdit.tsx";

type FormData = Constant;

export type EditConstantDialogProps = {
  title: string;
  constant: Constant;
  onSubmit: (changes: Omit<Partial<Constant>, "id">) => void;
};

export const EditConstantDialog: React.FC<EditConstantDialogProps> = ({
  title,
  constant,
  onSubmit,
}) => {
  const { closeContainingModal } = useModalContext();

  const typeOptions: ReturnType<typeof buildTypeOptions> = buildTypeOptions(
    DataTypes.stringType(),
    [],
    false,
    false,
  );

  return (
    <Modal
      title={title}
      open={true}
      onCancel={closeContainingModal}
      footer={[
        <Button key="cancel" onClick={closeContainingModal}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          form="constantEditForm"
          htmlType={"submit"}
        >
          Submit
        </Button>,
      ]}
    >
      <Form<FormData>
        id="constantEditForm"
        labelCol={{ flex: "70px" }}
        wrapperCol={{ flex: "auto" }}
        labelWrap
        initialValues={{ ...constant }}
        onValuesChange={(_changes, values) => {
          // TODO
        }}
        onFinish={(values) => {
          // TODO
          // const changes = {
          //   name: values.name,
          //   type: values.type,
          //   defaultValue: values.hasDefaultValue
          //     ? values.defaultValue
          //     : undefined,
          //   required: values.required,
          // };
          // onSubmit?.(changes);
          closeContainingModal();
        }}
      >
        <Form.Item label={"Name"} name={"name"} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item
          style={{ width: "100%" }}
          label={"Type"}
          name={"type"}
          rules={[{ required: true }]}
          getValueProps={(type: DataType) => {
            return {
              value: typeOptions.find((option) =>
                DataTypes.same(option.type, type, []),
              )?.value,
            };
          }}
          normalize={(value) => {
            return (
              typeOptions.find((option) => option.value === value)?.type ??
              constant.type
            );
          }}
        >
          <Select options={typeOptions} />
        </Form.Item>
        <Flex vertical={false} style={{ marginLeft: 70 }}>
          <Form.Item label={null} name={"generated"} valuePropName={"checked"}>
            <Checkbox>Generated</Checkbox>
          </Form.Item>
          <Form.Item
            style={{ flexGrow: 1 }}
            label={null}
            name={"valueSupplier"}
            getValueProps={(valueSupplier: GivenValue) => {
              return {
                value: valueSupplier.value,
              };
            }}
            normalize={(value: string): GivenValue => {
              return { kind: "given", value: value };
            }}
          >
            <Input />
          </Form.Item>
        </Flex>
        {/*<Form.Item*/}
        {/*  style={{ marginLeft: 70 }}*/}
        {/*  label={null}*/}
        {/*  name={"required"}*/}
        {/*  valuePropName={"checked"}*/}
        {/*>*/}
        {/*  <Checkbox>Required</Checkbox>*/}
        {/*</Form.Item>*/}
      </Form>
    </Modal>
  );
};
