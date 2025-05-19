import styles from "../../components/admin_tools/variables/VariablesPage.module.css";
import SecuredVariables from "../../components/admin_tools/variables/SecuredVariables.tsx";


export const SecuredVariablesPage = () => {
  return (
    <div className={styles.container}>
      <SecuredVariables />
    </div>
  );
};