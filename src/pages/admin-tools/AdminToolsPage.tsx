
import { Outlet } from "react-router";
import styles from "../../components/admin_tools/AdminToolsPage.module.css"
import { AdminToolsSidebar } from "../../components/admin_tools/AdminToolsSidebar.tsx";

export const AdminTools = () => {
  return (
    <div className={styles.container}>
      <AdminToolsSidebar />
        <Outlet />
    </div>
  )
}