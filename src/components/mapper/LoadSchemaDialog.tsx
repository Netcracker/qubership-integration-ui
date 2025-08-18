import React from "react";
import { Button, Modal, Tabs } from "antd";
import { useModalContext } from "../../ModalContextProvider";
import Dragger from "antd/lib/upload/Dragger";
import { InboxOutlined } from "@ant-design/icons";

export type LoadSchemaDialogProps = {};

export const LoadSchemaDialog: React.FC<LoadSchemaDialogProps> = ({}) => {
  const { closeContainingModal } = useModalContext();
  return (
    <Modal
      title="Load source"
      open={true}
      onCancel={closeContainingModal}
      footer={[
        <Button key="submit" type="primary" htmlType={"submit"}>
          Submit
        </Button>,
      ]}
    >
      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: "1",
            label: "Schema",
            children: <></>, // TODO
          },
          {
            key: "2",
            label: "File",
            children: (
              <Dragger
                rootClassName="flex-dragger"
                multiple={false}
                //   fileList={fileList}
                beforeUpload={() => false}
                //   onChange={(info) => setFileList(info.fileList)}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                  Click or drag file to this area to upload
                </p>
              </Dragger>
            ),
          },
          {
            key: "3",
            label: "Code",
            children: <></>, // TODO
          },
        ]}
      />
    </Modal>
  );
};
