import { Breadcrumb } from "antd";

import { isVsCode } from "../../api/rest/vscodeExtensionApi.ts";
import { IntegrationSystemType } from "../../api/apiTypes.ts";
import { useNavigate } from "react-router-dom";

type ServiceNameBreadcrumbItemProps = {
  type?: IntegrationSystemType;
  id?: string;
  name?: string;
};

type ServiceTypeBreadcrumbItemProps = {
  type?: IntegrationSystemType;
};

export const ServiceNameBreadcrumbItem: React.FC<
  ServiceNameBreadcrumbItemProps
> = (props: ServiceNameBreadcrumbItemProps) => {
  const navigate = useNavigate();

  const endpoint =
    props.type === IntegrationSystemType.CONTEXT
      ? `/services/context/${props.id}/parameters`
      : `/services/systems/${props.id}/specificationGroups`;

  return (
    <Breadcrumb.Item>
      <a
        onClick={(e) => {
          e.preventDefault();
          void navigate(endpoint);
        }}
        href={endpoint}
      >
        {props.name || props.id || "..."}
      </a>
    </Breadcrumb.Item>
  );
};

export const ServiceTypeBreadcrumbItem: React.FC<
  ServiceTypeBreadcrumbItemProps
> = (props: ServiceTypeBreadcrumbItemProps) => {
  const navigate = useNavigate();

  const getTypeLabel = (type?: IntegrationSystemType) => {
    switch (type) {
      case IntegrationSystemType.EXTERNAL:
        return "External Services";
      case IntegrationSystemType.INTERNAL:
        return "Internal Services";
      case IntegrationSystemType.IMPLEMENTED:
        return "Implemented Services";
      case IntegrationSystemType.CONTEXT:
        return "Context Services";
      default:
        return "Services";
    }
  };

  const getTabHash = (type?: IntegrationSystemType) => {
    switch (type) {
      case IntegrationSystemType.EXTERNAL:
        return "external";
      case IntegrationSystemType.INTERNAL:
        return "internal";
      case IntegrationSystemType.IMPLEMENTED:
        return "implemented";
      case IntegrationSystemType.CONTEXT:
        return "context";
      default:
        return "implemented";
    }
  };

  return (
    <Breadcrumb.Item>
      {isVsCode ? (
        <span>{getTypeLabel(props.type)}</span>
      ) : (
        <a
          onClick={(e) => {
            e.preventDefault();
            void navigate(`/services#${getTabHash(props.type)}`);
          }}
          href={`/services#${getTabHash(props.type)}`}
        >
          {getTypeLabel(props.type)}
        </a>
      )}
    </Breadcrumb.Item>
  );
};
