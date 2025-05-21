import { Layout } from "antd";
import { useLocation, Outlet } from "react-router-dom";
import { AdminToolsSidebar } from "../../components/admin_tools/AdminToolsSidebar";
import styles from "./AdminToolsPage.module.css";
import { AnimatePresence, motion } from "framer-motion";

const { Content } = Layout;

export const AdminTools = () => {
  const location = useLocation();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AdminToolsSidebar />
      <Layout style={{ background: "#f9f9f9" }}>
        <Content className={styles.contentArea}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={styles.moduleContainer}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </Content>
      </Layout>
    </Layout>
  );
};