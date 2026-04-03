import React from "react";
import { useLocationHash } from "./useLocationHash.tsx";
import { ServicesList } from "./ServicesList.tsx";
import { NotFound } from "../../pages/NotFound.tsx";
import { McpServiceList } from "./mcp/McpServiceList.tsx";

export const ServiceListPage: React.FC = () => {
  const [tab] = useLocationHash("external");
  switch (tab) {
    case "mcp":
      return <McpServiceList />;
    case "external":
    case "internal":
    case "implemented":
    case "context":
      return <ServicesList tab={tab} />;
    default:
      return <NotFound />;
  }
};
