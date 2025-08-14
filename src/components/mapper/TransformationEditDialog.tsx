import React, { useEffect, useState } from "react";
import { Transformation } from "../../mapper/model/model";
import { Button, Flex, Form, Modal, Select } from "antd";
import { useModalContext } from "../../ModalContextProvider";
import { TRANSFORMATIONS } from "../../mapper/model/transformations";
import { capitalize } from "../../misc/format-utils";
import { TrimParameters } from "./transformation/parameters/TrimParameters";
import { ReplaceAllParameters } from "./transformation/parameters/ReplaceAllParameters";
import { DefaultValueParameters } from "./transformation/parameters/DefautValueParameters";
import { FormatDateTimeParameters } from "./transformation/parameters/FormatDateTimeParameters";
import { ExpressionParameters } from "./transformation/parameters/ExpressionParameters";
import { ConditionalParameters } from "./transformation/parameters/ConditionalParameters";
import { DictionaryParameters } from "./transformation/parameters/DictionaryParameters";

export type TransformationEditDialogProps = {
  transformation?: Transformation;
  onSubmit?: (transformation: Transformation | undefined) => void;
};
export const TransformationEditDialog: React.FC<
  TransformationEditDialogProps
> = ({ transformation, onSubmit }) => {
  const { closeContainingModal } = useModalContext();
  const [form] = Form.useForm<Transformation>();
  const [parametersComponent, setParametersComponent] =
    useState<React.ReactNode>("");

  useEffect(() => {
    setParametersComponent(
      parametersComponentMap[transformation?.name ?? ""] || ""
    );
  }, [transformation]);

  useEffect(() => {
    form.setFieldsValue({
      name: transformation?.name ?? "",
      parameters: transformation?.parameters ?? [],
    });
  }, [transformation]);

  const parametersComponentMap: Record<string, React.ReactNode> = {
    conditional: <ConditionalParameters />,
    defaultValue: <DefaultValueParameters />,
    dictionary: <DictionaryParameters />,
    expression: <ExpressionParameters />,
    formatDateTime: <FormatDateTimeParameters />,
    trim: <TrimParameters />,
    replaceAll: <ReplaceAllParameters />,
  };

  return (
    <Modal
      title="Edit transformation"
      open={true}
      onCancel={closeContainingModal}
      footer={[
        <Button key="cancel" onClick={closeContainingModal}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          form="transformationEditForm"
          htmlType={"submit"}
        >
          Save
        </Button>,
      ]}
    >
      <Form<Transformation>
        form={form}
        style={{ height: "60vh", display: "flex", flexDirection: "column" }}
        id="transformationEditForm"
        labelCol={{ flex: "150px" }}
        wrapperCol={{ flex: "auto" }}
        labelWrap
        onValuesChange={(changes, values) => {
          console.log({ changes, values });
          if (changes.name !== undefined) {
            form.setFieldValue("parameters", []);
            setParametersComponent(parametersComponentMap[changes.name] || "");
          }
        }}
        onFinish={(values) => {
          onSubmit?.(values.name ? values : undefined);
          closeContainingModal();
        }}
      >
        <Form.Item name="name" label="Transfomation">
          <Select<string>
            options={[
              {
                value: "",
                label: "None",
              },
              ...TRANSFORMATIONS.map((t) => ({
                value: t.name,
                label: capitalize(t.title),
              })),
            ]}
          />
        </Form.Item>
        <Flex vertical style={{ overflowY: "auto", flexGrow: 1 }}>
          {parametersComponent}
        </Flex>
      </Form>
    </Modal>
  );
};
