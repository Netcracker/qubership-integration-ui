import { Breadcrumb, Flex, Tabs } from "antd";
import { useParams } from "react-router";
import { formatTimestamp } from "../../misc/format-utils";
import styles from "./Services.module.css";
import {
  ServiceParametersPageHeader,
  ServiceParametersPageLayout,
} from "./ServiceParametersPage";
import {
  ServiceNameBreadcrumbItem,
  ServiceTypeBreadcrumbItem,
} from "./ServiceBreadcrumb";
import { IntegrationSystemType } from "../../api/apiTypes";
import { ContextServiceParametersTab } from "./context/ContextServiceParametersTab";

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
          <ContextServiceParametersTab
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
        <ServiceTypeBreadcrumbItem type={IntegrationSystemType.CONTEXT} />
        <ServiceNameBreadcrumbItem
          type={IntegrationSystemType.CONTEXT}
          id={systemId}
          name={systemId}
        />
      </Breadcrumb>
      <ServiceParametersPageHeader />
      <Tabs items={tabItems} activeKey={activeTab} />
    </ServiceParametersPageLayout>
  );
};
