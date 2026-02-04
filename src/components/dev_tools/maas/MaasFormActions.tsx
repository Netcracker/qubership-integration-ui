import React from "react";
import { Button, Flex } from "antd";
import styles from "./Maas.module.css";

interface MaasFormActionsProps {
  createInProgress: boolean;
  isFormValid: boolean;
  onCreate: () => void;
  onReset: () => void;
}

export const MaasFormActions: React.FC<MaasFormActionsProps> = ({
  createInProgress,
  isFormValid,
  onCreate,
  onReset,
}) => {
  return (
    <Flex justify="space-between" className={styles["actionsContainer"]}>
      <Button
        type="primary"
        loading={createInProgress}
        disabled={createInProgress || !isFormValid}
        onClick={onCreate}
      >
        Create
      </Button>
      <Button
        disabled={createInProgress}
        onClick={onReset}
      >
        Reset
      </Button>
    </Flex>
  );
};
