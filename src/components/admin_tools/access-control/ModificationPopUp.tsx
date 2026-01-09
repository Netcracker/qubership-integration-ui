import { Button, Checkbox, Form, Modal, Select } from "antd";
import React, { useState, useEffect } from "react";
import { useModalContext } from "../../../ModalContextProvider.tsx";
import { AccessControl as AccessControlData, AccessControlUpdateRequest } from "../../../api/apiTypes.ts";
import { useNotificationService } from "../../../hooks/useNotificationService.tsx";
import { api } from "../../../api/api.ts";

export type ModificationPopUpProps = {
  record?: AccessControlData;
  onSuccess?: () => void;
  mode?: "add" | "delete";
};

export const ModificationPopUp: React.FC<ModificationPopUpProps> = ({ record, onSuccess, mode = "add" }) => {
  const { closeContainingModal } = useModalContext();
  const notificationService = useNotificationService();
  const [form] = Form.useForm();
  const getInitialRoles = (): string[] => {
    const roles = record?.properties?.roles;
    return Array.isArray(roles) ? roles : [];
  };
  const isDeleteMode = mode === "delete";
  const [currentRoles] = useState<string[]>(getInitialRoles());
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    isDeleteMode ? [] : getInitialRoles()
  );
  const [isRedeploy, setIsRedeploy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isDeleteMode) {
      setSelectedRoles([]);
      form.setFieldsValue({ roles: [] });
    } else {
      const roles = getInitialRoles();
      setSelectedRoles(roles);
      form.setFieldsValue({ roles });
    }
  }, [record, form, isDeleteMode]);

  const handleSubmit = async () => {
    if (!record?.elementId) {
      notificationService.info("Error", "Element ID is required");
      return;
    }

    if (isDeleteMode && selectedRoles.length === 0) {
      notificationService.info("Error", "Please select at least one role to delete");
      return;
    }

    try {
      setIsLoading(true);
      const elementIdNumber = parseInt(record.elementId, 10);
      if (isNaN(elementIdNumber)) {
        notificationService.info("Error", "Invalid Element ID");
        return;
      }

      // For delete mode, calculate remaining roles after deletion
      const finalRoles = isDeleteMode
        ? currentRoles.filter(role => !selectedRoles.includes(role))
        : selectedRoles;

      const updateRequest: AccessControlUpdateRequest = {
        elementId: elementIdNumber,
        isRedeploy: isRedeploy,
        roles: finalRoles,
      };

      await api.updateHttpTriggerAccessControl(updateRequest);
      notificationService.info("Success", isDeleteMode ? "Roles deleted successfully" : "Roles updated successfully");
      onSuccess?.();
      closeContainingModal();
    } catch (error) {
      notificationService.requestFailed(isDeleteMode ? "Failed to delete roles" : "Failed to update roles", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRolesChange = (roles: string[] | []) => {
    const rolesArray = Array.isArray(roles) ? roles : [];
    setSelectedRoles(rolesArray);
    form.setFieldsValue({ roles: rolesArray });
  };

  const roleOptions = isDeleteMode
    ? currentRoles.map(role => ({ label: role, value: role }))
    : [];

  return (
    <Modal
      title={isDeleteMode ? "Remove Roles" : "Add Roles"}
      open={true}
      onCancel={closeContainingModal}
      styles={{ body: { paddingTop: "8px" } }}
      footer={[
        <Button key="cancel" onClick={closeContainingModal}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          danger={isDeleteMode}
          onClick={handleSubmit}
          loading={isLoading}
        >
          {isDeleteMode ? "Delete" : "Save"}
        </Button>,
      ]}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        labelCol={{ flex: "23px" }}
        wrapperCol={{ flex: "auto" }}
        labelWrap
        initialValues={{ roles: isDeleteMode ? [] : (record?.properties?.roles || []) }}
      >
        <Form.Item name="roles">
          <Select
            mode={isDeleteMode ? "multiple" : "tags"}
            allowClear
            style={{ width: "100%" }}
            placeholder={isDeleteMode ? "Remove Roles" : "Add Roles"}
            onChange={handleRolesChange}
            value={selectedRoles}
            options={roleOptions}
          />
        </Form.Item>
        <Form.Item name="redeploy" valuePropName="checked">
          <Checkbox
            checked={isRedeploy}
            onChange={(e) => setIsRedeploy(e.target.checked)}
          >
            Redeploy selected chain to apply changes
          </Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
};

