import styles from "../../components/admin_tools/variables/VariablesPage.module.css";
import { CommonVariables } from "../../components/admin_tools/variables/CommonVariables.tsx";

export const CommonVariablesPage = () => {
  return (
    <div className={styles.container}>
      <CommonVariables />
    </div>
  );
};