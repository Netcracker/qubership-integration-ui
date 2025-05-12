import { Modal, Button, Upload, Table, message } from "antd";
import { UploadOutlined, InboxOutlined } from "@ant-design/icons";
import type { RcFile } from "antd/es/upload";
import { useState } from "react";
import { importVariables } from "../../../api/admin-tools/variables.ts";

interface Props {
  onSuccess?: () => void;
}

const ImportVariablesModal = ({ onSuccess }: Props) => {
  const [visible, setVisible] = useState(false);
  const [file, setFile] = useState<RcFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [selectedNames, setSelectedNames] = useState<React.Key[]>([]);

  const showModal = () => {
    setVisible(true);
    setFile(null);
    setPreviewData([]);
    setSelectedNames([]);
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const handlePreview = async () => {
    if (!file) {
      message.warning("Choose a file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const data = await importVariables(formData, true);
      setPreviewData(data);
    } catch {
      message.error("Failed to preview");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      message.warning("Choose a file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    selectedNames.forEach(name => {
      formData.append("variablesNames", name);
    });

    try {
      setLoading(true);
      await importVariables(formData, false);
      message.success("Imported successfully");
      setVisible(false);
      onSuccess?.();
    } catch {
      message.error("Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button icon={<UploadOutlined />} onClick={showModal}>
        Import variables
      </Button>

      <Modal
        title="Import variables"
        open={visible}
        onCancel={handleCancel}
        footer={[
          <Button key="preview" onClick={handlePreview} loading={loading}>
            Preview
          </Button>,
          <Button
            key="import"
            type="primary"
            onClick={handleImport}
            // disabled={!previewData.length || !selectedNames.length}
            loading={loading}
          >
            Import
          </Button>,
        ]}
        width={700}
      >
        <Upload.Dragger
          name="file"
          accept=".yaml,.yml"
          beforeUpload={(file) => {
            setFile(file);
            return false;
          }}
          showUploadList={file ? [{ name: file.name, status: "done" }] : false}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Drag an YAML-file or click to choose</p>
        </Upload.Dragger>

        {previewData?.length > 0 && (
          <Table
            rowKey="name"
            style={{ marginTop: 16 }}
            columns={[
              { title: "Name", dataIndex: "name", key: "name" },
              { title: "Value", dataIndex: "value", key: "value" },
            ]}
            dataSource={previewData}
            rowSelection={{
              selectedRowKeys: selectedNames,
              onChange: setSelectedNames,
            }}
            pagination={false}
            size="small"
          />
        )}
      </Modal>
    </>
  );
};

export default ImportVariablesModal;