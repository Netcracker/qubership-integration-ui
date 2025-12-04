import { Breadcrumb, Flex, Tabs } from "antd";
import { ServiceParametersTab } from "./ServiceParametersTab";
import { useParams } from "react-router";
import { formatTimestamp } from "../../misc/format-utils";
import styles from "./Services.module.css";
import { ServiceParametersPageLayout } from "./ServiceParametersPage";
import { ServiceBreadcrumbItem } from "./ServiceBreadcrumb";
import { IntegrationSystemType } from "../../api/apiTypes";

const sidePadding = 32;

export const ContextServiceParametersPage: React.FC = () => {
  const { systemId } = useParams<{
    systemId: string;
  }>();

  const activeTab = "parameters";

  const tabItems = [
    {
      key: "parameters",
      label: "Parameters",
      children: (
        <Flex justify={"start"}>
          <ServiceParametersTab
            systemId={systemId || ""}
            activeTab={activeTab}
            formatTimestamp={formatTimestamp}
            sidePadding={sidePadding}
            styles={styles}
          />
        </Flex>
      ),
    },
  ];

  return (
    <ServiceParametersPageLayout>
        <Breadcrumb>
            <ServiceBreadcrumbItem type={IntegrationSystemType.CONTEXT}/>
        </Breadcrumb>
        <Tabs items={tabItems} activeKey={activeTab} />;
    </ServiceParametersPageLayout>
  );
};
